import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = env.LOGIN_RATE_LIMIT_WINDOW * 1000;
  const max = env.LOGIN_RATE_LIMIT_MAX;

  const existing = await db.loginRateLimit.findUnique({ where: { identifier } });

  if (!existing || existing.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + windowMs);
    await db.loginRateLimit.upsert({
      where: { identifier },
      create: { identifier, attempts: 1, windowStart: now, expiresAt },
      update: { attempts: 1, windowStart: now, expiresAt },
    });
    return { allowed: true, remaining: max - 1, resetAt: expiresAt };
  }

  if (existing.attempts >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.expiresAt };
  }

  const updated = await db.loginRateLimit.update({
    where: { identifier },
    data: { attempts: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: max - updated.attempts,
    resetAt: existing.expiresAt,
  };
}

export async function resetLoginRateLimit(identifier: string): Promise<void> {
  await db.loginRateLimit.deleteMany({ where: { identifier } }).catch(() => undefined);
}
