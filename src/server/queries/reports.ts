import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { eachDayInRange, isoDateLocal, type DateRange } from "@/lib/date-range";

export type ReportScope = {
  branchId: string | null; // null = all branches (admin only)
  range: DateRange;
};

function branchFilter(scope: ReportScope): Prisma.TicketWhereInput {
  return scope.branchId ? { branchId: scope.branchId } : {};
}

export type RevenueByDay = { date: string; revenue: number; tickets: number };

export async function revenueByDay(scope: ReportScope): Promise<RevenueByDay[]> {
  const where: Prisma.TicketWhereInput = {
    ...branchFilter(scope),
    paidAt: { gte: scope.range.from, lte: scope.range.to },
    paymentStatus: "PAID",
  };

  const tickets = await db.ticket.findMany({
    where,
    select: { paidAt: true, grandTotal: true },
  });

  const byDay = new Map<string, { revenue: number; tickets: number }>();
  for (const d of eachDayInRange(scope.range)) {
    byDay.set(isoDateLocal(d), { revenue: 0, tickets: 0 });
  }

  for (const t of tickets) {
    if (!t.paidAt) continue;
    const key = isoDateLocal(t.paidAt);
    const entry = byDay.get(key);
    if (entry) {
      entry.revenue += t.grandTotal;
      entry.tickets += 1;
    }
  }

  return Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));
}

export type CoreStats = {
  ticketsCreated: number;
  ticketsPaid: number;
  revenue: number;
  averageTicketValue: number;
  urgentRatio: number;
  walkInVsBot: { walkIn: number; bot: number };
};

export async function coreStats(scope: ReportScope): Promise<CoreStats> {
  const baseWhere: Prisma.TicketWhereInput = {
    ...branchFilter(scope),
    createdAt: { gte: scope.range.from, lte: scope.range.to },
  };

  const [created, urgent, walkIn, bot, paidAgg] = await Promise.all([
    db.ticket.count({ where: baseWhere }),
    db.ticket.count({ where: { ...baseWhere, isUrgent: true } }),
    db.ticket.count({ where: { ...baseWhere, source: "WALK_IN" } }),
    db.ticket.count({ where: { ...baseWhere, source: "BOT" } }),
    db.ticket.aggregate({
      where: {
        ...branchFilter(scope),
        paidAt: { gte: scope.range.from, lte: scope.range.to },
        paymentStatus: "PAID",
      },
      _sum: { grandTotal: true },
      _avg: { grandTotal: true },
      _count: true,
    }),
  ]);

  return {
    ticketsCreated: created,
    ticketsPaid: paidAgg._count,
    revenue: paidAgg._sum.grandTotal ?? 0,
    averageTicketValue: Math.round(paidAgg._avg.grandTotal ?? 0),
    urgentRatio: created > 0 ? Math.round((urgent / created) * 100) : 0,
    walkInVsBot: { walkIn, bot },
  };
}

export type TopItem = { name: string; quantity: number; revenue: number };

