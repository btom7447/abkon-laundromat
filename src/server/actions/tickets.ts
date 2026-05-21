"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Service, TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { generateTicketNumber } from "@/lib/ticket-number";
import { calculatePricing, type LineInput } from "@/lib/ticket-pricing";
import { renderIntakeSummary, renderReadyNotification, type IntakeLine } from "@/lib/sms/templates";
import { queueAndSendSms } from "@/lib/sms/send";

const lineSchema = z.object({
  itemTypeId: z.string().min(1),
  service: z.enum(["WASH", "IRON", "DRY_CLEAN"]),
  quantity: z.coerce.number().int().min(1).max(10_000),
  negotiableUnitPrice: z.coerce.number().int().min(0).optional().nullable(),
  perItemAddOnIds: z.array(z.string()).default([]),
});

const payloadSchema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().min(1),
  lines: z.array(lineSchema).min(1, "Add at least one item"),
  perTicketAddOnIds: z.array(z.string()).default([]),
  isUrgent: z.boolean().default(false),
  pickupDate: z.string().min(1),
  discountPercent: z.coerce.number().int().min(0).max(100).default(0),
  discountReason: z.string().max(300).optional(),
  paymentReceived: z.boolean().default(false),
});

export type CreateTicketState =
  | { ok: true; ticketId: string; ticketNumber: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const SERVICE_UNIT_LABEL = (unit: "PIECE" | "SQM" | "NEGOTIABLE") =>
  unit === "SQM" ? "sqm" : "pieces";

export async function createTicketAction(
  payloadJson: string
): Promise<CreateTicketState> {
  const actor = await requireSession();

  let raw: unknown;
  try {
    raw = JSON.parse(payloadJson);
  } catch {
    return { ok: false, error: "Invalid payload." };
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  assertCanAccessBranch(actor, data.branchId);

  const [branch, customer, itemTypes, addOns] = await Promise.all([
    db.branch.findUnique({ where: { id: data.branchId } }),
    db.customer.findFirst({
      where: { id: data.customerId, branchId: data.branchId },
    }),
    db.itemType.findMany({
      where: {
        branchId: data.branchId,
        active: true,
        id: { in: data.lines.map((l) => l.itemTypeId) },
      },
    }),
    db.addOn.findMany({
      where: {
        branchId: data.branchId,
        active: true,
        id: {
          in: Array.from(
            new Set([
              ...data.perTicketAddOnIds,
              ...data.lines.flatMap((l) => l.perItemAddOnIds),
            ])
          ),
        },
      },
    }),
  ]);

  if (!branch) return { ok: false, error: "Branch not found." };
  if (!customer) return { ok: false, error: "Customer not found for this branch." };

  const itemMap = new Map(itemTypes.map((i) => [i.id, i]));
  const addOnMap = new Map(addOns.map((a) => [a.id, a]));

  // Validate line items match catalog + assemble pricing input
  const lineInputs: LineInput[] = [];
  for (const line of data.lines) {
    const item = itemMap.get(line.itemTypeId);
    if (!item) return { ok: false, error: `Item ${line.itemTypeId} is not available.` };

    const perItemAddOnObjs = line.perItemAddOnIds.map((id) => addOnMap.get(id)).filter(
      (x): x is NonNullable<typeof x> => x != null && x.scope === "PER_ITEM"
    );

    // Service applicability check
    for (const a of perItemAddOnObjs) {
      if (a.appliesToServices.length > 0 && !a.appliesToServices.includes(line.service)) {
        return {
          ok: false,
          error: `Add-on "${a.name}" doesn't apply to ${line.service.toLowerCase().replace("_", " ")}.`,
        };
      }
    }

    lineInputs.push({
      itemType: item,
      service: line.service as Service,
      quantity: line.quantity,
      negotiableUnitPrice: line.negotiableUnitPrice ?? null,
      perItemAddOns: perItemAddOnObjs,
    });
  }

  const perTicketAddOnObjs = data.perTicketAddOnIds
    .map((id) => addOnMap.get(id))
    .filter((x): x is NonNullable<typeof x> => x != null && x.scope === "PER_TICKET");

  let calc;
  try {
    calc = calculatePricing({
      branch,
      lines: lineInputs,
      perTicketAddOns: perTicketAddOnObjs,
      isUrgent: data.isUrgent,
      discountPercent: data.discountPercent,
      enforceMaxDiscount: actor.role !== "ADMIN",
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Pricing error." };
  }

  // Pickup date validation
  const pickup = new Date(data.pickupDate);
  if (Number.isNaN(pickup.getTime())) {
    return { ok: false, error: "Invalid pickup date." };
  }

  // Generate ticket number
  const tn = await generateTicketNumber(branch.id, branch.code);

  // Create everything in a single transaction
  const ticket = await db.$transaction(async (tx) => {
    const t = await tx.ticket.create({
      data: {
        ticketNumber: tn.ticketNumber,
        ticketBucket: tn.ticketBucket,
        ticketRandom: tn.ticketRandom,
        branchId: branch.id,
        customerId: customer.id,
        createdById: actor.id,
        source: "WALK_IN",
        status: "RECEIVED",
        receivedAt: new Date(),
        pickupDatePromised: pickup,
        isUrgent: data.isUrgent,
        lineItemsSubtotal: calc.lineItemsSubtotal,
        perTicketAddonsTotal: calc.perTicketAddOnsTotal,
        discountPercent: calc.discountPercent,
        discountAmount: calc.discountAmount,
        discountReason: data.discountReason || null,
        discountAppliedById: calc.discountAmount > 0 ? actor.id : null,
        grandTotal: calc.grandTotal,
        paymentStatus: data.paymentReceived ? "PAID" : "UNPAID",
        paidAt: data.paymentReceived ? new Date() : null,
        paidToId: data.paymentReceived ? actor.id : null,
      },
    });

    for (const line of calc.lines) {
      const created = await tx.ticketLineItem.create({
        data: {
          ticketId: t.id,
          itemTypeId: line.itemTypeId,
          itemTypeNameSnapshot: line.itemTypeName,
          service: line.service,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceSnapshot: line.unitPrice,
          isNegotiable: line.isNegotiable,
          lineSubtotal: line.lineSubtotal,
        },
      });
      for (const ao of line.addOns) {
        await tx.ticketLineItemAddOn.create({
          data: {
            ticketLineItemId: created.id,
            addOnId: ao.addOnId,
            addOnNameSnapshot: ao.name,
            addOnAmountSnapshot: ao.amount,
          },
        });
      }
    }

    for (const ao of calc.perTicketAddOns) {
      await tx.ticketAddOn.create({
        data: {
          ticketId: t.id,
          addOnId: ao.addOnId,
          addOnNameSnapshot: ao.name,
          addOnPricingModeSnapshot: ao.pricingMode,
          addOnAmountSnapshot: ao.rawAmount,
          computedAmount: ao.computedAmount,
        },
      });
    }

    // Urgent surcharge stored as a virtual TicketAddOn (without a real addOnId).
    if (calc.urgentSurcharge > 0) {
      await tx.ticketAddOn.create({
        data: {
          ticketId: t.id,
          addOnId: null,
          addOnNameSnapshot: data.isUrgent ? "Urgent (1-day)" : "Urgent",
          addOnPricingModeSnapshot: branch.urgentSurchargeMode,
          addOnAmountSnapshot: branch.urgentSurchargeAmount,
          computedAmount: calc.urgentSurcharge,
        },
      });
    }

    return t;
  });

  // Audit
  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: branch.id,
    action: "ticket_created",
    entityType: "ticket",
    entityId: ticket.id,
    afterState: {
      ticketNumber: ticket.ticketNumber,
      total: ticket.grandTotal,
      paymentStatus: ticket.paymentStatus,
      lineCount: calc.lines.length,
    },
  });

  if (calc.discountAmount > 0) {
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      branchId: branch.id,
      action: "discount_applied",
      entityType: "ticket",
      entityId: ticket.id,
      afterState: {
        ticketNumber: ticket.ticketNumber,
        discountPercent: calc.discountPercent,
        discountAmount: calc.discountAmount,
        reason: data.discountReason,
      },
    });
  }

  // SMS — fire-and-forget (logged to SmsLog regardless)
  const intakeLines: IntakeLine[] = calc.lines.map((l) => ({
    itemName: l.itemTypeName,
    service: l.service,
    quantity: l.quantity,
    unitLabel: SERVICE_UNIT_LABEL(l.unit),
    subtotal: l.lineSubtotal,
  }));
  const ticketAddOnsForSms = [
    ...calc.perTicketAddOns.map((a) => ({ name: a.name, amount: a.computedAmount })),
    ...(calc.urgentSurcharge > 0
      ? [{ name: "Urgent (1-day)", amount: calc.urgentSurcharge }]
      : []),
  ];
  const message = renderIntakeSummary({
    customerName: customer.name,
    ticketNumber: ticket.ticketNumber,
    lines: intakeLines,
    perTicketAddOns: ticketAddOnsForSms,
    discountAmount: calc.discountAmount,
    grandTotal: calc.grandTotal,
    pickupDate: pickup,
    paid: data.paymentReceived,
  });
  queueAndSendSms({
    ticketId: ticket.id,
    phone: customer.phone,
    message,
    type: "INTAKE_SUMMARY",
  }).catch((err) => console.error("[ticket] intake SMS error", err));

  revalidatePath("/admin/tickets");
  return { ok: true, ticketId: ticket.id, ticketNumber: ticket.ticketNumber };
}

