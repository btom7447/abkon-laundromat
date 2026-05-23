import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/lib/notification-prefs";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

function resolvePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== "object") return DEFAULT_NOTIFICATION_PREFS;
  const r = raw as Partial<NotificationPrefs>;
  return {
    urgent: r.urgent ?? true,
    uncollected: r.uncollected ?? true,
    unpaid: r.unpaid ?? true,
    smsFailed: r.smsFailed ?? true,
    cashReconcile: r.cashReconcile ?? true,
  };
}

export default async function ProfilePage() {
  const session = await requireSession();
  const [user, loginHistory, pinnedItems, branchItems] = await Promise.all([
    db.user.findUnique({
      where: { id: session.id },
      include: { branch: { select: { name: true, code: true } } },
    }),
    db.auditLog.findMany({
      where: {
        actorId: session.id,
        action: { in: ["login_success", "login_mfa_recovery_used"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { createdAt: true, ipAddress: true, userAgent: true, action: true },
    }),
    db.userPinnedItem.findMany({
      where: { userId: session.id },
      orderBy: { pinnedAt: "desc" },
      include: {
        itemType: { select: { id: true, name: true, branchId: true } },
      },
    }),
    // Items the user can pin — scoped to their branch (or all branches for ADMIN)
    db.itemType.findMany({
      where: {
        active: true,
        ...(session.role === "ADMIN" ? {} : { branchId: session.branchId ?? undefined }),
      },
      select: { id: true, name: true, branchId: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      take: 200,
    }),
  ]);
  if (!user) return null;

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        branchName: user.branch?.name ?? null,
        branchCode: user.branch?.code ?? null,
        lastLoginAt: user.lastLoginAt ? formatDate(user.lastLoginAt) : null,
        createdAt: formatDate(user.createdAt),
        passwordChangedAt: user.passwordChangedAt ? formatDate(user.passwordChangedAt) : null,
        mfaEnabled: user.mfaEnabled,
        mfaRecoveryCount: user.mfaRecoveryCodes.length,
        notificationPrefs: resolvePrefs(user.notificationPrefs),
        deletionRequestedAt: user.deletionRequestedAt
          ? formatDate(user.deletionRequestedAt)
          : null,
      }}
      loginHistory={loginHistory.map((e) => ({
        when: formatDate(e.createdAt),
        ip: e.ipAddress,
        userAgent: e.userAgent,
        usedRecovery: e.action === "login_mfa_recovery_used",
      }))}
      pinnedItems={pinnedItems.map((p) => ({
        id: p.itemType.id,
        name: p.itemType.name,
      }))}
      availableItems={branchItems}
    />
  );
}
