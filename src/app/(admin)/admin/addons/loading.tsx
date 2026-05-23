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

function AddOnCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-[56px_1fr] gap-3.5 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <Shimmer className="h-14 w-14 rounded-[10px]" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <Shimmer className="h-3.5 w-32" />
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-4 w-16 rounded-full" />
          <Shimmer className="h-3 w-12" />
        </div>
      </div>
      <div className="col-span-full mt-1 flex items-center justify-between gap-2 border-t border-dashed border-default pt-3">
        <Shimmer className="h-5 w-20" />
        <div className="flex gap-1.5">
          <Shimmer className="h-4 w-14 rounded-full" />
          <Shimmer className="h-4 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      <Shimmer className="h-3 w-48" />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AddOnCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function AddonsLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-3 w-80 max-w-full" />
        </div>
        <Shimmer className="h-10 w-36 rounded-lg" />
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>

        {/* Category chip bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <Shimmer className="h-7 w-24 rounded-full" />
          <Shimmer className="h-7 w-16 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-24 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
        </div>

        {/* Per-item + Per-ticket sections */}
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </>
  );
}
