import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        actor: { select: { name: true, email: true } },
        branch: { select: { name: true, code: true } },
      },
    }),
    db.auditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Append-only record of all configuration and security-relevant actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Showing page {page} of {totalPages} · {total} total entries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-500">No audit entries yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Branch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantForAction(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{log.entityType}</div>
                      {log.entityId && (
                        <code className="text-xs text-slate-400">{log.entityId.slice(0, 8)}…</code>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.actor ? (
                        <>
                          <div>{log.actor.name}</div>
                          <div className="text-xs text-slate-500">{log.actor.email}</div>
                        </>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.branch ? `${log.branch.name}` : <span className="text-slate-400">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <a href={`?page=${page - 1}`} className="text-brand-600 hover:underline">
              ← Newer
            </a>
          ) : (
            <span />
          )}
          {page < totalPages ? (
            <a href={`?page=${page + 1}`} className="text-brand-600 hover:underline">
              Older →
            </a>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function variantForAction(action: string): "default" | "success" | "warning" | "danger" | "muted" {
  if (action.includes("failure") || action.includes("locked") || action.includes("rate_limited")) {
    return "danger";
  }
  if (action.includes("success") || action.includes("created")) return "success";
  if (action.includes("price_changed") || action.includes("discount")) return "warning";
  return "muted";
}
