import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(d);
}

/**
 * Format a `@db.Date` column (Prisma reads these as UTC-midnight Date objects)
 * using UTC components so the displayed day matches what was stored — independent
 * of the viewer's timezone.
 */
export function formatDbDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "UTC" }).format(d);
}

/**
 * Extract YYYY-MM-DD from a `@db.Date` column using UTC components. Round-trip-safe
 * with {@link localDateToUtcMidnight}.
 */
export function isoUtcDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Convert a local Date (or YYYY-MM-DD string) into the UTC-midnight Date that
 * should be written to a `@db.Date` column. Storing this way means the date the
 * user *meant* is the same date that comes back, regardless of server/client TZ.
 */
export function localDateToUtcMidnight(input: Date | string): Date {
  if (typeof input === "string") {
    const [y, m, d] = input.split("-").map(Number);
    return new Date(Date.UTC(y!, (m ?? 1) - 1, d!));
  }
  return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
}
