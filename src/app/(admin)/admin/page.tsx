import Link from "next/link";
import {
  Plus,
  UserCircle,
  Search,
  BarChart3,
  Shirt,
  Wallet,
} from "lucide-react";
import { requireSession, branchScopeFor } from "@/lib/rbac";
import { loadDashboardStats, loadPeriodMetrics } from "@/server/queries/dashboard";
import { db } from "@/lib/db";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { PageFade } from "@/components/admin/motion";
import { DashboardClient } from "@/components/admin/dashboard-client";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 100_000) return `₦${Math.round(amount / 1000)}k`;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// ── KPI primitive (server-side, no motion) ────────────────────────────────

type StaticKpiTone = "default" | "amber" | "red";

const TONE_CONTAINER: Record<StaticKpiTone, string> = {
  default: "border-default bg-card",
  amber: "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20",
  red: "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20",
};

const TONE_VALUE: Record<StaticKpiTone, string> = {
  default: "text-foreground",
  amber: "text-amber-700 dark:text-amber-300",
  red: "text-red-700 dark:text-red-300",
};

function StaticKpi({
  label,
  value,
  sub,
  tone = "default",
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: StaticKpiTone;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]",
        TONE_CONTAINER[tone]
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-[26px] font-bold leading-[1.05] tracking-tight tabular-nums",
          TONE_VALUE[tone],
          valueClassName
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default async function AdminHomePage() {
  const user = await requireSession();
  const branchId = branchScopeFor(user, null);

  const branchSettings = branchId
    ? await db.branch.findUnique({ where: { id: branchId }, select: { maxDiscountPercent: true } })
    : null;
  const maxDiscount = branchSettings?.maxDiscountPercent ?? 10;

  const [stats, todayMetrics] = await Promise.all([
    loadDashboardStats({ branchId, branchMaxDiscountPercent: maxDiscount }),
    loadPeriodMetrics({ branchId, period: "today" }),
  ]);

  const today = new Date();
  const firstName = user.name.split(/\s+/)[0] ?? "there";
  const greeting = greetingForHour(today.getHours());

  const attentionRow = (
    <section className="flex flex-col gap-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Attention
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaticKpi
          label="Unpaid ≥ 7 days"
          value={formatNaira(stats.attention.unpaidLong.total)}
          tone={stats.attention.unpaidLong.count > 0 ? "red" : "default"}
          sub={
            <>
              {stats.attention.unpaidLong.count} ticket
              {stats.attention.unpaidLong.count === 1 ? "" : "s"}
              {stats.attention.unpaidLong.oldestDays > 0 &&
                ` · oldest ${stats.attention.unpaidLong.oldestDays}d`}
            </>
          }
        />
        <StaticKpi
          label="Uncollected ≥ 4 days"
          value={stats.attention.uncollectedLong.count}
          tone={stats.attention.uncollectedLong.count > 0 ? "amber" : "default"}
          sub={
            stats.attention.uncollectedLong.count > 0
              ? `${formatNaira(stats.attention.uncollectedLong.total)} sitting in storage`
              : "All clear"
          }
        />
        <StaticKpi
          label="Pending bot bookings"
          value="—"
          valueClassName="text-muted-foreground"
          sub="Coming in M4 (WhatsApp bot)"
        />
        <StaticKpi
          label="Discounts today"
          value={stats.attention.discountsToday.count}
          tone={stats.attention.discountsToday.count > 0 ? "amber" : "default"}
          sub={
            stats.attention.discountsToday.count > 0
              ? `−${formatNaira(stats.attention.discountsToday.total)}${stats.attention.discountsToday.allUnderCap ? " · all under cap" : " · review"}`
              : "None applied"
          }
        />
      </div>
    </section>
  );

  const activityPanel = (
    <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">Recent activity</h3>
        <Link
          href="/admin/audit"
          className="text-[12.5px] font-medium text-brand-700 transition-colors hover:underline dark:text-brand-300"
        >
          View all
        </Link>
      </div>
      <ActivityFeed items={stats.activity} />
    </div>
  );

  const quickActions = (
    <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">Quick actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <QaButton href="/admin/tickets/new" icon={<Plus />} label="New ticket" sub="Index a bag" />
        <QaButton
          href="/admin/tickets?focus=search"
          icon={<Search />}
          label="Find ticket"
          sub="By number, name or phone"
        />
        <QaButton
          href="/admin/customers?focus=search"
          icon={<UserCircle />}
          label="Customers"
          sub="By name & phone"
        />
        <QaButton href="/admin/cash" icon={<Wallet />} label="Today's cash" sub="Reconcile" />
        {user.role === "ADMIN" && (
          <QaButton href="/admin/reports" icon={<BarChart3 />} label="Reports" sub="This week" />
        )}
        <QaButton href="/admin/items" icon={<Shirt />} label="Items & prices" sub="Catalog" />
      </div>
    </div>
  );

  const headerText = (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Today · {formatDateLong(today)}
      </span>
      <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
        {greeting}, {firstName}
      </h1>
      <p className="mt-1 max-w-[580px] text-[13px] leading-snug text-muted-foreground md:text-sm">
        {stats.today.ticketsReady > 0
          ? `${stats.today.ticketsReady} ticket${stats.today.ticketsReady === 1 ? "" : "s"} ready for pickup right now`
          : "No tickets ready for pickup right now"}
        {stats.today.urgentDueToday > 0
          ? ` · ${stats.today.urgentDueToday} urgent due today`
          : ""}
        . Here&apos;s where we stand.
      </p>
    </div>
  );

  return (
    <PageFade className="contents">
      <DashboardClient
        initialMetrics={todayMetrics}
        ticketsReady={stats.today.ticketsReady}
        urgentDueToday={stats.today.urgentDueToday}
        headerText={headerText}
        attentionRow={attentionRow}
        activityPanel={activityPanel}
        quickActions={quickActions}
      />
    </PageFade>
  );
}

function QaButton({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-lg border border-default bg-surface p-3.5 text-left transition-all hover:-translate-y-px hover:border-brand-300 hover:bg-surface-muted"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 [&_svg]:h-4 [&_svg]:w-4 dark:bg-brand-900/30 dark:text-brand-300">
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
      <span className="-mt-1 text-[11.5px] text-muted-foreground">{sub}</span>
    </Link>
  );
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
