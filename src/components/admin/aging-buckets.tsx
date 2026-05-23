import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type AgingBucket = {
  label: string;
  days: string;
  count: number;
  amount: number;
};

interface Props {
  title: string;
  sub?: string;
  data: AgingBucket[];
  /** Visual tone — bucket bars darken from this base. */
  tone?: "amber" | "red";
}

/**
 * Replaces the previous aging table with a vertical list of buckets where each
 * row shows count + amount and a tone-graded bar whose width is proportional to
 * the bucket's share of the total amount outstanding.
 */
export function AgingBuckets({ title, sub, data, tone = "amber" }: Props) {
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const totalAmount = data.reduce((s, d) => s + d.amount, 0);
  const maxAmount = data.reduce((m, d) => Math.max(m, d.amount), 0);

  // Tone progression: lighter on younger buckets, darker on older.
  const TONE_FILL: Record<"amber" | "red", string[]> = {
    amber: ["bg-amber-200", "bg-amber-300", "bg-amber-400", "bg-amber-500"],
    red: ["bg-red-200", "bg-red-300", "bg-red-400", "bg-red-500"],
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-default pb-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h3>
          {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
        </div>
        <div className="text-right">
          <div className="text-[18px] font-bold tabular-nums tracking-tight text-foreground">
            {formatNaira(totalAmount)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {totalCount} ticket{totalCount === 1 ? "" : "s"} outstanding
          </div>
        </div>
      </div>

      {/* Buckets */}
      {totalCount === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6 text-center text-sm text-muted-foreground">
          Nothing here — all clear.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((b, i) => {
            const pct = maxAmount > 0 ? (b.amount / maxAmount) * 100 : 0;
            const fill = TONE_FILL[tone][i] ?? TONE_FILL[tone][TONE_FILL[tone].length - 1]!;
            const empty = b.count === 0;
            return (
              <div key={b.label} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        empty ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {b.label}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {b.count} ticket{b.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[13px] font-semibold tabular-nums",
                      empty ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {formatNaira(b.amount)}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 dark:opacity-90",
                      empty ? "bg-surface-muted" : fill
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
