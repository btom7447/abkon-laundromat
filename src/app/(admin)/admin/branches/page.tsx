import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, MapPin, Clock, Truck, Users, Shirt, Zap, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchModal } from "./branch-modal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ new?: string; edit?: string }>;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function BranchesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { new: newFlag, edit: editId } = await searchParams;

  const branches = await db.branch.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true, itemTypes: true } } },
  });

  if (branches.length === 0 && !newFlag) {
    // First-load empty state — only render the create modal when the admin
    // explicitly asks via ?new=1, otherwise show a hint.
  }

  // Modal target
  let editTarget = null as Awaited<ReturnType<typeof db.branch.findUnique>> | null;
  if (editId) {
    editTarget = await db.branch.findUnique({ where: { id: editId } });
    if (editId && !editTarget) notFound();
  }
  const showNewModal = newFlag === "1" && !editTarget;

  const activeCount = branches.filter((b) => b.active).length;
  const totalStaff = branches.reduce((s, b) => s + b._count.users, 0);
  const totalItems = branches.reduce((s, b) => s + b._count.itemTypes, 0);

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Branches
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Manage branch locations, operating hours, and pricing config. Each branch has its own
            catalog, staff, and ticket numbering.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <Link
            href="/admin/branches?new=1"
            scroll={false}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            <Plus /> New branch
          </Link>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiBox label="Active branches" value={activeCount} sub={`${branches.length} total`} />
          <KpiBox label="Total staff" value={totalStaff} sub="Across all branches" />
          <KpiBox label="Total items" value={totalItems} sub="Across all catalogs" />
        </div>

        {branches.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No branches yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create your first branch to get started. Each branch has its own ticket numbering,
              staff, and catalog.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((b) => (
              <BranchCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>

      {editTarget && <BranchModal mode="edit" branch={editTarget} />}
      {showNewModal && <BranchModal mode="new" branch={null} />}
    </>
  );
}

// ── Primitives ────────────────────────────────────────────────────────

function KpiBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-1.5 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className="text-[26px] font-bold leading-[1.05] tabular-nums tracking-tight text-foreground">
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function BranchCard({
  b,
}: {
  b: {
    id: string;
    name: string;
    code: string;
    address: string | null;
    serviceAreas: string[];
    businessHoursOpen: string;
    businessHoursClose: string;
    businessDays: number[];
    homeDeliveryFee: number;
    urgentSurchargeAmount: number;
    urgentSurchargeMode: string;
    active: boolean;
    _count: { users: number; itemTypes: number };
  };
}) {
  const businessDaysSorted = [...b.businessDays].sort((a, b) => a - b);
  const urgentLabel =
    b.urgentSurchargeMode === "FLAT" ? formatNaira(b.urgentSurchargeAmount) : `${b.urgentSurchargeAmount}%`;

  return (
    <Link
      href={`/admin/branches?edit=${b.id}`}
      scroll={false}
      className="group flex flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-all hover:-translate-y-px hover:border-brand-300"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300">
          <Building2 className="h-6 w-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold text-foreground">{b.name}</h3>
            <code className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[10.5px] font-semibold text-foreground">
              {b.code}
            </code>
          </div>
          {b.address && (
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0">
              <MapPin />
              <span className="truncate">{b.address}</span>
            </div>
          )}
          {!b.active && (
            <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Service areas as tags */}
      {b.serviceAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {b.serviceAreas.slice(0, 6).map((area) => (
            <span
              key={area}
              className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
            >
              {area}
            </span>
          ))}
          {b.serviceAreas.length > 6 && (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{b.serviceAreas.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Hours + Days */}
      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-default pt-3 text-[11.5px] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0">
        <span className="inline-flex items-center gap-1.5">
          <Clock />
          <span className="font-semibold tabular-nums text-foreground">
            {b.businessHoursOpen}–{b.businessHoursClose}
          </span>
        </span>
        <span className="inline-flex flex-wrap items-center gap-0.5">
          {DAY_SHORT.map((label, idx) => {
            const isOpen = businessDaysSorted.includes(idx);
            return (
              <span
                key={idx}
                className={cn(
                  "inline-flex h-5 min-w-7 items-center justify-center rounded text-[10px] font-semibold uppercase tracking-tight",
                  isOpen
                    ? "bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300"
                    : "bg-surface-muted text-muted-foreground/60"
                )}
                title={isOpen ? `Open ${label}` : `Closed ${label}`}
              >
                {label[0]}
              </span>
            );
          })}
        </span>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-4 gap-3 border-t border-dashed border-default pt-3">
        <FooterStat icon={<Users />} label="Staff" value={b._count.users} />
        <FooterStat icon={<Shirt />} label="Items" value={b._count.itemTypes} />
        <FooterStat icon={<Truck />} label="Delivery" value={formatNaira(b.homeDeliveryFee)} small />
        <FooterStat icon={<Zap />} label="Urgent" value={urgentLabel} small />
      </div>
    </Link>
  );
}

function FooterStat({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground [&_svg]:h-3 [&_svg]:w-3">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "truncate font-semibold tabular-nums text-foreground",
          small ? "text-[12.5px]" : "text-[14px]"
        )}
      >
        {value}
      </span>
    </div>
  );
}
