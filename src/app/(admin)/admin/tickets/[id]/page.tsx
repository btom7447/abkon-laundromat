import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Check,
  Wallet,
  Plus,
  MessageCircle,
  Clock,
  XCircle,
  Archive,
  Receipt,
  Zap,
} from "lucide-react";
import type { TicketStatus, Service } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";
import { formatDate, formatDateOnly, formatNaira } from "@/lib/utils";
import { illustrationForItem } from "@/lib/pos-categories";
import { Illustration } from "@/components/brand/illustrations";
import { CopyButton } from "@/components/admin/copy-button";
import { TicketStatusTimeline } from "@/components/admin/ticket-status-timeline";
import { SmsHistory } from "@/components/admin/sms-history";
import { StatusActions } from "./status-actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SERVICE_LABEL: Record<Service, string> = {
  WASH: "Wash",
  IRON: "Iron",
  WASH_AND_IRON: "Wash & Iron",
  DRY_CLEAN: "Dry clean",
};

function avatarColor(seed: string): string {
  const palette = ["#0EA5E9", "#16A34A", "#0369A1", "#7C3AED", "#DB2777", "#F59E0B", "#DC2626", "#0891B2"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length]!;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

function relativeDays(date: Date): string {
  const ms = Date.now() - date.getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

type StepState = "done" | "active" | "future" | "cancelled";

function deriveSteps(ticket: {
  status: TicketStatus;
  receivedAt: Date;
  readyAt: Date | null;
  inStorageAt: Date | null;
  collectedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  pickupDatePromised: Date;
}): Array<{ key: string; label: string; when: string; state: StepState; meta?: string }> {
  const cancelled = ticket.status === "CANCELLED";
  const inStorage = !!ticket.inStorageAt;
  const ready = !!ticket.readyAt;
  const collected = !!ticket.collectedAt;

  const steps: Array<{ key: string; label: string; when: string; state: StepState; meta?: string }> = [];

  steps.push({
    key: "received",
    label: "Received",
    when: formatDate(ticket.receivedAt),
    state: cancelled ? "cancelled" : "done",
  });

  if (cancelled) {
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      when: ticket.cancelledAt ? formatDate(ticket.cancelledAt) : "—",
      state: "cancelled",
      meta: ticket.cancellationReason ?? undefined,
    });
    return steps;
  }

  steps.push({
    key: "ready",
    label: "Ready",
    when: ready ? formatDate(ticket.readyAt!) : `Pickup expected ${formatDateOnly(ticket.pickupDatePromised)}`,
    state: ready ? "done" : ticket.status === "RECEIVED" ? "active" : "future",
  });

  if (inStorage) {
    steps.push({
      key: "storage",
      label: "In storage",
      when: ticket.inStorageAt ? formatDate(ticket.inStorageAt) : "—",
      state: collected ? "done" : "active",
    });
  } else if (ready && !collected) {
    steps.push({
      key: "awaiting",
      label: "Awaiting collection",
      when: ticket.readyAt ? `${relativeDays(ticket.readyAt)} waiting` : "",
      state: "active",
    });
  }

  steps.push({
    key: "collected",
    label: "Collected",
    when: collected ? formatDate(ticket.collectedAt!) : `Pickup ${formatDateOnly(ticket.pickupDatePromised)}`,
    state: collected ? "done" : "future",
  });

  return steps;
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

  const customerStats = await db.ticket.aggregate({
    where: { customerId: ticket.customer.id, paymentStatus: "PAID" },
    _sum: { grandTotal: true },
    _count: true,
  });
  const lastCustomerVisit = await db.ticket.findFirst({
    where: { customerId: ticket.customer.id, id: { not: ticket.id } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const steps = deriveSteps(ticket);
  const itemCount = ticket.lineItems.reduce((s, l) => s + l.quantity, 0);
  const itemsSubtotal = ticket.lineItemsSubtotal;

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" /> Back to tickets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5 font-mono text-[clamp(24px,4vw,40px)] font-bold leading-none tracking-wide text-foreground">
            <span className="break-all">{ticket.ticketNumber}</span>
            <CopyButton value={ticket.ticketNumber} label="ticket number" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {ticket.paymentStatus === "PAID" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                <Check className="h-3 w-3" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Unpaid
              </span>
            )}
            {ticket.isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                <Zap className="h-3 w-3" /> Urgent
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Created {formatDate(ticket.receivedAt)} by {ticket.createdBy.name}
            </span>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        <TicketStatusTimeline steps={steps} currentStatus={ticket.status} />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Items */}
            <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
              <div className="mb-3.5 flex items-baseline justify-between">
                <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
                  Items · {itemCount} piece{itemCount === 1 ? "" : "s"}
                </h3>
              </div>
              {ticket.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-3.5 border-b border-dashed border-default py-3.5 last:border-0"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-[10px] bg-surface-muted text-navy-800 dark:text-brand-200">
                    <Illustration name={illustrationForItem(li.itemTypeNameSnapshot)} size={42} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[14.5px] font-semibold text-foreground">
                        {li.itemTypeNameSnapshot}
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        × {li.quantity}
                        {li.unit === "SQM" ? " sqm" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                        {SERVICE_LABEL[li.service]}
                      </span>
                      {li.addOns.map((a) => (
                        <span
                          key={a.id}
                          className="text-[11.5px] font-medium text-brand-700 dark:text-brand-300"
                        >
                          + {a.addOnNameSnapshot}
                        </span>
                      ))}
                      {li.isNegotiable && (
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          Negotiated
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14.5px] font-semibold tabular-nums text-foreground">
                      {formatNaira(li.lineSubtotal)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatNaira(li.unitPriceSnapshot)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
              <div className="mb-3.5 flex items-baseline justify-between">
                <h3 className="text-[16px] font-semibold tracking-tight text-foreground">Totals</h3>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <SumRow label="Items subtotal" value={formatNaira(itemsSubtotal)} />
                {ticket.ticketAddOns.map((a) => (
                  <SumRow key={a.id} label={a.addOnNameSnapshot} value={formatNaira(a.computedAmount)} />
                ))}
                {ticket.discountAmount > 0 && (
                  <SumRow
                    label={`Discount (${ticket.discountPercent}%)${ticket.discountReason ? ` — ${ticket.discountReason}` : ""}`}
                    value={`−${formatNaira(ticket.discountAmount)}`}
                    negative
                  />
                )}
                <div className="mt-1 flex items-baseline justify-between border-t border-default pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Grand total{ticket.paymentStatus === "PAID" ? " · Paid" : ""}
                  </span>
                  <span className="text-[28px] font-bold tabular-nums tracking-tight text-foreground">
                    {formatNaira(ticket.grandTotal)}
                  </span>
                </div>
                {ticket.paymentStatus === "PAID" && ticket.paidAt && (
                  <p className="text-xs text-muted-foreground">
                    Paid {formatDate(ticket.paidAt)}
                    {ticket.paidTo ? ` to ${ticket.paidTo.name}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* SMS history */}
            <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
              <div className="mb-3.5 flex items-baseline justify-between">
                <h3 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" /> SMS history
                </h3>
              </div>
              <SmsHistory
                items={ticket.smsLogs.map((s) => ({
                  id: s.id,
                  customerPhone: s.customerPhone,
                  content: s.content,
                  status: s.status,
                  createdAt: s.createdAt,
                  sentAt: s.sentAt,
                  error: s.error,
                }))}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-surface p-5 dark:border-brand-500/30 dark:from-brand-500/15 dark:to-surface">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 dark:text-brand-300">
                Next action
              </div>
              <StatusActions
                ticketId={ticket.id}
                currentStatus={ticket.status}
                paymentStatus={ticket.paymentStatus}
              />
            </div>

            <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
              <div className="mb-3.5 flex items-baseline justify-between">
                <h3 className="text-[16px] font-semibold tracking-tight text-foreground">Customer</h3>
                <Link
                  href={`/admin/customers?edit=${ticket.customer.id}`}
                  className="text-[12.5px] font-medium text-brand-700 transition-colors hover:underline dark:text-brand-300"
                >
                  Profile
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
                  style={{ background: avatarColor(ticket.customer.id) }}
                >
                  {initials(ticket.customer.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-foreground">
                    {ticket.customer.name}
                  </div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {ticket.customer.phone}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-default pt-4">
                <StatBox k="Visits" v={String(customerStats._count)} />
                <StatBox k="Lifetime" v={formatNaira(customerStats._sum.grandTotal ?? 0)} />
                <StatBox
                  k="Last visit"
                  v={lastCustomerVisit ? relativeDays(lastCustomerVisit.createdAt) + " ago" : "—"}
                />
              </div>
            </div>

            <div className="rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
              <div className="mb-3.5 flex items-baseline justify-between">
                <h3 className="text-[16px] font-semibold tracking-tight text-foreground">Timeline</h3>
              </div>
              <div className="flex flex-col pl-2">
                <TLItem
                  tone="sky"
                  icon={<Plus />}
                  top={
                    <>
                      Ticket <strong className="font-semibold">created</strong>
                    </>
                  }
                  meta={`${formatDate(ticket.receivedAt)} · ${ticket.createdBy.name}`}
                  isLast={false}
                />
                {ticket.paidAt && (
                  <TLItem
                    tone="green"
                    icon={<Wallet />}
                    top={
                      <>
                        Marked <strong className="font-semibold">paid</strong> ·{" "}
                        {formatNaira(ticket.grandTotal)}
                      </>
                    }
                    meta={`${formatDate(ticket.paidAt)}${ticket.paidTo ? ` · ${ticket.paidTo.name}` : ""}`}
                    isLast={false}
                  />
                )}
                {ticket.readyAt && (
                  <TLItem
                    tone="green"
                    icon={<Check />}
                    top={
                      <>
                        Marked <strong className="font-semibold">ready</strong>
                      </>
                    }
                    meta={formatDate(ticket.readyAt)}
                    isLast={false}
                  />
                )}
                {ticket.inStorageAt && (
                  <TLItem
                    tone="amber"
                    icon={<Archive />}
                    top={
                      <>
                        Moved to <strong className="font-semibold">storage</strong>
                      </>
                    }
                    meta={formatDate(ticket.inStorageAt)}
                    isLast={false}
                  />
                )}
                {ticket.collectedAt && (
                  <TLItem
                    tone="green"
                    icon={<Receipt />}
                    top={
                      <>
                        Marked <strong className="font-semibold">collected</strong>
                      </>
                    }
                    meta={formatDate(ticket.collectedAt)}
                    isLast
                  />
                )}
                {ticket.cancelledAt && (
                  <TLItem
                    tone="red"
                    icon={<XCircle />}
                    top={
                      <>
                        Ticket <strong className="font-semibold">cancelled</strong>
                        {ticket.cancellationReason ? ` — ${ticket.cancellationReason}` : ""}
                      </>
                    }
                    meta={formatDate(ticket.cancelledAt)}
                    isLast
                  />
                )}
                {ticket.status === "READY" && ticket.readyAt && (
                  <TLItem
                    tone="amber"
                    icon={<Clock />}
                    top={<>{relativeDays(ticket.readyAt)} awaiting collection</>}
                    meta="Now"
                    isLast
                  />
                )}
              </div>
              <div className="mt-3 border-t border-default pt-3 text-xs text-muted-foreground">
                Pickup promised:{" "}
                <strong className="font-semibold text-foreground">
                  {formatDateOnly(ticket.pickupDatePromised)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SumRow({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          negative ? "text-destructive" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StatBox({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {k}
      </div>
      <div className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{v}</div>
    </div>
  );
}

const TL_TONE_DOT: Record<"sky" | "green" | "amber" | "red", string> = {
  sky: "bg-brand-100 border-brand-300 text-brand-700 dark:bg-brand-500/18 dark:border-brand-500/36 dark:text-brand-300",
  green:
    "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-500/22 dark:border-emerald-500/36 dark:text-emerald-300",
  amber:
    "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-500/22 dark:border-amber-500/36 dark:text-amber-300",
  red: "bg-red-100 border-red-300 text-red-700 dark:bg-red-500/22 dark:border-red-500/36 dark:text-red-300",
};

function TLItem({
  tone,
  icon,
  top,
  meta,
  isLast,
}: {
  tone: "sky" | "green" | "amber" | "red";
  icon: React.ReactNode;
  top: React.ReactNode;
  meta: string;
  isLast: boolean;
}) {
  return (
    <div className="relative grid grid-cols-[28px_1fr] gap-3 py-2.5">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[13px] top-8 bottom-[-10px] w-0.5 bg-[hsl(var(--border))]"
        />
      )}
      <div
        className={cn(
          "z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 [&_svg]:h-3 [&_svg]:w-3",
          TL_TONE_DOT[tone]
        )}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <div className="text-[13px] text-foreground">{top}</div>
        <div className="text-[11.5px] text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}
