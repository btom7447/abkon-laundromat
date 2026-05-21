import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquare, User } from "lucide-react";
import type { TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";
import { formatDate, formatDateOnly, formatNaira } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusActions } from "./status-actions";

export const dynamic = "force-dynamic";

const statusVariant: Record<TicketStatus, "default" | "success" | "warning" | "danger" | "muted"> = {
  RECEIVED: "default",
  READY: "success",
  IN_STORAGE: "warning",
  COLLECTED: "muted",
  CANCELLED: "danger",
};

function serviceLabel(s: string) {
  return s.toLowerCase().replace("_", " ");
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      branch: true,
      createdBy: { select: { name: true, email: true } },
      paidTo: { select: { name: true } },
      discountAppliedBy: { select: { name: true } },
      lineItems: { include: { addOns: true } },
      ticketAddOns: true,
      smsLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!ticket) notFound();
  assertCanAccessBranch(user, ticket.branchId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/tickets?branch=${ticket.branchId}`} className="text-sm text-brand-600 hover:underline">
            ← All tickets
          </Link>
          <h1 className="mt-1 font-mono text-2xl font-bold text-slate-900">{ticket.ticketNumber}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={statusVariant[ticket.status]}>{serviceLabel(ticket.status)}</Badge>
            {ticket.isUrgent && <Badge variant="warning">urgent</Badge>}
            {ticket.paymentStatus === "PAID"
              ? <Badge variant="success">paid</Badge>
              : <Badge variant="warning">unpaid</Badge>}
          </div>
        </div>
        <div className="text-right text-sm text-slate-600">
          <div>Created {formatDate(ticket.receivedAt)}</div>
          <div>By {ticket.createdBy.name}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticket.lineItems.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell>
                        <div className="font-medium">{li.itemTypeNameSnapshot}</div>
                        {li.addOns.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {li.addOns.map((a) => (
                              <Badge key={a.id} variant="muted" className="text-[10px]">
                                {a.addOnNameSnapshot} +{formatNaira(a.addOnAmountSnapshot)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {li.isNegotiable && <div className="mt-0.5 text-xs text-amber-700">Negotiated price</div>}
                      </TableCell>
                      <TableCell>{serviceLabel(li.service)}</TableCell>
                      <TableCell>{li.quantity} {li.unit === "SQM" ? "sqm" : ""}</TableCell>
                      <TableCell>{formatNaira(li.unitPriceSnapshot)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNaira(li.lineSubtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Items subtotal" value={formatNaira(ticket.lineItemsSubtotal)} />
              {ticket.ticketAddOns.map((a) => (
                <Row key={a.id} label={a.addOnNameSnapshot} value={formatNaira(a.computedAmount)} />
              ))}
              {ticket.discountAmount > 0 && (
                <Row
                  label={`Discount (${ticket.discountPercent}%)${ticket.discountReason ? ` — ${ticket.discountReason}` : ""}`}
                  value={`−${formatNaira(ticket.discountAmount)}`}
                  negative
                />
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-semibold text-slate-900">Grand total</span>
                <span className="text-xl font-bold text-slate-900">{formatNaira(ticket.grandTotal)}</span>
              </div>
              {ticket.paymentStatus === "PAID" && ticket.paidAt && (
                <p className="text-xs text-slate-500">
                  Paid {formatDate(ticket.paidAt)} {ticket.paidTo && `to ${ticket.paidTo.name}`}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                SMS history
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ticket.smsLogs.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No SMS sent for this ticket.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticket.smsLogs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs text-slate-500">{formatDate(s.createdAt)}</TableCell>
                        <TableCell className="text-sm">{s.messageType.toLowerCase().replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "SENT" || s.status === "DELIVERED" ? "success" : s.status === "FAILED" ? "danger" : "muted"}>
                            {s.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{s.customerPhone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent>
              <StatusActions
                ticketId={ticket.id}
                currentStatus={ticket.status}
                paymentStatus={ticket.paymentStatus}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href={`/admin/customers/${ticket.customer.id}`} className="block font-medium text-brand-600 hover:underline">
                {ticket.customer.name}
              </Link>
              <div className="text-slate-600">{ticket.customer.phone}</div>
              {ticket.customer.defaultAddress && (
                <div className="text-xs text-slate-500">{ticket.customer.defaultAddress}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <TimelineRow label="Received" date={ticket.receivedAt} />
              {ticket.readyAt && <TimelineRow label="Ready" date={ticket.readyAt} />}
              {ticket.inStorageAt && <TimelineRow label="Moved to storage" date={ticket.inStorageAt} />}
              {ticket.collectedAt && <TimelineRow label="Collected" date={ticket.collectedAt} />}
              {ticket.cancelledAt && (
                <TimelineRow
                  label={`Cancelled${ticket.cancellationReason ? ` — ${ticket.cancellationReason}` : ""}`}
                  date={ticket.cancelledAt}
                  negative
                />
              )}
              <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                Pickup promised: <strong>{formatDateOnly(ticket.pickupDatePromised)}</strong>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={negative ? "text-red-600" : "text-slate-900"}>{value}</span>
    </div>
  );
}

function TimelineRow({ label, date, negative }: { label: string; date: Date; negative?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${negative ? "bg-red-500" : "bg-brand-500"}`} />
      <div className="flex-1">
        <div className={`text-sm ${negative ? "text-red-700" : "text-slate-900"}`}>{label}</div>
        <div className="text-xs text-slate-500">{formatDate(date)}</div>
      </div>
    </div>
  );
}
