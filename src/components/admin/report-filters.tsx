"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const presets = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
] as const;

export function PresetTabs({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function switchTo(preset: string) {
    const next = new URLSearchParams(params.toString());
    next.set("preset", preset);
    next.delete("from");
    next.delete("to");
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {presets.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => switchTo(p.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            current === p.value ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
