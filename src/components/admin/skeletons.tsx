import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block animate-pulse rounded-md bg-surface-muted dark:bg-navy-800/60",
        className
      )}
      aria-hidden
    />
  );
}

const FLAG_CLS: Record<NonNullable<KpiSkeletonProps["flag"]>, string> = {
  sky: "border-l-[3px] border-l-brand-300",
  amber: "border-l-[3px] border-l-amber-300",
  red: "border-l-[3px] border-l-red-300",
};

interface KpiSkeletonProps {
  flag?: "sky" | "amber" | "red";
}

export function KpiSkeleton({ flag }: KpiSkeletonProps = {}) {
  return (
    <div
      aria-busy="true"
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]",
        flag && FLAG_CLS[flag]
      )}
    >
      <div className="flex items-center gap-1.5">
        <Shimmer className="h-3.5 w-3.5 rounded-full" />
        <Shimmer className="h-3 w-20" />
      </div>
      <Shimmer className="my-1 h-7 w-24" />
      <Shimmer className="h-3 w-28" />
    </div>
  );
}

export function ChartSkeleton({ height = 140 }: { height?: number }) {
  return (
    <div
      aria-busy="true"
      className="relative w-full overflow-hidden rounded-md bg-surface-muted/60 dark:bg-navy-800/40"
      style={{ height }}
    >
      <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </div>
  );
}

export function ActivityRowSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-dashed border-default py-2.5 last:border-0"
    >
      <Shimmer className="h-7 w-7 rounded-full" />
      <div className="flex w-full flex-col gap-1.5">
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-2.5 w-1/3" />
      </div>
      <Shimmer className="h-2.5 w-6" />
    </div>
  );
}
