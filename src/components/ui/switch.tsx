"use client";

import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Optional form field name — emits a hidden input with "on" or "off" so server actions can read it. */
  name?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}

/**
 * Brand-colored toggle switch. Animated thumb, focus ring, accessible button
 * with `role="switch"`. Pairs with a hidden input when `name` is provided so
 * the value rides along in a form submission.
 */
export function Switch({ checked, onChange, disabled, name, ariaLabel, size = "md" }: Props) {
  const dims =
    size === "sm"
      ? "h-5 w-9 [&>span]:h-3.5 [&>span]:w-3.5"
      : "h-6 w-11 [&>span]:h-4.5 [&>span]:w-4.5";
  const offset = size === "sm" ? (checked ? "translate-x-4" : "translate-x-0.5") : (checked ? "translate-x-5" : "translate-x-0.5");

  return (
    <>
      {name && <input type="hidden" name={name} value={checked ? "on" : "off"} />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60",
          dims,
          checked
            ? "bg-brand-500"
            : "bg-slate-300 dark:bg-slate-700"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none inline-block transform rounded-full bg-white shadow-[0_1px_3px_0_rgb(15_23_42/0.18)] transition-transform duration-200 ease-out",
            offset
          )}
        />
      </button>
    </>
  );
}
