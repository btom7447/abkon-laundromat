import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Mail, Phone, Building2, Clock, Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StaffModal } from "./staff-modal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ new?: string; edit?: string; role?: string }>;
}

const ROLE_PILL_CLS: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  RECEPTION: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
};

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { new: newFlag, edit: editId, role: roleFilter } = await searchParams;

  const [users, branches] = await Promise.all([
    db.user.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { branch: { select: { id: true, name: true, code: true } } },
    }),
    db.branch.findMany({
      where: { active: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Modal target
  let editTarget = null as Awaited<ReturnType<typeof db.user.findUnique>> | null;
  if (editId) {
    editTarget = await db.user.findUnique({ where: { id: editId } });
    if (editId && !editTarget) notFound();
  }
  const showNewModal = newFlag === "1" && !editTarget;

  // KPI counts
  const activeCount = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const receptionCount = users.filter((u) => u.role === "RECEPTION").length;
  const lockedCount = users.filter((u) => u.lockedUntil && u.lockedUntil > new Date()).length;

  // Filter
  const filtered = roleFilter === "ADMIN" || roleFilter === "RECEPTION"
    ? users.filter((u) => u.role === roleFilter)
    : users;

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Staff accounts
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Manage admin and reception users. Admins see every branch; reception staff are
            scoped to a single branch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          <Link
            href="/admin/users?new=1"
            scroll={false}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            <Plus /> New staff
          </Link>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiBox label="Total staff" value={users.length} sub={`${activeCount} active`} />
          <KpiBox label="Admins" value={adminCount} sub="All-branch access" />
          <KpiBox label="Reception" value={receptionCount} sub="Branch-scoped" />
          <KpiBox
            label="Locked"
            value={lockedCount}
            sub={lockedCount > 0 ? "Account lockouts" : "None"}
            tone={lockedCount > 0 ? "warn" : undefined}
          />
        </div>

        {/* Pending deletion requests — admin needs to see + act on these */}
        {users.some((u) => u.deletionRequestedAt) && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4">
              <AlertTriangle className="text-amber-700 dark:text-amber-300" />
              <h3 className="text-[13px] font-semibold text-amber-900 dark:text-amber-100">
                Account deletion requests
              </h3>
              <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[10.5px] font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                {users.filter((u) => u.deletionRequestedAt).length}
              </span>
            </div>
            <p className="text-[11.5px] text-amber-800/85 dark:text-amber-200/85">
              These users have asked for their account to be removed. Open the staff card to review
              the reason and confirm or reject.
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {users
                .filter((u) => u.deletionRequestedAt)
                .map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/admin/users?edit=${u.id}`}
                      scroll={false}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-800/60 dark:hover:bg-amber-900/60"
                    >
                      <Mail className="h-2.5 w-2.5" />
                      {u.email}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Role filter chip bar */}
        {users.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <RoleChip href="/admin/users" active={!roleFilter} label="All staff" count={users.length} />
            {adminCount > 0 && (
              <RoleChip
                href="/admin/users?role=ADMIN"
                active={roleFilter === "ADMIN"}
                label="Admins"
                count={adminCount}
              />
            )}
            {receptionCount > 0 && (
              <RoleChip
                href="/admin/users?role=RECEPTION"
                active={roleFilter === "RECEPTION"}
                label="Reception"
                count={receptionCount}
              />
            )}
          </div>
        )}

        {users.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No staff accounts yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create your first staff account to get started. Admins can manage everything; reception
              staff are scoped to their branch.
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-default bg-card p-5 text-center text-sm text-muted-foreground">
            No staff in this role.{" "}
            <Link
              href="/admin/users"
              scroll={false}
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Clear filter
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((u) => (
              <StaffCard key={u.id} u={u} />
            ))}
          </div>
        )}
      </div>

      {editTarget && <StaffModal mode="edit" user={editTarget} branches={branches} />}
      {showNewModal && <StaffModal mode="new" user={null} branches={branches} />}
    </>
  );
}

// ── Primitives ────────────────────────────────────────────────────────

function KpiBox({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]",
        tone === "warn"
          ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/15"
          : "border-default bg-card"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-[24px] font-bold leading-[1.05] tabular-nums tracking-tight md:text-[26px]",
          tone === "warn" ? "text-amber-700 dark:text-amber-300" : "text-foreground"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function RoleChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-800/60 dark:bg-navy-800 dark:text-brand-200"
          : "border-default bg-surface text-foreground/80 hover:bg-surface-muted"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-px text-[10.5px] tabular-nums",
          active
            ? "bg-brand-200 text-brand-800 dark:bg-navy-700 dark:text-brand-200"
            : "bg-surface-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function StaffCard({
  u,
}: {
  u: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: Role;
    branch: { id: string; name: string; code: string } | null;
    lastLoginAt: Date | null;
    lockedUntil: Date | null;
    active: boolean;
  };
}) {
  const isLocked = !!u.lockedUntil && u.lockedUntil > new Date();
  return (
    <Link
      href={`/admin/users?edit=${u.id}`}
      scroll={false}
      className="group flex flex-col gap-3 rounded-xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-all hover:-translate-y-px hover:border-brand-300"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <Avatar name={u.name} seed={u.email} src={u.avatarUrl} size={48} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold text-foreground">{u.name}</h3>
            {!u.active && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Inactive
              </span>
            )}
            {isLocked && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                <Lock className="h-2.5 w-2.5" />
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0">
            <Mail />
            <span className="truncate">{u.email}</span>
          </div>
        </div>
      </div>

      {/* Tags row — role + branch */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium [&_svg]:h-2.5 [&_svg]:w-2.5",
            ROLE_PILL_CLS[u.role]
          )}
        >
          <ShieldCheck />
          {u.role === "ADMIN" ? "Admin" : "Reception"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] font-medium text-foreground [&_svg]:h-2.5 [&_svg]:w-2.5">
          <Building2 />
          {u.branch ? `${u.branch.name} · ${u.branch.code}` : "All branches"}
        </span>
      </div>

      {/* Footer — last login + optional phone */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-default pt-3 text-[11.5px] text-muted-foreground [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0">
        <span className="inline-flex items-center gap-1.5">
          <Clock />
          <span>
            Last login{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
            </span>
          </span>
        </span>
        {u.phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone />
            <span className="font-mono">{u.phone}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
