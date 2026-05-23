"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, WashingMachine, Anvil, Droplets, Wind, Sparkles } from "lucide-react";
import type { Service } from "@prisma/client";
import { Illustration } from "@/components/brand/illustrations";
import type { PosItem } from "@/components/admin/pos/item-grid";
import { cn } from "@/lib/utils";

export interface PosAddOn {
  id: string;
  name: string;
  scope: "PER_ITEM" | "PER_TICKET";
  pricingMode: "FLAT" | "PERCENTAGE";
  amount: number;
  appliesToServices: Service[];
}

export interface PosLineDraft {
  itemId: string;
  service: Service;
  quantity: number;
  negotiableUnitPrice: number;
  perItemAddOnIds: string[];
}

interface Props {
  open: boolean;
  item: PosItem | null;
  perItemAddOns: PosAddOn[];
  initial?: PosLineDraft;
  onClose: () => void;
  onSubmit: (draft: PosLineDraft) => void;
}

const SERVICE_TABS: Array<{ id: Service; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: "WASH", label: "Wash", Icon: WashingMachine },
  { id: "IRON", label: "Iron", Icon: Anvil },
  { id: "WASH_AND_IRON", label: "Wash & Iron", Icon: Droplets },
  { id: "DRY_CLEAN", label: "Dry clean", Icon: Wind },
];

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function priceForService(item: PosItem, service: Service): number | null {
  switch (service) {
    case "WASH": return item.washPrice;
    case "IRON": return item.ironPrice;
    case "WASH_AND_IRON":
      if (item.washAndIronPrice != null) return item.washAndIronPrice;
      if (item.washPrice != null && item.ironPrice != null) return item.washPrice + item.ironPrice;
      return null;
    case "DRY_CLEAN": return item.dryCleanPrice;
  }
}

function defaultService(item: PosItem): Service {
  if (item.washPrice != null) return "WASH";
  if (item.ironPrice != null) return "IRON";
  if (item.washAndIronPrice != null) return "WASH_AND_IRON";
  if (item.dryCleanPrice != null) return "DRY_CLEAN";
  return "WASH";
}

