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

function BranchCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <Shimmer className="h-12 w-12 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Shimmer className="h-4 w-40" />
            <Shimmer className="h-4 w-10 rounded-full" />
          </div>
          <Shimmer className="h-3 w-56 max-w-full" />
        </div>
      </div>

      {/* Service area tags */}
      <div className="flex flex-wrap gap-1.5">
        <Shimmer className="h-5 w-16 rounded-full" />
        <Shimmer className="h-5 w-20 rounded-full" />
        <Shimmer className="h-5 w-14 rounded-full" />
      </div>

      {/* Hours + days */}
      <div className="flex items-center gap-3 border-t border-dashed border-default pt-3">
        <Shimmer className="h-3 w-24" />
        <div className="flex gap-0.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} className="h-5 w-7 rounded" />
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-4 gap-3 border-t border-dashed border-default pt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Shimmer className="h-2.5 w-12" />
            <Shimmer className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BranchesLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-3 w-96 max-w-full" />
        </div>
        <Shimmer className="h-10 w-36 rounded-lg" />
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>

        {/* Branch cards */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BranchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
