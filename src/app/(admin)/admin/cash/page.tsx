import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { resolveRange } from "@/lib/date-range";
import { todayCashSnapshot, cashReconciliationHistory } from "@/server/queries/reports";
import { formatDate, formatDateOnly, formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchPicker } from "@/components/admin/branch-picker";
import { ReconcileForm } from "./reconcile-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

export default async function CashPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested } = await searchParams;
  const ctx = await resolveBranchContext(user, requested ?? null);

  if (!ctx) {
    return (
      <Card>
        <CardHeader><CardTitle>No branches set up</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-600">
          {user.role === "ADMIN" ? "Create a branch first." : "You are not assigned to a branch."}
        </CardContent>
      </Card>
    );
  }

  const scope = { branchId: ctx.branchId, range: resolveRange({ preset: "today" }) };
  const [today, history] = await Promise.all([
    todayCashSnapshot(scope),
    cashReconciliationHistory(ctx.branchId, 30),
  ]);

  const todayIso = isoDateLocal(today.date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash reconciliation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Match the drawer total against tickets paid today. {ctx.branchName}.
          </p>
        </div>
        <BranchPicker branches={ctx.branches} current={ctx.branchId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {formatDateOnly(today.date)} · {today.ticketCount} payment{today.ticketCount === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReconcileForm
            branchId={ctx.branchId}
            date={todayIso}
            expectedCash={today.expectedCash}
            currentCounted={today.countedCash}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent reconciliations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No reconciliations yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Counted</TableHead>
                  <TableHead>Discrepancy</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Saved at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{formatDateOnly(h.date)}</TableCell>
                    <TableCell>{formatNaira(h.expectedCash)}</TableCell>
                    <TableCell>{formatNaira(h.countedCash)}</TableCell>
                    <TableCell>
                      {h.discrepancy === 0 ? (
                        <Badge variant="success">balanced</Badge>
                      ) : h.discrepancy > 0 ? (
                        <Badge variant="warning">+{formatNaira(h.discrepancy)}</Badge>
                      ) : (
                        <Badge variant="danger">{formatNaira(h.discrepancy)}</Badge>
                      )}
                      {h.notes && (
                        <div className="mt-1 text-xs text-slate-500">{h.notes}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{h.reconciledBy}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(h.reconciledAt)}</TableCell>
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

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
