"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const reconcileSchema = z.object({
  branchId: z.string().min(1),
  date: z.string().min(1), // YYYY-MM-DD
  countedCash: z.coerce.number().int().min(0).max(1_000_000_000),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type ReconcileState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function reconcileCashAction(
  _prev: ReconcileState,
  formData: FormData
): Promise<ReconcileState> {
  const actor = await requireSession();
  const parsed = reconcileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  assertCanAccessBranch(actor, data.branchId);

  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const agg = await db.ticket.aggregate({
    where: {
      branchId: data.branchId,
      paymentStatus: "PAID",
      paidAt: { gte: date, lte: endOfDay },
    },
    _sum: { grandTotal: true },
  });
  const expected = agg._sum.grandTotal ?? 0;
  const discrepancy = data.countedCash - expected;

  const before = await db.cashReconciliation.findUnique({
    where: { branchId_date: { branchId: data.branchId, date } },
  });

  const saved = await db.cashReconciliation.upsert({
    where: { branchId_date: { branchId: data.branchId, date } },
    update: {
      expectedCash: expected,
      countedCash: data.countedCash,
      discrepancy,
      reconciledById: actor.id,
      notes: data.notes || null,
      reconciledAt: new Date(),
    },
    create: {
      branchId: data.branchId,
      date,
      expectedCash: expected,
      countedCash: data.countedCash,
      discrepancy,
      reconciledById: actor.id,
      notes: data.notes || null,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: before ? "cash_reconciliation_updated" : "cash_reconciliation_created",
    entityType: "cash_reconciliation",
    entityId: saved.id,
    beforeState: before
      ? { countedCash: before.countedCash, discrepancy: before.discrepancy }
      : null,
    afterState: { countedCash: saved.countedCash, discrepancy: saved.discrepancy, expected },
  });

  revalidatePath("/admin/cash");
  return { success: true };
}
