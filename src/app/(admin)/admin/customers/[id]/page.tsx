import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";
import { updateCustomerAction, type CustomerFormState } from "@/server/actions/customers";
import { formatDate, formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerForm } from "../customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: { branch: { select: { id: true, name: true } } },
  });
  if (!customer) notFound();
  assertCanAccessBranch(user, customer.branch.id);

  const tickets = await db.ticket.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      createdAt: true,
    },
  });

  const action = async (prev: CustomerFormState, formData: FormData) =>
    updateCustomerAction(id, prev, formData);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Edit customer details and review ticket history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            action={action}
            branchId={customer.branch.id}
            branchName={customer.branch.name}
            customer={customer}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No tickets yet for this customer.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/admin/tickets/${t.id}`} className="font-medium text-brand-600 hover:underline">
                        {t.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="muted">{t.status.toLowerCase().replace("_", " ")}</Badge></TableCell>
                    <TableCell>
                      {t.paymentStatus === "PAID" ? <Badge variant="success">Paid</Badge> : <Badge variant="warning">Unpaid</Badge>}
                    </TableCell>
                    <TableCell>{formatNaira(t.grandTotal)}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(t.createdAt)}</TableCell>
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
