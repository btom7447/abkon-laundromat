"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  ChevronRight,
  Calendar,
  Sparkles,
  Truck,
  PackageOpen,
  Zap,
  Percent,
  ChevronDown,
  Loader2,
  WashingMachine,
  Anvil,
  Droplets,
  Wind,
  X,
} from "lucide-react";
import type { Service } from "@prisma/client";
import { Illustration } from "@/components/brand/illustrations";
import type { PosItem } from "@/components/admin/pos/item-grid";
import type { PosAddOn, PosLineDraft } from "@/components/admin/pos/item-config-panel";
import { cn } from "@/lib/utils";

export interface CartLine extends PosLineDraft {
  tempId: string;
}

export interface ComputedLine {
  unitPrice: number;
  subtotal: number;
  error: string | null;
}

interface Props {
  /** Mobile-only drawer state */
  mobileOpen: boolean;
  onMobileClose: () => void;
  customer: { name: string } | null;
  lines: CartLine[];
  items: PosItem[];
  perTicketAddOns: PosAddOn[];
  addOnMap: Map<string, PosAddOn>;
  selectedPerTicketAddOnIds: string[];
  onTogglePerTicketAddOn: (id: string) => void;
  isUrgent: boolean;
  onToggleUrgent: (v: boolean) => void;
  urgentSurchargeAmount: number;
  urgentSurchargeMode: "FLAT" | "PERCENTAGE";
  pickupDate: string;
  onPickupDateChange: (d: string) => void;
  discountPercent: number;
  discountReason: string;
  onDiscountChange: (pct: number) => void;
  onDiscountReasonChange: (r: string) => void;
  maxDiscount: number;
  paymentReceived: boolean;
  onPaymentReceivedChange: (v: boolean) => void;
  computedLines: ComputedLine[];
  lineSubtotal: number;
  perTicketAddOnsTotal: number;
  urgentSurcharge: number;
  discountAmount: number;
  grandTotal: number;
  onEditLine: (line: CartLine) => void;
  onUpdateQty: (tempId: string, qty: number) => void;
  onRemoveLine: (tempId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

const SERVICE_ICON: Record<Service, React.ComponentType<{ className?: string }>> = {
  WASH: WashingMachine,
  IRON: Anvil,
  WASH_AND_IRON: Droplets,
  DRY_CLEAN: Wind,
};

const SERVICE_LABEL: Record<Service, string> = {
  WASH: "Wash",
  IRON: "Iron",
  WASH_AND_IRON: "Wash & Iron",
  DRY_CLEAN: "Dry clean",
};

function addOnIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("pickup")) return Truck;
  if (n.includes("delivery")) return Truck;
  if (n.includes("bag") || n.includes("garment")) return PackageOpen;
  return Sparkles;
}

