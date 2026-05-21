import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { updateAddOnAction, type AddOnFormState } from "@/server/actions/addons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddOnForm } from "../addon-form";

export default async function EditAddOnPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const addOn = await db.addOn.findUnique({
    where: { id },
    include: { branch: { select: { id: true, name: true } } },
  });
  if (!addOn) notFound();

  const action = async (prev: AddOnFormState, formData: FormData) =>
    updateAddOnAction(id, prev, formData);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{addOn.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Edit add-on details and pricing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add-on details</CardTitle>
        </CardHeader>
        <CardContent>
          <AddOnForm
            action={action}
            branchId={addOn.branch.id}
            branchName={addOn.branch.name}
            addOn={addOn}
          />
        </CardContent>
      </Card>
    </div>
  );
}
