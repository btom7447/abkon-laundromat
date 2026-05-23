"use server";

import { z } from "zod";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { queueAndSendSms } from "@/lib/sms/send";
import { renderPasswordResetCode } from "@/lib/sms/templates";

const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;

export type RequestState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Always true on the happy path — same response whether or not the phone
   *  exists, to prevent account enumeration. */
  sent?: boolean;
  /** Echoed back so the next step's form knows which phone we're resetting. */
  phone?: string;
};

export type ResetState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

const requestSchema = z.object({
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[\d+\-\s()]+$/, "Phone may only contain digits and + - ( ) spaces"),
});

const resetSchema = z
  .object({
    phone: z.string().min(7).max(20),
    code: z
      .string()
      .regex(/^\d{6}$/, "Code must be 6 digits"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(200)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/\d/, "Must contain a number"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function normalizePhone(raw: string): string {
  // Strip whitespace and parentheses/dashes — keep digits and leading +.
  return raw.replace(/[\s()-]/g, "");
}

function generateOtp(length: number): string {
  // Numeric-only OTP. Cryptographically random when crypto is available.
  let out = "";
  const buf = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < length; i++) out += (buf[i]! % 10).toString();
  } else {
    for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

/**
 * Step 1 — Send an OTP to the user's registered phone number.
 *
 * Returns `sent: true` unconditionally (whether or not the phone is on file)
 * so an attacker can't enumerate which numbers are registered. The actual SMS
 * is only dispatched if the phone matches an active account.
 */
export async function requestPasswordResetAction(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const parsed = requestSchema.safeParse({
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const phone = normalizePhone(parsed.data.phone);

  // Look up active user by phone. Match against stored format and normalized
  // format to be lenient about how phones are stored.
  const user = await db.user.findFirst({
    where: {
      active: true,
      OR: [{ phone }, { phone: parsed.data.phone }],
    },
  });

  if (user && user.phone) {
    const code = generateOtp(CODE_LENGTH);
    const codeHash = await hash(code, ARGON_OPTIONS);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: codeHash,
        passwordResetCodeExpiresAt: expiresAt,
        passwordResetAttempts: 0,
      },
    });

    await queueAndSendSms({
      phone: user.phone,
      type: "OTHER",
      message: renderPasswordResetCode({ code, minutesValid: CODE_TTL_MINUTES }),
    });

    await recordAudit({
      actorId: user.id,
      actorRole: user.role,
      branchId: user.branchId,
      action: "password_reset_requested",
      entityType: "user",
      entityId: user.id,
    });
  }

  // Always succeed — generic "if found, we sent a code" copy on the client.
  return { sent: true, phone: parsed.data.phone };
}

/**
 * Step 2 — Verify the OTP and set a new password.
 */
export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const phone = normalizePhone(parsed.data.phone);
  const user = await db.user.findFirst({
    where: {
      active: true,
      OR: [{ phone }, { phone: parsed.data.phone }],
    },
  });

  // Always return the same error to avoid leaking which step failed (phone vs code).
  const genericError: ResetState = { error: "Invalid or expired code. Request a new code." };

  if (!user || !user.passwordResetCodeHash || !user.passwordResetCodeExpiresAt) {
    return genericError;
  }
  if (user.passwordResetCodeExpiresAt.getTime() < Date.now()) {
    // Expired — clear it so it can't be reused
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: null,
        passwordResetCodeExpiresAt: null,
        passwordResetAttempts: 0,
      },
    });
    return genericError;
  }
  if (user.passwordResetAttempts >= MAX_VERIFY_ATTEMPTS) {
    // Too many wrong attempts — invalidate the code entirely
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: null,
        passwordResetCodeExpiresAt: null,
        passwordResetAttempts: 0,
      },
    });
    return { error: "Too many attempts. Please request a new code." };
  }

  const codeOk = await verify(user.passwordResetCodeHash, parsed.data.code);
  if (!codeOk) {
    await db.user.update({
      where: { id: user.id },
      data: { passwordResetAttempts: { increment: 1 } },
    });
    return genericError;
  }

  // Valid code — set the new password, clear the code, unlock the account.
  const newHash = await hash(parsed.data.password, ARGON_OPTIONS);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      passwordResetAttempts: 0,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await recordAudit({
    actorId: user.id,
    actorRole: user.role,
    branchId: user.branchId,
    action: "password_reset_completed",
    entityType: "user",
    entityId: user.id,
  });

  return { success: true };
}
