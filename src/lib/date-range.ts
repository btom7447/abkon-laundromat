export type RangePreset = "today" | "week" | "month" | "year" | "custom";

export type DateRange = {
  from: Date;
  to: Date;
  preset: RangePreset;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay() || 7; // Monday=1, Sunday=0 → 7
  x.setDate(x.getDate() - (day - 1));
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function startOfYear(d: Date): Date {
  const x = startOfDay(d);
  x.setMonth(0, 1);
  return x;
}

export function resolveRange(input?: {
  preset?: string;
  from?: string;
  to?: string;
}): DateRange {
  const now = new Date();
  const preset = (input?.preset as RangePreset) ?? "month";

  if (input?.from && input?.to) {
    const from = startOfDay(new Date(input.from));
    const to = endOfDay(new Date(input.to));
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { from, to, preset: "custom" };
    }
  }

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), preset: "today" };
    case "week":
      return { from: startOfWeek(now), to: endOfDay(now), preset: "week" };
    case "year":
      return { from: startOfYear(now), to: endOfDay(now), preset: "year" };
    case "month":
    default:
      return { from: startOfMonth(now), to: endOfDay(now), preset: "month" };
  }
}

export function eachDayInRange(range: DateRange): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(range.from);
  while (cursor <= range.to) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
