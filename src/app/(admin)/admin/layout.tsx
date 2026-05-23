import { Toaster } from "sonner";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { getActiveBranchCookie } from "@/server/actions/branch-switch";
import { getNotifications } from "@/server/queries/notifications";
import { Topbar } from "@/components/admin/topbar";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();

  // Resolve which branch this view operates on:
  // - reception: locked to user.branchId
  // - admin: cookie-selected, falling back to first branch alphabetically
  const cookieBranch = await getActiveBranchCookie();
  let targetBranchId =
    user.role === "RECEPTION" ? user.branchId : cookieBranch ?? null;
  // Admin fallback — when no cookie is set yet, pick the first branch so the
  // count badges (and everything else that depends on a branch) populate on
  // first load instead of staying at 0.
  if (!targetBranchId && user.role === "ADMIN") {
    const firstBranch = await db.branch.findFirst({
      select: { id: true },
      orderBy: { name: "asc" },
    });
    targetBranchId = firstBranch?.id ?? null;
  }

  const [allBranches, activeBranch, ticketsInFlight, activeItemsCount, activeAddonsCount, notifications] =
    await Promise.all([
      user.role === "ADMIN"
        ? db.branch.findMany({
            select: { id: true, name: true, code: true },
            orderBy: { name: "asc" },
          })
        : user.branchId
          ? db.branch
              .findUnique({ where: { id: user.branchId }, select: { id: true, name: true, code: true } })
              .then((b) => (b ? [b] : []))
          : Promise.resolve([]),
      targetBranchId
        ? db.branch.findUnique({
            where: { id: targetBranchId },
            select: { id: true, name: true, code: true },
          })
        : user.role === "ADMIN"
          ? db.branch.findFirst({
              select: { id: true, name: true, code: true },
              orderBy: { name: "asc" },
            })
          : Promise.resolve(null),
      db.ticket.count({
        where: {
          ...(targetBranchId ? { branchId: targetBranchId } : {}),
          paymentStatus: "UNPAID",
          status: { not: "CANCELLED" },
        },
      }),
      targetBranchId
        ? db.itemType.count({ where: { branchId: targetBranchId, active: true } })
        : Promise.resolve(0),
      targetBranchId
        ? db.addOn.count({ where: { branchId: targetBranchId, active: true } })
        : Promise.resolve(0),
      getNotifications({ branchId: targetBranchId ?? null }),
    ]);

  return (
    <AdminShell
      sidebarProps={{
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        activeBranch,
        branches: allBranches,
        ticketsBadge: ticketsInFlight,
        itemsBadge: activeItemsCount,
        addonsBadge: activeAddonsCount,
      }}
      topbar={
        <Topbar
          notifications={notifications}
          branchId={activeBranch?.id ?? null}
          user={{ name: user.name, email: user.email, role: user.role }}
          activeBranch={activeBranch}
          branches={allBranches}
          canSwitchBranch={user.role === "ADMIN" && allBranches.length > 1}
        />
      }
    >
      {children}
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{ classNames: { toast: "text-[13px]" } }}
      />
    </AdminShell>
  );
}
