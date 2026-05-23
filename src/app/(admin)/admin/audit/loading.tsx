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

function LogRowSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-dashed border-default px-4 py-3 last:border-0 md:px-5"
    >
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-2.5 w-2.5 rounded-full" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <Shimmer className="h-3 w-40" />
        <Shimmer className="h-2.5 w-32" />
      </div>
      <div className="hidden flex-col items-end gap-1.5 md:flex">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-2.5 w-20" />
      </div>
    </div>
  );
}

export default function AuditLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-3 w-96 max-w-full" />
        </div>
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

        {/* Log feed */}
        <div className="overflow-hidden rounded-xl border border-default bg-card shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-default px-4 py-3 md:px-5">
            <div className="flex flex-col gap-1.5">
              <Shimmer className="h-3 w-36" />
              <Shimmer className="h-2.5 w-48" />
            </div>
            <Shimmer className="h-3 w-24" />
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <LogRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
