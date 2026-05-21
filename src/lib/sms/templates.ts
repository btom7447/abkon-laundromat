import type { Service } from "@prisma/client";
import { formatNaira, formatDateOnly } from "@/lib/utils";

export type IntakeLine = {
  itemName: string;
  service: Service;
  quantity: number;
  unitLabel: string; // "pieces" | "sqm"
  subtotal: number;
};

export type IntakeSummaryInput = {
  customerName: string;
  ticketNumber: string;
  lines: IntakeLine[];
  perTicketAddOns: { name: string; amount: number }[];
  discountAmount: number;
  grandTotal: number;
  pickupDate: Date;
  paid: boolean;
};

const SERVICE_LABEL: Record<Service, string> = {
  WASH: "wash",
  IRON: "iron",
  DRY_CLEAN: "dry-clean",
};

export function renderIntakeSummary(input: IntakeSummaryInput): string {
  const lines: string[] = [
    `Abkon Laundromat — Ticket ${input.ticketNumber}`,
    `Hi ${input.customerName.split(" ")[0]}, we've received your laundry.`,
    ``,
    `Items:`,
  ];

  for (const line of input.lines) {
    lines.push(
      `• ${line.quantity} ${line.unitLabel} × ${line.itemName} (${SERVICE_LABEL[line.service]}) — ${formatNaira(line.subtotal)}`
    );
  }

  for (const addOn of input.perTicketAddOns) {
    lines.push(`• ${addOn.name} — ${formatNaira(addOn.amount)}`);
  }

  if (input.discountAmount > 0) {
    lines.push(`• Discount: −${formatNaira(input.discountAmount)}`);
  }

  lines.push(``);
  lines.push(`Total: ${formatNaira(input.grandTotal)} (${input.paid ? "PAID" : "due on collection"})`);
  lines.push(`Pickup from: ${formatDateOnly(input.pickupDate)}`);
  lines.push(``);
  lines.push(`Keep this ticket number for pickup.`);

  return lines.join("\n");
}

export function renderReadyNotification(input: {
  customerName: string;
  ticketNumber: string;
  grandTotal: number;
  paid: boolean;
}): string {
  const balance = input.paid
    ? `Already paid in full.`
    : `Balance due on collection: ${formatNaira(input.grandTotal)}.`;
  return [
    `Abkon Laundromat — Ticket ${input.ticketNumber}`,
    `Hi ${input.customerName.split(" ")[0]}, your laundry is ready for pickup.`,
    balance,
    `Show this ticket number at reception.`,
  ].join("\n");
}

export function renderReminder(input: {
  customerName: string;
  ticketNumber: string;
  daysSinceReady: number;
}): string {
  return [
    `Abkon Laundromat — Ticket ${input.ticketNumber}`,
    `Hi ${input.customerName.split(" ")[0]}, your laundry has been ready for ${input.daysSinceReady} day${input.daysSinceReady === 1 ? "" : "s"}.`,
    `Please come collect when you can — show this ticket number at reception.`,
  ].join("\n");
}
