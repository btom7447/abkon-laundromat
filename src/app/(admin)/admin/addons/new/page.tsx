import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { createAddOnAction } from "@/server/actions/addons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddOnForm } from "../addon-form";

interface Props {
  searchParams: Promise<{ branch?: string }>;
}

export default async function NewAddOnPage({ searchParams }: Props) {
  await requireAdmin();
  const { branch: branchId } = await searchParams;
  if (!branchId) notFound();
  const branch = await db.branch.findUnique({ where: { id: branchId } });
  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New add-on</h1>
        <p className="mt-1 text-sm text-slate-500">Add a per-item or per-ticket extra service.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add-on details</CardTitle>
        </CardHeader>
        <CardContent>
          <AddOnForm
            action={createAddOnAction}
            branchId={branch.id}
            branchName={branch.name}
            submitLabel="Create add-on"
          />
        </CardContent>
      </Card>
    </div>
  );
}
