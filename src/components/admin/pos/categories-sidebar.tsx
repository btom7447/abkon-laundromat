"use client";

import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronsLeft } from "lucide-react";
import { POS_CATEGORIES, type PosCategoryId } from "@/lib/pos-categories";
import { cn } from "@/lib/utils";

interface PosItem {
  id: string;
  category: PosCategoryId;
}

interface Props {
  items: PosItem[];
  active: PosCategoryId;
  onSelect: (id: PosCategoryId) => void;
  /** Desktop collapse state (lg+ only — drives icon-only rail). */
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Mobile drawer state */
  mobileOpen: boolean;
  onMobileClose: () => void;
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

const SMOOTH = "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export function CategoriesSidebar({
  items,
  active,
  onSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: Props) {
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    for (const c of POS_CATEGORIES) if (c.id !== "all") m[c.id] = 0;
    for (const it of items) m[it.category] = (m[it.category] ?? 0) + 1;
    return m;
  }, [items]);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            onClick={onMobileClose}
            aria-label="Close categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[color-mix(in_oklab,#0B1226_40%,transparent)] backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          // Mobile: fixed drawer, slides in from left
          "fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r border-default bg-surface transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: static (in-grid), fills its column, smooth padding swap
          "lg:static lg:z-auto lg:w-full lg:translate-x-0 lg:py-3",
          SMOOTH,
          // Padding tightens on collapse to keep buttons centered in 64px column
          collapsed ? "lg:px-2" : "lg:px-3"
        )}
      >
        {/* Desktop collapse handle — sits on right edge like main sidebar */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand catalog" : "Collapse catalog"}
          className="absolute -right-3 top-4 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-default bg-surface text-muted-foreground shadow-[0_2px_6px_-1px_rgb(15_23_42/0.12)] transition-all hover:scale-105 hover:text-foreground lg:inline-flex"
        >
          <ChevronsLeft
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </button>

        {/* Header: "Catalog" label + mobile close button */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 pb-2 pt-3 lg:px-2 lg:pt-1",
            // Header padding match for expanded state
            !collapsed && "lg:px-2"
          )}
        >
          <span
            className={cn(
              "text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap",
              SMOOTH,
              collapsed && "lg:pointer-events-none lg:h-0 lg:overflow-hidden lg:opacity-0"
            )}
          >
            Catalog
          </span>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className={cn(
            "flex flex-col gap-0.5 px-2 pb-3 lg:px-0",
            collapsed && "lg:items-center"
          )}
        >
          {POS_CATEGORIES.map((c) => {
            const isActive = active === c.id;
            if (c.id !== "all" && (counts[c.id] ?? 0) === 0) return null;
            const iconId = CAT_ICONS[c.id] ?? CAT_ICONS.other;
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                whileTap={{ scale: 0.97 }}
                title={collapsed ? `${c.label} (${counts[c.id] ?? 0})` : undefined}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-lg border-0 px-2.5 py-2 text-left text-[13.5px] transition-colors [&_svg]:shrink-0",
                  isActive
                    ? "bg-brand-50 font-semibold text-brand-800 dark:bg-navy-800 dark:text-brand-200"
                    : "bg-transparent text-foreground/80 hover:bg-surface-muted hover:text-foreground",
                  SMOOTH,
                  // Collapsed (lg+): icon-only square buttons, centered
                  collapsed && "lg:h-10 lg:w-10 lg:justify-center lg:gap-0 lg:px-0 lg:py-0"
                )}
              >
                <Icon icon={iconId} width={16} height={16} />
                <span
                  className={cn(
                    "min-w-0 truncate whitespace-nowrap",
                    SMOOTH,
                    collapsed
                      ? "lg:pointer-events-none lg:w-0 lg:opacity-0"
                      : "flex-1"
                  )}
                >
                  {c.label}
                </span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 py-px text-[11px] tabular-nums",
                    isActive
                      ? "bg-brand-200 text-brand-800 dark:bg-navy-700 dark:text-brand-200"
                      : "bg-surface-muted text-muted-foreground",
                    SMOOTH,
                    collapsed && "lg:pointer-events-none lg:hidden"
                  )}
                >
                  {counts[c.id] ?? 0}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
