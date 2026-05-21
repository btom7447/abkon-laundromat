import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac";

export type BranchContext = {
  branchId: string;
  branchName: string;
  branchCode: string;
  branches: { id: string; name: string; code: string }[];
};

/**
 * Resolves the active branch context for a CMS page.
 * - Reception users are scoped to their own branch.
 * - Admins pick a branch via ?branch=<id>; defaults to the first active branch.
 *
 * Returns null if there are no branches at all.
 */
export async function resolveBranchContext(
  user: SessionUser,
  requestedBranchId: string | null | undefined
): Promise<BranchContext | null> {
  const branches = await db.branch.findMany({
    select: { id: true, name: true, code: true, active: true },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  if (branches.length === 0) return null;

  let activeId: string;
  if (user.role === "ADMIN") {
    activeId = requestedBranchId && branches.find((b) => b.id === requestedBranchId)
      ? requestedBranchId
      : branches[0]!.id;
  } else {
    if (!user.branchId) return null;
    activeId = user.branchId;
  }

  const active = branches.find((b) => b.id === activeId);
  if (!active) return null;

  return {
    branchId: active.id,
    branchName: active.name,
    branchCode: active.code,
    branches: user.role === "ADMIN"
      ? branches.map(({ id, name, code }) => ({ id, name, code }))
      : branches.filter((b) => b.id === activeId).map(({ id, name, code }) => ({ id, name, code })),
  };
}
