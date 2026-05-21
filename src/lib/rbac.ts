import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
};

export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}

/**
 * For reception users, returns their branch ID.
 * Admins must explicitly pick a branch via query/session.
 */
export function branchScopeFor(user: SessionUser, requestedBranchId?: string | null): string | null {
  if (user.role === "ADMIN") return requestedBranchId ?? null;
  return user.branchId;
}

export function assertCanAccessBranch(user: SessionUser, branchId: string): void {
  if (user.role === "ADMIN") return;
  if (user.branchId !== branchId) {
    throw new Error("Forbidden: branch access denied");
  }
}
