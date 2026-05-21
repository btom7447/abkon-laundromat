import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { createItemAction } from "@/server/actions/items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemForm } from "../item-form";

interface Props {
  searchParams: Promise<{ branch?: string }>;
}

export default async function NewItemPage({ searchParams }: Props) {
  await requireAdmin();
  const { branch: branchId } = await searchParams;
  if (!branchId) notFound();
  const branch = await db.branch.findUnique({ where: { id: branchId } });
  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New item</h1>
        <p className="mt-1 text-sm text-slate-500">Add a new laundry item to the catalog.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm
            action={createItemAction}
            branchId={branch.id}
            branchName={branch.name}
            submitLabel="Create item"
          />
        </CardContent>
      </Card>
    </div>
  );
}
