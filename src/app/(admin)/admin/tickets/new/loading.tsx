import { Search, WashingMachine } from "lucide-react";
import { Icon } from "@iconify/react";
import { POS_CATEGORIES, type PosCategoryId } from "@/lib/pos-categories";
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

const CAT_ICONS: Record<PosCategoryId, string> = {
  all: "game-icons:hanger",
  tops: "game-icons:t-shirt",
  bottoms: "game-icons:trousers",
  native: "game-icons:kimono",
  formal: "mdi:account-tie",
  household: "game-icons:bed",
  negotiable: "game-icons:price-tag",
  other: "game-icons:wool",
};

/**
 * Loader for the new-ticket POS board. Keeps the real chrome (customer bar
 * placeholder, category rail labels, live-cart empty state) and only shimmers
 * the dynamic parts: per-category counts and the item-grid tiles.
 */
export default function NewTicketLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Customer bar placeholder */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-default bg-surface px-4 py-3.5 md:flex-nowrap md:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 md:flex-nowrap md:gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Step 1 of 3
            </span>
            <span className="text-[15px] font-semibold text-foreground">Pick a customer</span>
          </div>
          <div className="relative min-w-0 flex-1 md:max-w-[420px]">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              placeholder="Search by name or phone…"
              disabled
              className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-[14px] text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="relative flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[0_1fr_320px] lg:grid-cols-[180px_1fr_360px] xl:grid-cols-[200px_1fr_380px]">
        {/* Category rail — labels real, counts shimmer */}
        <aside className="hidden overflow-y-auto border-r border-default bg-surface p-3 lg:block">
          <div className="px-2 pb-3 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Catalog
          </div>
          {POS_CATEGORIES.map((c) => (
            <div
              key={c.id}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-foreground/80"
            >
              <Icon icon={CAT_ICONS[c.id] ?? "game-icons:wool"} width={16} height={16} />
              <span className="flex-1">{c.label}</span>
              <Shimmer className="ml-auto h-4 w-6 rounded-full" />
            </div>
          ))}
        </aside>

        {/* Item grid — search real, tiles shimmer */}
        <section className="flex min-h-0 flex-col overflow-hidden bg-surface-muted dark:bg-background">
          <div className="mb-0 flex items-center gap-3 border-b border-default px-4 py-3 md:px-5">
            <div className="relative w-full sm:w-[260px]">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <input
                placeholder="Search items…"
                disabled
                className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-[13.5px] text-foreground"
              />
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto p-4 sm:grid-cols-3 md:p-5 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-xl border border-default bg-card px-3.5 pb-3.5 pt-4 text-center"
              >
                <Shimmer className="h-[72px] w-[72px] rounded-full" />
                <Shimmer className="h-3.5 w-20 rounded-sm" />
                <Shimmer className="h-2.5 w-14 rounded-sm" />
              </div>
            ))}
          </div>
        </section>

        {/* Live cart — static empty state */}
        <aside className="flex min-w-0 flex-col border-l border-default bg-card">
          <div className="flex shrink-0 items-baseline justify-between border-b border-default px-5 py-4">
            <span className="text-[16px] font-bold tracking-tight text-foreground">Live cart</span>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
              0 items
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <WashingMachine
              aria-hidden
              className="text-muted-foreground/70"
              style={{ width: 88, height: 88, strokeWidth: 1.5 }}
            />
            <h4 className="text-[15px] font-semibold text-foreground">Pick a customer first</h4>
            <p className="mx-auto max-w-[260px] text-[12.5px] leading-snug text-muted-foreground">
              Find the customer in the bar above, then add items from the catalog.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
