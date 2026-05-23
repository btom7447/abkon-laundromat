"use client";

import { Search, SlidersHorizontal, ShoppingBag, Pin } from "lucide-react";
import { motion } from "framer-motion";
import { Illustration, type IllustrationName } from "@/components/brand/illustrations";
import type { PosCategoryId } from "@/lib/pos-categories";
import { POS_CATEGORIES } from "@/lib/pos-categories";
import { cn } from "@/lib/utils";

export interface PosItem {
  id: string;
  name: string;
  unit: "PIECE" | "SQM" | "NEGOTIABLE";
  washPrice: number | null;
  ironPrice: number | null;
  washAndIronPrice: number | null;
  dryCleanPrice: number | null;
  category: PosCategoryId;
  illustration: IllustrationName;
  /** Surfaces this item at the top of the grid for the current user. */
  pinned?: boolean;
}

interface Props {
  items: PosItem[];
  category: PosCategoryId;
  search: string;
  onSearchChange: (s: string) => void;
  onItemClick: (it: PosItem) => void;
  cartQty: (id: string) => number;
  /** Mobile-only callbacks to open the categories drawer + cart bottom-sheet. */
  onOpenMobileCats: () => void;
  onOpenMobileCart: () => void;
  cartCount: number;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function priceTeaser(it: PosItem): string {
  if (it.unit === "NEGOTIABLE") return "Set at counter";
  const offered = [it.washPrice, it.ironPrice, it.washAndIronPrice, it.dryCleanPrice].filter(
    (p): p is number => p != null && p > 0
  );
  if (offered.length === 0) return "—";
  const lead = Math.min(...offered);
  const suffix = it.unit === "SQM" ? " / sqm" : "";
  return offered.length > 1 ? `From ${formatNaira(lead)}${suffix}` : `${formatNaira(lead)}${suffix}`;
}

export function ItemGrid({
  items,
  category,
  search,
  onSearchChange,
  onItemClick,
  cartQty,
  onOpenMobileCats,
  onOpenMobileCart,
  cartCount,
}: Props) {
  const label = POS_CATEGORIES.find((c) => c.id === category)?.label ?? "All items";

  return (
    <div className="overflow-y-auto bg-surface-muted px-4 py-4 dark:bg-background md:px-5 md:py-5">
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end justify-between gap-3 sm:block">
          <div>
            <div className="text-[18px] font-bold tracking-tight text-foreground">{label}</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
              {items.length} items · tap to configure
            </div>
          </div>
          {/* Mobile-only: open categories drawer */}
          <button
            type="button"
            onClick={onOpenMobileCats}
            aria-label="Open categories"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-default bg-surface px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface-muted lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Categories</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-[260px]">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              placeholder="Search items…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-[13.5px] text-foreground transition-colors focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-500/20"
            />
          </div>
          {/* Mobile-only: open cart bottom sheet */}
          <button
            type="button"
            onClick={onOpenMobileCart}
            aria-label={`Open cart (${cartCount} item${cartCount === 1 ? "" : "s"})`}
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-default bg-surface text-foreground transition-colors hover:bg-surface-muted md:hidden"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold tabular-nums text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02 } } }}
      >
        {items.length === 0 && (
          <div className="col-span-full px-4 py-8 text-center text-[13.5px] text-muted-foreground">
            {search ? <>No items match <strong>{search}</strong>.</> : "No items in this category."}
          </div>
        )}
        {[...items]
          // Pinned items sort to the top of the grid so the user's "frequent
          // five" sit at the entry point of the catalog.
          .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
          .map((it) => {
          const qty = cartQty(it.id);
          const isNeg = it.unit === "NEGOTIABLE";
          const isSqm = it.unit === "SQM";
          return (
            <motion.button
              key={it.id}
              type="button"
              onClick={() => onItemClick(it)}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
              }}
              whileTap={{ scale: 0.97 }}
              className="relative flex min-h-[148px] cursor-pointer flex-col items-center gap-2 rounded-xl border border-default bg-card px-3.5 pb-3.5 pt-4 text-center transition-all hover:-translate-y-px hover:border-brand-300 hover:shadow-[0_4px_12px_-2px_rgb(15_23_42/0.10)]"
            >
              {qty > 0 && (
                <motion.span
                  key={qty}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute right-2 top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold tabular-nums text-white"
                >
                  {qty}
                </motion.span>
              )}
              {it.pinned && (
                <span
                  aria-label="Pinned"
                  title="Pinned to top from your profile"
                  className="absolute left-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_2px_6px_-1px_rgb(14_165_233/0.45)]"
                >
                  <Pin className="h-2.5 w-2.5" />
                </span>
              )}
              {isNeg && (
                <span className={cn(
                  "absolute top-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
                  it.pinned ? "left-9" : "left-2"
                )}>
                  Neg.
                </span>
              )}
              {isSqm && !isNeg && (
                <span className="absolute right-2 top-2 text-[10px] font-medium text-muted-foreground">
                  / sqm
                </span>
              )}
              <span className="flex h-[72px] w-[72px] items-center justify-center text-navy-800 dark:text-brand-200">
                <Illustration name={it.illustration} size={64} />
              </span>
              <span className="text-[13px] font-semibold leading-[1.2] text-foreground">{it.name}</span>
              <span className="text-[11.5px] tabular-nums text-muted-foreground">{priceTeaser(it)}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
