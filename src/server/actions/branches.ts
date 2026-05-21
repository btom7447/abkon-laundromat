"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const branchSchema = z.object({
  name: z.string().min(2).max(80),
  code: z
    .string()
    .min(2)
    .max(3)
    .regex(/^[A-Z]+$/, "Code must be 2-3 uppercase letters"),
  address: z.string().max(200).optional().or(z.literal("")),
  serviceAreas: z.string().optional().or(z.literal("")), // comma-separated
  businessHoursOpen: z.string().regex(/^\d{2}:\d{2}$/),
  businessHoursClose: z.string().regex(/^\d{2}:\d{2}$/),
  homeDeliveryFee: z.coerce.number().int().min(0).max(1_000_000),
  urgentSurchargeAmount: z.coerce.number().int().min(0).max(1_000_000),
  urgentSurchargeMode: z.enum(["FLAT", "PERCENTAGE"]),
  abandonedFlagDays: z.coerce.number().int().min(1).max(365),
  moveToStorageDays: z.coerce.number().int().min(1).max(365),
  maxDiscountPercent: z.coerce.number().int().min(0).max(100),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

export type BranchFormState = { error?: string; fieldErrors?: Record<string, string[]> };

function parseServiceAreas(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createBranchAction(
  _prev: BranchFormState,
  formData: FormData
): Promise<BranchFormState> {
  const actor = await requireAdmin();

  const parsed = branchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;

  const existing = await db.branch.findUnique({ where: { code: data.code } });
  if (existing) return { error: `Branch code "${data.code}" is already in use.` };

  const branch = await db.branch.create({
    data: {
      name: data.name,
      code: data.code,
      address: data.address || null,
      serviceAreas: parseServiceAreas(data.serviceAreas),
      businessHoursOpen: data.businessHoursOpen,
      businessHoursClose: data.businessHoursClose,
      homeDeliveryFee: data.homeDeliveryFee,
      urgentSurchargeAmount: data.urgentSurchargeAmount,
      urgentSurchargeMode: data.urgentSurchargeMode,
      abandonedFlagDays: data.abandonedFlagDays,
      moveToStorageDays: data.moveToStorageDays,
      maxDiscountPercent: data.maxDiscountPercent,
      active: data.active,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: branch.id,
    action: "branch_created",
    entityType: "branch",
    entityId: branch.id,
    afterState: branch,
  });

  revalidatePath("/admin/branches");
  redirect("/admin/branches");
}

export async function updateBranchAction(
  branchId: string,
  _prev: BranchFormState,
  formData: FormData
): Promise<BranchFormState> {
  const actor = await requireAdmin();

  const parsed = branchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const before = await db.branch.findUnique({ where: { id: branchId } });
  if (!before) return { error: "Branch not found." };

  if (data.code !== before.code) {
    const codeClash = await db.branch.findUnique({ where: { code: data.code } });
    if (codeClash) return { error: `Branch code "${data.code}" is already in use.` };
  }

  const after = await db.branch.update({
    where: { id: branchId },
    data: {
      name: data.name,
      code: data.code,
      address: data.address || null,
      serviceAreas: parseServiceAreas(data.serviceAreas),
      businessHoursOpen: data.businessHoursOpen,
      businessHoursClose: data.businessHoursClose,
      homeDeliveryFee: data.homeDeliveryFee,
      urgentSurchargeAmount: data.urgentSurchargeAmount,
      urgentSurchargeMode: data.urgentSurchargeMode,
      abandonedFlagDays: data.abandonedFlagDays,
      moveToStorageDays: data.moveToStorageDays,
      maxDiscountPercent: data.maxDiscountPercent,
      active: data.active,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: branchId,
    action: "branch_updated",
    entityType: "branch",
    entityId: branchId,
    beforeState: before,
    afterState: after,
  });

  revalidatePath("/admin/branches");
  redirect("/admin/branches");
}
