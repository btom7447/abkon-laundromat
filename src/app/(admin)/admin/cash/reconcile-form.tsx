"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Banknote,
  Wallet,
  Equal,
  StickyNote,
} from "lucide-react";
import CountUp from "react-countup";
import { reconcileCashAction, type ReconcileState } from "@/server/actions/cash";
import { cn } from "@/lib/utils";

const initial: ReconcileState = {};

interface Props {
  branchId: string;
  date: string;
  expectedCash: number;
  ticketCount: number;
  currentCounted?: number | null;
  currentNotes?: string | null;
}

type Tone = "balanced" | "over" | "short";

const TONE_TEXT_CLS: Record<Tone, string> = {
  balanced: "text-emerald-600 dark:text-emerald-400",
  over: "text-amber-600 dark:text-amber-400",
  short: "text-red-600 dark:text-red-400",
};

const TONE_PILL_CLS: Record<Tone, string> = {
  balanced: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  over: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  short: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const TONE_ICON_BG: Record<Tone, string> = {
  balanced: "bg-emerald-500",
  over: "bg-amber-500",
  short: "bg-red-500",
};

const TONE_BORDER_CLS: Record<Tone, string> = {
  balanced: "border-emerald-300 focus-within:border-emerald-500 focus-within:ring-emerald-500/20",
  over: "border-amber-300 focus-within:border-amber-500 focus-within:ring-amber-500/20",
  short: "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20",
};

function withSeparators(n: number): string {
  return n.toLocaleString("en-NG");
}

function parseCount(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function ReconcileForm({
  branchId,
  date,
  expectedCash,
  ticketCount,
  currentCounted,
  currentNotes,
}: Props) {
  const [state, action, pending] = useActionState(reconcileCashAction, initial);
  const initialCount = currentCounted ?? expectedCash;
  const [counted, setCounted] = useState<number>(initialCount);
  const [countedText, setCountedText] = useState<string>(
    initialCount > 0 ? withSeparators(initialCount) : ""
  );

  useEffect(() => {
    if (currentCounted != null && currentCounted !== counted) {
      setCounted(currentCounted);
      setCountedText(currentCounted > 0 ? withSeparators(currentCounted) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCounted]);

  const discrepancy = useMemo(() => counted - expectedCash, [counted, expectedCash]);
  const tone: Tone = discrepancy === 0 ? "balanced" : discrepancy > 0 ? "over" : "short";

  const varianceCopy =
    tone === "balanced"
      ? "Drawer matches the system — nothing to chase."
      : tone === "over"
        ? "Drawer has more cash than expected. Float top-up or miscount?"
        : "Drawer is missing cash. Recount, then leave a note if it stands.";

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="countedCash" value={counted} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Ledger tape */}
      <div className="overflow-hidden rounded-xl border border-default bg-surface-muted/30 dark:bg-navy-900/30">
        {/* Expected row */}
        <LedgerRow>
          <LedgerLabel icon={<Wallet />} label="Expected from system" sub={`${ticketCount} paid ticket${ticketCount === 1 ? "" : "s"} today`} />
          <div className="text-right text-[20px] font-bold tabular-nums tracking-tight text-foreground md:text-[24px]">
            <CountUp
              key={`exp-${expectedCash}`}
              start={0}
              end={expectedCash}
              duration={0.5}
              prefix="₦"
              separator=","
              preserveValue
            />
          </div>
        </LedgerRow>

        {/* Operator */}
        <Operator>−</Operator>

        {/* Counted row — the input */}
        <LedgerRow>
          <LedgerLabel icon={<Banknote />} label="Counted in drawer" sub="Live thousands separators" />
          <div
            className={cn(
              "relative w-full max-w-xs rounded-lg border-2 bg-surface transition-all focus-within:ring-[3px] md:w-[260px]",
              TONE_BORDER_CLS[tone]
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] font-bold leading-none text-muted-foreground md:text-[24px]"
            >
              ₦
            </span>
            <input
              id="counted-cash-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={countedText}
              onChange={(e) => {
                const n = parseCount(e.target.value);
                setCounted(n);
                setCountedText(n > 0 ? withSeparators(n) : "");
              }}
              onFocus={(e) => e.currentTarget.select()}
              required
              placeholder="0"
              aria-label="Cash counted in drawer"
              className="h-12 w-full bg-transparent pl-8 pr-3 text-right text-[20px] font-bold tabular-nums tracking-tight text-foreground focus:outline-none placeholder:text-muted-foreground/30 md:h-14 md:pl-9 md:text-[24px]"
            />
          </div>
        </LedgerRow>

        {/* Operator */}
        <Operator>
          <Equal className="h-3 w-3" />
        </Operator>

        {/* Variance row — the result */}
        <div className="flex items-center justify-between gap-4 border-t-2 border-double border-default bg-card px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-[0_4px_10px_-2px_rgb(15_23_42/0.18)] [&_svg]:h-4 [&_svg]:w-4",
                TONE_ICON_BG[tone]
              )}
            >
              {tone === "balanced" ? <Check /> : tone === "over" ? <ArrowUpRight /> : <ArrowDownRight />}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Variance
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                    TONE_PILL_CLS[tone]
                  )}
                >
                  {tone === "balanced" ? "Balanced" : tone === "over" ? "Overage" : "Shortage"}
                </span>
              </div>
              <p className="line-clamp-1 text-[11.5px] text-muted-foreground">{varianceCopy}</p>
            </div>
          </div>
          <div className={cn("shrink-0 text-right text-[24px] font-bold tabular-nums tracking-tight md:text-[30px]", TONE_TEXT_CLS[tone])}>
            <CountUp
              key={`var-${discrepancy}`}
              start={0}
              end={discrepancy}
              duration={0.45}
              preserveValue
              formattingFn={(n) =>
                n === 0 ? "₦0" : `${n > 0 ? "+" : "−"}₦${withSeparators(Math.abs(n))}`
              }
            />
          </div>
        </div>
      </div>

      {/* Note · full width */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="rec-notes"
          className="flex items-center gap-2.5 text-[13.5px] font-semibold text-foreground"
        >
          <StickyNote className="h-7 w-7 shrink-0 text-brand-700 dark:text-brand-300" />
          Note for the record
          {discrepancy !== 0 && (
            <span className="text-[11.5px] font-normal italic text-amber-600 dark:text-amber-400">
              (recommended — variance is non-zero)
            </span>
          )}
        </label>
        <textarea
          id="rec-notes"
          name="notes"
          rows={3}
          defaultValue={currentNotes ?? ""}
          placeholder={
            tone === "short"
              ? "e.g. ₦200 short — possible miscount on AB-LG-…"
              : tone === "over"
                ? "e.g. found ₦500 unaccounted — float top-up?"
                : "Optional — anything worth remembering about this shift."
          }
          className="w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-[13.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* CTA · full width, under the note */}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-5 text-[14px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-4 [&_svg]:w-4"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Check />
            {currentCounted != null ? "Update reconciliation" : "Save reconciliation"}
          </>
        )}
      </button>

      {state.success && (
        <div className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" /> Saved — record updated.
        </div>
      )}
    </form>
  );
}

function LedgerRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
      {children}
    </div>
  );
}

function LedgerLabel({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
      {icon}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
        {sub && (
          <span className="line-clamp-1 text-[11.5px] text-muted-foreground">{sub}</span>
        )}
      </div>
    </div>
  );
}

function Operator({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex justify-center" aria-hidden>
      <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-default md:inset-x-6" />
      <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border border-default bg-surface text-[12px] font-bold text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
