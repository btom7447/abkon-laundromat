import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { updateUserAction, type UserFormState } from "@/server/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "../user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [user, branches] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.branch.findMany({
      where: { active: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!user) notFound();

  const action = async (prev: UserFormState, formData: FormData) =>
    updateUserAction(id, prev, formData);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Edit account details. Leave password blank to keep current.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            action={action}
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
              branchId: user.branchId,
              active: user.active,
            }}
            branches={branches}
          />
        </CardContent>
      </Card>
    </div>
  );
}
