"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hash } from "@node-rs/argon2";
import { verify as verifyArgon } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { queueAndSendSms } from "@/lib/sms/send";
import { renderPasswordResetCode } from "@/lib/sms/templates";

const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const MAX_AVATAR_BYTES = 120_000; // ~120 KB after client-side resize

export type ProfileState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z
    .string()
    .min(0)
    .max(20)
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .optional()
    .or(z.literal("")),
});

/**
 * Update the signed-in user's name / phone / avatar. Email + role + branch
 * are intentionally **not** editable from the profile page — those are
 * admin-controlled.
 */
export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const actor = await requireSession();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Validate avatar payload — must be a data URL of a reasonable size if set.
  const avatarUrl = parsed.data.avatarUrl?.trim() || null;
  if (avatarUrl) {
    if (!avatarUrl.startsWith("data:image/")) {
      return { fieldErrors: { avatarUrl: ["Avatar must be an image"] } };
    }
    if (avatarUrl.length > MAX_AVATAR_BYTES * 1.4) {
      // base64 inflates ~33%
      return {
        fieldErrors: {
          avatarUrl: ["Avatar is too large — keep it under ~120KB after compression"],
        },
      };
    }
  }

  const before = await db.user.findUnique({ where: { id: actor.id } });
  if (!before) return { error: "Account not found." };

  const after = await db.user.update({
    where: { id: actor.id },
    data: {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone?.trim() || null,
      avatarUrl,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "profile_updated",
    entityType: "user",
    entityId: actor.id,
    beforeState: { name: before.name, phone: before.phone, hadAvatar: !!before.avatarUrl },
    afterState: { name: after.name, phone: after.phone, hadAvatar: !!after.avatarUrl },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/profile");
  return { success: true };
}

// ── Password change (OTP-verified) ────────────────────────────────────

export type PasswordChangeRequestState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  sent?: boolean;
};

export type PasswordChangeCompleteState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

function generateOtp(length: number): string {
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
 * Step 1: send a 6-digit OTP to the signed-in user's registered phone. We
 * reuse the password-reset slot on the user row (codeHash + expiry) so we
 * don't need a separate table.
 */
export async function requestPasswordChangeOtpAction(
  _prev: PasswordChangeRequestState,
  _formData: FormData
): Promise<PasswordChangeRequestState> {
  const actor = await requireSession();

  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user) return { error: "Account not found." };
  if (!user.phone) {
    return {
      error:
        "No phone number on file. Update your profile with a phone number first so we can send the verification code.",
    };
  }

  const code = generateOtp(6);
  const codeHash = await hash(code, ARGON_OPTIONS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

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
    message: renderPasswordResetCode({ code, minutesValid: OTP_TTL_MINUTES }),
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "password_change_otp_requested",
    entityType: "user",
    entityId: actor.id,
  });

  return { sent: true };
}

const completeSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(200)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/\d/, "Must contain a number"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Step 2: verify OTP + set the new password for the signed-in user.
 */
export async function completePasswordChangeAction(
  _prev: PasswordChangeCompleteState,
  formData: FormData
): Promise<PasswordChangeCompleteState> {
  const actor = await requireSession();
  const parsed = completeSchema.safeParse({
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await db.user.findUnique({ where: { id: actor.id } });
  const genericError: PasswordChangeCompleteState = {
    error: "Invalid or expired code. Request a new code.",
  };
  if (!user || !user.passwordResetCodeHash || !user.passwordResetCodeExpiresAt) {
    return genericError;
  }
  if (user.passwordResetCodeExpiresAt.getTime() < Date.now()) {
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
  if (user.passwordResetAttempts >= MAX_OTP_ATTEMPTS) {
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: null,
        passwordResetCodeExpiresAt: null,
        passwordResetAttempts: 0,
      },
    });
    return { error: "Too many attempts. Request a new code." };
  }

  const codeOk = await verifyArgon(user.passwordResetCodeHash, parsed.data.code);
  if (!codeOk) {
    await db.user.update({
      where: { id: user.id },
      data: { passwordResetAttempts: { increment: 1 } },
    });
    return genericError;
  }

  const newHash = await hash(parsed.data.password, ARGON_OPTIONS);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      passwordResetAttempts: 0,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "password_changed",
    entityType: "user",
    entityId: actor.id,
  });

  return { success: true };
}

// ── Theme preference ──────────────────────────────────────────────────

export async function setThemePreferenceAction(
  theme: "light" | "dark" | "system"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireSession();
  if (!["light", "dark", "system"].includes(theme)) {
    return { ok: false, error: "Invalid theme" };
  }
  await db.user.update({
    where: { id: actor.id },
    data: { themePreference: theme },
  });
  return { ok: true };
}

// ── Notification preferences ──────────────────────────────────────────

const prefsSchema = z.object({
  urgent: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  uncollected: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  unpaid: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  smsFailed: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  cashReconcile: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function updateNotificationPrefsAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const actor = await requireSession();
  const parsed = prefsSchema.safeParse({
    urgent: formData.get("urgent"),
    uncollected: formData.get("uncollected"),
    unpaid: formData.get("unpaid"),
    smsFailed: formData.get("smsFailed"),
    cashReconcile: formData.get("cashReconcile"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await db.user.update({
    where: { id: actor.id },
    data: { notificationPrefs: parsed.data },
  });

  return { success: true };
}

// ── Pinned items (POS shortcuts) ──────────────────────────────────────

export async function togglePinnedItemAction(
  itemTypeId: string
): Promise<{ ok: true; pinned: boolean } | { ok: false; error: string }> {
  if (!itemTypeId) return { ok: false, error: "Item required" };
  const actor = await requireSession();

  const existing = await db.userPinnedItem.findUnique({
    where: { userId_itemTypeId: { userId: actor.id, itemTypeId } },
  });

  if (existing) {
    await db.userPinnedItem.delete({ where: { id: existing.id } });
    return { ok: true, pinned: false };
  }

  // Confirm the item exists and is in a branch the actor can access
  const item = await db.itemType.findUnique({ where: { id: itemTypeId } });
  if (!item) return { ok: false, error: "Item not found" };
  if (actor.role !== "ADMIN" && item.branchId !== actor.branchId) {
    return { ok: false, error: "Item not in your branch" };
  }

  await db.userPinnedItem.create({
    data: { userId: actor.id, itemTypeId },
  });
  return { ok: true, pinned: true };
}

// ── Account deletion request ──────────────────────────────────────────

const deletionSchema = z.object({
  reason: z.string().max(500).optional().or(z.literal("")),
});

export async function requestAccountDeletionAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const actor = await requireSession();
  const parsed = deletionSchema.safeParse({
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await db.user.update({
    where: { id: actor.id },
    data: {
      deletionRequestedAt: new Date(),
      deletionRequestedReason: parsed.data.reason || null,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "account_deletion_requested",
    entityType: "user",
    entityId: actor.id,
    afterState: { reason: parsed.data.reason || null },
  });

  return { success: true };
}

export async function cancelAccountDeletionAction(): Promise<{ ok: true }> {
  const actor = await requireSession();
  await db.user.update({
    where: { id: actor.id },
    data: {
      deletionRequestedAt: null,
      deletionRequestedReason: null,
    },
  });
  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "account_deletion_cancelled",
    entityType: "user",
    entityId: actor.id,
  });
  return { ok: true };
}
