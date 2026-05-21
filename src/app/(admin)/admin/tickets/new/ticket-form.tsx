"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, AlertCircle, Copy } from "lucide-react";
import type { Service } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerPicker, type SelectedCustomer } from "@/components/admin/customer-picker";
import { formatNaira } from "@/lib/utils";
import { createTicketAction } from "@/server/actions/tickets";

type ItemConfig = {
  id: string;
  name: string;
  unit: "PIECE" | "SQM" | "NEGOTIABLE";
  washPrice: number | null;
  ironPrice: number | null;
  dryCleanPrice: number | null;
};

type AddOnConfig = {
  id: string;
  name: string;
  scope: "PER_ITEM" | "PER_TICKET";
  pricingMode: "FLAT" | "PERCENTAGE";
  amount: number;
  appliesToServices: Service[];
};

interface Props {
  branchId: string;
  branchCode: string;
  branchName: string;
  urgentSurchargeAmount: number;
  urgentSurchargeMode: "FLAT" | "PERCENTAGE";
  maxDiscountPercent: number;
  homeDeliveryFee: number;
  items: ItemConfig[];
  addOns: AddOnConfig[];
  isAdmin: boolean;
}

type LineState = {
  tempId: string;
  itemTypeId: string;
  service: Service;
  quantity: number;
  negotiableUnitPrice: number;
  perItemAddOnIds: string[];
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultPickup(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function priceForService(item: ItemConfig, service: Service): number | null {
  switch (service) {
    case "WASH": return item.washPrice;
    case "IRON": return item.ironPrice;
    case "DRY_CLEAN": return item.dryCleanPrice;
  }
}

export function TicketForm(props: Props) {
  const router = useRouter();
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null);
  const [lines, setLines] = useState<LineState[]>([]);
  const [perTicketAddOnIds, setPerTicketAddOnIds] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [pickupDate, setPickupDate] = useState<string>(defaultPickup(2));
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const perItemAddOns = props.addOns.filter((a) => a.scope === "PER_ITEM");
  const perTicketAddOns = props.addOns.filter((a) => a.scope === "PER_TICKET");
  const itemMap = useMemo(() => new Map(props.items.map((i) => [i.id, i])), [props.items]);
  const addOnMap = useMemo(() => new Map(props.addOns.map((a) => [a.id, a])), [props.addOns]);

  // Live pricing (mirrors server logic)
  const calc = useMemo(() => {
    let lineSubtotal = 0;
    const lineBreakdown = lines.map((ln) => {
      const item = itemMap.get(ln.itemTypeId);
      if (!item) return { subtotal: 0, error: "Pick an item" };
      const isNegotiable = item.unit === "NEGOTIABLE";
      const unitPrice = isNegotiable
        ? Math.max(0, Math.floor(ln.negotiableUnitPrice || 0))
        : priceForService(item, ln.service);
      if (unitPrice == null) {
        return { subtotal: 0, error: `${item.name} not available for ${ln.service.toLowerCase().replace("_", " ")}` };
      }
      let sub = unitPrice * ln.quantity;
      for (const aid of ln.perItemAddOnIds) {
        const a = addOnMap.get(aid);
        if (!a) continue;
        sub += a.pricingMode === "FLAT"
          ? a.amount * ln.quantity
          : Math.round((unitPrice * ln.quantity * a.amount) / 100);
      }
      lineSubtotal += sub;
      return { subtotal: sub, error: null as string | null };
    });

    let perTicketTotal = 0;
    for (const aid of perTicketAddOnIds) {
      const a = addOnMap.get(aid);
      if (!a) continue;
      perTicketTotal += a.pricingMode === "FLAT"
        ? a.amount
        : Math.round((lineSubtotal * a.amount) / 100);
    }

    const urgentSurcharge = isUrgent
      ? props.urgentSurchargeMode === "FLAT"
        ? props.urgentSurchargeAmount
        : Math.round(((lineSubtotal + perTicketTotal) * props.urgentSurchargeAmount) / 100)
      : 0;

    const cappedDiscount = props.isAdmin
      ? Math.max(0, Math.min(100, discountPercent))
      : Math.min(discountPercent, props.maxDiscountPercent);

    const pre = lineSubtotal + perTicketTotal + urgentSurcharge;
    const discountAmount = Math.round((pre * cappedDiscount) / 100);
    const grandTotal = Math.max(0, pre - discountAmount);

    return {
      lineBreakdown,
      lineSubtotal,
      perTicketTotal,
      urgentSurcharge,
      discountPercent: cappedDiscount,
      discountAmount,
      grandTotal,
    };
  }, [lines, perTicketAddOnIds, isUrgent, discountPercent, itemMap, addOnMap, props]);

  const canSubmit =
    !!customer &&
    lines.length > 0 &&
    lines.every((l) => l.itemTypeId && l.quantity > 0) &&
    calc.lineBreakdown.every((l) => !l.error);

  function addLine() {
    setLines((ls) => [
      ...ls,
      { tempId: randomId(), itemTypeId: "", service: "WASH", quantity: 1, negotiableUnitPrice: 0, perItemAddOnIds: [] },
    ]);
  }

  function duplicateLine(idx: number) {
    setLines((ls) => {
      const src = ls[idx];
      if (!src) return ls;
      const copy = { ...src, tempId: randomId() };
      return [...ls.slice(0, idx + 1), copy, ...ls.slice(idx + 1)];
    });
  }

  function updateLine(idx: number, patch: Partial<LineState>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  function submit() {
    if (!customer) return;
    setError(null);
    const payload = {
      branchId: props.branchId,
      customerId: customer.id,
      lines: lines.map((l) => {
        const item = itemMap.get(l.itemTypeId);
        return {
          itemTypeId: l.itemTypeId,
          service: l.service,
          quantity: l.quantity,
          negotiableUnitPrice: item?.unit === "NEGOTIABLE" ? l.negotiableUnitPrice : null,
          perItemAddOnIds: l.perItemAddOnIds,
        };
      }),
      perTicketAddOnIds,
      isUrgent,
      pickupDate,
      discountPercent: calc.discountPercent,
      discountReason: discountReason.trim() || undefined,
      paymentReceived,
    };

    startSubmit(async () => {
      const result = await createTicketAction(JSON.stringify(payload));
      if (result.ok) {
        router.push(`/admin/tickets/${result.ticketId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPicker branchId={props.branchId} value={customer} onChange={setCustomer} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              No items yet. Click <strong>Add item</strong> to start.
            </div>
          )}
          {lines.map((line, idx) => {
            const item = itemMap.get(line.itemTypeId);
            const isNegotiable = item?.unit === "NEGOTIABLE";
            const isSqm = item?.unit === "SQM";
            const lineCalc = calc.lineBreakdown[idx];

            return (
              <div key={line.tempId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                  <div>
                    <Label>Item</Label>
                    <Select
                      value={line.itemTypeId}
                      onChange={(e) => updateLine(idx, { itemTypeId: e.target.value })}
                    >
                      <option value="">— Select item —</option>
                      {props.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} {it.unit === "SQM" ? "(per sqm)" : it.unit === "NEGOTIABLE" ? "(neg.)" : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Service</Label>
                    <Select
                      value={line.service}
                      onChange={(e) => updateLine(idx, { service: e.target.value as Service })}
                    >
                      <option value="WASH">Wash</option>
                      <option value="IRON">Iron</option>
                      <option value="DRY_CLEAN">Dry clean</option>
                    </Select>
                  </div>
                  <div>
                    <Label>{isSqm ? "Sqm" : "Quantity"}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </div>
                </div>

                {isNegotiable && (
                  <div className="mt-3">
                    <Label>Negotiated unit price (₦)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={line.negotiableUnitPrice}
                      onChange={(e) => updateLine(idx, { negotiableUnitPrice: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </div>
                )}

                {perItemAddOns.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Per-item add-ons</div>
                    <div className="flex flex-wrap gap-2">
                      {perItemAddOns.map((a) => {
                        const applicable =
                          a.appliesToServices.length === 0 || a.appliesToServices.includes(line.service);
                        const checked = line.perItemAddOnIds.includes(a.id);
                        return (
                          <label
                            key={a.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                              checked
                                ? "border-brand-500 bg-brand-50 text-brand-800"
                                : "border-slate-300 bg-white text-slate-700"
                            } ${applicable ? "" : "opacity-40"}`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              disabled={!applicable}
                              checked={checked}
                              onChange={(e) => {
                                const ids = e.target.checked
                                  ? [...line.perItemAddOnIds, a.id]
                                  : line.perItemAddOnIds.filter((id) => id !== a.id);
                                updateLine(idx, { perItemAddOnIds: ids });
                              }}
                            />
                            {a.name}
                            <span className="text-[10px] text-slate-500">
                              {a.pricingMode === "FLAT" ? `+₦${a.amount}` : `+${a.amount}%`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <button type="button" onClick={() => duplicateLine(idx)} className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900">
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                    <button type="button" onClick={() => removeLine(idx)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                  <div className="text-right">
                    {lineCalc?.error ? (
                      <span className="text-xs text-red-600">{lineCalc.error}</span>
                    ) : (
                      <span className="text-sm font-medium text-slate-900">{formatNaira(lineCalc?.subtotal ?? 0)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add-ons & options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {perTicketAddOns.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Per-ticket add-ons</div>
              <div className="flex flex-wrap gap-2">
                {perTicketAddOns.map((a) => {
                  const checked = perTicketAddOnIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                        checked
                          ? "border-brand-500 bg-brand-50 text-brand-800"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          setPerTicketAddOnIds((ids) =>
                            e.target.checked ? [...ids, a.id] : ids.filter((id) => id !== a.id)
                          );
                        }}
                      />
                      {a.name}
                      <span className="text-xs text-slate-500">
                        {a.pricingMode === "FLAT" ? `+₦${a.amount}` : `+${a.amount}%`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup date</Label>
              <Input
                id="pickup"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
              <p className="text-xs text-slate-500">Standard SLA: 2 days. Urgent: 1 day.</p>
            </div>

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-900">Urgent (1-day)</div>
                  <div className="text-xs text-slate-500">
                    +{props.urgentSurchargeMode === "FLAT"
                      ? formatNaira(props.urgentSurchargeAmount)
                      : `${props.urgentSurchargeAmount}%`}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => {
                    setIsUrgent(e.target.checked);
                    if (e.target.checked) setPickupDate(defaultPickup(1));
                    else setPickupDate(defaultPickup(2));
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <div className="space-y-1.5">
              <Label htmlFor="discount">
                Discount % {!props.isAdmin && (
                  <span className="text-xs text-slate-500">(max {props.maxDiscountPercent}%)</span>
                )}
              </Label>
              <Input
                id="discount"
                type="number"
                min={0}
                max={props.isAdmin ? 100 : props.maxDiscountPercent}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Discount reason {discountPercent > 0 && <span className="text-red-500">*</span>}</Label>
              <Input
                id="reason"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="e.g. loyalty, complaint resolution"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={paymentReceived}
              onChange={(e) => setPaymentReceived(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="text-sm font-medium text-slate-900">Payment received at intake</span>
              <span className="block text-xs text-slate-500">Mark this if the customer paid upfront.</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SummaryRow label="Items subtotal" value={formatNaira(calc.lineSubtotal)} />
          {calc.perTicketTotal - calc.urgentSurcharge > 0 && (
            <SummaryRow label="Per-ticket add-ons" value={formatNaira(calc.perTicketTotal - calc.urgentSurcharge)} />
          )}
          {calc.urgentSurcharge > 0 && (
            <SummaryRow label="Urgent surcharge" value={formatNaira(calc.urgentSurcharge)} />
          )}
          {calc.discountAmount > 0 && (
            <SummaryRow label={`Discount (${calc.discountPercent}%)`} value={`−${formatNaira(calc.discountAmount)}`} negative />
          )}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-base font-semibold text-slate-900">Grand total</span>
            <span className="text-xl font-bold text-slate-900">{formatNaira(calc.grandTotal)}</span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Badge variant={paymentReceived ? "success" : "warning"}>
              {paymentReceived ? "Will be marked PAID" : "Due on collection"}
            </Badge>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              size="lg"
              disabled={!canSubmit || submitting}
              onClick={submit}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating ticket…" : "Create ticket"}
            </Button>
            <div className="text-xs text-slate-500">
              SMS will be sent to {customer?.phone ?? "the customer"}.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={negative ? "text-red-600" : "text-slate-900"}>{value}</span>
    </div>
  );
}
