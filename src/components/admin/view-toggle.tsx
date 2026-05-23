"use client";

import Link from "next/link";
import { LayoutList, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

interface Props {
  value: ViewMode;
  listHref: string;
  gridHref: string;
}

/**
 * Segmented two-button toggle (list / grid). Renders as Link buttons so the
 * choice is URL-driven and survives reload.
 */
export function ViewToggle({ value, listHref, gridHref }: Props) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex h-9 items-center rounded-lg border border-default bg-surface p-0.5"
    >
      <Link
        href={listHref}
        aria-pressed={value === "list"}
        title="List view"
        className={cn(
          "inline-flex h-8 w-9 items-center justify-center rounded-md transition-colors",
          value === "list"
            ? "bg-brand-50 text-brand-800 shadow-sm dark:bg-navy-800 dark:text-brand-200"
            : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        )}
      >
        <LayoutList />
      </Link>
      <Link
        href={gridHref}
        aria-pressed={value === "grid"}
        title="Grid view"
        className={cn(
          "inline-flex h-8 w-9 items-center justify-center rounded-md transition-colors",
          value === "grid"
            ? "bg-brand-50 text-brand-800 shadow-sm dark:bg-navy-800 dark:text-brand-200"
            : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        )}
      >
        <LayoutGrid />
      </Link>
    </div>
  );
}