export function ItemConfigPanel({ open, item, perItemAddOns, initial, onClose, onSubmit }: Props) {
  const [service, setService] = useState<Service>("WASH");
  const [qty, setQty] = useState(1);
  const [negotPrice, setNegotPrice] = useState(0);
  const [addOnIds, setAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    if (!item) return;
    setService(initial?.service ?? defaultService(item));
    setQty(initial?.quantity ?? 1);
    setNegotPrice(initial?.negotiableUnitPrice ?? 0);
    setAddOnIds(initial?.perItemAddOnIds ?? []);
  }, [item?.id, initial?.itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isNeg = item?.unit === "NEGOTIABLE";
  const isSqm = item?.unit === "SQM";

  const calc = useMemo(() => {
    if (!item) return { unitPrice: 0, subtotal: 0, error: null as string | null };
    const unitPrice = isNeg ? Math.max(0, Math.floor(negotPrice || 0)) : priceForService(item, service) ?? 0;
    if (!isNeg && (priceForService(item, service) == null)) {
      return { unitPrice: 0, subtotal: 0, error: `${item.name} not offered for ${service.toLowerCase().replace("_", " ")}` };
    }
    let sub = unitPrice * qty;
    for (const aid of addOnIds) {
      const a = perItemAddOns.find((x) => x.id === aid);
      if (!a) continue;
      sub += a.pricingMode === "FLAT" ? a.amount * qty : Math.round((unitPrice * qty * a.amount) / 100);
    }
    return { unitPrice, subtotal: sub, error: null };
  }, [item, service, qty, negotPrice, addOnIds, perItemAddOns, isNeg]);

  function commit() {
    if (!item || calc.error || calc.subtotal <= 0) return;
    onSubmit({
      itemId: item.id,
      service,
      quantity: qty,
      negotiableUnitPrice: isNeg ? negotPrice : 0,
      perItemAddOnIds: addOnIds,
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[60] bg-[color-mix(in_oklab,#0B1226_40%,transparent)] backdrop-blur-sm transition-opacity duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-hidden={!open}
        aria-label="Configure item"
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-full max-w-[480px] flex-col border-l border-default bg-card shadow-[-24px_0_56px_-16px_rgb(11_18_38/0.22)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {item && (
          <>
            {/* Head */}
            <div className="flex items-start justify-between gap-3.5 px-6 pt-5">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[22px] font-bold leading-tight tracking-tight text-foreground">
                  {item.name}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {isNeg
                    ? "Negotiable — agree price at counter"
                    : isSqm
                      ? "Charged per square metre"
                      : "Charged per piece"}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground [&_svg]:h-4 [&_svg]:w-4"
              >
                <X />
              </button>
            </div>

            {/* Hero illustration */}
            <div className="flex justify-center px-6 pb-2 pt-3.5">
              <span className="flex h-[130px] w-[130px] items-center justify-center rounded-2xl bg-surface-muted text-navy-800 dark:text-brand-200">
                <Illustration name={item.illustration} size={110} />
              </span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-4">
              {/* Service tabs */}
              <section>
                <div className="mb-2.5 flex items-baseline justify-between">
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Service
                  </span>
                  {!isNeg && (
                    <span className="text-[11.5px] text-muted-foreground">Tap to pick — prices update live</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TABS.map(({ id, label, Icon }) => {
                    const sp = priceForService(item, id);
                    const unavailable = !isNeg && (sp == null || sp <= 0);
                    const active = service === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setService(id)}
                        disabled={unavailable}
                        title={unavailable ? `${label} not offered for ${item.name}` : ""}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-xl border px-3.5 py-3 text-left transition-all",
                          active
                            ? "border-brand-500 bg-brand-50 shadow-[0_0_0_3px_color-mix(in_oklab,#0EA5E9_18%,transparent)] dark:border-brand-400 dark:bg-brand-500/15"
                            : "border-default bg-surface hover:border-brand-300 hover:bg-surface-muted",
                          unavailable && "cursor-not-allowed opacity-40 hover:border-default hover:bg-surface"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5",
                            active
                              ? "bg-brand-500 text-white"
                              : "bg-surface-muted text-brand-700 dark:text-brand-300"
                          )}
                        >
                          <Icon />
                        </span>
                        <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
                        <span className="text-[11.5px] tabular-nums text-muted-foreground">
                          {isNeg
                            ? "—"
                            : unavailable
                              ? "n/a"
                              : `${formatNaira(sp ?? 0)}${isSqm ? "/sqm" : ""}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Qty / Negotiable price */}
              {isNeg ? (
                <section>
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Agreed price
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">Negotiated at the counter</span>
                  </div>
                  <div className="flex h-[52px] items-center gap-2 rounded-xl border border-default bg-surface px-3.5 transition-colors focus-within:border-brand-500">
                    <span className="font-semibold text-muted-foreground">₦</span>
                    <input
                      type="number"
                      min={0}
                      value={negotPrice || ""}
                      onChange={(e) => setNegotPrice(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full flex-1 border-0 bg-transparent text-[20px] font-bold tabular-nums text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                    />
                    <span className="text-[13px] text-muted-foreground">/ piece</span>
                  </div>
                  <div className="mt-4">
                    <QtyStepper qty={qty} setQty={setQty} />
                  </div>
                </section>
              ) : (
                <section>
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {isSqm ? "Square meters" : "Quantity"}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {isSqm ? "Measure at intake" : "Pieces"}
                    </span>
                  </div>
                  <QtyStepper qty={qty} setQty={setQty} />
                </section>
              )}

              {/* Add-ons */}
              {perItemAddOns.length > 0 && (
                <section>
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Add-ons
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">Per item</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {perItemAddOns.map((a) => {
                      const applicable = a.appliesToServices.length === 0 || a.appliesToServices.includes(service);
                      const on = addOnIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={!applicable}
                          onClick={() =>
                            setAddOnIds((ids) =>
                              ids.includes(a.id) ? ids.filter((x) => x !== a.id) : [...ids, a.id]
                            )
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] transition-all",
                            on
                              ? "border-brand-500 bg-brand-50 font-semibold text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-200"
                              : "border-default bg-surface text-foreground hover:border-brand-300 hover:bg-surface-muted",
                            !applicable && "cursor-not-allowed opacity-40"
                          )}
                        >
                          <Sparkles className="h-3 w-3" />
                          {a.name}
                          <span
                            className={cn(
                              "text-[11.5px] tabular-nums",
                              on ? "opacity-80" : "text-muted-foreground"
                            )}
                          >
                            {a.pricingMode === "FLAT" ? `+₦${a.amount}` : `+${a.amount}%`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {calc.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {calc.error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-default bg-card px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Line total
                </span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={calc.subtotal}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[22px] font-bold tabular-nums tracking-tight text-foreground"
                  >
                    {formatNaira(calc.subtotal)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={commit}
                disabled={!!calc.error || calc.subtotal <= 0}
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {initial ? "Update line" : "Add to ticket"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function QtyStepper({ qty, setQty }: { qty: number; setQty: (n: number | ((n: number) => number)) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-surface-muted p-1">
      <button
        type="button"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        disabled={qty <= 1}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-default bg-surface text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4"
      >
        <Minus />
      </button>
      <span className="min-w-[56px] text-center text-[20px] font-bold tabular-nums text-foreground">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => setQty((q) => q + 1)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-default bg-surface text-foreground transition-colors hover:bg-surface-muted [&_svg]:h-4 [&_svg]:w-4"
      >
        <Plus />
      </button>
    </div>
  );
}
