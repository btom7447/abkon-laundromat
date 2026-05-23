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

function ChartCardSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div
      aria-busy="true"
      className="flex h-full flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <div className="flex flex-col gap-1.5">
        <Shimmer className="h-4 w-40" />
        <Shimmer className="h-3 w-56" />
      </div>
      <div style={{ height }} className="w-full animate-pulse rounded-md bg-surface-muted dark:bg-navy-800/60" />
    </div>
  );
}

function DonutCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex h-full flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <div className="flex flex-col gap-1.5">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-3 w-48" />
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
        <div className="relative h-44 w-44">
          <Shimmer className="h-full w-full rounded-full" />
          <span
            aria-hidden
            className="absolute inset-6 rounded-full bg-card dark:bg-card"
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-20" />
      </div>
    </div>
  );
}

function AgingCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex h-full flex-col gap-4 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-default pb-3">
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-4 w-36" />
          <Shimmer className="h-3 w-48" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Shimmer className="h-5 w-28" />
          <Shimmer className="h-3 w-32" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-3 w-20" />
            </div>
            <Shimmer className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-3 w-72" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Shimmer className="h-10 w-32 rounded-lg" />
          <Shimmer className="h-10 w-44 rounded-lg" />
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

        {/* Branch comparison (rendered conditionally for ADMIN — keep a placeholder so the
            page doesn't visibly shift) */}
        <div
          aria-busy="true"
          className="flex flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <Shimmer className="h-4 w-44" />
              <Shimmer className="h-3 w-72" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Shimmer className="h-5 w-28" />
              <Shimmer className="h-3 w-36" />
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="h-3 w-24 shrink-0" />
                <Shimmer className="h-7 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Revenue + Volume */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <ChartCardSkeleton />
          <ChartCardSkeleton height={192} />
        </div>

        {/* Top items */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <ChartCardSkeleton height={288} />
          <ChartCardSkeleton height={288} />
        </div>

        {/* Service + Source splits */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <DonutCardSkeleton />
          <DonutCardSkeleton />
        </div>

        {/* Aging */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <AgingCardSkeleton />
          <AgingCardSkeleton />
        </div>
      </div>
    </>
  );
}
