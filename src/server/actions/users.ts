"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";

const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

const baseSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  phone: z.string().max(40).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "RECEPTION"]),
  branchId: z.string().optional().or(z.literal("")),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

const createSchema = baseSchema.extend({
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/\d/, "Must contain a number"),
});

const updateSchema = baseSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

export type UserFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Set on modal-mode submits so the client can dismiss + refresh. */
  success?: boolean;
  createdId?: string;
};

function normalizeBranchId(role: string, raw: string | undefined): string | null {
  if (role === "ADMIN") return null;
  if (!raw) return null;
  return raw;
}

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await requireAdmin();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;

  const branchId = normalizeBranchId(data.role, data.branchId || undefined);
  if (data.role === "RECEPTION" && !branchId) {
    return { fieldErrors: { branchId: ["Reception staff must be assigned to a branch."] } };
  }
  if (branchId) {
    const branch = await db.branch.findUnique({ where: { id: branchId } });
    if (!branch) return { fieldErrors: { branchId: ["Branch not found."] } };
  }

  const emailClash = await db.user.findUnique({ where: { email: data.email } });
  if (emailClash) return { error: "A user with this email already exists." };

  const passwordHash = await hash(data.password, ARGON_OPTIONS);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      branchId,
      passwordHash,
      active: data.active,
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId,
    action: "user_created",
    entityType: "user",
    entityId: user.id,
    afterState: { id: user.id, email: user.email, role: user.role, branchId },
  });

  revalidatePath("/admin/users");
  if (formData.get("__modal") === "1") return { success: true, createdId: user.id };
  redirect("/admin/users");
}

export async function updateUserAction(
  userId: string,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await requireAdmin();

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const before = await db.user.findUnique({ where: { id: userId } });
  if (!before) return { error: "User not found." };

  const branchId = normalizeBranchId(data.role, data.branchId || undefined);
  if (data.role === "RECEPTION" && !branchId) {
    return { fieldErrors: { branchId: ["Reception staff must be assigned to a branch."] } };
  }
  if (branchId) {
    const branch = await db.branch.findUnique({ where: { id: branchId } });
    if (!branch) return { fieldErrors: { branchId: ["Branch not found."] } };
  }

  if (data.email !== before.email) {
    const emailClash = await db.user.findUnique({ where: { email: data.email } });
    if (emailClash && emailClash.id !== userId) {
      return { error: "A user with this email already exists." };
    }
  }

  let passwordHash: string | undefined;
  if (data.password && data.password.length > 0) {
    const pwParsed = createSchema.shape.password.safeParse(data.password);
    if (!pwParsed.success) {
      return { fieldErrors: { password: pwParsed.error.flatten().formErrors } };
    }
    passwordHash = await hash(data.password, ARGON_OPTIONS);
  }

  const after = await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      branchId,
      active: data.active,
      ...(passwordHash ? { passwordHash, failedLoginAttempts: 0, lockedUntil: null } : {}),
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId,
    action: passwordHash ? "user_updated_with_password_reset" : "user_updated",
    entityType: "user",
    entityId: userId,
    beforeState: { email: before.email, role: before.role, branchId: before.branchId, active: before.active },
    afterState: { email: after.email, role: after.role, branchId: after.branchId, active: after.active },
  });

  revalidatePath("/admin/users");
  if (formData.get("__modal") === "1") return { success: true };
  redirect("/admin/users");
}
