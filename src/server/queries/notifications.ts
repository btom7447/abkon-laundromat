import "server-only";
import { db } from "@/lib/db";

export type NotificationItem = {
  id: string;
  tone: "sky" | "success" | "warn" | "danger";
  title: string;
  body: string;
  /** Optional ticket number rendered as a mono badge next to the body. */
  ticketNumber?: string | null;
  href: string;
  createdAt: Date;
  /** True when this user has previously marked this notification as read. */
  read?: boolean;
};

/**
 * Live attention items — derived from current ticket + cash state, not stored.
 * Pulled per-branch (or all branches for admin without a branch).
 *
 * When `userId` is provided, each item's `read` field is filled from the
 * NotificationRead table so the UI can dim already-seen notifications and the
 * badge can show an accurate unread count.
 */
type NotificationPrefs = {
  urgent: boolean;
  uncollected: boolean;
  unpaid: boolean;
  smsFailed: boolean;
  cashReconcile: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  urgent: true,
  uncollected: true,
  unpaid: true,
  smsFailed: true,
  cashReconcile: true,
};

function resolvePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== "object") return DEFAULT_PREFS;
  const r = raw as Partial<NotificationPrefs>;
  return {
    urgent: r.urgent ?? true,
    uncollected: r.uncollected ?? true,
    unpaid: r.unpaid ?? true,
    smsFailed: r.smsFailed ?? true,
    cashReconcile: r.cashReconcile ?? true,
  };
}

export async function getNotifications(opts: {
  branchId: string | null;
  userId?: string | null;
}): Promise<NotificationItem[]> {
  const now = new Date();
  const branchFilter = opts.branchId ? { branchId: opts.branchId } : {};

  const fourDaysAgo = new Date(now.getTime() - 4 * 86_400_000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [uncollected, urgentDueToday, unpaidLong, failedSms, missedReconcile] = await Promise.all([
    db.ticket.findMany({
      where: { ...branchFilter, status: { in: ["READY", "IN_STORAGE"] }, readyAt: { lte: fourDaysAgo } },
      orderBy: { readyAt: "asc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    db.ticket.findMany({
      where: {
        ...branchFilter,
        isUrgent: true,
        status: { in: ["RECEIVED", "READY"] },
        pickupDatePromised: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { pickupDatePromised: "asc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    db.ticket.findMany({
      where: {
        ...branchFilter,
        paymentStatus: "UNPAID",
        status: { in: ["COLLECTED", "READY", "IN_STORAGE"] },
        OR: [{ readyAt: { lte: sevenDaysAgo } }, { receivedAt: { lte: sevenDaysAgo }, readyAt: null }],
      },
      orderBy: { receivedAt: "asc" },
      take: 3,
      include: { customer: { select: { name: true } } },
    }),
    db.smsLog.findMany({
      where: { status: "FAILED", createdAt: { gte: yesterdayStart } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    opts.branchId
      ? db.cashReconciliation.findFirst({
          where: { branchId: opts.branchId, date: { gte: yesterdayStart, lt: todayStart } },
        })
      : Promise.resolve(null),
  ]);

  // Pull user prefs in parallel with the rest, if a user was provided.
  const userPrefs: NotificationPrefs = opts.userId
    ? resolvePrefs(
        (
          await db.user.findUnique({
            where: { id: opts.userId },
            select: { notificationPrefs: true },
          })
        )?.notificationPrefs ?? null
      )
    : DEFAULT_PREFS;

  const items: NotificationItem[] = [];

  if (userPrefs.urgent)
  for (const t of urgentDueToday) {
    items.push({
      id: `urgent-${t.id}`,
      tone: "warn",
      title: "Urgent pickup due today",
      body: `${t.customer.name} · by ${formatTime(t.pickupDatePromised)}`,
      ticketNumber: t.ticketNumber,
      href: `/admin/tickets/${t.id}`,
      createdAt: t.pickupDatePromised,
    });
  }

  if (userPrefs.uncollected)
  for (const t of uncollected) {
    const days = Math.floor((now.getTime() - (t.readyAt?.getTime() ?? now.getTime())) / 86_400_000);
    items.push({
      id: `uncollected-${t.id}`,
      tone: days >= 7 ? "danger" : "warn",
      title: `Uncollected for ${days} day${days === 1 ? "" : "s"}`,
      body: `${t.customer.name} · ready since ${formatDate(t.readyAt ?? t.receivedAt)}`,
      ticketNumber: t.ticketNumber,
      href: `/admin/tickets/${t.id}`,
      createdAt: t.readyAt ?? t.receivedAt,
    });
  }

  if (userPrefs.unpaid)
  for (const t of unpaidLong) {
    items.push({
      id: `unpaid-${t.id}`,
      tone: "danger",
      title: "Unpaid over 7 days",
      body: `${t.customer.name} · ${formatCurrency(t.grandTotal)} outstanding`,
      ticketNumber: t.ticketNumber,
      href: `/admin/tickets/${t.id}`,
      createdAt: t.receivedAt,
    });
  }

  if (userPrefs.smsFailed)
  for (const s of failedSms) {
    items.push({
      id: `sms-${s.id}`,
      tone: "warn",
      title: "SMS delivery failed",
      body: `To ${s.customerPhone} · ${s.error?.slice(0, 80) ?? "Provider rejected the message."}`,
      href: s.ticketId ? `/admin/tickets/${s.ticketId}` : "/admin/audit",
      createdAt: s.createdAt,
    });
  }

  if (userPrefs.cashReconcile && opts.branchId && !missedReconcile) {
    items.push({
      id: `cash-yesterday`,
      tone: "sky",
      title: "Yesterday's cash not reconciled",
      body: "Close out the previous day before tonight's drawer count.",
      href: "/admin/cash",
      createdAt: yesterdayStart,
    });
  }

  const sorted = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Layer per-user read state on top so the badge can show an unread count and
  // each row can render in a "seen" style.
  if (opts.userId && sorted.length > 0) {
    const reads = await db.notificationRead.findMany({
      where: {
        userId: opts.userId,
        notificationId: { in: sorted.map((s) => s.id) },
      },
      select: { notificationId: true },
    });
    const readSet = new Set(reads.map((r) => r.notificationId));
    return sorted.map((n) => ({ ...n, read: readSet.has(n.id) }));
  }

  return sorted;
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric" }).format(d);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
