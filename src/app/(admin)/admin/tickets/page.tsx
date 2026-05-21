import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { Prisma, TicketStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { formatDate, formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchPicker } from "@/components/admin/branch-picker";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUSES: TicketStatus[] = ["RECEIVED", "READY", "IN_STORAGE", "COLLECTED", "CANCELLED"];

const statusVariant: Record<TicketStatus, "default" | "success" | "warning" | "danger" | "muted"> = {
  RECEIVED: "default",
  READY: "success",
  IN_STORAGE: "warning",
  COLLECTED: "muted",
  CANCELLED: "danger",
};

interface PageProps {
  searchParams: Promise<{
    branch?: string;
    status?: string;
    payment?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { branch: requested, status, payment, q, page: pageStr } = await searchParams;
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

  const page = Math.max(1, Number(pageStr) || 1);
  const query = (q ?? "").trim();
  const statusFilter = STATUSES.includes(status as TicketStatus) ? (status as TicketStatus) : undefined;
  const paymentFilter =
    payment === "PAID" ? "PAID" : payment === "UNPAID" ? "UNPAID" : undefined;

  const where: Prisma.TicketWhereInput = {
    branchId: ctx.branchId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentFilter ? { paymentStatus: paymentFilter as PaymentStatus } : {}),
    ...(query
      ? {
          OR: [
            { ticketNumber: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
            { customer: { phone: { contains: query.replace(/\s+/g, "") } } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    db.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { customer: { select: { name: true, phone: true } } },
    }),
    db.ticket.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const branchId = ctx.branchId;

  function buildQuery(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    params.set("branch", branchId);
    if (query) params.set("q", query);
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("payment", paymentFilter);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    });
    return `?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">{ctx.branchName} · {total} ticket{total === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-3">
          <BranchPicker branches={ctx.branches} current={ctx.branchId} />
          <Link href={`/admin/tickets/new?branch=${ctx.branchId}`}>
            <Button>
              <Plus className="h-4 w-4" />
              New ticket
            </Button>
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="" method="GET">
        <input type="hidden" name="branch" value={ctx.branchId} />
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={query} placeholder="Ticket #, customer name, phone…" className="pl-9" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <Select name="status" defaultValue={statusFilter ?? ""}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.toLowerCase().replace("_", " ")}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Payment</label>
          <Select name="payment" defaultValue={paymentFilter ?? ""}>
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </Select>
        </div>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No tickets match the filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/admin/tickets/${t.id}`} className="font-mono text-sm font-medium text-brand-600 hover:underline">
                        {t.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{t.customer.name}</div>
                      <div className="text-xs text-slate-500">{t.customer.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[t.status]}>
                        {t.status.toLowerCase().replace("_", " ")}
                      </Badge>
                      {t.isUrgent && <Badge variant="warning" className="ml-1">urgent</Badge>}
                    </TableCell>
                    <TableCell>
                      {t.paymentStatus === "PAID"
                        ? <Badge variant="success">Paid</Badge>
                        : <Badge variant="warning">Unpaid</Badge>}
                    </TableCell>
                    <TableCell>{formatNaira(t.grandTotal)}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(t.pickupDatePromised)}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(t.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1
            ? <Link href={buildQuery({ page: String(page - 1) })} className="text-brand-600 hover:underline">← Newer</Link>
            : <span />}
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          {page < totalPages
            ? <Link href={buildQuery({ page: String(page + 1) })} className="text-brand-600 hover:underline">Older →</Link>
            : <span />}
        </div>
      )}
    </div>
  );
}
