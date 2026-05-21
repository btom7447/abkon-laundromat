import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { resolveRange } from "@/lib/date-range";
import {
  coreStats,
  revenueByDay,
  topItemsByVolume,
  topItemsByRevenue,
  serviceSplit,
  unpaidAging,
  uncollectedAging,
} from "@/server/queries/reports";
import { formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchPicker } from "@/components/admin/branch-picker";
import { PresetTabs } from "@/components/admin/report-filters";
import {
  RevenueLineChart,
  TicketsBarChart,
  TopItemsBarChart,
  ServiceSplitDonut,
} from "@/components/admin/charts";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ branch?: string; preset?: string; from?: string; to?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested, preset, from, to } = await searchParams;
  const ctx = await resolveBranchContext(user, requested ?? null);

  if (!ctx) {
    return (
      <Card>
        <CardHeader><CardTitle>No branches set up</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-600">
          {user.role === "ADMIN" ? "Create a branch first." : "You are not assigned to a branch."}
        </CardContent>
      </Card>
    );
  }

  const range = resolveRange({ preset, from, to });
  const scope = { branchId: ctx.branchId, range };

  const [stats, revenueSeries, byVolume, byRevenue, splits, unpaid, uncollected, allBranches] =
    await Promise.all([
      coreStats(scope),
      revenueByDay(scope),
      topItemsByVolume(scope, 8),
      topItemsByRevenue(scope, 8),
      serviceSplit(scope),
      unpaidAging(scope),
      uncollectedAging(scope),
      user.role === "ADMIN"
        ? db.branch.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } })
        : Promise.resolve([]),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            {ctx.branchName} · {formatDate(range.from)} → {formatDate(range.to)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PresetTabs current={range.preset} />
          <BranchPicker
            branches={user.role === "ADMIN" ? allBranches : ctx.branches}
            current={ctx.branchId}
          />
        </div>
      </div>

      {/* Core stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatNaira(stats.revenue)} sub={`${stats.ticketsPaid} paid tickets`} />
        <StatCard label="Tickets created" value={String(stats.ticketsCreated)} sub={`${stats.urgentRatio}% urgent`} />
        <StatCard label="Avg ticket value" value={formatNaira(stats.averageTicketValue)} sub="of paid tickets" />
        <StatCard
          label="Walk-in / Bot"
          value={`${stats.walkInVsBot.walkIn} / ${stats.walkInVsBot.bot}`}
          sub="ticket source split"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
          <p className="text-sm text-slate-500">Paid tickets only. Cancelled tickets excluded.</p>
        </CardHeader>
        <CardContent>
          <RevenueLineChart data={revenueSeries} />
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Ticket volume</div>
            <TicketsBarChart data={revenueSeries.map((r) => ({ date: r.date, tickets: r.tickets }))} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top items by volume</CardTitle></CardHeader>
          <CardContent>
            {byVolume.length === 0 ? (
              <Empty />
            ) : (
              <TopItemsBarChart data={byVolume} unit="count" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top items by revenue</CardTitle></CardHeader>
          <CardContent>
            {byRevenue.length === 0 ? (
              <Empty />
            ) : (
              <TopItemsBarChart data={byRevenue} unit="currency" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Service split</CardTitle></CardHeader>
        <CardContent>
          {splits.length === 0 ? <Empty /> : <ServiceSplitDonut data={splits} />}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AgingCard title="Unpaid tickets — aging" data={unpaid} />
        <AgingCard title="Uncollected — aging since ready" data={uncollected} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
        {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function AgingCard({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; count: number; amount: number }>;
}) {
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const totalAmount = data.reduce((s, d) => s + d.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-slate-500">
          {totalCount} ticket{totalCount === 1 ? "" : "s"} · {formatNaira(totalAmount)} outstanding
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Age</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((b) => (
              <TableRow key={b.label}>
                <TableCell>{b.label}</TableCell>
                <TableCell>{b.count}</TableCell>
                <TableCell className="text-right">{formatNaira(b.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Empty() {
  return <div className="py-12 text-center text-sm text-slate-400">No data for this range.</div>;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(d);
}
