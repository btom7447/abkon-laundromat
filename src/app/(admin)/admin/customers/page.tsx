import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchPicker } from "@/components/admin/branch-picker";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ branch?: string; q?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested, q } = await searchParams;
  const ctx = await resolveBranchContext(user, requested ?? null);

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No branches set up</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {user.role === "ADMIN" ? <>Create a branch first.</> : <>You are not assigned to a branch.</>}
        </CardContent>
      </Card>
    );
  }

  const query = (q ?? "").trim();
  const customers = await db.customer.findMany({
    where: {
      branchId: ctx.branchId,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query.replace(/\s+/g, "") } },
            ],
          }
        : {}),
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Saved customers for {ctx.branchName}. Lookups are scoped to this branch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchPicker branches={ctx.branches} current={ctx.branchId} />
          <Link href={`/admin/customers/new?branch=${ctx.branchId}`}>
            <Button>
              <Plus className="h-4 w-4" />
              New customer
            </Button>
          </Link>
        </div>
      </div>

      <form className="flex items-center gap-2" action="" method="GET">
        <input type="hidden" name="branch" value={ctx.branchId} />
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={query} placeholder="Search by name or phone…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              {query ? "No matches." : "No customers yet."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell className="text-sm">{c._count.tickets}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      {c.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/customers/${c.id}`} className="text-sm font-medium text-brand-600 hover:underline">
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
