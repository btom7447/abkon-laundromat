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

/**
 * Intake SMS — single GSM-7 segment (≤160 ASCII chars). We avoid em dash, ₦,
 * and bullets because any one of them flips Termii to UCS-2 (70 chars/segment).
 * Naira amount is rendered as "NGN 2,000" and the date as the medium locale
 * format ("25 May 2026") to stay within the budget.
 */
export function renderIntakeSummary(input: IntakeSummaryInput): string {
  const totalLabel = input.paid ? "paid in full" : "due on collection";
  const totalStr = input.grandTotal.toLocaleString("en-NG");
  return `Abkon Laundromat: Order received. Ticket ${input.ticketNumber}. Total NGN ${totalStr} ${totalLabel}. Pickup ${formatDateOnly(input.pickupDate)}. Keep this ticket for pickup.`;
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

/**
 * Password reset OTP — ASCII-only single GSM-7 segment so Termii ships one
 * billable unit regardless of phone provider.
 */
export function renderPasswordResetCode(input: {
  code: string;
  minutesValid: number;
}): string {
  return `Abkon Laundromat: Your password reset code is ${input.code}. It expires in ${input.minutesValid} minutes. Do not share this code.`;
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
