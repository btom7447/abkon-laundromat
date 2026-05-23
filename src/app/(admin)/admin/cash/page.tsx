import { CalendarDays, Wallet, TrendingUp, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { getActiveBranchCookie } from "@/server/actions/branch-switch";
import { resolveRange } from "@/lib/date-range";
import { todayCashSnapshot, cashReconciliationHistory } from "@/server/queries/reports";
import {
  formatDate,
  formatDateOnly,
  formatDbDate,
  formatNaira,
  isoUtcDate,
  localDateToUtcMidnight,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiValue } from "@/components/admin/kpi-value";
import { ReconcileForm } from "./reconcile-form";
import { MonthlyCalendar, type DayRecord } from "./monthly-calendar";
import { ReconciliationList } from "./reconciliation-list";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function CashPage() {
  const user = await requireSession();
  const cookieBranch = await getActiveBranchCookie();
  const ctx = await resolveBranchContext(user, cookieBranch);

  if (!ctx) {
    return (
      <div className="p-7">
        <Card>
          <CardHeader>
            <CardTitle>No branches set up</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.role === "ADMIN" ? "Create a branch first." : "You are not assigned to a branch."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const branchId = ctx.branchId;
  const scope = { branchId, range: resolveRange({ preset: "today" }) };
  const today = new Date();

  const sevenDaysAgo = new Date(startOfDay(today));
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  // Pull a year of revenue so the calendar can render any visited month.
  const oneYearAgo = new Date(startOfDay(today));
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [todaySnapshot, history, weekAgg, lastReconcile, yearRevenue] = await Promise.all([
    todayCashSnapshot(scope),
    cashReconciliationHistory(branchId, 365),
    db.ticket.aggregate({
      where: { branchId, paymentStatus: "PAID", paidAt: { gte: sevenDaysAgo, lte: today } },
      _sum: { grandTotal: true },
    }),
    db.cashReconciliation.findFirst({
      where: { branchId, date: { lt: localDateToUtcMidnight(today) } },
      orderBy: { date: "desc" },
    }),
    db.ticket.findMany({
      where: { branchId, paymentStatus: "PAID", paidAt: { gte: oneYearAgo, lte: today } },
      select: { paidAt: true, grandTotal: true },
    }),
  ]);

  const weekTotal = weekAgg._sum.grandTotal ?? 0;
  const avgDaily = Math.round(weekTotal / 7);

  const todayIso = isoDateLocal(todaySnapshot.date);

  // Build a record-per-day list for the calendar
  const revenueMap = new Map<string, number>();
  for (const t of yearRevenue) {
    if (!t.paidAt) continue;
    const key = isoDateLocal(t.paidAt);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + t.grandTotal);
  }
  const dayMap = new Map<string, DayRecord>();
  for (const [iso, revenue] of revenueMap) {
    dayMap.set(iso, { iso, state: "no-data", revenue });
  }
  for (const h of history) {
    // CashReconciliation.date is `@db.Date` (UTC midnight) — read with UTC components
    // so the calendar cell for the reconciled day matches.
    const iso = isoUtcDate(h.date);
    const existing = dayMap.get(iso);
    dayMap.set(iso, {
      iso,
      state: h.discrepancy === 0 ? "balanced" : h.discrepancy > 0 ? "over" : "short",
      revenue: existing?.revenue,
      discrepancy: h.discrepancy,
    });
  }
  const calendarRecords = Array.from(dayMap.values());

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Cash reconciliation
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            At end of shift, compare the cash in the drawer against today&apos;s paid tickets.
            The expected total locks automatically as payments come in.
          </p>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBox
            label="Expected today"
            icon={<Wallet />}
            value={todaySnapshot.expectedCash}
            currency
            sub={`From ${todaySnapshot.ticketCount} paid ticket${todaySnapshot.ticketCount === 1 ? "" : "s"}`}
            accent
          />
          <KpiBox
            label="Last reconciliation"
            icon={<Scale />}
            customValue={
              <span
                className={cn(
                  "truncate text-[20px] font-bold leading-[1.05] tracking-tight md:text-[22px]",
                  lastReconcile?.discrepancy === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : lastReconcile && lastReconcile.discrepancy !== 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground"
                )}
              >
                {lastReconcile
                  ? lastReconcile.discrepancy === 0
                    ? "Balanced"
                    : `${lastReconcile.discrepancy > 0 ? "+" : ""}${formatNaira(lastReconcile.discrepancy)}`
                  : "—"}
              </span>
            }
            sub={
              lastReconcile
                ? `${formatDbDate(lastReconcile.date)} · counted ${formatNaira(lastReconcile.countedCash)}`
                : "No prior reconciliation"
            }
          />
          <KpiBox
            label="Past 7 days"
            icon={<TrendingUp />}
            value={weekTotal}
            currency
            sub="Paid revenue this week"
          />
          <KpiBox
            label="Avg daily revenue"
            icon={<CalendarDays />}
            value={avgDaily}
            currency
            sub="Rolling 7-day mean"
          />
        </div>

        {/* Today reconcile */}
        <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
                Reconcile today · {formatDateOnly(todaySnapshot.date)}
                {todaySnapshot.alreadyReconciled && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Already saved
                  </span>
                )}
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Enter the cash you counted in the drawer. We&apos;ll do the math for you.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Updated {formatDate(new Date())}
            </span>
          </div>
          <ReconcileForm
            branchId={branchId}
            date={todayIso}
            expectedCash={todaySnapshot.expectedCash}
            ticketCount={todaySnapshot.ticketCount}
            currentCounted={todaySnapshot.countedCash}
          />
        </div>

        {/* Monthly calendar */}
        <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="mb-4 flex flex-col gap-0.5">
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
              Reconciliation calendar
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Browse any month — coloured days are reconciled, the amount underneath is that day&apos;s paid revenue.
            </p>
          </div>
          <MonthlyCalendar records={calendarRecords} todayIso={todayIso} />
        </div>

        {/* Recent reconciliations */}
        <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="mb-4 flex flex-col gap-0.5">
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
              Recent reconciliations
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Last 30 entries — most recent first.
            </p>
          </div>
          <ReconciliationList rows={history} />
        </div>
      </div>
    </>
  );
}

// ── Primitives ────────────────────────────────────────────────────────

function KpiBox({
  label,
  icon,
  value,
  customValue,
  currency,
  sub,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  value?: number;
  customValue?: React.ReactNode;
  currency?: boolean;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]",
        accent
          ? "border-brand-200/70 bg-brand-50/40 dark:border-brand-900/40 dark:bg-brand-950/20"
          : "border-default bg-card"
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
        {label}
      </div>
      {customValue ? (
        customValue
      ) : (
        <div className="text-[24px] font-bold leading-[1.05] tabular-nums tracking-tight text-foreground md:text-[26px]">
          <KpiValue value={value ?? 0} currency={currency} />
        </div>
      )}
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
