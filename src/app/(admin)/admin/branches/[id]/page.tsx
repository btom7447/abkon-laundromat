import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { updateBranchAction, type BranchFormState } from "@/server/actions/branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchForm } from "../branch-form";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const branch = await db.branch.findUnique({ where: { id } });
  if (!branch) notFound();

  const action = async (prev: BranchFormState, formData: FormData) =>
    updateBranchAction(id, prev, formData);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{branch.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Edit branch details and pricing config.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch details</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchForm action={action} branch={branch} />
        </CardContent>
      </Card>
    </div>
  );
}
