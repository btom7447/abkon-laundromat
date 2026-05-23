import { KpiSkeleton, ChartSkeleton, ActivityRowSkeleton } from "@/components/admin/skeletons";
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

export default function DashboardLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-3 w-44" />
          <Shimmer className="h-7 w-72" />
          <Shimmer className="h-3 w-96" />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <Shimmer className="h-10 w-32 rounded-lg" />
          <Shimmer className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        <section className="flex flex-col gap-2.5">
          <Shimmer className="h-3 w-20" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton flag="sky" />
            <KpiSkeleton flag="amber" />
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <Shimmer className="h-3 w-20" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiSkeleton flag="red" />
            <KpiSkeleton flag="amber" />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
          <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <div className="mb-3.5 flex items-center justify-between">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-3 w-14" />
            </div>
            <div className="flex flex-col gap-2">
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </div>
          </div>

          <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <div className="mb-3.5 flex items-center justify-between">
              <Shimmer className="h-4 w-40" />
              <Shimmer className="h-3 w-20" />
            </div>
            <ChartSkeleton height={140} />
            <div className="mt-3.5 flex items-center justify-between">
              <Shimmer className="h-3 w-10" />
              <Shimmer className="h-3 w-10" />
              <Shimmer className="h-3 w-24" />
            </div>
          </div>

          <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <div className="mb-3.5">
              <Shimmer className="h-4 w-28" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Shimmer className="h-16 rounded-lg" />
              <Shimmer className="h-16 rounded-lg" />
              <Shimmer className="h-16 rounded-lg" />
              <Shimmer className="h-16 rounded-lg" />
              <Shimmer className="h-16 rounded-lg" />
              <Shimmer className="h-16 rounded-lg" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
