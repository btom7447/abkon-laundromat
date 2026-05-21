import { requireAdmin } from "@/lib/rbac";
import { createBranchAction } from "@/server/actions/branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchForm } from "../branch-form";

export default async function NewBranchPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New branch</h1>
        <p className="mt-1 text-sm text-slate-500">Set up a new branch location with its pricing config.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch details</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchForm action={createBranchAction} submitLabel="Create branch" />
        </CardContent>
      </Card>
    </div>
  );
}
