import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { z } from "zod";

import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { recordAudit } from "@/lib/audit";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { verifyMfaTotpOrRecovery } from "@/lib/mfa";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
  // Optional second-factor code — six-digit TOTP or a recovery code. Required
  // only when the resolved user has `mfaEnabled = true`.
  mfaCode: z.string().max(40).optional().or(z.literal("")).or(z.literal(null)),
});

const ACCOUNT_LOCK_MINUTES = 15;
const LOCK_AFTER_FAILED = 5;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const rate = await checkLoginRateLimit(email.toLowerCase());
        if (!rate.allowed) {
          await recordAudit({
            action: "login_rate_limited",
            entityType: "user",
            entityId: email,
          });
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            branchId: true,
            passwordHash: true,
            active: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            mfaEnabled: true,
          },
        });

        if (!user || !user.active) {
          await recordAudit({
            action: "login_failure",
            entityType: "user",
            entityId: email,
            afterState: { reason: "no_user_or_inactive" },
          });
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            action: "login_locked",
            entityType: "user",
            entityId: user.id,
          });
          return null;
        }

        let valid = false;
        try {
          valid = await verify(user.passwordHash, password);
        } catch {
          valid = false;
        }

        if (!valid) {
          const newAttempts = user.failedLoginAttempts + 1;
          const shouldLock = newAttempts >= LOCK_AFTER_FAILED;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              lockedUntil: shouldLock
                ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60_000)
                : null,
            },
          });
          await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            action: shouldLock ? "login_locked" : "login_failure",
            entityType: "user",
            entityId: user.id,
            afterState: { failedAttempts: newAttempts },
          });
          return null;
        }

        // ── Two-factor check ─────────────────────────────────────────
        if (user.mfaEnabled) {
          const mfaCode = (parsed.data.mfaCode ?? "").toString().trim();
          if (!mfaCode) {
            // Distinct rejection so the form can show "Enter your 2FA code" instead of "Wrong password"
            await recordAudit({
              actorId: user.id,
              actorRole: user.role,
              action: "login_mfa_required",
              entityType: "user",
              entityId: user.id,
            });
            // Throw a tagged error so the action layer can branch on it.
            throw new Error("MFA_REQUIRED");
          }
          const mfaOk = await verifyMfaTotpOrRecovery(user.id, mfaCode);
          if (!mfaOk.ok) {
            await db.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: { increment: 1 } },
            });
            await recordAudit({
              actorId: user.id,
              actorRole: user.role,
              action: "login_mfa_failure",
              entityType: "user",
              entityId: user.id,
            });
            throw new Error("MFA_INVALID");
          }
          if (mfaOk.usedRecovery) {
            await recordAudit({
              actorId: user.id,
              actorRole: user.role,
              action: "login_mfa_recovery_used",
              entityType: "user",
              entityId: user.id,
            });
          }
        }

        await db.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await resetLoginRateLimit(email.toLowerCase());
        await recordAudit({
          actorId: user.id,
          actorRole: user.role,
          branchId: user.branchId,
          action: "login_success",
          entityType: "user",
          entityId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
        };
      },
    }),
  ],
});
