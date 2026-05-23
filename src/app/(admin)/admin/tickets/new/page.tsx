import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryForItem, illustrationForItem } from "@/lib/pos-categories";
import { PosBoard } from "@/components/admin/pos/pos-board";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

export default async function NewTicketPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested } = await searchParams;
  const ctx = await resolveBranchContext(user, requested ?? null);
  if (!ctx) notFound();

  const [branch, items, addOns, pinned] = await Promise.all([
    db.branch.findUnique({ where: { id: ctx.branchId } }),
    db.itemType.findMany({
      where: { branchId: ctx.branchId, active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    db.addOn.findMany({
      where: { branchId: ctx.branchId, active: true },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
    }),
    // Per-user pinned items in this branch — surfaced at the top of the catalog
    db.userPinnedItem.findMany({
      where: { userId: user.id, itemType: { branchId: ctx.branchId, active: true } },
      orderBy: { pinnedAt: "desc" },
      select: { itemTypeId: true },
    }),
  ]);

  if (!branch) notFound();

  if (items.length === 0) {
    return (
      <div className="p-7">
        <Card>
          <CardHeader>
            <CardTitle>No items configured</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This branch has no items yet. Ask an admin to add items in the catalog.
          </CardContent>
        </Card>
      </div>
    );
  }

  const pinnedSet = new Set(pinned.map((p) => p.itemTypeId));

  return (
    <PosBoard
      branch={{
        id: branch.id,
        name: branch.name,
        code: branch.code,
        urgentSurchargeAmount: branch.urgentSurchargeAmount,
        urgentSurchargeMode: branch.urgentSurchargeMode,
        maxDiscountPercent: branch.maxDiscountPercent,
      }}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        washPrice: i.washPrice,
        ironPrice: i.ironPrice,
        washAndIronPrice: i.washAndIronPrice,
        dryCleanPrice: i.dryCleanPrice,
        category: categoryForItem(i.name, i.unit, i.category),
        illustration: illustrationForItem(i.name),
        pinned: pinnedSet.has(i.id),
      }))}
      perItemAddOns={addOns
        .filter((a) => a.scope === "PER_ITEM")
        .map((a) => ({
          id: a.id,
          name: a.name,
          scope: a.scope,
          pricingMode: a.pricingMode,
          amount: a.amount,
          appliesToServices: a.appliesToServices,
        }))}
      perTicketAddOns={addOns
        .filter((a) => a.scope === "PER_TICKET")
        .map((a) => ({
          id: a.id,
          name: a.name,
          scope: a.scope,
          pricingMode: a.pricingMode,
          amount: a.amount,
          appliesToServices: a.appliesToServices,
        }))}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
