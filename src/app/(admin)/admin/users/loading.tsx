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

function StaffCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <Shimmer className="h-12 w-12 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Shimmer className="h-4 w-40" />
          <div className="flex items-center gap-1.5">
            <Shimmer className="h-3 w-3 rounded" />
            <Shimmer className="h-3 w-44" />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Shimmer className="h-4 w-20 rounded-full" />
        <Shimmer className="h-4 w-28 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-dashed border-default pt-3">
        <Shimmer className="h-3 w-32" />
        <Shimmer className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function UsersLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-44" />
          <Shimmer className="h-3 w-96 max-w-full" />
        </div>
        <Shimmer className="h-10 w-32 rounded-lg" />
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>

        {/* Role chip bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-24 rounded-full" />
        </div>

        {/* Staff cards */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StaffCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
