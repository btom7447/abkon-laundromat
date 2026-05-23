import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d = new Date()): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function priorMonthRange(d = new Date()): { from: Date; to: Date } {
  const from = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const to = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
  return { from, to };
}

function delta(curr: number, prev: number): { pct: number; direction: "up" | "down" | "flat" } {
  if (prev === 0) {
    if (curr === 0) return { pct: 0, direction: "flat" };
    return { pct: 100, direction: "up" };
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { pct: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export type DashboardStats = {
  today: {
    revenue: number;
    ticketsCreated: number;
    ticketsPaid: number;
    averageTicketValue: number;
    ticketsReady: number;
    urgentDueToday: number;
    newCustomers: number;
    paidVsCreatedDelta: number; // unused, but useful in UI
  };
  month: {
    revenue: number;
    revenueDelta: ReturnType<typeof delta>;
    tickets: number;
    ticketsDelta: ReturnType<typeof delta>;
    averageTicketValue: number;
    averageTicketValueDelta: ReturnType<typeof delta>;
    topItem: { name: string; quantity: number; revenue: number } | null;
    topService: { service: string; revenue: number; share: number } | null;
  };
  attention: {
    unpaidLong: { count: number; total: number; oldestDays: number };
    uncollectedLong: { count: number; total: number };
    pendingBotBookings: number;
    discountsToday: { count: number; total: number; allUnderCap: boolean };
  };
  revenueLast30: Array<{ date: string; revenue: number }>;
  activity: Array<{
    id: string;
    action: string;
    actorName: string | null;
    entityType: string;
    entityId: string | null;
    summary: string;
    createdAt: Date;
  }>;
};

export async function loadDashboardStats(opts: {
  branchId: string | null;
  branchMaxDiscountPercent: number;
}): Promise<DashboardStats> {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const prev = priorMonthRange(now);
  const thirtyDaysAgo = new Date(dayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const branchFilter: Prisma.TicketWhereInput = opts.branchId ? { branchId: opts.branchId } : {};

  const [
    todayPaidAgg,
    todayCreated,
    todayReady,
    todayUrgent,
    todayNewCustomers,
    monthPaidAgg,
    monthCreated,
    prevMonthPaidAgg,
    prevMonthCreated,
    topItem,
    serviceSplit,
    unpaidLong,
    uncollectedLong,
    discountsToday,
    revenue30Raw,
    auditEvents,
  ] = await Promise.all([
    db.ticket.aggregate({
      where: { ...branchFilter, paymentStatus: "PAID", paidAt: { gte: dayStart, lte: dayEnd } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    db.ticket.count({ where: { ...branchFilter, createdAt: { gte: dayStart, lte: dayEnd } } }),
    db.ticket.count({ where: { ...branchFilter, status: "READY" } }),
    db.ticket.count({
      where: {
        ...branchFilter,
        isUrgent: true,
        status: { in: ["RECEIVED", "READY"] },
        pickupDatePromised: { gte: dayStart, lte: dayEnd },
      },
    }),
    db.customer.count({
      where: {
        ...(opts.branchId ? { branchId: opts.branchId } : {}),
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    db.ticket.aggregate({
      where: { ...branchFilter, paymentStatus: "PAID", paidAt: { gte: monthStart, lte: dayEnd } },
      _sum: { grandTotal: true },
      _avg: { grandTotal: true },
      _count: true,
    }),
    db.ticket.count({ where: { ...branchFilter, createdAt: { gte: monthStart, lte: dayEnd } } }),
    db.ticket.aggregate({
      where: { ...branchFilter, paymentStatus: "PAID", paidAt: { gte: prev.from, lte: prev.to } },
      _sum: { grandTotal: true },
      _avg: { grandTotal: true },
      _count: true,
    }),
    db.ticket.count({ where: { ...branchFilter, createdAt: { gte: prev.from, lte: prev.to } } }),
    db.ticketLineItem.groupBy({
      by: ["itemTypeNameSnapshot"],
      where: {
        ticket: {
          ...branchFilter,
          status: { not: "CANCELLED" },
          createdAt: { gte: monthStart, lte: dayEnd },
        },
      },
      _sum: { quantity: true, lineSubtotal: true },
      orderBy: { _sum: { lineSubtotal: "desc" } },
      take: 1,
    }),
    db.ticketLineItem.groupBy({
      by: ["service"],
      where: {
        ticket: {
          ...branchFilter,
          status: { not: "CANCELLED" },
          createdAt: { gte: monthStart, lte: dayEnd },
        },
      },
      _sum: { lineSubtotal: true },
    }),
    db.ticket.findMany({
      where: {
        ...branchFilter,
        paymentStatus: "UNPAID",
        status: { in: ["COLLECTED", "READY", "IN_STORAGE"] },
        OR: [
          { readyAt: { lte: new Date(now.getTime() - 7 * 86400000) } },
          { receivedAt: { lte: new Date(now.getTime() - 7 * 86400000) }, readyAt: null },
        ],
      },
      select: { grandTotal: true, readyAt: true, createdAt: true },
    }),
    db.ticket.findMany({
      where: {
        ...branchFilter,
        status: { in: ["READY", "IN_STORAGE"] },
        readyAt: { lte: new Date(now.getTime() - 4 * 86400000) },
      },
      select: { grandTotal: true },
    }),
    db.ticket.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: dayStart, lte: dayEnd },
        discountAmount: { gt: 0 },
      },
      select: { discountAmount: true, discountPercent: true },
    }),
    db.ticket.findMany({
      where: { ...branchFilter, paymentStatus: "PAID", paidAt: { gte: thirtyDaysAgo, lte: dayEnd } },
      select: { paidAt: true, grandTotal: true },
    }),
    db.auditLog.findMany({
      where: opts.branchId ? { branchId: opts.branchId } : {},
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const todayRevenue = todayPaidAgg._sum.grandTotal ?? 0;
  const monthRevenue = monthPaidAgg._sum.grandTotal ?? 0;
  const monthAvg = Math.round(monthPaidAgg._avg.grandTotal ?? 0);
  const prevRevenue = prevMonthPaidAgg._sum.grandTotal ?? 0;
  const prevAvg = Math.round(prevMonthPaidAgg._avg.grandTotal ?? 0);

  const unpaidTotal = unpaidLong.reduce((sum, t) => sum + t.grandTotal, 0);
  const oldestUnpaidDays = unpaidLong.reduce((max, t) => {
    const ref = t.readyAt ?? t.createdAt;
    const days = Math.floor((now.getTime() - ref.getTime()) / 86400000);
    return Math.max(max, days);
  }, 0);

  const totalServiceRevenue = serviceSplit.reduce((sum, s) => sum + (s._sum.lineSubtotal ?? 0), 0);
  const topServiceEntry = serviceSplit.length
    ? serviceSplit.reduce((top, s) =>
        (s._sum.lineSubtotal ?? 0) > (top._sum.lineSubtotal ?? 0) ? s : top
      )
    : null;

  const serviceLabel = (s: string) =>
    s === "WASH"
      ? "Wash"
      : s === "IRON"
        ? "Iron"
        : s === "WASH_AND_IRON"
          ? "Wash & Iron"
          : s === "DRY_CLEAN"
            ? "Dry clean"
            : s;

  const discountsTotal = discountsToday.reduce((s, d) => s + d.discountAmount, 0);
  const allUnderCap = discountsToday.every((d) => d.discountPercent <= opts.branchMaxDiscountPercent);

  // Aggregate revenue per day for the 30-day chart
  const revenueByDayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    revenueByDayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of revenue30Raw) {
    if (!r.paidAt) continue;
    const key = r.paidAt.toISOString().slice(0, 10);
    if (revenueByDayMap.has(key)) {
      revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + r.grandTotal);
    }
  }

  return {
    today: {
      revenue: todayRevenue,
      ticketsCreated: todayCreated,
      ticketsPaid: todayPaidAgg._count,
      averageTicketValue: todayPaidAgg._count > 0 ? Math.round(todayRevenue / todayPaidAgg._count) : 0,
      ticketsReady: todayReady,
      urgentDueToday: todayUrgent,
      newCustomers: todayNewCustomers,
      paidVsCreatedDelta: todayCreated - todayPaidAgg._count,
    },
    month: {
      revenue: monthRevenue,
      revenueDelta: delta(monthRevenue, prevRevenue),
      tickets: monthCreated,
      ticketsDelta: delta(monthCreated, prevMonthCreated),
      averageTicketValue: monthAvg,
      averageTicketValueDelta: delta(monthAvg, prevAvg),
      topItem: topItem[0]
        ? {
            name: topItem[0].itemTypeNameSnapshot,
            quantity: topItem[0]._sum.quantity ?? 0,
            revenue: topItem[0]._sum.lineSubtotal ?? 0,
          }
        : null,
      topService: topServiceEntry
        ? {
            service: serviceLabel(topServiceEntry.service),
            revenue: topServiceEntry._sum.lineSubtotal ?? 0,
            share:
              totalServiceRevenue > 0
                ? Math.round(((topServiceEntry._sum.lineSubtotal ?? 0) / totalServiceRevenue) * 100)
                : 0,
          }
        : null,
    },
    attention: {
      unpaidLong: { count: unpaidLong.length, total: unpaidTotal, oldestDays: oldestUnpaidDays },
      uncollectedLong: {
        count: uncollectedLong.length,
        total: uncollectedLong.reduce((s, t) => s + t.grandTotal, 0),
      },
      pendingBotBookings: 0, // M4
      discountsToday: { count: discountsToday.length, total: discountsTotal, allUnderCap },
    },
    revenueLast30: Array.from(revenueByDayMap.entries()).map(([date, revenue]) => ({ date, revenue })),
    activity: auditEvents.map((e) => ({
      id: e.id,
      action: e.action,
      actorName: e.actor?.name ?? null,
      entityType: e.entityType,
      entityId: e.entityId,
      summary: humanizeAction(e.action, e.entityType, e.entityId),
      createdAt: e.createdAt,
    })),
  };
}

function humanizeAction(action: string, entityType: string, entityId: string | null): string {
  const id = entityId ? entityId.slice(0, 8) : "";
  const map: Record<string, string> = {
    ticket_created: `New ticket created`,
    ticket_ready: `Ticket marked Ready`,
    ticket_collected: `Ticket collected`,
    ticket_cancelled: `Ticket cancelled`,
    ticket_in_storage: `Ticket moved to storage`,
    ticket_paid: `Cash collected`,
    discount_applied: `Discount applied`,
    customer_created: `New customer added`,
    customer_updated: `Customer updated`,
    item_price_changed: `Item price changed`,
    addon_price_changed: `Add-on price changed`,
    login_success: `Sign-in`,
    login_failure: `Failed sign-in attempt`,
    login_locked: `Account locked`,
    cash_reconciliation_created: `Cash reconciled`,
    cash_reconciliation_updated: `Cash reconciliation updated`,
  };
  return map[action] ?? `${action.replace(/_/g, " ")} on ${entityType} ${id}`;
}

export type Period = "today" | "week" | "month";

export type PeriodMetrics = {
  period: Period;
  label: string; // "Today", "This week", "This month"
  revenue: number;
  ticketsCreated: number;
  ticketsPaid: number;
  averageTicketValue: number;
  /** Series for the KPI sparkline AND the larger chart. Length varies by period. */
  series: Array<{ key: string; revenue: number }>;
  chartLabel: string; // "Revenue today (hourly)" etc.
};

function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // ISO week (Mon = 0)
  x.setDate(x.getDate() - diff);
  return x;
}

/**
 * Period-scoped revenue + ticket metrics with a series suitable for both the
 * KPI sparkline and the larger revenue chart.
 *
 * - today  → 24 hourly buckets (00:00..23:00 of today)
 * - week   → 7 daily buckets (Mon..Sun of this week so far)
 * - month  → 30 daily buckets ending today
 */
export async function loadPeriodMetrics(opts: {
  branchId: string | null;
  period: Period;
}): Promise<PeriodMetrics> {
  const now = new Date();
  const branchFilter: Prisma.TicketWhereInput = opts.branchId ? { branchId: opts.branchId } : {};

  let from: Date;
  let to: Date = endOfDay(now);
  let label: string;
  let chartLabel: string;

  if (opts.period === "today") {
    from = startOfDay(now);
    label = "Today";
    chartLabel = "Revenue today";
  } else if (opts.period === "week") {
    from = startOfWeek(now);
    label = "This week";
    chartLabel = "Revenue this week";
  } else {
    from = startOfDay(now);
    from.setDate(from.getDate() - 29);
    label = "This month";
    chartLabel = "Revenue · last 30 days";
  }

  const [paidAgg, created, paidTickets] = await Promise.all([
    db.ticket.aggregate({
      where: { ...branchFilter, paymentStatus: "PAID", paidAt: { gte: from, lte: to } },
      _sum: { grandTotal: true },
      _avg: { grandTotal: true },
      _count: true,
    }),
    db.ticket.count({ where: { ...branchFilter, createdAt: { gte: from, lte: to } } }),
    db.ticket.findMany({
      where: { ...branchFilter, paymentStatus: "PAID", paidAt: { gte: from, lte: to } },
      select: { paidAt: true, grandTotal: true },
    }),
  ]);

  // Build the series buckets.
  const series: Array<{ key: string; revenue: number }> = [];
  if (opts.period === "today") {
    for (let h = 0; h < 24; h++) series.push({ key: `${h}`, revenue: 0 });
    for (const t of paidTickets) {
      if (!t.paidAt) continue;
      const h = t.paidAt.getHours();
      series[h]!.revenue += t.grandTotal;
    }
  } else {
    const days = opts.period === "week" ? 7 : 30;
    const start = new Date(from);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      series.push({ key: d.toISOString().slice(0, 10), revenue: 0 });
    }
    const idxOf = new Map(series.map((s, i) => [s.key, i] as const));
    for (const t of paidTickets) {
      if (!t.paidAt) continue;
      const key = t.paidAt.toISOString().slice(0, 10);
      const i = idxOf.get(key);
      if (i != null) series[i]!.revenue += t.grandTotal;
    }
  }

  const revenue = paidAgg._sum.grandTotal ?? 0;
  return {
    period: opts.period,
    label,
    revenue,
    ticketsCreated: created,
    ticketsPaid: paidAgg._count,
    averageTicketValue: paidAgg._count > 0 ? Math.round(revenue / paidAgg._count) : 0,
    series,
    chartLabel,
  };
}

export function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}
