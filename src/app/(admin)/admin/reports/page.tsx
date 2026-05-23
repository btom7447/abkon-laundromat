import {
  TrendingUp,
  Receipt,
  Footprints,
  Bot,
} from "lucide-react";
import { requireAdmin } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { resolveRange } from "@/lib/date-range";
import {
  coreStats,
  revenueByDay,
  revenueByBranch,
  topItemsByVolume,
  topItemsByRevenue,
  serviceSplit,
  sourceSplit,
  unpaidAging,
  uncollectedAging,
} from "@/server/queries/reports";
import { formatDateOnly, formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportPeriodSelector } from "@/components/admin/report-period-selector";
import { ReportDownloadButton } from "@/components/admin/report-download-button";
import { AgingBuckets } from "@/components/admin/aging-buckets";
import { KpiValue } from "@/components/admin/kpi-value";
import {
  RevenueLineChart,
  TicketsBarChart,
  TopItemsBarChart,
  ServiceSplitDonut,
  SourceSplitDonut,
  BranchRevenueBarChart,
} from "@/components/admin/charts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const { preset, from, to } = await searchParams;
  // Branch context comes from the header BranchSwitcher (cookie-driven), not a
  // local picker — keeps a single source of truth for the active branch.
  const ctx = await resolveBranchContext(user, null);

  if (!ctx) {
    return (
      <div className="p-4 md:p-7">
        <Card>
          <CardHeader><CardTitle>No branches set up</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.role === "ADMIN" ? "Create a branch first." : "You are not assigned to a branch."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const range = resolveRange({ preset, from, to });
  const scope = { branchId: ctx.branchId, range };

  const [stats, revenueSeries, byVolume, byRevenue, splits, sources, unpaid, uncollected, branchRevenue] =
    await Promise.all([
      coreStats(scope),
      revenueByDay(scope),
      topItemsByVolume(scope, 8),
      topItemsByRevenue(scope, 8),
      serviceSplit(scope),
      sourceSplit(scope),
      unpaidAging(scope),
      uncollectedAging(scope),
      // Branch comparison is ADMIN-only — fetch unconditionally for ADMIN so the
      // section can decide whether to render based on the number of branches.
      user.role === "ADMIN" ? revenueByBranch(range) : Promise.resolve([]),
    ]);

  const showBranchComparison = user.role === "ADMIN" && branchRevenue.length >= 2;
  const totalBranchRevenue = branchRevenue.reduce((s, b) => s + b.revenue, 0);

  const totalSourced = stats.walkInVsBot.walkIn + stats.walkInVsBot.bot;
  const walkInPct = totalSourced > 0 ? Math.round((stats.walkInVsBot.walkIn / totalSourced) * 100) : 0;
  const botPct = totalSourced > 0 ? 100 - walkInPct : 0;

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Reports
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            {ctx.branchName} · {formatDateOnly(range.from)} → {formatDateOnly(range.to)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          <ReportPeriodSelector current={range.preset} />
          <ReportDownloadButton />
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBox
            label="Revenue"
            icon={<TrendingUp />}
            value={stats.revenue}
            currency
            sub={`${stats.ticketsPaid} paid ticket${stats.ticketsPaid === 1 ? "" : "s"}`}
            accent
          />
          <KpiBox
            label="Tickets created"
            icon={<Receipt />}
            value={stats.ticketsCreated}
            sub={
              stats.ticketsCreated > 0
                ? `${stats.urgentRatio}% urgent`
                : "No tickets in this range"
            }
          />
          <KpiBox
            label="Walk-in tickets"
            icon={<Footprints />}
            value={stats.walkInVsBot.walkIn}
            sub={totalSourced > 0 ? `${walkInPct}% of ${totalSourced} sourced` : "—"}
          />
          <KpiBox
            label="Bot tickets"
            icon={<Bot />}
            value={stats.walkInVsBot.bot}
            sub={totalSourced > 0 ? `${botPct}% of ${totalSourced} sourced` : "—"}
          />
        </div>

        {/* Branch comparison — ADMIN only, when 2+ active branches */}
        {showBranchComparison && (
          <div className="flex flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
                  Branch comparison
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Revenue across all active branches for this range — the highlighted bar is{" "}
                  <span className="font-semibold text-foreground">{ctx.branchName}</span>, the
                  branch driving the rest of this report.
                </p>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-bold tabular-nums tracking-tight text-foreground">
                  {formatNaira(totalBranchRevenue)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  combined across {branchRevenue.length} branches
                </div>
              </div>
            </div>
            <BranchRevenueBarChart data={branchRevenue} activeBranchId={ctx.branchId} />
          </div>
        )}

        {/* Revenue + Volume — side-by-side on lg, stacked on mobile */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <SectionCard title="Revenue over time" sub="Paid tickets only · cancelled excluded">
            <RevenueLineChart data={revenueSeries} />
          </SectionCard>
          <SectionCard title="Ticket volume" sub="Tickets created per day">
            <TicketsBarChart data={revenueSeries.map((r) => ({ date: r.date, tickets: r.tickets }))} />
          </SectionCard>
        </div>

        {/* Top items */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <SectionCard title="Top items by volume" sub="Counted across all paid + unpaid line items">
            {byVolume.length === 0 ? <Empty /> : <TopItemsBarChart data={byVolume} unit="count" />}
          </SectionCard>
          <SectionCard title="Top items by revenue" sub="Naira contribution per item">
            {byRevenue.length === 0 ? <Empty /> : <TopItemsBarChart data={byRevenue} unit="currency" />}
          </SectionCard>
        </div>

        {/* Service + Source splits */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <SectionCard title="Service split" sub="Line items by service type">
            {splits.length === 0 ? <Empty /> : <ServiceSplitDonut data={splits} />}
          </SectionCard>
          <SectionCard title="Channel split" sub="Walk-in vs WhatsApp bot — count + revenue on hover">
            {sources.length === 0 ? <Empty /> : <SourceSplitDonut data={sources} />}
          </SectionCard>
        </div>

        {/* Aging */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <AgingBuckets
            title="Unpaid tickets"
            sub="Tickets in storage or collected without payment"
            data={unpaid}
            tone="amber"
          />
          <AgingBuckets
            title="Uncollected tickets"
            sub="Time since the order was marked ready for pickup"
            data={uncollected}
            tone="red"
          />
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
  currency,
  sub,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
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
      <div className="text-[24px] font-bold leading-[1.05] tabular-nums tracking-tight text-foreground md:text-[26px]">
        <KpiValue value={value} currency={currency} />
      </div>
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SectionCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h3>
        {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      No data for this range.
    </div>
  );
}
