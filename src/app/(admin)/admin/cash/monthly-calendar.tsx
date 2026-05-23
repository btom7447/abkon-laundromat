"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DayRecord = {
  /** Local YYYY-MM-DD */
  iso: string;
  state: "balanced" | "over" | "short" | "no-data";
  /** Naira amounts */
  revenue?: number;
  discrepancy?: number;
};

interface Props {
  /** Records keyed by local YYYY-MM-DD. */
  records: DayRecord[];
  /** ISO of "today" in user's local TZ — used to gate future days and pick initial view. */
  todayIso: string;
}

const DAY_STATE_CLS: Record<DayRecord["state"], string> = {
  balanced: "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/25 dark:hover:bg-emerald-500/35",
  over: "bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/25 dark:hover:bg-amber-500/35",
  short: "bg-red-100 hover:bg-red-200 dark:bg-red-500/25 dark:hover:bg-red-500/35",
  "no-data": "bg-surface-muted/60",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

function isoFor(year: number, month0: number, day: number): string {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatNairaShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n.toLocaleString("en-NG")}`;
}

export function MonthlyCalendar({ records, todayIso }: Props) {
  const today = parseIso(todayIso);
  const [view, setView] = useState<{ year: number; month: number }>({
    year: today.y,
    month: today.m - 1, // store 0-indexed
  });

  const recordMap = useMemo(() => {
    const m = new Map<string, DayRecord>();
    for (const r of records) m.set(r.iso, r);
    return m;
  }, [records]);

  // Years to allow in dropdown: derive from data, plus current year, sorted desc.
  const years = useMemo(() => {
    const set = new Set<number>([today.y]);
    for (const r of records) set.add(parseIso(r.iso).y);
    return Array.from(set).sort((a, b) => b - a);
  }, [records, today.y]);

  const firstOfMonth = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // Monday-start week: getDay() returns 0=Sun..6=Sat, we want 0=Mon..6=Sun
  const leadingBlank = (firstOfMonth.getDay() + 6) % 7;

  const cells: Array<{ iso: string | null; day: number | null; isFuture: boolean; rec?: DayRecord }> = [];
  for (let i = 0; i < leadingBlank; i++) cells.push({ iso: null, day: null, isFuture: false });
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoFor(view.year, view.month, day);
    const isFuture =
      view.year > today.y ||
      (view.year === today.y && view.month + 1 > today.m) ||
      (view.year === today.y && view.month + 1 === today.m && day > today.d);
    cells.push({ iso, day, isFuture, rec: recordMap.get(iso) });
  }
  // pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null, isFuture: false });

  // Month summary stats
  const monthRecords = cells
    .filter((c): c is { iso: string; day: number; isFuture: boolean; rec: DayRecord } => !!c.rec)
    .map((c) => c.rec);
  const monthRevenue = monthRecords.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const balancedDays = monthRecords.filter((r) => r.state === "balanced").length;
  const variantDays = monthRecords.filter((r) => r.state === "over" || r.state === "short").length;

  function prevMonth() {
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }));
  }
  function nextMonth() {
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }));
  }
  function goToday() {
    setView({ year: today.y, month: today.m - 1 });
  }

  const isCurrentMonth = view.year === today.y && view.month + 1 === today.m;
  // Can't go past current month
  const nextDisabled =
    view.year > today.y || (view.year === today.y && view.month + 1 >= today.m);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-default bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            value={view.month}
            onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
            className="h-9 rounded-md border border-default bg-surface px-2.5 text-[13.5px] font-semibold text-foreground transition-colors hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="Month"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={view.year}
            onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
            className="h-9 rounded-md border border-default bg-surface px-2.5 text-[13.5px] font-semibold text-foreground transition-colors hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="Year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={nextMonth}
            disabled={nextDisabled}
            aria-label="Next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-default bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={goToday}
              className="ml-1 inline-flex h-9 items-center rounded-md border border-default bg-surface px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              This month
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
          <Legend className="bg-emerald-100 dark:bg-emerald-500/25">Balanced</Legend>
          <Legend className="bg-amber-100 dark:bg-amber-500/25">Overage</Legend>
          <Legend className="bg-red-100 dark:bg-red-500/25">Shortage</Legend>
          <Legend className="bg-surface-muted/60">No data</Legend>
        </div>
      </div>

      {/* Month summary strip */}
      {monthRecords.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-dashed border-default bg-surface-muted/30 px-3 py-2 text-[12px]">
          <SummaryStat
            label="Reconciled"
            value={`${monthRecords.length} day${monthRecords.length === 1 ? "" : "s"}`}
          />
          <SummaryStat label="Balanced" value={`${balancedDays}`} tone="emerald" />
          {variantDays > 0 && <SummaryStat label="With variance" value={`${variantDays}`} tone="amber" />}
          <SummaryStat label="Revenue" value={formatNairaShort(monthRevenue)} />
        </div>
      )}

      {/* Calendar grid */}
      <div className="mx-auto w-full max-w-3xl">
        <div className="grid grid-cols-7 gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {cells.map((c, i) => {
            if (!c.day || !c.iso) {
              return <div key={`blank-${i}`} aria-hidden className="h-12 md:h-14" />;
            }
            const isToday = c.iso === todayIso;
            const state = c.rec?.state ?? "no-data";
            return (
              <div
                key={c.iso}
                className={cn(
                  "relative flex h-12 flex-col items-start justify-between rounded-md p-1.5 text-[11px] transition-colors md:h-14",
                  c.isFuture
                    ? "border border-dashed border-default bg-transparent"
                    : DAY_STATE_CLS[state],
                  isToday && "ring-2 ring-brand-500 ring-offset-1 ring-offset-card"
                )}
                title={
                  c.rec
                    ? `${c.iso} · ${state}${
                        c.rec.discrepancy != null && c.rec.discrepancy !== 0
                          ? ` ${c.rec.discrepancy > 0 ? "+" : ""}${formatNairaShort(c.rec.discrepancy)}`
                          : ""
                      }`
                    : c.isFuture
                      ? `${c.iso} · upcoming`
                      : `${c.iso} · no reconciliation`
                }
              >
                <span
                  className={cn(
                    "text-[10.5px] font-semibold leading-none text-muted-foreground",
                    c.isFuture && "opacity-40",
                    isToday && "text-brand-700 dark:text-brand-300"
                  )}
                >
                  {c.day}
                </span>
                {c.rec?.revenue != null && c.rec.revenue > 0 && (
                  <span className="self-end text-[9px] font-semibold tabular-nums leading-none text-foreground/80 md:text-[9.5px]">
                    {formatNairaShort(c.rec.revenue)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span aria-hidden className={cn("h-3 w-3 rounded-sm", className)} />
      {children}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber";
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "emerald"
            ? "text-emerald-700 dark:text-emerald-300"
            : tone === "amber"
              ? "text-amber-700 dark:text-amber-300"
              : "text-foreground"
        )}
      >
        {value}
      </span>
    </span>
  );
}