export async function topItemsByVolume(scope: ReportScope, limit = 8): Promise<TopItem[]> {
  const grouped = await db.ticketLineItem.groupBy({
    by: ["itemTypeNameSnapshot"],
    where: {
      ticket: {
        ...branchFilter(scope),
        createdAt: { gte: scope.range.from, lte: scope.range.to },
        status: { not: "CANCELLED" },
      },
    },
    _sum: { quantity: true, lineSubtotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return grouped.map((g) => ({
    name: g.itemTypeNameSnapshot,
    quantity: g._sum.quantity ?? 0,
    revenue: g._sum.lineSubtotal ?? 0,
  }));
}

export async function topItemsByRevenue(scope: ReportScope, limit = 8): Promise<TopItem[]> {
  const grouped = await db.ticketLineItem.groupBy({
    by: ["itemTypeNameSnapshot"],
    where: {
      ticket: {
        ...branchFilter(scope),
        createdAt: { gte: scope.range.from, lte: scope.range.to },
        status: { not: "CANCELLED" },
      },
    },
    _sum: { quantity: true, lineSubtotal: true },
    orderBy: { _sum: { lineSubtotal: "desc" } },
    take: limit,
  });

  return grouped.map((g) => ({
    name: g.itemTypeNameSnapshot,
    quantity: g._sum.quantity ?? 0,
    revenue: g._sum.lineSubtotal ?? 0,
  }));
}

export type ServiceSplit = { service: string; count: number; revenue: number };

export async function serviceSplit(scope: ReportScope): Promise<ServiceSplit[]> {
  const grouped = await db.ticketLineItem.groupBy({
    by: ["service"],
    where: {
      ticket: {
        ...branchFilter(scope),
        createdAt: { gte: scope.range.from, lte: scope.range.to },
        status: { not: "CANCELLED" },
      },
    },
    _count: true,
    _sum: { lineSubtotal: true },
  });

  return grouped.map((g) => ({
    service: g.service,
    count: g._count,
    revenue: g._sum.lineSubtotal ?? 0,
  }));
}

export type AgingBucket = { label: string; days: string; count: number; amount: number };

export async function unpaidAging(scope: ReportScope): Promise<AgingBucket[]> {
  const tickets = await db.ticket.findMany({
    where: {
      ...branchFilter(scope),
      paymentStatus: "UNPAID",
      status: { in: ["COLLECTED", "READY", "IN_STORAGE"] },
    },
    select: { grandTotal: true, readyAt: true, createdAt: true },
  });

  const now = Date.now();
  const buckets: AgingBucket[] = [
    { label: "0–3 days", days: "0-3", count: 0, amount: 0 },
    { label: "4–7 days", days: "4-7", count: 0, amount: 0 },
    { label: "8–14 days", days: "8-14", count: 0, amount: 0 },
    { label: "15+ days", days: "15+", count: 0, amount: 0 },
  ];

  for (const t of tickets) {
    const ref = t.readyAt ?? t.createdAt;
    const days = Math.floor((now - ref.getTime()) / 86_400_000);
    const idx = days <= 3 ? 0 : days <= 7 ? 1 : days <= 14 ? 2 : 3;
    const bucket = buckets[idx];
    if (bucket) {
      bucket.count++;
      bucket.amount += t.grandTotal;
    }
  }
  return buckets;
}

export async function uncollectedAging(scope: ReportScope): Promise<AgingBucket[]> {
  const tickets = await db.ticket.findMany({
    where: {
      ...branchFilter(scope),
      status: { in: ["READY", "IN_STORAGE"] },
    },
    select: { grandTotal: true, readyAt: true },
  });

  const now = Date.now();
  const buckets: AgingBucket[] = [
    { label: "0–3 days", days: "0-3", count: 0, amount: 0 },
    { label: "4–7 days", days: "4-7", count: 0, amount: 0 },
    { label: "8–14 days", days: "8-14", count: 0, amount: 0 },
    { label: "15+ days", days: "15+", count: 0, amount: 0 },
  ];

  for (const t of tickets) {
    if (!t.readyAt) continue;
    const days = Math.floor((now - t.readyAt.getTime()) / 86_400_000);
    const idx = days <= 3 ? 0 : days <= 7 ? 1 : days <= 14 ? 2 : 3;
    const bucket = buckets[idx];
    if (bucket) {
      bucket.count++;
      bucket.amount += t.grandTotal;
    }
  }
  return buckets;
}

export type TodayCashSnapshot = {
  date: Date;
  expectedCash: number;
  ticketCount: number;
  alreadyReconciled: boolean;
  countedCash: number | null;
  discrepancy: number | null;
};

export async function todayCashSnapshot(scope: ReportScope): Promise<TodayCashSnapshot> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  if (!scope.branchId) {
    return {
      date: startOfToday,
      expectedCash: 0,
      ticketCount: 0,
      alreadyReconciled: false,
      countedCash: null,
      discrepancy: null,
    };
  }

  const [agg, existing] = await Promise.all([
    db.ticket.aggregate({
      where: {
        branchId: scope.branchId,
        paymentStatus: "PAID",
        paidAt: { gte: startOfToday, lte: endOfToday },
      },
      _sum: { grandTotal: true },
      _count: true,
    }),
    db.cashReconciliation.findUnique({
      where: { branchId_date: { branchId: scope.branchId, date: startOfToday } },
    }),
  ]);

  return {
    date: startOfToday,
    expectedCash: agg._sum.grandTotal ?? 0,
    ticketCount: agg._count,
    alreadyReconciled: !!existing,
    countedCash: existing?.countedCash ?? null,
    discrepancy: existing?.discrepancy ?? null,
  };
}

export async function cashReconciliationHistory(
  branchId: string,
  limit = 30
): Promise<
  Array<{
    id: string;
    date: Date;
    expectedCash: number;
    countedCash: number;
    discrepancy: number;
    notes: string | null;
    reconciledBy: string;
    reconciledAt: Date;
  }>
> {
  const rows = await db.cashReconciliation.findMany({
    where: { branchId },
    orderBy: { date: "desc" },
    take: limit,
    include: { reconciledBy: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    expectedCash: r.expectedCash,
    countedCash: r.countedCash,
    discrepancy: r.discrepancy,
    notes: r.notes,
    reconciledBy: r.reconciledBy.name,
    reconciledAt: r.reconciledAt,
  }));
}
