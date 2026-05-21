"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Customer } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerFormState } from "@/server/actions/customers";

interface Props {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  branchId: string;
  branchName: string;
  customer?: Customer;
  submitLabel?: string;
}

const initial: CustomerFormState = {};

export function CustomerForm({ action, branchId, branchName, customer, submitLabel = "Save customer" }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="branchId" value={branchId} />

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Branch: <span className="font-medium">{branchName}</span>
      </div>

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={customer?.name} error={state.fieldErrors?.name} required />
        <Field label="Phone" name="phone" defaultValue={customer?.phone} error={state.fieldErrors?.phone} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="WhatsApp number (optional)"
          name="whatsappNumber"
          defaultValue={customer?.whatsappNumber ?? ""}
        />
        <Field
          label="Default address (optional)"
          name="defaultAddress"
          defaultValue={customer?.defaultAddress ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={customer?.notes ?? ""}
          className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={customer?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <Label htmlFor="active" className="cursor-pointer">Active</Label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href={`/admin/customers?branch=${branchId}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
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
}: { label: string; name: string; error?: string[]; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} aria-invalid={!!error} {...props} />
      {error && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}
