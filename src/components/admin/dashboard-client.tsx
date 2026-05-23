"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Wallet, Plus, Bell, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/admin/sparkline";
import { PeriodSelector } from "@/components/admin/period-selector";
import { KpiValue } from "@/components/admin/kpi-value";
import { KpiSkeleton, ChartSkeleton } from "@/components/admin/skeletons";
import { getPeriodMetrics } from "@/server/actions/dashboard";
import type { Period, PeriodMetrics } from "@/server/queries/dashboard";
import { cn } from "@/lib/utils";

interface Props {
  initialMetrics: PeriodMetrics;
  ticketsReady: number;
  urgentDueToday: number;
  /** Pre-rendered page-head text block (greeting, sub). */
  headerText: React.ReactNode;
  /** Pre-rendered server segments (Attention row, Activity, Quick actions). */
  attentionRow: React.ReactNode;
  activityPanel: React.ReactNode;
  quickActions: React.ReactNode;
}

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 100_000) return `₦${Math.round(amount / 1000)}k`;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function rangeStartLabel(m: PeriodMetrics): string {
  if (m.period === "today") return "00:00";
  const first = m.series[0]?.key;
  if (!first) return "";
  return new Date(first).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function rangeMidLabel(m: PeriodMetrics): string {
  if (m.period === "today") return "12:00";
  const midIdx = Math.floor(m.series.length / 2);
  const mid = m.series[midIdx]?.key;
  if (!mid) return "";
  return new Date(mid).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

// ── KPI card primitive ────────────────────────────────────────────────────

type KpiTone = "default" | "sky" | "amber" | "red";

const KPI_TONE_CLS: Record<KpiTone, string> = {
  default: "border-default bg-card",
  sky: "border-brand-200/70 bg-brand-50/40 dark:border-brand-900/40 dark:bg-brand-950/20",
  amber: "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20",
  red: "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20",
};

const KPI_VALUE_TONE: Record<KpiTone, string> = {
  default: "text-foreground",
  sky: "text-foreground",
  amber: "text-amber-700 dark:text-amber-300",
  red: "text-red-700 dark:text-red-300",
};

interface KpiCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  sparkline?: ReactNode;
  tone?: KpiTone;
  motionKey?: string;
  motionDelay?: number;
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  sparkline,
  tone = "default",
  motionKey,
  motionDelay = 0,
}: KpiCardProps) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: motionDelay, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]",
        KPI_TONE_CLS[tone]
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-brand-500">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "text-[26px] font-bold leading-[1.05] tracking-tight tabular-nums",
          KPI_VALUE_TONE[tone]
        )}
      >
        {value}
      </div>
      {sparkline && <div className="mt-0.5 h-7 w-full">{sparkline}</div>}
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export function DashboardClient({
  initialMetrics,
  ticketsReady,
  urgentDueToday,
  headerText,
  attentionRow,
  activityPanel,
  quickActions,
}: Props) {
  const [period, setPeriod] = useState<Period>(initialMetrics.period);
  const [metrics, setMetrics] = useState<PeriodMetrics>(initialMetrics);
  const [pending, startTransition] = useTransition();

  function handlePeriodChange(next: Period) {
    if (next === period) return;
    setPeriod(next);
    startTransition(async () => {
      const fresh = await getPeriodMetrics(next);
      setMetrics(fresh);
    });
  }

  const sparkData = metrics.series.map((s) => s.revenue);

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        {headerText}
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <PeriodSelector value={period} onChange={handlePeriodChange} disabled={pending} />
          <Link
            href="/admin/tickets/new"
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            <Plus /> New ticket
          </Link>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* Period band + KPIs */}
        <section className="flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {metrics.label}
            {pending && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-medium normal-case tracking-normal text-emerald-600 dark:text-emerald-400">
                Loading…
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {pending ? (
              <>
                <KpiSkeleton />
                <KpiSkeleton />
              </>
            ) : (
              <>
                <KpiCard
                  motionKey={`rev-${period}`}
                  icon={<Wallet />}
                  label="Revenue"
                  value={<KpiValue value={metrics.revenue} currency />}
                  sub={`${metrics.ticketsPaid} paid · ${formatNaira(metrics.averageTicketValue)} avg`}
                />
                <KpiCard
                  motionKey={`tickets-${period}`}
                  motionDelay={0.04}
                  icon={<Plus />}
                  label="Tickets created"
                  value={<KpiValue value={metrics.ticketsCreated} />}
                  sub={
                    metrics.ticketsCreated === 0
                      ? "Quiet so far."
                      : metrics.label.toLowerCase()
                  }
                />
              </>
            )}

            <KpiCard
              motionDelay={0.08}
              icon={<Bell />}
              label="Ready for pickup"
              value={<KpiValue value={ticketsReady} />}
              sub={ticketsReady === 0 ? "Nothing waiting." : "Tagged on shelf"}
              tone={ticketsReady > 0 ? "sky" : "default"}
            />

            <KpiCard
              motionDelay={0.12}
              icon={<Zap />}
              label="Urgent due today"
              value={<KpiValue value={urgentDueToday} />}
              sub={urgentDueToday > 0 ? "Before 6pm" : "None pending"}
              tone={urgentDueToday > 0 ? "amber" : "default"}
            />
          </div>
        </section>

        {/* Attention row (static, server-rendered) */}
        {attentionRow}

        {/* Bottom panels */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
          {activityPanel}

          <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <div className="mb-3.5 flex items-baseline justify-between">
              <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
                {metrics.chartLabel}
              </h3>
              <Link
                href="/admin/reports"
                className="text-[12.5px] font-medium text-brand-700 transition-colors hover:underline dark:text-brand-300"
              >
                Full report
              </Link>
            </div>
            <div className="relative h-[140px] overflow-hidden rounded-md bg-gradient-to-b from-brand-50 to-transparent dark:from-brand-500/8 [&_svg]:h-full [&_svg]:w-full">
              {pending ? (
                <ChartSkeleton height={140} />
              ) : (
                <motion.div
                  key={`chart-${period}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full"
                >
                  <Sparkline data={sparkData} height={140} width={400} strokeWidth={2} />
                </motion.div>
              )}
            </div>
            <div className="mt-3.5 flex items-center justify-between text-[12.5px] text-muted-foreground">
              <span>{rangeStartLabel(metrics)}</span>
              <span>{rangeMidLabel(metrics)}</span>
              <span>
                <strong className="text-foreground">{formatNaira(metrics.revenue)}</strong>{" "}
                {metrics.label.toLowerCase()}
              </span>
            </div>
          </div>

          {quickActions}
        </section>
      </div>
    </>
  );
}
