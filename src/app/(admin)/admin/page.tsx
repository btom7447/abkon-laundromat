import { Building2, Users, Shirt, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession, branchScopeFor } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const user = await requireSession();

  const where = user.role === "ADMIN" ? {} : { branchId: branchScopeFor(user) ?? "__none__" };

  const [branches, users, items, addOns] = await Promise.all([
    db.branch.count(),
    db.user.count({ where: user.role === "ADMIN" ? {} : { branchId: user.branchId ?? "__none__" } }),
    db.itemType.count({ where: { ...where, active: true } }),
    db.addOn.count({ where: { ...where, active: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name.split(" ")[0]}.</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.role === "ADMIN"
            ? "You're signed in as administrator. You can see all branches."
            : "You're signed in as reception."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Building2 className="h-4 w-4" />} label="Branches" value={branches} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Staff accounts" value={users} />
        <StatCard icon={<Shirt className="h-4 w-4" />} label="Active items" value={items} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Active add-ons" value={addOns} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>You're early in the setup. Here's what's next.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>1. Configure your branches and pricing.</li>
            <li>2. Add staff accounts (admin can add reception users).</li>
            <li>3. Review the catalog of items and add-ons.</li>
            <li>4. Ticket creation and reports come in the next milestones.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
