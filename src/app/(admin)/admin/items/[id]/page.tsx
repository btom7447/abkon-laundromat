import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { updateItemAction, type ItemFormState } from "@/server/actions/items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemForm } from "../item-form";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const item = await db.itemType.findUnique({
    where: { id },
    include: { branch: { select: { id: true, name: true } } },
  });
  if (!item) notFound();

  const action = async (prev: ItemFormState, formData: FormData) =>
    updateItemAction(id, prev, formData);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Edit catalog item details and prices.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm
            action={action}
            branchId={item.branch.id}
            branchName={item.branch.name}
            item={item}
          />
        </CardContent>
      </Card>
    </div>
  );
}
