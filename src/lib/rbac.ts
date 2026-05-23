import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

/**
 * Memoize the session lookup per request. Auth.js's JWT strategy decrypts the
 * session cookie on every call; without this, layouts + pages + server actions
 * each pay that cost. React.cache deduplicates within a render.
 */
const cachedAuth = cache(async () => auth());

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
};

/**
 * Resolve the current session or redirect to /login. Used as the standard
 * entry guard for any /admin page or server action.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await cachedAuth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/**
 * Same as `requireSession` but returns null instead of redirecting. Useful for
 * conditional UI in shared layouts.
 */
export async function maybeSession(): Promise<SessionUser | null> {
  const session = await cachedAuth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/**
 * Require an admin session. Reception users get redirected to /admin instead
 * of seeing a 403, which is friendlier inside the admin app.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}

/**
 * Stricter variant: throws notFound() instead of redirecting. Use this when a
 * deep link to an admin-only resource should appear to not exist for reception.
 */
export async function requireAdminOrNotFound(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== "ADMIN") notFound();
  return user;
}

/**
 * For reception users, returns their branch ID. Admins must explicitly pick
 * a branch via query/session.
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

/**
 * Boolean check (no throw) — used in components to conditionally render
 * admin-only widgets without bouncing the page.
 */
export function isAdmin(user: SessionUser): boolean {
  return user.role === "ADMIN";
}
