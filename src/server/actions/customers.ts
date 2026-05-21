"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, branchScopeFor } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const customerSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2).max(120),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[\d+\-\s()]+$/, "Phone may only contain digits and + - ( ) spaces"),
  whatsappNumber: z.string().max(20).optional().or(z.literal("")),
  defaultAddress: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

export type CustomerFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  createdId?: string;
};

function ensureBranchAccess(actorRole: string, actorBranchId: string | null, branchId: string) {
  if (actorRole === "ADMIN") return;
  if (actorBranchId !== branchId) {
    throw new Error("Forbidden: branch access denied");
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const actor = await requireSession();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  ensureBranchAccess(actor.role, actor.branchId, data.branchId);

  const phone = normalizePhone(data.phone);
  const clash = await db.customer.findUnique({
    where: { branchId_phone: { branchId: data.branchId, phone } },
  });
  if (clash) return { error: "A customer with this phone already exists in this branch." };

  const customer = await db.customer.create({
    data: {
      branchId: data.branchId,
      name: data.name,
      phone,
      whatsappNumber: data.whatsappNumber || null,
      defaultAddress: data.defaultAddress || null,
      notes: data.notes || null,
      active: data.active,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: "customer_created",
    entityType: "customer",
    entityId: customer.id,
    afterState: { id: customer.id, name: customer.name, phone: customer.phone },
  });

  revalidatePath("/admin/customers");

  // If the caller requested inline (e.g. from ticket creation), return id instead of redirect.
  if (formData.get("__inline") === "1") {
    return { createdId: customer.id };
  }

  redirect(`/admin/customers?branch=${data.branchId}`);
}

export async function updateCustomerAction(
  customerId: string,
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const actor = await requireSession();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  ensureBranchAccess(actor.role, actor.branchId, data.branchId);

  const before = await db.customer.findUnique({ where: { id: customerId } });
  if (!before) return { error: "Customer not found." };
  if (before.branchId !== data.branchId) return { error: "Cannot move customers between branches." };
  ensureBranchAccess(actor.role, actor.branchId, before.branchId);

  const phone = normalizePhone(data.phone);
  if (phone !== before.phone) {
    const clash = await db.customer.findUnique({
      where: { branchId_phone: { branchId: data.branchId, phone } },
    });
    if (clash && clash.id !== customerId) {
      return { error: "A customer with this phone already exists in this branch." };
    }
  }

  const after = await db.customer.update({
    where: { id: customerId },
    data: {
      name: data.name,
      phone,
      whatsappNumber: data.whatsappNumber || null,
      defaultAddress: data.defaultAddress || null,
      notes: data.notes || null,
      active: data.active,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: data.branchId,
    action: "customer_updated",
    entityType: "customer",
    entityId: customerId,
    beforeState: { name: before.name, phone: before.phone, active: before.active },
    afterState: { name: after.name, phone: after.phone, active: after.active },
  });

  revalidatePath("/admin/customers");
  redirect(`/admin/customers?branch=${data.branchId}`);
}

/**
 * Quick-create a customer from inside the ticket flow. Returns customer id
 * for the ticket form to use immediately. No redirect.
 */
export async function quickCreateCustomer(input: {
  branchId: string;
  name: string;
  phone: string;
  whatsappNumber?: string;
  defaultAddress?: string;
}): Promise<{ ok: true; customerId: string } | { ok: false; error: string }> {
  const actor = await requireSession();
  ensureBranchAccess(actor.role, actor.branchId, input.branchId);

  const phone = normalizePhone(input.phone);
  if (phone.length < 7) return { ok: false, error: "Phone too short." };

  const existing = await db.customer.findUnique({
    where: { branchId_phone: { branchId: input.branchId, phone } },
  });
  if (existing) return { ok: true, customerId: existing.id };

  const created = await db.customer.create({
    data: {
      branchId: input.branchId,
      name: input.name.trim(),
      phone,
      whatsappNumber: input.whatsappNumber?.trim() || null,
      defaultAddress: input.defaultAddress?.trim() || null,
      active: true,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: input.branchId,
    action: "customer_created",
    entityType: "customer",
    entityId: created.id,
    afterState: { id: created.id, name: created.name, phone: created.phone },
  });

  return { ok: true, customerId: created.id };
}

export async function searchCustomers(input: {
  branchId: string;
  query: string;
  limit?: number;
}): Promise<{ id: string; name: string; phone: string }[]> {
  const actor = await requireSession();
  const scoped = branchScopeFor(actor, input.branchId);
  if (!scoped) return [];

  const q = input.query.trim();
  if (q.length < 2) return [];

  const customers = await db.customer.findMany({
    where: {
      branchId: scoped,
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\s+/g, "") } },
      ],
    },
    orderBy: { name: "asc" },
    take: input.limit ?? 10,
    select: { id: true, name: true, phone: true },
  });

  return customers;
}
