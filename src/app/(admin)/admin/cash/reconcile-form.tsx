"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reconcileCashAction, type ReconcileState } from "@/server/actions/cash";
import { formatNaira } from "@/lib/utils";

const initial: ReconcileState = {};

interface Props {
  branchId: string;
  date: string; // YYYY-MM-DD
  expectedCash: number;
  currentCounted?: number | null;
  currentNotes?: string | null;
}

export function ReconcileForm({ branchId, date, expectedCash, currentCounted, currentNotes }: Props) {
  const [state, action, pending] = useActionState(reconcileCashAction, initial);
  const [counted, setCounted] = useState<number>(currentCounted ?? expectedCash);
  const discrepancy = useMemo(() => counted - expectedCash, [counted, expectedCash]);

  useEffect(() => {
    if (state.success) {
      setCounted((prev) => prev); // no-op, refresh handled by revalidate
    }
  }, [state.success]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="date" value={date} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Expected cash</Label>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-semibold text-slate-900">
            {formatNaira(expectedCash)}
          </div>
          <p className="text-xs text-slate-500">Sum of tickets paid today.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="countedCash">Counted cash in drawer (₦)</Label>
          <Input
            id="countedCash"
            name="countedCash"
            type="number"
            min={0}
            value={counted}
            onChange={(e) => setCounted(Math.max(0, Number(e.target.value) || 0))}
            required
          />
        </div>
      </div>

      <div
        className={`rounded-md border px-3 py-2 text-sm ${
          discrepancy === 0
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : discrepancy > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        {discrepancy === 0
          ? "✓ Drawer matches expected — balanced."
          : discrepancy > 0
            ? `Overage: +${formatNaira(discrepancy)} more than expected.`
            : `Shortage: ${formatNaira(discrepancy)} less than expected.`}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={currentNotes ?? ""}
          placeholder="e.g. ₦200 short, possibly miscount on ticket AB-XX-…"
          className="min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Saving…" : currentCounted != null ? "Update reconciliation" : "Save reconciliation"}
      </Button>
      {state.success && (
        <span className="ml-2 text-sm text-emerald-600">Saved.</span>
      )}
    </form>
  );
}
