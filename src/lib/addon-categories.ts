/**
 * Add-on catalog categories. Mirrors the shape of pos-categories.ts so the UI
 * components (chips, filters, modal dropdown) look and feel the same.
 *
 * Resolution priority for `categoryForAddOn`:
 *   1. Explicit `storedCategory` (the admin's choice on AddOn.category).
 *   2. Name-based lookup against the built-in mapping.
 *   3. Fallback → "other".
 */

export type AddOnCategoryId =
  | "all"
  | "care"
  | "repair"
  | "logistics"
  | "urgency"
  | "other";

export const ADDON_CATEGORIES: Array<{
  id: AddOnCategoryId;
  label: string;
  hint: string;
}> = [
  { id: "all", label: "All add-ons", hint: "Everything" },
  { id: "care", label: "Care", hint: "Stain removal, starching, whitening, perfuming…" },
  { id: "repair", label: "Repair", hint: "Buttons, hemming, stitching" },
  { id: "logistics", label: "Logistics", hint: "Pickup, delivery, packaging" },
  { id: "urgency", label: "Urgency", hint: "Rush, urgent surcharge" },
  { id: "other", label: "Other", hint: "Everything else" },
];

const CATEGORY_BY_NAME: Record<string, AddOnCategoryId> = {
  // Care
  Starching: "care",
  "Stain removal": "care",
  Whitening: "care",
  "Color restoration": "care",
  "Fabric softening": "care",
  Sanitizing: "care",
  Perfuming: "care",
  // Repair
  "Button replacement": "repair",
  "Minor stitching": "repair",
  "Hem adjustment": "repair",
  // Logistics
  "Premium garment bag": "logistics",
  Pickup: "logistics",
  Delivery: "logistics",
  // Urgency
  "Same-day rush": "urgency",
  "Urgent surcharge": "urgency",
};

export function categoryForAddOn(
  name: string,
  storedCategory?: string | null
): AddOnCategoryId {
  if (storedCategory) {
    const known = ADDON_CATEGORIES.find((c) => c.id === storedCategory);
    if (known) return known.id;
  }
  return CATEGORY_BY_NAME[name] ?? "other";
}

/**
 * Tailwind class strings for the colored category pill, shared between cards
 * and the modal header. Keeps a single source of truth for the palette.
 */
export const ADDON_CATEGORY_PILL_CLS: Record<AddOnCategoryId, string> = {
  all: "",
  care: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  repair: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  logistics: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  urgency: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
