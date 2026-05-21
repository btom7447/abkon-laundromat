"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const itemSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2).max(80),
  unit: z.enum(["PIECE", "SQM", "NEGOTIABLE"]),
  washPrice: z
    .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
    .optional(),
  ironPrice: z
    .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
    .optional(),
  dryCleanPrice: z
    .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
    .optional(),
  displayOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

export type ItemFormState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createItemAction(
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const actor = await requireSession();
  if (actor.role !== "ADMIN") return { error: "Only admin can manage items." };

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;

  const clash = await db.itemType.findUnique({
    where: { branchId_name: { branchId: data.branchId, name: data.name } },
  });
  if (clash) return { error: `Item "${data.name}" already exists in this branch.` };

  const item = await db.itemType.create({
    data: {
      branchId: data.branchId,
      name: data.name,
      unit: data.unit,
      washPrice: data.washPrice ?? null,
      ironPrice: data.ironPrice ?? null,
      dryCleanPrice: data.dryCleanPrice ?? null,
      displayOrder: data.displayOrder,
      active: data.active,
      updatedById: actor.id,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: "item_created",
    entityType: "item_type",
    entityId: item.id,
    afterState: item,
  });

  revalidatePath(`/admin/items`);
  redirect(`/admin/items?branch=${data.branchId}`);
}

export async function updateItemAction(
  itemId: string,
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const actor = await requireSession();
  if (actor.role !== "ADMIN") return { error: "Only admin can manage items." };

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;

  const before = await db.itemType.findUnique({ where: { id: itemId } });
  if (!before) return { error: "Item not found." };
  if (before.branchId !== data.branchId) return { error: "Cannot move items between branches." };

  if (data.name !== before.name) {
    const clash = await db.itemType.findUnique({
      where: { branchId_name: { branchId: data.branchId, name: data.name } },
    });
    if (clash && clash.id !== itemId) {
      return { error: `Item "${data.name}" already exists in this branch.` };
    }
  }

  const after = await db.itemType.update({
    where: { id: itemId },
    data: {
      name: data.name,
      unit: data.unit,
      washPrice: data.washPrice ?? null,
      ironPrice: data.ironPrice ?? null,
      dryCleanPrice: data.dryCleanPrice ?? null,
      displayOrder: data.displayOrder,
      active: data.active,
      updatedById: actor.id,
    },
  });

  const priceChanged =
    before.washPrice !== after.washPrice ||
    before.ironPrice !== after.ironPrice ||
    before.dryCleanPrice !== after.dryCleanPrice;

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: priceChanged ? "item_price_changed" : "item_updated",
    entityType: "item_type",
    entityId: itemId,
    beforeState: before,
    afterState: after,
  });

  revalidatePath(`/admin/items`);
  redirect(`/admin/items?branch=${data.branchId}`);
}
