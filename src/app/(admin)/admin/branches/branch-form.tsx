"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Branch } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { BranchFormState } from "@/server/actions/branches";

interface Props {
  action: (state: BranchFormState, formData: FormData) => Promise<BranchFormState>;
  branch?: Branch;
  submitLabel?: string;
}

const initial: BranchFormState = {};

export function BranchForm({ action, branch, submitLabel = "Save branch" }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Branch name" name="name" error={state.fieldErrors?.name} defaultValue={branch?.name} required />
        <Field
          label="Branch code (2-3 uppercase letters)"
          name="code"
          error={state.fieldErrors?.code}
          defaultValue={branch?.code}
          placeholder="LG"
          maxLength={3}
          required
        />
      </div>

      <Field
        label="Address"
        name="address"
        error={state.fieldErrors?.address}
        defaultValue={branch?.address ?? ""}
      />

      <div className="space-y-1.5">
        <Label htmlFor="serviceAreas">Service areas (comma separated, used by WhatsApp bot)</Label>
        <Input
          id="serviceAreas"
          name="serviceAreas"
          defaultValue={branch?.serviceAreas.join(", ") ?? ""}
          placeholder="Ikeja, Maryland, Ojota"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Opens at"
          name="businessHoursOpen"
          type="time"
          error={state.fieldErrors?.businessHoursOpen}
          defaultValue={branch?.businessHoursOpen ?? "08:00"}
          required
        />
        <Field
          label="Closes at"
          name="businessHoursClose"
          type="time"
          error={state.fieldErrors?.businessHoursClose}
          defaultValue={branch?.businessHoursClose ?? "20:00"}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Home delivery fee (₦)"
          name="homeDeliveryFee"
          type="number"
          min={0}
          error={state.fieldErrors?.homeDeliveryFee}
          defaultValue={branch?.homeDeliveryFee ?? 1000}
          required
        />
        <Field
          label="Max discount % reception can apply"
          name="maxDiscountPercent"
          type="number"
          min={0}
          max={100}
          error={state.fieldErrors?.maxDiscountPercent}
          defaultValue={branch?.maxDiscountPercent ?? 10}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Urgent surcharge amount (₦ or %)"
          name="urgentSurchargeAmount"
          type="number"
          min={0}
          error={state.fieldErrors?.urgentSurchargeAmount}
          defaultValue={branch?.urgentSurchargeAmount ?? 500}
          required
        />
        <div className="space-y-1.5">
          <Label htmlFor="urgentSurchargeMode">Urgent surcharge mode</Label>
          <Select
            id="urgentSurchargeMode"
            name="urgentSurchargeMode"
            defaultValue={branch?.urgentSurchargeMode ?? "FLAT"}
          >
            <option value="FLAT">Flat ₦ amount</option>
            <option value="PERCENTAGE">Percentage of total</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Abandoned flag (days after ready)"
          name="abandonedFlagDays"
          type="number"
          min={1}
          error={state.fieldErrors?.abandonedFlagDays}
          defaultValue={branch?.abandonedFlagDays ?? 7}
          required
        />
        <Field
          label="Move to storage (days after ready)"
          name="moveToStorageDays"
          type="number"
          min={1}
          error={state.fieldErrors?.moveToStorageDays}
          defaultValue={branch?.moveToStorageDays ?? 14}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={branch?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <Label htmlFor="active" className="cursor-pointer">Branch is active</Label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href="/admin/branches"
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
