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

function TicketCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="relative rounded-xl border border-default bg-card py-4 pl-6 pr-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-surface-muted"
      />
      <div className="flex items-center justify-between border-b border-dashed border-default pb-3">
        <Shimmer className="h-4 w-32" />
        <div className="flex gap-1.5">
          <Shimmer className="h-5 w-14 rounded-full" />
          <Shimmer className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Shimmer className="h-3 w-32" />
            <Shimmer className="h-2.5 w-44" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  );
}

export default function TicketsLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-7 w-28" />
          <Shimmer className="h-3 w-44" />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <Shimmer className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton flag="amber" />
          <KpiSkeleton flag="amber" />
          <KpiSkeleton />
        </div>

        {/* Chip bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <Shimmer className="h-7 w-16 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-16 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="h-7 w-24 rounded-full" />
          <span className="ml-auto" />
          <Shimmer className="h-9 w-full max-w-[320px] rounded-md md:w-64" />
        </div>

        {/* Ticket cards */}
        <div className="flex flex-col gap-2.5">
          <TicketCardSkeleton />
          <TicketCardSkeleton />
          <TicketCardSkeleton />
          <TicketCardSkeleton />
          <TicketCardSkeleton />
          <TicketCardSkeleton />
        </div>
      </div>
    </>
  );
}
