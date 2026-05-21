"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const SERVICES = ["WASH", "IRON", "DRY_CLEAN"] as const;

const addOnSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2).max(80),
  scope: z.enum(["PER_ITEM", "PER_TICKET"]),
  pricingMode: z.enum(["FLAT", "PERCENTAGE"]),
  amount: z.coerce.number().int().min(0).max(1_000_000),
  appliesToWash: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  appliesToIron: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  appliesToDryClean: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

export type AddOnFormState = { error?: string; fieldErrors?: Record<string, string[]> };

function applicableServices(data: z.infer<typeof addOnSchema>): typeof SERVICES[number][] {
  const list: typeof SERVICES[number][] = [];
  if (data.appliesToWash) list.push("WASH");
  if (data.appliesToIron) list.push("IRON");
  if (data.appliesToDryClean) list.push("DRY_CLEAN");
  return list;
}

export async function createAddOnAction(
  _prev: AddOnFormState,
  formData: FormData
): Promise<AddOnFormState> {
  const actor = await requireSession();
  if (actor.role !== "ADMIN") return { error: "Only admin can manage add-ons." };

  const parsed = addOnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  if (data.pricingMode === "PERCENTAGE" && data.amount > 100) {
    return { fieldErrors: { amount: ["Percentage cannot exceed 100."] } };
  }

  const clash = await db.addOn.findUnique({
    where: { branchId_name: { branchId: data.branchId, name: data.name } },
  });
  if (clash) return { error: `Add-on "${data.name}" already exists in this branch.` };

  const addOn = await db.addOn.create({
    data: {
      branchId: data.branchId,
      name: data.name,
      scope: data.scope,
      pricingMode: data.pricingMode,
      amount: data.amount,
      appliesToServices: applicableServices(data),
      active: data.active,
      updatedById: actor.id,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: "addon_created",
    entityType: "add_on",
    entityId: addOn.id,
    afterState: addOn,
  });

  revalidatePath("/admin/addons");
  redirect(`/admin/addons?branch=${data.branchId}`);
}

export async function updateAddOnAction(
  addOnId: string,
  _prev: AddOnFormState,
  formData: FormData
): Promise<AddOnFormState> {
  const actor = await requireSession();
  if (actor.role !== "ADMIN") return { error: "Only admin can manage add-ons." };

  const parsed = addOnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  if (data.pricingMode === "PERCENTAGE" && data.amount > 100) {
    return { fieldErrors: { amount: ["Percentage cannot exceed 100."] } };
  }

  const before = await db.addOn.findUnique({ where: { id: addOnId } });
  if (!before) return { error: "Add-on not found." };
  if (before.branchId !== data.branchId) return { error: "Cannot move add-ons between branches." };

  if (data.name !== before.name) {
    const clash = await db.addOn.findUnique({
      where: { branchId_name: { branchId: data.branchId, name: data.name } },
    });
    if (clash && clash.id !== addOnId) {
      return { error: `Add-on "${data.name}" already exists in this branch.` };
    }
  }

  const after = await db.addOn.update({
    where: { id: addOnId },
    data: {
      name: data.name,
      scope: data.scope,
      pricingMode: data.pricingMode,
      amount: data.amount,
      appliesToServices: applicableServices(data),
      active: data.active,
      updatedById: actor.id,
    },
  });

  const priceChanged = before.amount !== after.amount || before.pricingMode !== after.pricingMode;

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: priceChanged ? "addon_price_changed" : "addon_updated",
    entityType: "add_on",
    entityId: addOnId,
    beforeState: before,
    afterState: after,
  });

  revalidatePath("/admin/addons");
  redirect(`/admin/addons?branch=${data.branchId}`);
}
