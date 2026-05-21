import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { createUserAction } from "@/server/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "../user-form";

export default async function NewUserPage() {
  await requireAdmin();
  const branches = await db.branch.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New staff member</h1>
        <p className="mt-1 text-sm text-slate-500">Create a new admin or reception account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            action={createUserAction}
            branches={branches}
            submitLabel="Create account"
            isCreate
          />
        </CardContent>
      </Card>
    </div>
  );
}
