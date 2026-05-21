import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchPicker } from "@/components/admin/branch-picker";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

export default async function AddOnsPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested } = await searchParams;
  const ctx = await resolveBranchContext(user, requested ?? null);

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No branches set up</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {user.role === "ADMIN" ? <>Create a branch first to add add-ons.</> : <>You are not assigned to a branch.</>}
        </CardContent>
      </Card>
    );
  }

  const addOns = await db.addOn.findMany({
    where: { branchId: ctx.branchId },
    orderBy: [{ active: "desc" }, { scope: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add-ons</h1>
          <p className="mt-1 text-sm text-slate-500">
            Extra services like starching, stain removal, urgent surcharge. Per-item or per-ticket.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchPicker branches={ctx.branches} current={ctx.branchId} />
          {user.role === "ADMIN" && (
            <Link href={`/admin/addons/new?branch=${ctx.branchId}`}>
              <Button>
                <Plus className="h-4 w-4" />
                New add-on
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ctx.branchName} · {addOns.length} add-on{addOns.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {addOns.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-500">No add-ons yet for this branch.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Status</TableHead>
                  {user.role === "ADMIN" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {addOns.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant="muted">
                        {a.scope === "PER_ITEM" ? "per item" : "per ticket"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.pricingMode === "FLAT" ? formatNaira(a.amount) : `${a.amount}%`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.appliesToServices.length === 0 ? (
                        <span className="text-slate-400">All services</span>
                      ) : (
                        a.appliesToServices
                          .map((s) => s.toLowerCase().replace("_", " "))
                          .join(", ")
                      )}
                    </TableCell>
                    <TableCell>
                      {a.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                    </TableCell>
                    {user.role === "ADMIN" && (
                      <TableCell className="text-right">
                        <Link href={`/admin/addons/${a.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                          Edit
                        </Link>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
