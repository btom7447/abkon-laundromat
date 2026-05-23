"use server";

import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

const APP_LABEL = "Abkon Laundromat";

// TOTP step is 30s; allow ±1 step drift so slow phones / clocks don't fail.
const TOTP_TOLERANCE = 1;

export type MfaSetupState = {
  error?: string;
  /** Provisional secret + otpauth URL + base64 QR data URL — returned from init. */
  secret?: string;
  otpauthUrl?: string;
  qrDataUrl?: string;
};

export type MfaVerifyState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Plain-text recovery codes — surfaced ONCE after successful setup. */
  recoveryCodes?: string[];
  success?: boolean;
};

function generateRecoveryCodes(count = 8): string[] {
  // 10-char alphanumeric, formatted XXXX-XXXX-XX for readability.
  const out: string[] = [];
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  for (let i = 0; i < count; i++) {
    let code = "";
    const buf = new Uint32Array(10);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(buf);
    }
    for (let j = 0; j < 10; j++) code += alphabet[buf[j]! % alphabet.length];
    out.push(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 10)}`);
  }
  return out;
}

/**
 * Step 1: generate a new TOTP secret + QR for the signed-in user. The secret
 * is returned to the client for display but NOT persisted yet — only after the
 * user proves they've added it to their authenticator app (step 2) do we
 * commit it to the DB.
 */
export async function initMfaSetupAction(): Promise<MfaSetupState> {
  const actor = await requireSession();
  if (!actor.email) return { error: "Missing email" };

  const secret = generateSecret({ length: 20 });
  const otpauthUrl = generateURI({
    strategy: "totp",
    label: actor.email,
    issuer: APP_LABEL,
    secret,
  });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 240,
    margin: 1,
    color: { dark: "#0B1226", light: "#FFFFFF" },
  });

  return { secret, otpauthUrl, qrDataUrl };
}

/**
 * Step 2: user enters a 6-digit code from the authenticator. If it verifies
 * against the provisional secret we just generated, we commit + generate
 * recovery codes. We return the plain-text recovery codes ONCE — they're
 * argon2-hashed before storage so we can't surface them again later.
 */
export async function verifyMfaSetupAction(
  _prev: MfaVerifyState,
  formData: FormData
): Promise<MfaVerifyState> {
  const actor = await requireSession();
  const secret = String(formData.get("secret") ?? "");
  const code = String(formData.get("code") ?? "");

  if (!/^[A-Z2-7]{16,}$/.test(secret)) return { error: "Setup expired. Start again." };
  if (!/^\d{6}$/.test(code)) {
    return { fieldErrors: { code: ["Enter the 6-digit code from your authenticator"] } };
  }

  const result = verifySync({
    strategy: "totp",
    token: code,
    secret,
    epochTolerance: TOTP_TOLERANCE,
  });
  if (!result.valid) {
    return { fieldErrors: { code: ["Code didn't match. Try again."] } };
  }

  // Commit secret + generate recovery codes
  const recoveryCodes = generateRecoveryCodes(8);
  const hashedCodes = await Promise.all(recoveryCodes.map((c) => hash(c, ARGON_OPTIONS)));

  await db.user.update({
    where: { id: actor.id },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaRecoveryCodes: hashedCodes,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "mfa_enabled",
    entityType: "user",
    entityId: actor.id,
  });

  return { success: true, recoveryCodes };
}

/**
 * Disable 2FA. We don't require re-verification here because the user is
 * already authenticated via session — but we audit it.
 */
export async function disableMfaAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireSession();
  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user) return { ok: false, error: "Account not found" };
  if (!user.mfaEnabled) return { ok: true };

  await db.user.update({
    where: { id: actor.id },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaRecoveryCodes: [],
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "mfa_disabled",
    entityType: "user",
    entityId: actor.id,
  });

  return { ok: true };
}

/**
 * Regenerate recovery codes — invalidates any old ones.
 */
export async function regenerateRecoveryCodesAction(): Promise<
  { ok: true; codes: string[] } | { ok: false; error: string }
> {
  const actor = await requireSession();
  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user || !user.mfaEnabled) {
    return { ok: false, error: "Enable 2FA first" };
  }

  const codes = generateRecoveryCodes(8);
  const hashed = await Promise.all(codes.map((c) => hash(c, ARGON_OPTIONS)));

  await db.user.update({
    where: { id: actor.id },
    data: { mfaRecoveryCodes: hashed },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: actor.branchId,
    action: "mfa_recovery_codes_regenerated",
    entityType: "user",
    entityId: actor.id,
  });

  return { ok: true, codes };
}

