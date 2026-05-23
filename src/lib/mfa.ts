import "server-only";
import { verifySync } from "otplib";
import { verify } from "@node-rs/argon2";
import { db } from "@/lib/db";

// TOTP step is 30s; allow ±1 step drift so slow phones / clocks don't fail.
const TOTP_TOLERANCE = 1;

/**
 * Verify a TOTP code OR a recovery code against the user's stored secret /
 * hashed recovery codes. If the user enters a recovery code, it's consumed
 * (one-time use). Used by the Credentials provider in auth.ts.
 *
 * NOT an action — kept in /lib so it can't be invoked as RPC from clients.
 */
export async function verifyMfaTotpOrRecovery(
  userId: string,
  code: string
): Promise<{ ok: true; usedRecovery: boolean } | { ok: false }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.mfaEnabled || !user.mfaSecret) return { ok: false };

  const trimmed = code.replace(/\s+/g, "").toUpperCase();

  // TOTP — six digits from the authenticator app
  if (/^\d{6}$/.test(trimmed)) {
    const result = verifySync({
      strategy: "totp",
      token: trimmed,
      secret: user.mfaSecret,
      epochTolerance: TOTP_TOLERANCE,
    });
    return result.valid ? { ok: true, usedRecovery: false } : { ok: false };
  }

  // Recovery code — XXXX-XXXX-XX (we accept with or without dashes)
  if (/^[A-Z0-9]{8,12}-?[A-Z0-9]{0,4}-?[A-Z0-9]{0,4}$/.test(trimmed)) {
    const clean = trimmed.replace(/-/g, "");
    if (clean.length === 10) {
      const formatted = `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 10)}`;
      for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
        const hashed = user.mfaRecoveryCodes[i]!;
        // eslint-disable-next-line no-await-in-loop
        const ok = await verify(hashed, formatted).catch(() => false);
        if (ok) {
          const remaining = user.mfaRecoveryCodes.filter((_, idx) => idx !== i);
          await db.user.update({
            where: { id: user.id },
            data: { mfaRecoveryCodes: remaining },
          });
          return { ok: true, usedRecovery: true };
        }
      }
    }
  }

  return { ok: false };
}
