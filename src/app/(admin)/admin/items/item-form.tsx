"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ItemType, ItemUnit } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ItemFormState } from "@/server/actions/items";

interface Props {
  action: (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  branchId: string;
  branchName: string;
  item?: ItemType;
  submitLabel?: string;
}

const initial: ItemFormState = {};

export function ItemForm({ action, branchId, branchName, item, submitLabel = "Save item" }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [unit, setUnit] = useState<ItemUnit>(item?.unit ?? "PIECE");

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
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="name">Item name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={item?.name}
            placeholder="e.g. Shirt, Agbada, Rug"
            required
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Select
            id="unit"
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as ItemUnit)}
          >
            <option value="PIECE">Per piece</option>
            <option value="SQM">Per square meter</option>
            <option value="NEGOTIABLE">Negotiable (reception sets price)</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayOrder">Display order</Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min={0}
            defaultValue={item?.displayOrder ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Service prices (₦) — leave blank if not offered for this item</Label>
        <p className="text-xs text-slate-500">
          {unit === "NEGOTIABLE"
            ? "Negotiable items use prices as guidance only; reception enters the final price at ticket time."
            : unit === "SQM"
              ? "Prices are per square meter."
              : "Prices are per piece."}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Wash"
            name="washPrice"
            type="number"
            min={0}
            defaultValue={item?.washPrice ?? ""}
            error={state.fieldErrors?.washPrice}
          />
          <Field
            label="Iron"
            name="ironPrice"
            type="number"
            min={0}
            defaultValue={item?.ironPrice ?? ""}
            error={state.fieldErrors?.ironPrice}
          />
          <Field
            label="Dry clean"
            name="dryCleanPrice"
            type="number"
            min={0}
            defaultValue={item?.dryCleanPrice ?? ""}
            error={state.fieldErrors?.dryCleanPrice}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={item?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <Label htmlFor="active" className="cursor-pointer">Item is active</Label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href={`/admin/items?branch=${branchId}`}
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
