"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { AddOn } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AddOnFormState } from "@/server/actions/addons";

interface Props {
  action: (state: AddOnFormState, formData: FormData) => Promise<AddOnFormState>;
  branchId: string;
  branchName: string;
  addOn?: AddOn;
  submitLabel?: string;
}

const initial: AddOnFormState = {};

export function AddOnForm({ action, branchId, branchName, addOn, submitLabel = "Save add-on" }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const services = new Set(addOn?.appliesToServices ?? []);

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

      <div className="space-y-1.5">
        <Label htmlFor="name">Add-on name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={addOn?.name}
          placeholder="e.g. Starching, Stain removal, Urgent surcharge"
          required
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="scope">Applied to</Label>
          <Select id="scope" name="scope" defaultValue={addOn?.scope ?? "PER_ITEM"}>
            <option value="PER_ITEM">Per item (added to each line)</option>
            <option value="PER_TICKET">Per ticket (added once to whole bag)</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pricingMode">Pricing mode</Label>
          <Select id="pricingMode" name="pricingMode" defaultValue={addOn?.pricingMode ?? "FLAT"}>
            <option value="FLAT">Flat ₦ amount</option>
            <option value="PERCENTAGE">Percentage of subtotal</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₦ for flat, % for percentage)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={0}
          defaultValue={addOn?.amount ?? 0}
          aria-invalid={!!state.fieldErrors?.amount}
          required
        />
        {state.fieldErrors?.amount && (
          <p className="text-xs text-red-600">{state.fieldErrors.amount[0]}</p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Applies to services</legend>
        <p className="text-xs text-slate-500">Leave all unchecked to apply to every service.</p>
        <div className="flex flex-wrap gap-4">
          <ServiceCheck name="appliesToWash" label="Wash" defaultChecked={services.has("WASH")} />
          <ServiceCheck name="appliesToIron" label="Iron" defaultChecked={services.has("IRON")} />
          <ServiceCheck name="appliesToDryClean" label="Dry clean" defaultChecked={services.has("DRY_CLEAN")} />
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={addOn?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <Label htmlFor="active" className="cursor-pointer">Add-on is active</Label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href={`/admin/addons?branch=${branchId}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function ServiceCheck({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      {label}
    </label>
  );
}
