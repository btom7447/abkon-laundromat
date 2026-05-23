"use client";

import { useEffect, useRef, useState } from "react";
import { History, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Period } from "@/server/queries/dashboard";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ key: Period; label: string; hint: string }> = [
  { key: "today", label: "Today", hint: "Current day" },
  { key: "week", label: "This week", hint: "Mon – now" },
  { key: "month", label: "This month", hint: "Last 30 days" },
];

interface Props {
  value: Period;
  onChange: (next: Period) => void;
  disabled?: boolean;
}

export function PeriodSelector({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const current = OPTIONS.find((o) => o.key === value) ?? OPTIONS[0]!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-3.5 [&_svg]:w-3.5"
      >
        <History />
        <span>{current.label}</span>
        <ChevronDown
          className="h-3 w-3 text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-xl border border-default bg-card p-1.5 shadow-[0_12px_32px_-8px_rgb(11_18_38/0.18),0_6px_12px_-6px_rgb(11_18_38/0.1)]"
          >
            {OPTIONS.map((o) => {
              const active = o.key === value;
              return (
                <button
                  key={o.key}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-100",
                    active
                      ? "bg-brand-50 text-brand-800 dark:bg-navy-800 dark:text-brand-200"
                      : "hover:bg-surface-muted"
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-[13px] font-semibold">{o.label}</span>
                    <span className="text-[10.5px] text-muted-foreground">{o.hint}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-brand-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
