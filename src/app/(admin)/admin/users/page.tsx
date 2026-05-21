import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { branch: { select: { name: true, code: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage admin and reception users.</p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="h-4 w-4" />
            New staff
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All staff</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-500">No staff accounts yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-slate-700">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "muted"}>
                        {u.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.branch ? `${u.branch.name} (${u.branch.code})` : <span className="text-slate-400">All</span>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {u.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                      {u.lockedUntil && u.lockedUntil > new Date() && (
                        <Badge variant="warning" className="ml-1">Locked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/users/${u.id}`} className="text-sm font-medium text-brand-600 hover:underline">
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
