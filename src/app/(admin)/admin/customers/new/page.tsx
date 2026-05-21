import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { createCustomerAction } from "@/server/actions/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerForm } from "../customer-form";

interface Props {
  searchParams: Promise<{ branch?: string }>;
}

export default async function NewCustomerPage({ searchParams }: Props) {
  const user = await requireSession();
  const { branch: requested } = await searchParams;
  const branchId = user.role === "RECEPTION" ? user.branchId : requested;
  if (!branchId) notFound();
  const branch = await db.branch.findUnique({ where: { id: branchId } });
  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New customer</h1>
        <p className="mt-1 text-sm text-slate-500">Add a new customer to this branch.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            action={createCustomerAction}
            branchId={branch.id}
            branchName={branch.name}
            submitLabel="Create customer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