export function LiveCart(props: Props) {
  const {
    mobileOpen, onMobileClose,
    customer, lines, items, perTicketAddOns, addOnMap,
    selectedPerTicketAddOnIds, onTogglePerTicketAddOn,
    isUrgent, onToggleUrgent, urgentSurchargeAmount, urgentSurchargeMode,
    pickupDate, onPickupDateChange,
    discountPercent, discountReason, onDiscountChange, onDiscountReasonChange, maxDiscount,
    paymentReceived, onPaymentReceivedChange,
    computedLines, lineSubtotal, perTicketAddOnsTotal, urgentSurcharge, discountAmount, grandTotal,
    onEditLine, onUpdateQty, onRemoveLine, onSubmit, submitting, canSubmit,
  } = props;

  const [discountOpen, setDiscountOpen] = useState(false);
  const itemMap = new Map(items.map((i) => [i.id, i]));

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            onClick={onMobileClose}
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[color-mix(in_oklab,#0B1226_40%,transparent)] backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          // Mobile: bottom-sheet drawer
          "fixed inset-x-0 bottom-0 z-50 flex min-w-0 max-h-[85vh] flex-col rounded-t-2xl border-t border-default bg-card shadow-[0_-12px_32px_-8px_rgb(11_18_38/0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          mobileOpen ? "translate-y-0" : "translate-y-full",
          // Desktop: static side panel
          "md:static md:inset-x-auto md:bottom-auto md:z-auto md:max-h-none md:translate-y-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none md:transition-none"
        )}
      >
        {/* Mobile grab handle */}
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close cart"
          className="flex shrink-0 items-center justify-center py-2.5 md:hidden"
        >
          <span className="block h-1 w-10 rounded-full bg-muted-foreground/30" />
        </button>

        {/* Head */}
        <div className="flex shrink-0 items-baseline justify-between border-b border-default px-5 pb-4 md:pt-4">
          <span className="text-[16px] font-bold tracking-tight text-foreground">Live cart</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
              {lines.length} {lines.length === 1 ? "item" : "items"}
            </span>
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <WashingMachine
            aria-hidden
            className="text-muted-foreground/70"
            style={{ width: 88, height: 88, strokeWidth: 1.5 }}
          />
          <h4 className="text-[15px] font-semibold text-foreground">
            {customer ? "Tap an item to start" : "Pick a customer first"}
          </h4>
          <p className="mx-auto max-w-[260px] text-[12.5px] leading-snug text-muted-foreground">
            {customer
              ? "Choose service, quantity, and add-ons in the panel that opens."
              : "Find the customer in the bar above, then add items from the catalog."}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Lines */}
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {lines.map((ln, idx) => {
                const it = itemMap.get(ln.itemId);
                const lineCalc = computedLines[idx];
                const ServiceIcon = SERVICE_ICON[ln.service];
                return (
                  <motion.div
                    key={ln.tempId}
                    layout
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-[44px_1fr_auto] gap-3 border-b border-dashed border-default px-4 py-3.5 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => onEditLine(ln)}
                      aria-label={`Edit ${it?.name}`}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-surface-muted p-0 text-navy-800 dark:text-brand-200"
                    >
                      {it && <Illustration name={it.illustration} size={36} />}
                    </button>
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <div className="flex items-baseline justify-between gap-2 text-[14px] font-semibold text-foreground">
                        <span className="truncate">{it?.name}</span>
                        <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
                          × {ln.quantity}
                          {it?.unit === "SQM" ? " sqm" : ""}
                        </span>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-700 dark:text-brand-300 [&_svg]:h-2.5 [&_svg]:w-2.5">
                          <ServiceIcon />
                          {SERVICE_LABEL[ln.service]}
                        </span>
                      </div>
                      {ln.perItemAddOnIds.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {ln.perItemAddOnIds.map((aid) => {
                            const a = addOnMap.get(aid);
                            return a ? (
                              <span
                                key={aid}
                                className="rounded-full bg-surface-muted px-1.5 py-px text-[10.5px] tracking-[0.02em] text-muted-foreground"
                              >
                                + {a.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      {lineCalc?.error && (
                        <span className="mt-0.5 text-[11px] text-destructive">{lineCalc.error}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[14px] font-bold tabular-nums text-foreground">
                        {formatNaira(lineCalc?.subtotal ?? 0)}
                      </span>
                      <div className="inline-flex items-center gap-0 rounded-md bg-surface-muted">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(ln.tempId, Math.max(1, ln.quantity - 1))}
                          disabled={ln.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-0 bg-transparent text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30 [&_svg]:h-3 [&_svg]:w-3"
                        >
                          <Minus />
                        </button>
                        <span className="min-w-[24px] text-center text-[12px] font-semibold tabular-nums">
                          {ln.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(ln.tempId, ln.quantity + 1)}
                          aria-label="Increase quantity"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-0 bg-transparent text-foreground transition-colors hover:bg-surface [&_svg]:h-3 [&_svg]:w-3"
                        >
                          <Plus />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveLine(ln.tempId)}
                        className="mt-0.5 border-0 bg-transparent p-0 text-[10.5px] text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Ticket options */}
          <div className="flex flex-col gap-2 border-t border-default px-4 py-4">
            {perTicketAddOns.map((a) => {
              const on = selectedPerTicketAddOnIds.includes(a.id);
              const Icon = addOnIcon(a.name);
              return (
                <OptToggle
                  key={a.id}
                  on={on}
                  onClick={() => onTogglePerTicketAddOn(a.id)}
                  icon={<Icon />}
                  title={a.name}
                  sub={a.pricingMode === "FLAT" ? `+ ${formatNaira(a.amount)}` : `+ ${a.amount}%`}
                />
              );
            })}
            <OptToggle
              on={isUrgent}
              onClick={() => onToggleUrgent(!isUrgent)}
              icon={<Zap />}
              title="Urgent (1-day)"
              sub={
                "+ " +
                (urgentSurchargeMode === "FLAT"
                  ? formatNaira(urgentSurchargeAmount)
                  : `${urgentSurchargeAmount}%`) +
                " surcharge"
              }
            />
          </div>

          {/* Discount */}
          <div className="border-t border-default px-4 pb-0 pt-3">
            <button
              type="button"
              onClick={() => setDiscountOpen((o) => !o)}
              className="flex w-full items-center justify-between border-0 bg-transparent px-0 py-2 text-[13px] text-foreground"
            >
              <span className="flex items-center gap-2 font-medium [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-muted-foreground">
                <Percent />
                Apply discount
              </span>
              <span className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                {discountPercent > 0 && (
                  <span className="font-semibold text-brand-500">−{discountPercent}%</span>
                )}
                <span className="text-[10.5px]">max {maxDiscount}%</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-150",
                    discountOpen && "rotate-180"
                  )}
                />
              </span>
            </button>
            {discountOpen && (
              <div className="pb-3.5 pt-1.5">
                <div className="grid grid-cols-[90px_1fr] items-start gap-2.5">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                      Percent
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={maxDiscount}
                      value={discountPercent || ""}
                      onChange={(e) =>
                        onDiscountChange(Math.min(maxDiscount, Math.max(0, Number(e.target.value) || 0)))
                      }
                      placeholder="0"
                      className="h-9 w-full rounded-md border border-input bg-surface px-2.5 text-[13px] text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                      Reason {discountPercent > 0 && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={discountReason}
                      onChange={(e) => onDiscountReasonChange(e.target.value)}
                      placeholder="e.g. loyalty, complaint resolution…"
                      className="min-h-[56px] w-full resize-y rounded-md border border-input bg-surface px-2.5 py-2 text-[13px] text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-1.5 border-t border-default px-4 pb-4 pt-3.5">
            <SumRow label="Items subtotal" value={formatNaira(lineSubtotal)} />
            {perTicketAddOnsTotal - urgentSurcharge > 0 && (
              <SumRow
                label="Per-ticket add-ons"
                value={formatNaira(perTicketAddOnsTotal - urgentSurcharge)}
              />
            )}
            {urgentSurcharge > 0 && <SumRow label="Urgent surcharge" value={formatNaira(urgentSurcharge)} />}
            {discountAmount > 0 && (
              <SumRow
                label={`Discount (${discountPercent}%)`}
                value={`− ${formatNaira(discountAmount)}`}
                negative
              />
            )}
            <div className="mt-1 flex items-baseline justify-between border-t border-default pt-2">
              <span className="text-[14px] font-semibold text-foreground">Grand total</span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={grandTotal}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[22px] font-bold tabular-nums tracking-tight text-foreground"
                >
                  {formatNaira(grandTotal)}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="flex shrink-0 flex-col gap-2.5 border-t border-default bg-card px-4 py-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Pickup date
          </span>
          <span className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
            <Calendar />
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => onPickupDateChange(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              aria-label="Pickup date"
              className="flex-1 border-0 bg-transparent p-0 text-[13px] text-foreground outline-none"
            />
          </span>
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg bg-surface-muted px-3 py-2 text-[13px] text-foreground">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={paymentReceived}
              onChange={(e) => onPaymentReceivedChange(e.target.checked)}
              style={{ accentColor: "#0EA5E9" }}
            />
            Payment received at intake
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em]",
              paymentReceived
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            )}
          >
            {paymentReceived ? "Will mark PAID" : "Due on collection"}
          </span>
        </label>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-brand-500 px-4 py-3.5 text-[14.5px] font-semibold leading-none text-white transition-colors hover:bg-brand-600 active:translate-y-px disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:active:translate-y-0 [&_svg]:h-4 [&_svg]:w-4"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              Creating ticket…
            </>
          ) : (
            <>
              Create ticket
              <ChevronRight />
            </>
          )}
        </button>
      </div>
      </aside>
    </>
  );
}

function OptToggle({
  on,
  onClick,
  icon,
  title,
  sub,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-all",
        on
          ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/12"
          : "border-default bg-surface hover:border-strong"
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
            on ? "text-brand-500" : "text-brand-700 dark:text-brand-300"
          )}
        >
          {icon}
        </span>
        <span className="min-w-0">
          <strong className="block text-[13px] font-semibold text-foreground">{title}</strong>
          <span className="mt-px block text-[11px] text-muted-foreground">{sub}</span>
        </span>
      </span>
      <span
        className={cn(
          "relative h-[18px] w-8 shrink-0 rounded-full border transition-colors",
          on ? "border-brand-500 bg-brand-500" : "border-default bg-surface-muted"
        )}
      >
        <span
          className={cn(
            "absolute left-px top-px h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            on && "translate-x-[14px]"
          )}
        />
      </span>
    </button>
  );
}

function SumRow({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", negative ? "text-destructive" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
