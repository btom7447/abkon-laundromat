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

function CustomerCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-2.5 rounded-xl border border-default bg-card p-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <div className="flex items-center gap-2.5">
        <Shimmer className="h-10 w-10 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-2.5 w-20" />
        </div>
      </div>
      <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-default pt-2.5">
        <Shimmer className="h-2.5 w-12" />
        <Shimmer className="h-3 w-16" />
      </div>
    </div>
  );
}

export default function CustomersLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-36" />
          <Shimmer className="h-3 w-72" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-10 w-36 rounded-lg" />
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

        {/* Chip bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <Shimmer className="h-7 w-16 rounded-full" />
          <Shimmer className="h-7 w-24 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-16 rounded-full" />
          <Shimmer className="h-7 w-24 rounded-full" />
          <span className="ml-auto" />
          <Shimmer className="h-9 w-full max-w-[320px] rounded-md md:w-64" />
        </div>

        {/* Customer cards — dense grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <CustomerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
