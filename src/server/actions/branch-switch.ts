"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";

const COOKIE_NAME = "abkon_active_branch";

export async function setActiveBranch(branchId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireSession();

  const branch = await db.branch.findUnique({ where: { id: branchId }, select: { id: true } });
  if (!branch) return { ok: false, error: "Branch not found." };

  // Reception users can only "switch" to their own branch (no-op).
  if (user.role !== "ADMIN") {
    assertCanAccessBranch(user, branchId);
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, branchId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function getActiveBranchCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
