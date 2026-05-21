"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { UserFormState } from "@/server/actions/users";

interface UserSeed {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  branchId: string | null;
  active: boolean;
}

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

interface Props {
  action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  user?: UserSeed;
  branches: BranchOption[];
  submitLabel?: string;
  isCreate?: boolean;
}

const initial: UserFormState = {};

export function UserForm({ action, user, branches, submitLabel = "Save", isCreate = false }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [role, setRole] = useState<Role>(user?.role ?? "RECEPTION");

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" name="name" error={state.fieldErrors?.name} defaultValue={user?.name} required />
        <Field
          label="Email"
          name="email"
          type="email"
          error={state.fieldErrors?.email}
          defaultValue={user?.email}
          required
          autoComplete="off"
        />
      </div>

      <Field
        label="Phone (optional)"
        name="phone"
        error={state.fieldErrors?.phone}
        defaultValue={user?.phone ?? ""}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            name="role"
            defaultValue={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="RECEPTION">Reception (branch-scoped)</option>
            <option value="ADMIN">Admin (all branches)</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="branchId">Branch {role === "RECEPTION" && <span className="text-red-500">*</span>}</Label>
          <Select id="branchId" name="branchId" defaultValue={user?.branchId ?? ""} disabled={role === "ADMIN"}>
            <option value="">— Select a branch —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </Select>
          {state.fieldErrors?.branchId && (
            <p className="text-xs text-red-600">{state.fieldErrors.branchId[0]}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Label htmlFor="password" className="text-slate-800">
          {isCreate ? "Initial password" : "Reset password (leave blank to keep current)"}
        </Label>
        <p className="mt-1 text-xs text-slate-500">
          Min. 10 characters, with uppercase, lowercase, and a number.
        </p>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="mt-2"
          required={isCreate}
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={user?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <Label htmlFor="active" className="cursor-pointer">Account is active</Label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href="/admin/users" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  error?: string[];
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} aria-invalid={!!error} {...props} />
      {error && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}