// ───────────────────────────────────────────────────────────────────────────
// Status transitions
// ───────────────────────────────────────────────────────────────────────────

const transitionMap: Record<TicketStatus, TicketStatus[]> = {
  RECEIVED: ["READY", "CANCELLED"],
  READY: ["IN_STORAGE", "COLLECTED"],
  IN_STORAGE: ["COLLECTED"],
  COLLECTED: [],
  CANCELLED: [],
};

export async function transitionTicketStatus(input: {
  ticketId: string;
  nextStatus: TicketStatus;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireSession();
  const ticket = await db.ticket.findUnique({
    where: { id: input.ticketId },
    include: { customer: true, branch: true },
  });
  if (!ticket) return { ok: false, error: "Ticket not found." };
  assertCanAccessBranch(actor, ticket.branchId);

  if (!transitionMap[ticket.status].includes(input.nextStatus)) {
    return {
      ok: false,
      error: `Cannot move from ${ticket.status.toLowerCase()} to ${input.nextStatus.toLowerCase()}.`,
    };
  }

  if (input.nextStatus === "CANCELLED" && !input.reason) {
    return { ok: false, error: "Provide a cancellation reason." };
  }

  const updateData: Parameters<typeof db.ticket.update>[0]["data"] = {
    status: input.nextStatus,
  };
  const now = new Date();
  switch (input.nextStatus) {
    case "READY":
      updateData.readyAt = now;
      break;
    case "IN_STORAGE":
      updateData.inStorageAt = now;
      break;
    case "COLLECTED":
      updateData.collectedAt = now;
      break;
    case "CANCELLED":
      updateData.cancelledAt = now;
      updateData.cancellationReason = input.reason;
      break;
  }

  const updated = await db.ticket.update({ where: { id: ticket.id }, data: updateData });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: ticket.branchId,
    action: `ticket_${input.nextStatus.toLowerCase()}`,
    entityType: "ticket",
    entityId: ticket.id,
    beforeState: { status: ticket.status },
    afterState: { status: updated.status, reason: input.reason },
  });

  // Ready SMS
  if (input.nextStatus === "READY") {
    const message = renderReadyNotification({
      customerName: ticket.customer.name,
      ticketNumber: ticket.ticketNumber,
      grandTotal: ticket.grandTotal,
      paid: ticket.paymentStatus === "PAID",
    });
    queueAndSendSms({
      ticketId: ticket.id,
      phone: ticket.customer.phone,
      message,
      type: "READY_NOTIFICATION",
    }).catch((err) => console.error("[ticket] ready SMS error", err));
  }

  revalidatePath(`/admin/tickets/${ticket.id}`);
  revalidatePath(`/admin/tickets`);
  return { ok: true };
}

export async function markTicketPaid(ticketId: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireSession();
  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { ok: false, error: "Ticket not found." };
  assertCanAccessBranch(actor, ticket.branchId);
  if (ticket.paymentStatus === "PAID") return { ok: true };

  const updated = await db.ticket.update({
    where: { id: ticketId },
    data: { paymentStatus: "PAID", paidAt: new Date(), paidToId: actor.id },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: ticket.branchId,
    action: "ticket_paid",
    entityType: "ticket",
    entityId: ticket.id,
    beforeState: { paymentStatus: ticket.paymentStatus },
    afterState: { paymentStatus: updated.paymentStatus, amount: ticket.grandTotal },
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath(`/admin/tickets`);
  return { ok: true };
}

export async function gotoTicket(ticketId: string): Promise<never> {
  redirect(`/admin/tickets/${ticketId}`);
}
