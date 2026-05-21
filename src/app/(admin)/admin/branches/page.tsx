import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  await requireAdmin();

  const branches = await db.branch.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true, itemTypes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Branches</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage branch locations, pricing config, and operating hours.
          </p>
        </div>
        <Link href="/admin/branches/new">
          <Button>
            <Plus className="h-4 w-4" />
            New branch
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All branches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {branches.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-500">
              No branches yet. Create your first one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Home delivery</TableHead>
                  <TableHead>Urgent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.name}
                      <div className="text-xs text-slate-500">
                        {b._count.users} staff · {b._count.itemTypes} items
                      </div>
                    </TableCell>
                    <TableCell><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{b.code}</code></TableCell>
                    <TableCell className="text-sm">{b.businessHoursOpen}–{b.businessHoursClose}</TableCell>
                    <TableCell>{formatNaira(b.homeDeliveryFee)}</TableCell>
                    <TableCell>
                      {b.urgentSurchargeMode === "FLAT"
                        ? formatNaira(b.urgentSurchargeAmount)
                        : `${b.urgentSurchargeAmount}%`}
                    </TableCell>
                    <TableCell>
                      {b.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/branches/${b.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                        Edit
                      </Link>
                    </TableCell>
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
