"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
};

interface Props<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: DropdownOption<T>[];
  /** Optional native form field name — emits a hidden input so React forms can read it. */
  name?: string;
  /** Visible label inside the trigger when no value matches. */
  placeholder?: string;
  /** Trigger icon shown to the left of the label. */
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  /** Match the trigger width. Defaults to `w-full`. */
  triggerClassName?: string;
  /** Width of the open panel. Defaults to `w-56`. */
  menuClassName?: string;
  align?: "start" | "end";
  ariaLabel?: string;
}

/**
 * App-wide dropdown matching the visual language of `<PeriodSelector>` —
 * motion-animated panel, listbox semantics, brand-tinted active option, dark
 * mode aware. Use this in place of native `<select>` whenever the surrounding
 * UI is a modal, form, or anywhere a heavier native control feels out of place.
 *
 * For form submissions, pass `name` and a hidden input is emitted with the
 * current value.
 */
export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  name,
  placeholder = "Select…",
  icon,
  disabled,
  className,
  triggerClassName,
  menuClassName,
  align = "start",
  ariaLabel,
}: Props<T>) {
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

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-surface px-3 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-3.5 [&_svg]:w-3.5",
          triggerClassName
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon}
          <span className="truncate">{current?.label ?? placeholder}</span>
        </span>
        <ChevronDown
          className="h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200"
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
            className={cn(
              "absolute top-[calc(100%+6px)] z-50 w-full min-w-56 overflow-hidden rounded-xl border border-default bg-card p-1.5 shadow-[0_12px_32px_-8px_rgb(11_18_38/0.18),0_6px_12px_-6px_rgb(11_18_38/0.1)]",
              align === "end" ? "right-0" : "left-0",
              menuClassName
            )}
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-100 [&_svg]:h-3.5 [&_svg]:w-3.5",
                    active
                      ? "bg-brand-50 text-brand-800 dark:bg-navy-800 dark:text-brand-200"
                      : "text-foreground hover:bg-surface-muted"
                  )}
                >
                  {o.icon}
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-[13px] font-semibold">{o.label}</span>
                    {o.hint && <span className="text-[10.5px] text-muted-foreground">{o.hint}</span>}
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
