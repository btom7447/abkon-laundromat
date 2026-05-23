import type { AddOn, Branch, ItemType, Service } from "@prisma/client";

export type LineInput = {
  itemType: Pick<ItemType, "id" | "name" | "unit" | "washPrice" | "ironPrice" | "washAndIronPrice" | "dryCleanPrice">;
  service: Service;
  quantity: number; // pieces or sqm
  negotiableUnitPrice?: number | null;
  perItemAddOns: Pick<AddOn, "id" | "name" | "scope" | "pricingMode" | "amount">[];
};

export type ComputedLine = {
  itemTypeId: string;
  itemTypeName: string;
  unit: ItemType["unit"];
  service: Service;
  quantity: number;
  unitPrice: number;
  isNegotiable: boolean;
  lineSubtotal: number;
  addOns: { addOnId: string; name: string; amount: number }[];
};

export type ComputedTicketAddOn = {
  addOnId: string;
  name: string;
  pricingMode: AddOn["pricingMode"];
  rawAmount: number;
  computedAmount: number;
};

export type PriceCalculation = {
  lines: ComputedLine[];
  lineItemsSubtotal: number;
  perTicketAddOns: ComputedTicketAddOn[];
  perTicketAddOnsTotal: number;
  urgentSurcharge: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
};

export type PricingInput = {
  branch: Pick<Branch, "urgentSurchargeAmount" | "urgentSurchargeMode" | "maxDiscountPercent">;
  lines: LineInput[];
  perTicketAddOns: Pick<AddOn, "id" | "name" | "scope" | "pricingMode" | "amount">[];
  isUrgent: boolean;
  discountPercent: number; // 0..100
  enforceMaxDiscount?: boolean;
};

function pickServicePrice(item: LineInput["itemType"], service: Service): number | null {
  switch (service) {
    case "WASH":
      return item.washPrice;
    case "IRON":
      return item.ironPrice;
    case "WASH_AND_IRON": {
      // If a combined price is set, use it. Otherwise derive from wash + iron
      // (only if both individual services exist for the item).
      if (item.washAndIronPrice != null) return item.washAndIronPrice;
      if (item.washPrice != null && item.ironPrice != null) {
        return item.washPrice + item.ironPrice;
      }
      return null;
    }
    case "DRY_CLEAN":
      return item.dryCleanPrice;
  }
}

export function calculatePricing(input: PricingInput): PriceCalculation {
  // 1. Lines
  const lines: ComputedLine[] = input.lines.map((line) => {
    const isNegotiable = line.itemType.unit === "NEGOTIABLE";
    let unitPrice: number;

    if (isNegotiable) {
      unitPrice = Math.max(0, Math.floor(line.negotiableUnitPrice ?? 0));
    } else {
      const configured = pickServicePrice(line.itemType, line.service);
      if (configured == null) {
        throw new Error(
          `${line.itemType.name} is not configured for ${line.service.toLowerCase().replace("_", " ")}`
        );
      }
      unitPrice = configured;
    }

    const qty = Math.max(0, Math.floor(line.quantity));
    let lineSubtotal = unitPrice * qty;

    const addOns = line.perItemAddOns.map((a) => {
      // Per-item add-ons: FLAT = ₦ × qty, PERCENTAGE = % of (unitPrice × qty)
      const amount =
        a.pricingMode === "FLAT"
          ? a.amount * qty
          : Math.round((unitPrice * qty * a.amount) / 100);
      lineSubtotal += amount;
      return { addOnId: a.id, name: a.name, amount };
    });

    return {
      itemTypeId: line.itemType.id,
      itemTypeName: line.itemType.name,
      unit: line.itemType.unit,
      service: line.service,
      quantity: qty,
      unitPrice,
      isNegotiable,
      lineSubtotal,
      addOns,
    };
  });

  const lineItemsSubtotal = lines.reduce((sum, l) => sum + l.lineSubtotal, 0);

  // 2. Per-ticket add-ons (computed against lineItemsSubtotal)
  const perTicketAddOns: ComputedTicketAddOn[] = input.perTicketAddOns.map((a) => {
    const computedAmount =
      a.pricingMode === "FLAT"
        ? a.amount
        : Math.round((lineItemsSubtotal * a.amount) / 100);
    return {
      addOnId: a.id,
      name: a.name,
      pricingMode: a.pricingMode,
      rawAmount: a.amount,
      computedAmount,
    };
  });
  const perTicketAddOnsTotal = perTicketAddOns.reduce((s, a) => s + a.computedAmount, 0);

  // 3. Urgent surcharge
  const urgentSurcharge = input.isUrgent
    ? input.branch.urgentSurchargeMode === "FLAT"
      ? input.branch.urgentSurchargeAmount
      : Math.round(((lineItemsSubtotal + perTicketAddOnsTotal) * input.branch.urgentSurchargeAmount) / 100)
    : 0;

  // 4. Discount
  const cappedDiscountPercent = input.enforceMaxDiscount
    ? Math.min(input.discountPercent, input.branch.maxDiscountPercent)
    : Math.max(0, Math.min(100, input.discountPercent));

  const preDiscountTotal = lineItemsSubtotal + perTicketAddOnsTotal + urgentSurcharge;
  const discountAmount = Math.round((preDiscountTotal * cappedDiscountPercent) / 100);

  const grandTotal = Math.max(0, preDiscountTotal - discountAmount);

  return {
    lines,
    lineItemsSubtotal,
    perTicketAddOns,
    perTicketAddOnsTotal: perTicketAddOnsTotal + urgentSurcharge,
    urgentSurcharge,
    discountPercent: cappedDiscountPercent,
    discountAmount,
    grandTotal,
  };
}
