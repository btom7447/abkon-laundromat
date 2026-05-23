"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Service, AddOnScope, PricingMode } from "@prisma/client";
import type { PosCategoryId } from "@/lib/pos-categories";
import { CustomerBar, type PosCustomer } from "@/components/admin/pos/customer-bar";
import { CategoriesSidebar } from "@/components/admin/pos/categories-sidebar";
import { ItemGrid, type PosItem } from "@/components/admin/pos/item-grid";
import {
  ItemConfigPanel,
  type PosAddOn,
  type PosLineDraft,
} from "@/components/admin/pos/item-config-panel";
import { LiveCart, type CartLine, type ComputedLine } from "@/components/admin/pos/live-cart";
import { SuccessView } from "@/components/admin/pos/success-view";
import { createTicketAction } from "@/server/actions/tickets";

interface BranchInfo {
  id: string;
  name: string;
  code: string;
  urgentSurchargeAmount: number;
  urgentSurchargeMode: PricingMode;
  maxDiscountPercent: number;
}

interface Props {
  branch: BranchInfo;
  items: PosItem[];
  perItemAddOns: PosAddOn[];
  perTicketAddOns: PosAddOn[];
  isAdmin: boolean;
}

function tempId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultPickup(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
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

export function PosBoard({ branch, items, perItemAddOns, perTicketAddOns, isAdmin }: Props) {
  const router = useRouter();

  // Domain state
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [perTicketAddOnIds, setPerTicketAddOnIds] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [pickupDate, setPickupDate] = useState(defaultPickup(2));
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentReceived, setPaymentReceived] = useState(false);

  // UI state
  const [category, setCategory] = useState<PosCategoryId>("all");
  const [search, setSearch] = useState("");
  const [configItem, setConfigItem] = useState<PosItem | null>(null);
  const [editingLine, setEditingLine] = useState<CartLine | null>(null);
  const [success, setSuccess] = useState<{
    ticketId: string;
    ticketNumber: string;
    customerName: string;
    itemCount: number;
    grandTotal: number;
    pickupDate: Date;
    paid: boolean;
  } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  // Mobile drawer state — categories left drawer, cart bottom sheet
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  // Desktop collapse for the catalog sidebar — localStorage-backed
  const [catsCollapsed, setCatsCollapsed] = useState(false);
  const [catsMounted, setCatsMounted] = useState(false);
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("abkon_pos_cats_collapsed") : null;
    if (stored === "1") setCatsCollapsed(true);
    setCatsMounted(true);
  }, []);
  useEffect(() => {
    if (catsMounted) localStorage.setItem("abkon_pos_cats_collapsed", catsCollapsed ? "1" : "0");
  }, [catsCollapsed, catsMounted]);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const addOnMap = useMemo(
    () => new Map<string, PosAddOn>([...perItemAddOns, ...perTicketAddOns].map((a) => [a.id, a])),
    [perItemAddOns, perTicketAddOns]
  );

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const inCat = category === "all" || it.category === category;
      if (!inCat) return false;
      if (!q) return true;
      return it.name.toLowerCase().includes(q);
    });
  }, [items, category, search]);

  // Live pricing
  const calc = useMemo(() => {
    let lineSubtotal = 0;
    const computedLines: ComputedLine[] = lines.map((ln) => {
      const it = itemMap.get(ln.itemId);
      if (!it) return { unitPrice: 0, subtotal: 0, error: "Item not found" };
      const isNeg = it.unit === "NEGOTIABLE";
      const unitPrice = isNeg ? Math.max(0, Math.floor(ln.negotiableUnitPrice || 0)) : priceForService(it, ln.service);
      if (unitPrice == null) {
        return { unitPrice: 0, subtotal: 0, error: `${it.name} not offered for ${ln.service.toLowerCase().replace("_", " ")}` };
      }
      let sub = unitPrice * ln.quantity;
      for (const aid of ln.perItemAddOnIds) {
        const a = addOnMap.get(aid);
        if (!a) continue;
        sub +=
          a.pricingMode === "FLAT"
            ? a.amount * ln.quantity
            : Math.round((unitPrice * ln.quantity * a.amount) / 100);
      }
      lineSubtotal += sub;
      return { unitPrice, subtotal: sub, error: null };
    });

    let perTicketTotal = 0;
    for (const aid of perTicketAddOnIds) {
      const a = addOnMap.get(aid);
      if (!a) continue;
      perTicketTotal += a.pricingMode === "FLAT" ? a.amount : Math.round((lineSubtotal * a.amount) / 100);
    }

    const urgentSurcharge = isUrgent
      ? branch.urgentSurchargeMode === "FLAT"
        ? branch.urgentSurchargeAmount
        : Math.round(((lineSubtotal + perTicketTotal) * branch.urgentSurchargeAmount) / 100)
      : 0;

    const cappedDiscount = isAdmin
      ? Math.max(0, Math.min(100, discountPercent))
      : Math.min(discountPercent, branch.maxDiscountPercent);

    const pre = lineSubtotal + perTicketTotal + urgentSurcharge;
    const discountAmount = Math.round((pre * cappedDiscount) / 100);
    const grandTotal = Math.max(0, pre - discountAmount);

    return {
      computedLines,
      lineSubtotal,
      perTicketAddOnsTotal: perTicketTotal + urgentSurcharge,
      urgentSurcharge,
      discountPercent: cappedDiscount,
      discountAmount,
      grandTotal,
    };
  }, [lines, perTicketAddOnIds, isUrgent, discountPercent, addOnMap, itemMap, branch, isAdmin]);

  const canSubmit =
    !!customer &&
    lines.length > 0 &&
    calc.computedLines.every((l) => !l.error) &&
    (discountPercent === 0 || discountReason.trim().length > 0);

  function cartQtyFor(itemId: string): number {
    return lines.filter((l) => l.itemId === itemId).reduce((s, l) => s + l.quantity, 0);
  }

  function openItem(it: PosItem) {
    setEditingLine(null);
    setConfigItem(it);
  }

  function openEditLine(line: CartLine) {
    const it = itemMap.get(line.itemId);
    if (!it) return;
    setEditingLine(line);
    setConfigItem(it);
  }

  function closeConfig() {
    setConfigItem(null);
    setEditingLine(null);
  }

  function commitLine(draft: PosLineDraft) {
    if (editingLine) {
      setLines((ls) => ls.map((l) => (l.tempId === editingLine.tempId ? { ...l, ...draft } : l)));
      showToast("Line updated");
    } else {
      setLines((ls) => [...ls, { ...draft, tempId: tempId() }]);
      const item = itemMap.get(draft.itemId);
      showToast(`Added ${draft.quantity} × ${item?.name ?? "item"}`);
    }
    closeConfig();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }

  function toggleUrgent(v: boolean) {
    setIsUrgent(v);
    setPickupDate(defaultPickup(v ? 1 : 2));
  }

  function reset() {
    setCustomer(null);
    setLines([]);
    setPerTicketAddOnIds([]);
    setIsUrgent(false);
    setPickupDate(defaultPickup(2));
    setDiscountPercent(0);
    setDiscountReason("");
    setPaymentReceived(false);
    setCategory("all");
    setSearch("");
    setSuccess(null);
    setErrorBanner(null);
  }

  function submit() {
    if (!canSubmit || !customer) return;
    setErrorBanner(null);
    const payload = {
      branchId: branch.id,
      customerId: customer.id,
      lines: lines.map((l) => ({
        itemTypeId: l.itemId,
        service: l.service,
        quantity: l.quantity,
        negotiableUnitPrice: itemMap.get(l.itemId)?.unit === "NEGOTIABLE" ? l.negotiableUnitPrice : null,
        perItemAddOnIds: l.perItemAddOnIds,
      })),
      perTicketAddOnIds,
      isUrgent,
      pickupDate,
      discountPercent: calc.discountPercent,
      discountReason: discountReason.trim() || undefined,
      paymentReceived,
    };
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

    startSubmit(async () => {
      const res = await createTicketAction(JSON.stringify(payload));
      if (res.ok) {
        setSuccess({
          ticketId: res.ticketId,
          ticketNumber: res.ticketNumber,
          customerName: customer.name,
          itemCount,
          grandTotal: calc.grandTotal,
          pickupDate: new Date(pickupDate),
          paid: paymentReceived,
        });
        router.refresh();
      } else {
        setErrorBanner(res.error);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <CustomerBar branchId={branch.id} value={customer} onChange={setCustomer} />

      {errorBanner && (
        <div className="px-4 pt-3 md:px-6">
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {errorBanner}
          </div>
        </div>
      )}

      <div
        className={
          "relative flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[0_1fr_320px] " +
          "md:transition-[grid-template-columns] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)] " +
          (catsCollapsed
            ? "lg:grid-cols-[64px_1fr_360px] xl:grid-cols-[64px_1fr_380px]"
            : "lg:grid-cols-[180px_1fr_360px] xl:grid-cols-[200px_1fr_380px]")
        }
      >
        <CategoriesSidebar
          items={items}
          active={category}
          onSelect={(id) => {
            setCategory(id);
            setMobileCatsOpen(false);
          }}
          collapsed={catsCollapsed}
          onToggleCollapse={() => setCatsCollapsed((c) => !c)}
          mobileOpen={mobileCatsOpen}
          onMobileClose={() => setMobileCatsOpen(false)}
        />
        <ItemGrid
          items={visibleItems}
          category={category}
          search={search}
          onSearchChange={setSearch}
          onItemClick={openItem}
          cartQty={cartQtyFor}
          onOpenMobileCats={() => setMobileCatsOpen(true)}
          onOpenMobileCart={() => setMobileCartOpen(true)}
          cartCount={lines.reduce((s, l) => s + l.quantity, 0)}
        />
        <LiveCart
          mobileOpen={mobileCartOpen}
          onMobileClose={() => setMobileCartOpen(false)}
          customer={customer}
          lines={lines}
          items={items}
          perTicketAddOns={perTicketAddOns}
          addOnMap={addOnMap}
          selectedPerTicketAddOnIds={perTicketAddOnIds}
          onTogglePerTicketAddOn={(id) =>
            setPerTicketAddOnIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
          }
          isUrgent={isUrgent}
          onToggleUrgent={toggleUrgent}
          urgentSurchargeAmount={branch.urgentSurchargeAmount}
          urgentSurchargeMode={branch.urgentSurchargeMode}
          pickupDate={pickupDate}
          onPickupDateChange={setPickupDate}
          discountPercent={discountPercent}
          discountReason={discountReason}
          onDiscountChange={setDiscountPercent}
          onDiscountReasonChange={setDiscountReason}
          maxDiscount={isAdmin ? 100 : branch.maxDiscountPercent}
          paymentReceived={paymentReceived}
          onPaymentReceivedChange={setPaymentReceived}
          computedLines={calc.computedLines}
          lineSubtotal={calc.lineSubtotal}
          perTicketAddOnsTotal={calc.perTicketAddOnsTotal}
          urgentSurcharge={calc.urgentSurcharge}
          discountAmount={calc.discountAmount}
          grandTotal={calc.grandTotal}
          onEditLine={openEditLine}
          onUpdateQty={(id, q) => setLines((ls) => ls.map((l) => (l.tempId === id ? { ...l, quantity: q } : l)))}
          onRemoveLine={(id) => setLines((ls) => ls.filter((l) => l.tempId !== id))}
          onSubmit={submit}
          submitting={submitting}
          canSubmit={canSubmit && !submitting}
        />
      </div>

      <ItemConfigPanel
        open={!!configItem}
        item={configItem}
        perItemAddOns={perItemAddOns}
        initial={editingLine ?? undefined}
        onClose={closeConfig}
        onSubmit={commitLine}
      />

      {success && (
        <SuccessView
          ticketId={success.ticketId}
          ticketNumber={success.ticketNumber}
          customerName={success.customerName}
          itemCount={success.itemCount}
          grandTotal={success.grandTotal}
          pickupDate={success.pickupDate}
          paid={success.paid}
          onCreateAnother={reset}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            className="fixed bottom-6 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-lg [&_svg]:h-3.5 [&_svg]:w-3.5"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Check />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
