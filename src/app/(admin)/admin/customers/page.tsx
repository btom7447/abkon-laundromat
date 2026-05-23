import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { getActiveBranchCookie } from "@/server/actions/branch-switch";
import { formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CustomerModal, type CustomerBand } from "./customer-modal";

export const dynamic = "force-dynamic";

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
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const BAND_PILL_CLS: Record<CustomerBand, string> = {
  regular: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  active: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  new: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  dormant: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

const BAND_LABEL: Record<CustomerBand, string> = {
  regular: "Regular",
  active: "Active",
  new: "New",
  dormant: "Dormant",
};

function classifyBand(args: {
  visits: number;
  createdAt: Date;
  lastVisit: Date | null;
}): CustomerBand {
  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000);
  if (args.visits >= 6) return "regular";
  if (args.visits <= 1 && args.createdAt > oneWeekAgo) return "new";
  if (args.lastVisit && args.lastVisit.getTime() < Date.now() - 60 * 86_400_000) return "dormant";
  return "active";
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    focus?: string;
    edit?: string;
    new?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { q, filter, focus, edit: editId, new: newFlag } = await searchParams;
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

  const query = (q ?? "").trim();
  const branchId = ctx.branchId;
  const branchName = ctx.branchName;
  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [customers, totalCount, newThisWeekCount, topSpender, allTickets] = await Promise.all([
    db.customer.findMany({
      where: {
        branchId,
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
    }),
    db.customer.count({ where: { branchId } }),
    db.customer.count({ where: { branchId, createdAt: { gte: oneWeekAgo } } }),
    db.ticket.groupBy({
      by: ["customerId"],
      where: { branchId, paymentStatus: "PAID" },
      _sum: { grandTotal: true },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 1,
    }),
    db.ticket.aggregate({
      where: { branchId, paymentStatus: "PAID" },
      _sum: { grandTotal: true },
      _count: true,
    }),
  ]);

  const topSpenderId = topSpender[0]?.customerId;
  const topSpenderTotal = topSpender[0]?._sum.grandTotal ?? 0;
  const topSpenderCustomer = topSpenderId
    ? await db.customer.findUnique({ where: { id: topSpenderId }, select: { name: true } })
    : null;

  const lifetimeSpend = await db.ticket.groupBy({
    by: ["customerId"],
    where: { branchId, paymentStatus: "PAID", customerId: { in: customers.map((c) => c.id) } },
    _sum: { grandTotal: true },
    _max: { createdAt: true },
  });
  const spendMap = new Map(lifetimeSpend.map((g) => [g.customerId, g]));

  const enriched = customers.map((c) => {
    const spend = spendMap.get(c.id);
    const ltv = spend?._sum.grandTotal ?? 0;
    const lastVisit = spend?._max.createdAt ?? null;
    const visits = c._count.tickets;
    const band = classifyBand({ visits, createdAt: c.createdAt, lastVisit });
    return { ...c, ltv, lastVisit, band };
  });

  const totalLifetime = allTickets._sum.grandTotal ?? 0;
  const avgLifetime = totalCount > 0 ? Math.round(totalLifetime / Math.max(1, totalCount)) : 0;

  const counts = {
    all: totalCount,
    regular: enriched.filter((c) => c.band === "regular").length,
    active: enriched.filter((c) => c.band === "active").length,
    new: enriched.filter((c) => c.band === "new").length,
    dormant: enriched.filter((c) => c.band === "dormant").length,
  };

  const filtered = filter ? enriched.filter((c) => c.band === filter) : enriched;

  // Load the edit target separately so it works even if not on this page of the list.
  let editTarget: {
    customer: NonNullable<Awaited<ReturnType<typeof db.customer.findUnique>>>;
    band: CustomerBand;
    stats: {
      visits: number;
      lifetime: number;
      lastVisit: Date | null;
      recentTickets: Array<{
        id: string;
        ticketNumber: string;
        status: string;
        paymentStatus: string;
        grandTotal: number;
        createdAt: Date;
      }>;
    };
  } | null = null;
  if (editId) {
    const target = await db.customer.findUnique({ where: { id: editId } });
    if (target && target.branchId === branchId) {
      const [recentTickets, aggregate] = await Promise.all([
        db.ticket.findMany({
          where: { customerId: target.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            paymentStatus: true,
            grandTotal: true,
            createdAt: true,
          },
        }),
        db.ticket.aggregate({
          where: { customerId: target.id, paymentStatus: "PAID" },
          _sum: { grandTotal: true },
          _count: true,
        }),
      ]);
      const totalVisits = await db.ticket.count({ where: { customerId: target.id } });
      const lastVisit = recentTickets[0]?.createdAt ?? null;
      const band = classifyBand({
        visits: totalVisits,
        createdAt: target.createdAt,
        lastVisit,
      });
      editTarget = {
        customer: target,
        band,
        stats: {
          visits: totalVisits,
          lifetime: aggregate._sum.grandTotal ?? 0,
          lastVisit,
          recentTickets,
        },
      };
    }
  }

  const showNewModal = newFlag === "1" && !editTarget;

  function buildQuery(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filter) params.set("filter", filter);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "/admin/customers";
  }

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Customers
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            {totalCount} customers · {newThisWeekCount} new this week
            {topSpenderCustomer
              ? ` · top spender is ${topSpenderCustomer.name} (${formatNaira(topSpenderTotal)} lifetime)`
              : ""}
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <Link
            href={buildQuery({ new: "1" })}
            scroll={false}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            <Plus /> New customer
          </Link>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBox
            label="Total customers"
            value={totalCount}
            sub={newThisWeekCount > 0 ? `+${newThisWeekCount} this week` : "All-time"}
          />
          <KpiBox
            label="New this week"
            value={newThisWeekCount}
            sub="Created in the last 7 days"
          />
          <KpiBox
            label="Top spender"
            value={topSpenderCustomer?.name ?? "—"}
            valueLg={false}
            sub={
              topSpenderTotal > 0
                ? `${formatNaira(topSpenderTotal)} lifetime`
                : "No paid tickets yet"
            }
          />
          <KpiBox
            label="Avg lifetime value"
            value={formatNaira(avgLifetime)}
            sub="Across all customers"
          />
        </div>

        {/* Filter chip bar */}
        <form
          action=""
          method="GET"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
        >
          <Chip href={buildQuery({ filter: undefined })} active={!filter}>
            All <ChipCount active={!filter}>{counts.all}</ChipCount>
          </Chip>
          <Chip href={buildQuery({ filter: "regular" })} active={filter === "regular"}>
            Regulars <ChipCount active={filter === "regular"}>{counts.regular}</ChipCount>
          </Chip>
          <Chip href={buildQuery({ filter: "active" })} active={filter === "active"}>
            Active <ChipCount active={filter === "active"}>{counts.active}</ChipCount>
          </Chip>
          <Chip href={buildQuery({ filter: "new" })} active={filter === "new"}>
            New <ChipCount active={filter === "new"}>{counts.new}</ChipCount>
          </Chip>
          <Chip href={buildQuery({ filter: "dormant" })} active={filter === "dormant"}>
            Dormant <ChipCount active={filter === "dormant"}>{counts.dormant}</ChipCount>
          </Chip>
          <span className="ml-auto" />
          <div className="relative w-full min-w-50 flex-1 md:w-auto md:max-w-80 md:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name or phone…"
              autoFocus={focus === "search"}
              className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-[13px] text-foreground transition-colors focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-500/20"
            />
          </div>
        </form>

        {/* Cards — dense responsive grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-default bg-card p-5 text-center text-sm text-muted-foreground">
            {query ? "No matches." : "No customers yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={buildQuery({ edit: c.id })}
                scroll={false}
                className="group flex flex-col gap-2.5 rounded-xl border border-default bg-card p-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-all hover:-translate-y-px hover:border-brand-300"
              >
                {/* Header: avatar + name/phone stacked */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold text-white"
                    style={{ background: avatarColor(c.phone) }}
                  >
                    {initials(c.name)}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-[13.5px] font-semibold text-foreground">
                      {c.name}
                    </span>
                    <span className="truncate font-mono text-[11.5px] text-muted-foreground">
                      {c.phone}
                    </span>
                  </div>
                </div>

                {/* Footer: band tag + lifetime */}
                <div className="flex items-center justify-between gap-2 border-t border-dashed border-default pt-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      BAND_PILL_CLS[c.band]
                    )}
                  >
                    {BAND_LABEL[c.band]}
                  </span>
                  <span className="text-[13px] font-bold tabular-nums tracking-tight text-foreground">
                    {formatNaira(c.ltv)}
                  </span>
                </div>
                <div className="-mt-1 text-[10.5px] text-muted-foreground">
                  {c._count.tickets} ticket{c._count.tickets === 1 ? "" : "s"}
                  {c.lastVisit && ` · ${relativeDays(c.lastVisit)}`}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <CustomerModal
          mode="edit"
          customer={editTarget.customer}
          stats={editTarget.stats}
          band={editTarget.band}
          branchId={branchId}
          branchName={branchName}
        />
      )}
      {showNewModal && (
        <CustomerModal
          mode="new"
          customer={null}
          stats={null}
          band="new"
          branchId={branchId}
          branchName={branchName}
        />
      )}
    </>
  );
}

// ── Primitives ────────────────────────────────────────────────────────

function KpiBox({
  label,
  value,
  sub,
  valueLg = true,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueLg?: boolean;
}) {
  return (
    <div className="relative flex flex-col gap-1.5 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-bold leading-[1.05] tracking-tight text-foreground",
          valueLg ? "text-[26px] tabular-nums" : "truncate text-[18px]"
        )}
      >
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
