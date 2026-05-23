import { KpiSkeleton } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse rounded-md bg-surface-muted dark:bg-navy-800/60",
        className
      )}
    />
  );
}

function CalendarSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-9 w-9 rounded-md" />
          <Shimmer className="h-9 w-28 rounded-md" />
          <Shimmer className="h-9 w-20 rounded-md" />
          <Shimmer className="h-9 w-9 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-3 w-16" />
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-dashed border-default bg-surface-muted/30 px-3 py-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-28" />
      </div>

      {/* Grid */}
      <div className="mx-auto grid w-full max-w-3xl grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Shimmer key={`h-${i}`} className="h-3 w-6 justify-self-center" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Shimmer key={`d-${i}`} className="h-12 rounded-md md:h-14" />
        ))}
      </div>
    </div>
  );
}

function ReconcileFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      {/* Ledger tape */}
      <div className="overflow-hidden rounded-xl border border-default bg-surface-muted/30 dark:bg-navy-900/30">
        {/* Expected row */}
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Shimmer className="h-3.5 w-3.5 rounded" />
            <div className="flex flex-col gap-1">
              <Shimmer className="h-3 w-36" />
              <Shimmer className="h-2.5 w-28" />
            </div>
          </div>
          <Shimmer className="h-6 w-28 md:h-7" />
        </div>
        {/* Operator dash */}
        <div className="flex justify-center px-4 md:px-6">
          <Shimmer className="h-6 w-6 rounded-full" />
        </div>
        {/* Counted row */}
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Shimmer className="h-3.5 w-3.5 rounded" />
            <div className="flex flex-col gap-1">
              <Shimmer className="h-3 w-32" />
              <Shimmer className="h-2.5 w-28" />
            </div>
          </div>
          <Shimmer className="h-12 w-full max-w-xs rounded-lg md:h-14 md:w-[260px]" />
        </div>
        {/* Operator dash */}
        <div className="flex justify-center px-4 md:px-6">
          <Shimmer className="h-6 w-6 rounded-full" />
        </div>
        {/* Variance row */}
        <div className="flex items-center justify-between gap-4 border-t-2 border-double border-default bg-card px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Shimmer className="h-9 w-9 rounded-full" />
            <div className="flex flex-col gap-1">
              <Shimmer className="h-3 w-32" />
              <Shimmer className="h-2.5 w-40" />
            </div>
          </div>
          <Shimmer className="h-7 w-28 md:h-9 md:w-32" />
        </div>
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1.5">
        <Shimmer className="h-3 w-32" />
        <Shimmer className="h-20 w-full rounded-md" />
      </div>

      {/* CTA */}
      <Shimmer className="h-12 w-full rounded-lg" />
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 border-b border-default px-3 py-3 last:border-0">
      <Shimmer className="h-3 w-24" />
      <Shimmer className="h-3 w-20" />
      <Shimmer className="h-3 w-20" />
      <Shimmer className="h-5 w-24 rounded-full" />
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-3 w-20" />
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-2 rounded-xl border border-default bg-card p-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <div className="flex items-center justify-between gap-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-dashed border-default pt-2">
        <Shimmer className="h-2.5 w-16" />
        <Shimmer className="h-2.5 w-20 justify-self-end" />
        <Shimmer className="h-2.5 w-16" />
        <Shimmer className="h-2.5 w-20 justify-self-end" />
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-default pt-2">
        <Shimmer className="h-2.5 w-20" />
        <Shimmer className="h-2.5 w-24" />
      </div>
    </div>
  );
}

export default function CashLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-56" />
          <Shimmer className="h-3 w-80" />
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>

        {/* Reconcile form card */}
        <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="mb-4 flex flex-col gap-2">
            <Shimmer className="h-4 w-60" />
            <Shimmer className="h-3 w-72" />
          </div>
          <ReconcileFormSkeleton />
        </div>

        {/* Calendar card */}
        <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="mb-4 flex flex-col gap-2">
            <Shimmer className="h-4 w-52" />
            <Shimmer className="h-3 w-96 max-w-full" />
          </div>
          <CalendarSkeleton />
        </div>

        {/* Recent list card */}
        <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="mb-4 flex flex-col gap-2">
            <Shimmer className="h-4 w-52" />
            <Shimmer className="h-3 w-56" />
          </div>
          {/* Mobile cards */}
          <div className="flex flex-col gap-2.5 md:hidden">
            <MobileCardSkeleton />
            <MobileCardSkeleton />
            <MobileCardSkeleton />
          </div>
          {/* Desktop list */}
          <div className="hidden md:block">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}
