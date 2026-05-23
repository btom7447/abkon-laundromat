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

const PANEL_CLS =
  "rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]";

export default function TicketDetailLoading() {
  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Shimmer className="h-3 w-24" />
          <div className="flex items-center gap-3">
            <Shimmer className="h-7 w-52" />
            <Shimmer className="h-6 w-16 rounded-full" />
            <Shimmer className="h-6 w-14 rounded-full" />
          </div>
          <Shimmer className="h-3 w-72" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-10 w-28 rounded-lg" />
          <Shimmer className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* Status timeline shimmer */}
        <div className={PANEL_CLS}>
          <div className="flex items-center justify-between gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-1 items-center gap-3">
                <Shimmer className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Shimmer className="h-3 w-20" />
                  <Shimmer className="h-2.5 w-14" />
                </div>
                {i < 3 && <Shimmer className="h-0.5 flex-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          {/* Left: items + totals */}
          <div className="flex flex-col gap-5">
            <div className={PANEL_CLS}>
              <div className="mb-3.5 flex items-center justify-between">
                <Shimmer className="h-4 w-28" />
                <Shimmer className="h-3 w-16" />
              </div>
              <div className="flex flex-col">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b border-dashed border-default py-3.5 last:border-0"
                  >
                    <Shimmer className="h-13 w-13 rounded-[10px]" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Shimmer className="h-3.5 w-44" />
                      <Shimmer className="h-2.5 w-28" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Shimmer className="h-3 w-16" />
                      <Shimmer className="h-2.5 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={PANEL_CLS}>
              <div className="mb-3.5">
                <Shimmer className="h-4 w-20" />
              </div>
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Shimmer className="h-3 w-24" />
                    <Shimmer className="h-3 w-16" />
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-default pt-3">
                  <Shimmer className="h-4 w-12" />
                  <Shimmer className="h-5 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: action + customer + timeline */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-surface p-5 dark:border-brand-500/30 dark:from-brand-500/15 dark:to-surface">
              <Shimmer className="mb-3 h-3 w-24" />
              <Shimmer className="h-10 w-full rounded-lg" />
            </div>

            <div className={PANEL_CLS}>
              <div className="mb-3.5 flex items-center justify-between">
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-3 w-14" />
              </div>
              <div className="flex items-center gap-3">
                <Shimmer className="h-12 w-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Shimmer className="h-4 w-40" />
                  <Shimmer className="h-3 w-32" />
                </div>
              </div>
            </div>

            <div className={PANEL_CLS}>
              <div className="mb-3.5">
                <Shimmer className="h-4 w-20" />
              </div>
              <div className="flex flex-col gap-3 pl-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Shimmer className="h-7 w-7 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Shimmer className="h-3 w-3/4" />
                      <Shimmer className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
