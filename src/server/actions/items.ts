"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const onOff = z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false);

const CATEGORY_IDS = ["tops", "bottoms", "native", "formal", "household", "negotiable", "other"] as const;

const itemSchema = z
  .object({
    branchId: z.string().min(1),
    name: z.string().min(2).max(80),
    category: z
      .preprocess((v) => (v === "" || v == null ? null : v), z.enum(CATEGORY_IDS).nullable())
      .optional(),
    unit: z.enum(["PIECE", "SQM", "NEGOTIABLE"]),
    // Per-service offered toggles — if off, the price is stored as null no
    // matter what value sits in the input.
    washOffered: onOff,
    ironOffered: onOff,
    washAndIronOffered: onOff,
    dryCleanOffered: onOff,
    washPrice: z
      .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
      .optional(),
    ironPrice: z
      .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
      .optional(),
    washAndIronPrice: z
      .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
      .optional(),
    dryCleanPrice: z
      .preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable())
      .optional(),
    displayOrder: z.coerce.number().int().min(0).max(10_000).default(0),
    active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
  })
  .transform((d) => ({
    ...d,
    // Apply the toggle gate — services marked "not offered" force their price
    // to null regardless of what was typed in the (now-disabled) field.
    washPrice: d.washOffered ? d.washPrice ?? null : null,
    ironPrice: d.ironOffered ? d.ironPrice ?? null : null,
    washAndIronPrice: d.washAndIronOffered ? d.washAndIronPrice ?? null : null,
    dryCleanPrice: d.dryCleanOffered ? d.dryCleanPrice ?? null : null,
  }));

export type ItemFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Set on modal-mode submits so the client can dismiss + refresh. */
  success?: boolean;
  createdId?: string;
};

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
      category: data.category ?? null,
      unit: data.unit,
      washPrice: data.washPrice ?? null,
      ironPrice: data.ironPrice ?? null,
      washAndIronPrice: data.washAndIronPrice ?? null,
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
  if (formData.get("__modal") === "1") return { success: true, createdId: item.id };
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
      category: data.category ?? null,
      unit: data.unit,
      washPrice: data.washPrice ?? null,
      ironPrice: data.ironPrice ?? null,
      washAndIronPrice: data.washAndIronPrice ?? null,
      dryCleanPrice: data.dryCleanPrice ?? null,
      displayOrder: data.displayOrder,
      active: data.active,
      updatedById: actor.id,
    },
  });

  const priceChanged =
    before.washPrice !== after.washPrice ||
    before.ironPrice !== after.ironPrice ||
    before.washAndIronPrice !== after.washAndIronPrice ||
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
  if (formData.get("__modal") === "1") return { success: true };
  redirect(`/admin/items?branch=${data.branchId}`);
}
