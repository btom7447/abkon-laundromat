import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchPicker } from "@/components/admin/branch-picker";
import { TicketForm } from "./ticket-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

export default async function NewTicketPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested } = await searchParams;
  const ctx = await resolveBranchContext(user, requested ?? null);
  if (!ctx) notFound();

  const [branch, items, addOns] = await Promise.all([
    db.branch.findUnique({ where: { id: ctx.branchId } }),
    db.itemType.findMany({
      where: { branchId: ctx.branchId, active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    db.addOn.findMany({
      where: { branchId: ctx.branchId, active: true },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!branch) notFound();

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No items configured</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          This branch has no items yet. Ask an admin to add items in the catalog.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New ticket</h1>
          <p className="mt-1 text-sm text-slate-500">{branch.name} ({branch.code})</p>
        </div>
        {user.role === "ADMIN" && <BranchPicker branches={ctx.branches} current={ctx.branchId} />}
      </div>

      <TicketForm
        branchId={branch.id}
        branchCode={branch.code}
        branchName={branch.name}
        urgentSurchargeAmount={branch.urgentSurchargeAmount}
        urgentSurchargeMode={branch.urgentSurchargeMode}
        maxDiscountPercent={branch.maxDiscountPercent}
        homeDeliveryFee={branch.homeDeliveryFee}
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          washPrice: i.washPrice,
          ironPrice: i.ironPrice,
          dryCleanPrice: i.dryCleanPrice,
        }))}
        addOns={addOns.map((a) => ({
          id: a.id,
          name: a.name,
          scope: a.scope,
          pricingMode: a.pricingMode,
          amount: a.amount,
          appliesToServices: a.appliesToServices,
        }))}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
