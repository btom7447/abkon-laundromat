import Link from "next/link";
import {
  Plus,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  Tickets as TicketsIcon,
  FilterX,
  Clock,
} from "lucide-react";
import type { Prisma, TicketStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { getActiveBranchCookie } from "@/server/actions/branch-switch";
import { formatDate, formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewToggle, type ViewMode } from "@/components/admin/view-toggle";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUSES: TicketStatus[] = ["RECEIVED", "READY", "IN_STORAGE", "COLLECTED", "CANCELLED"];

const STATUS_LABEL: Record<TicketStatus, string> = {
  RECEIVED: "Received",
  READY: "Ready",
  IN_STORAGE: "In storage",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE_CLS: Record<TicketStatus, string> = {
  RECEIVED: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  READY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  IN_STORAGE: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  COLLECTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const STATUS_STRIPE_CLS: Record<TicketStatus, string> = {
  RECEIVED: "bg-brand-500",
  READY: "bg-emerald-500",
  IN_STORAGE: "bg-amber-500",
  COLLECTED: "bg-slate-500",
  CANCELLED: "bg-red-500",
};

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

function avatarColor(seed: string): string {
  const palette = ["#0EA5E9", "#16A34A", "#0369A1", "#7C3AED", "#DB2777", "#F59E0B", "#DC2626", "#0891B2"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length]!;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    urgent?: string;
    q?: string;
    page?: string;
    focus?: string;
    view?: string;
  }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { status, payment, urgent, q, page: pageStr, focus, view: viewParam } = await searchParams;
  const view: ViewMode = viewParam === "grid" ? "grid" : "list";
  const cookieBranch = await getActiveBranchCookie();
  const ctx = await resolveBranchContext(user, cookieBranch);

  if (!ctx) {
    return (
      <div className="p-7">
        <Card>
          <CardHeader>
            <CardTitle>No branches set up</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.role === "ADMIN" ? "Create a branch first." : "You are not assigned to a branch."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const page = Math.max(1, Number(pageStr) || 1);
  const query = (q ?? "").trim();
  const statusFilter = STATUSES.includes(status as TicketStatus) ? (status as TicketStatus) : undefined;
  const paymentFilter = payment === "PAID" ? "PAID" : payment === "UNPAID" ? "UNPAID" : undefined;
  const urgentOnly = urgent === "1";
  const branchId = ctx.branchId;

  const where: Prisma.TicketWhereInput = {
    branchId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentFilter ? { paymentStatus: paymentFilter as PaymentStatus } : {}),
    ...(urgentOnly ? { isUrgent: true } : {}),
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

  const [tickets, total, statusCounts, paidStats, unpaidStats, urgentCount, avgValueAgg] = await Promise.all([
    db.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { customer: { select: { name: true, phone: true } }, _count: { select: { lineItems: true } } },
    }),
    db.ticket.count({ where }),
    db.ticket.groupBy({ by: ["status"], where: { branchId }, _count: true }),
    db.ticket.aggregate({ where: { ...where, paymentStatus: "PAID" }, _sum: { grandTotal: true }, _count: true }),
    db.ticket.aggregate({ where: { ...where, paymentStatus: "UNPAID" }, _sum: { grandTotal: true }, _count: true }),
    db.ticket.count({ where: { ...where, isUrgent: true } }),
    db.ticket.aggregate({ where, _avg: { grandTotal: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countMap = new Map(statusCounts.map((c) => [c.status, c._count]));
  const allCount = statusCounts.reduce((s, c) => s + c._count, 0);

  function buildQuery(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("payment", paymentFilter);
    if (urgentOnly) params.set("urgent", "1");
    if (view === "grid") params.set("view", "grid");
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "/admin/tickets";
  }

  const listHref = buildQuery({ view: undefined, page: undefined });
  const gridHref = buildQuery({ view: "grid", page: undefined });

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Tickets
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground md:text-sm">{ctx.branchName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <ViewToggle value={view} listHref={listHref} gridHref={gridHref} />
          <Link
            href="/admin/tickets/new"
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            <Plus /> New ticket
          </Link>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiBox label="Filtered total" value={total} sub={`of ${allCount} all-time`} />
          <KpiBox
            label="Paid"
            value={<span className="text-emerald-600 dark:text-emerald-400">{paidStats._count}</span>}
            sub={formatNaira(paidStats._sum.grandTotal ?? 0)}
          />
          <KpiBox
            label="Unpaid"
            value={unpaidStats._count}
            sub={formatNaira(unpaidStats._sum.grandTotal ?? 0)}
            tone={unpaidStats._count > 0 ? "amber" : "default"}
          />
          <KpiBox
            label="Urgent"
            value={urgentCount}
            sub="In filtered set"
            tone={urgentCount > 0 ? "amber" : "default"}
          />
          <KpiBox
            label="Avg value"
            value={formatNaira(Math.round(avgValueAgg._avg.grandTotal ?? 0))}
            sub="Per ticket"
          />
        </div>

        {/* Filter chip bar */}
        <form
          action=""
          method="GET"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
        >
          <Chip href={buildQuery({ status: undefined, page: undefined })} active={!statusFilter}>
            All <ChipCount active={!statusFilter}>{allCount}</ChipCount>
          </Chip>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              href={buildQuery({ status: s, page: undefined })}
              active={statusFilter === s}
            >
              {STATUS_LABEL[s]}{" "}
              <ChipCount active={statusFilter === s}>{countMap.get(s) ?? 0}</ChipCount>
            </Chip>
          ))}
          <span className="h-5 w-px bg-[hsl(var(--border))]" aria-hidden />
          <Chip
            href={buildQuery({ payment: "PAID", page: undefined })}
            active={paymentFilter === "PAID"}
          >
            Paid
          </Chip>
          <Chip
            href={buildQuery({ payment: "UNPAID", page: undefined })}
            active={paymentFilter === "UNPAID"}
          >
            Unpaid
          </Chip>
          <Chip
            href={buildQuery({ urgent: urgentOnly ? undefined : "1", page: undefined })}
            active={urgentOnly}
          >
            <Zap className="h-3 w-3" /> Urgent only
          </Chip>
          <span className="ml-auto" />
          <div className="relative w-full min-w-[200px] flex-1 md:w-auto md:max-w-[320px] md:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search ticket #, name, phone…"
              autoFocus={focus === "search"}
              className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-[13px] text-foreground transition-colors focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-500/20"
            />
          </div>
        </form>

        {/* Ticket cards */}
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-default bg-card py-12 text-center shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            {allCount === 0 ? (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-navy-800 dark:text-brand-300">
                  <TicketsIcon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">No tickets yet</h3>
                  <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-muted-foreground">
                    Create your first ticket for {ctx.branchName} — receive a customer&apos;s bag and index its contents.
                  </p>
                </div>
                <Link
                  href="/admin/tickets/new"
                  className="mt-1 inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
                >
                  <Plus /> New ticket
                </Link>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                  <FilterX className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">
                    No tickets match those filters
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted-foreground">
                    {allCount} ticket{allCount === 1 ? "" : "s"} on file — try clearing a filter or refining your search.
                  </p>
                </div>
                <Link
                  href="/admin/tickets"
                  className="mt-1 inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted"
                >
                  Clear filters
                </Link>
              </>
            )}
          </div>
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-2.5"
            }
          >
            {tickets.map((t) => {
              const stripe = STATUS_STRIPE_CLS[t.status];
              const statusBadge = STATUS_BADGE_CLS[t.status];
              const card = (
                <>
                  <span
                    aria-hidden
                    className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", stripe)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-default pb-3">
                    <span className="font-mono text-[16px] font-semibold tracking-wide text-foreground">
                      {t.ticketNumber}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.isUrgent && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                          <Zap className="h-3 w-3" /> Urgent
                        </Badge>
                      )}
                      {t.paymentStatus === "PAID" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          Unpaid
                        </Badge>
                      )}
                      <Badge className={statusBadge}>{STATUS_LABEL[t.status]}</Badge>
                    </div>
                  </div>
                  {view === "grid" ? (
                    <>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold leading-none text-white"
                            style={{ background: avatarColor(t.customer.phone) }}
                          >
                            {initials(t.customer.name)}
                          </span>
                          <span className="truncate text-[14px] font-semibold text-foreground">
                            {t.customer.name}
                          </span>
                        </div>
                        <span className="shrink-0 text-[16px] font-bold tabular-nums tracking-tight text-foreground">
                          {formatNaira(t.grandTotal)}
                        </span>
                      </div>
                      <div className="mt-1.5 font-mono text-[12px] text-muted-foreground">
                        {t.customer.phone}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-default pt-2.5 text-[11.5px] text-muted-foreground">
                        <span>
                          {t._count.lineItems} line{t._count.lineItems === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(t.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(t.pickupDatePromised)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                          style={{ background: avatarColor(t.customer.phone) }}
                        >
                          {initials(t.customer.name)}
                        </div>
                        <div className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-[14px] font-semibold text-foreground">
                            {t.customer.name}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-muted-foreground">
                            <span className="font-mono">{t.customer.phone}</span>
                            <span className="text-muted-foreground/60">·</span>
                            <span>
                              {t._count.lineItems} line{t._count.lineItems === 1 ? "" : "s"}
                            </span>
                            <span className="text-muted-foreground/60">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDate(t.createdAt)}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[18px] font-bold leading-none tabular-nums tracking-tight text-foreground">
                          {formatNaira(t.grandTotal)}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground [&_svg]:h-3 [&_svg]:w-3">
                          <Calendar /> Pickup {formatDate(t.pickupDatePromised)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
              return (
                <Link
                  key={t.id}
                  href={`/admin/tickets/${t.id}`}
                  className="relative block rounded-xl border border-default bg-card py-4 pl-6 pr-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_-2px_rgb(15_23_42/0.10)]"
                >
                  {card}
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <PageBtn href={page > 1 ? buildQuery({ page: String(page - 1) }) : undefined}>
                <ChevronLeft /> Previous
              </PageBtn>
              <PageBtn href={page < totalPages ? buildQuery({ page: String(page + 1) }) : undefined}>
                Next <ChevronRight />
              </PageBtn>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Local primitives ────────────────────────────────────────────────────

type KpiTone = "default" | "amber";

function KpiBox({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: KpiTone;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]",
        tone === "amber"
          ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
          : "border-default bg-card"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className="text-[26px] font-bold leading-[1.05] tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-800/60 dark:bg-navy-800 dark:text-brand-200"
          : "border-default bg-surface text-foreground/80 hover:bg-surface-muted"
      )}
    >
      {children}
    </Link>
  );
}

function ChipCount({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-px text-[10.5px] tabular-nums",
        active
          ? "bg-brand-200 text-brand-800 dark:bg-navy-700 dark:text-brand-200"
          : "bg-surface-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function PageBtn({ href, children }: { href?: string; children: React.ReactNode }) {
  const cls =
    "inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-strong bg-surface px-3 text-[13px] font-medium text-foreground transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5";
  if (!href) {
    return <span className={cn(cls, "cursor-not-allowed opacity-40")}>{children}</span>;
  }
  return (
    <Link href={href} className={cn(cls, "hover:bg-surface-muted")}>
      {children}
    </Link>
  );
}
