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

export default async function ItemsPage({ searchParams }: PageProps) {
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
          {user.role === "ADMIN" ? (
            <>Create a branch first to add items.</>
          ) : (
            <>You are not assigned to a branch. Ask an admin to update your account.</>
          )}
        </CardContent>
      </Card>
    );
  }

  const items = await db.itemType.findMany({
    where: { branchId: ctx.branchId },
    orderBy: [{ active: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Items & prices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Catalog of laundry items and their per-service prices. Price changes don&apos;t affect existing tickets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchPicker branches={ctx.branches} current={ctx.branchId} />
          {user.role === "ADMIN" && (
            <Link href={`/admin/items/new?branch=${ctx.branchId}`}>
              <Button>
                <Plus className="h-4 w-4" />
                New item
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ctx.branchName} · {items.length} item{items.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-500">No items yet for this branch.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Wash</TableHead>
                  <TableHead>Iron</TableHead>
                  <TableHead>Dry clean</TableHead>
                  <TableHead>Status</TableHead>
                  {user.role === "ADMIN" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.name}</TableCell>
                    <TableCell><Badge variant="muted">{it.unit.toLowerCase()}</Badge></TableCell>
                    <TableCell>{it.washPrice != null ? formatNaira(it.washPrice) : <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell>{it.ironPrice != null ? formatNaira(it.ironPrice) : <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell>{it.dryCleanPrice != null ? formatNaira(it.dryCleanPrice) : <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell>
                      {it.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                    </TableCell>
                    {user.role === "ADMIN" && (
                      <TableCell className="text-right">
                        <Link href={`/admin/items/${it.id}`} className="text-sm font-medium text-brand-600 hover:underline">
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
