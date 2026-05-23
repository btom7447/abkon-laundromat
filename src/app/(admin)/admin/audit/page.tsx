import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  Coins,
  LogIn,
  Wallet,
  Receipt,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

type Severity = "info" | "create" | "update" | "warn" | "danger";

function categorize(action: string): {
  severity: Severity;
  icon: React.ComponentType<{ className?: string }>;
} {
  const a = action.toLowerCase();
  if (a.includes("failure") || a.includes("locked") || a.includes("rate_limited") || a.includes("blocked")) {
    return { severity: "danger", icon: ShieldAlert };
  }
  if (a.includes("login_success")) return { severity: "info", icon: LogIn };
  if (a.includes("login")) return { severity: "info", icon: Shield };
  if (a.includes("price_changed") || a.includes("discount")) {
    return { severity: "warn", icon: Coins };
  }
  if (a.includes("cash_reconciliation")) return { severity: "update", icon: Wallet };
  if (a.includes("ticket_created")) return { severity: "create", icon: Receipt };
  if (a.includes("_created")) return { severity: "create", icon: Plus };
  if (a.includes("_deleted") || a.includes("_removed")) return { severity: "danger", icon: Trash2 };
  if (a.includes("_updated") || a.includes("_changed")) return { severity: "update", icon: Pencil };
  return { severity: "info", icon: Activity };
}

const SEV_DOT_CLS: Record<Severity, string> = {
  info: "bg-slate-400 dark:bg-slate-500",
  create: "bg-emerald-500",
  update: "bg-sky-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
};

const SEV_ICON_TINT: Record<Severity, string> = {
  info: "text-slate-600 dark:text-slate-300",
  create: "text-emerald-700 dark:text-emerald-300",
  update: "text-sky-700 dark:text-sky-300",
  warn: "text-amber-700 dark:text-amber-300",
  danger: "text-red-700 dark:text-red-300",
};

function humanize(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function entityHumanized(type: string): string {
  return type.replace(/_/g, " ");
}

/** Format a date as HH:mm:ss in 24h, suitable for monospace alignment. */
function logTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayHeader(d: Date): string {
  const today = new Date();
  const todayIso = isoDateLocal(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dIso = isoDateLocal(d);
  if (dIso === todayIso) return "Today";
  if (dIso === isoDateLocal(yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [logs, total, todayCount, weekCount, securityCount] = await Promise.all([
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
    db.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
    db.auditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.auditLog.count({
      where: {
        OR: [
          { action: { contains: "failure" } },
          { action: { contains: "locked" } },
          { action: { contains: "rate_limited" } },
          { action: { contains: "blocked" } },
        ],
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Group log entries by local day for sticky-style headers in the feed
  const grouped = logs.reduce<Array<{ day: string; date: Date; rows: typeof logs }>>(
    (acc, log) => {
      const dayKey = isoDateLocal(log.createdAt);
      const last = acc[acc.length - 1];
      if (last && last.day === dayKey) {
        last.rows.push(log);
      } else {
        acc.push({ day: dayKey, date: log.createdAt, rows: [log] });
      }
      return acc;
    },
    []
  );

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Audit log
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Append-only record of every configuration change and security-relevant action.
            Grouped by day, newest first.
          </p>
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiBox label="Total entries" value={total} sub="All-time" />
          <KpiBox label="Today" value={todayCount} sub="Since midnight" />
          <KpiBox label="Past 7 days" value={weekCount} sub="Including today" />
          <KpiBox
            label="Security events"
            value={securityCount}
            sub={securityCount > 0 ? "Failures / lockouts" : "Clean record"}
            tone={securityCount > 0 ? "warn" : undefined}
          />
        </div>

        {/* Log feed */}
        <div className="overflow-hidden rounded-xl border border-default bg-card shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          {/* Feed header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default bg-surface-muted/30 px-4 py-3 md:px-5">
            <div className="flex flex-col gap-0.5">
              <h3 className="flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-muted-foreground">
                <Activity />
                Activity feed
              </h3>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Page {page} of {totalPages} · {total} entr{total === 1 ? "y" : "ies"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10.5px]">
              <LegendDot tone="create" label="Create" />
              <LegendDot tone="update" label="Update" />
              <LegendDot tone="warn" label="Pricing" />
              <LegendDot tone="danger" label="Security" />
            </div>
          </div>

          {logs.length === 0 ? (
            <Card className="m-4 rounded-lg border-dashed">
              <CardHeader>
                <CardTitle>No audit entries yet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Configuration changes, sign-ins, and other security-relevant actions will appear
                here as they happen.
              </CardContent>
            </Card>
          ) : (
            <div>
              {grouped.map((group) => (
                <section key={group.day} className="border-b border-default last:border-0">
                  <header className="sticky top-0 z-10 flex items-center justify-between border-b border-default bg-card/95 px-4 py-2 backdrop-blur md:px-5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {formatDayHeader(group.date)}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground tabular-nums">
                      {group.rows.length} entr{group.rows.length === 1 ? "y" : "ies"}
                    </span>
                  </header>
                  {group.rows.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-card px-4 py-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <span className="text-[12px] text-muted-foreground tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <PaginationButton
                href={page > 1 ? `?page=${page - 1}` : null}
                direction="prev"
                label="Newer"
              />
              <PaginationButton
                href={page < totalPages ? `?page=${page + 1}` : null}
                direction="next"
                label="Older"
              />
            </div>
          </div>
        )}
      </div>
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

function LegendDot({ tone, label }: { tone: Severity; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span aria-hidden className={cn("h-2 w-2 rounded-full", SEV_DOT_CLS[tone])} />
      {label}
    </span>
  );
}

function LogRow({
  log,
}: {
  log: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: Date;
    actor: { name: string; email: string } | null;
    branch: { name: string; code: string } | null;
  };
}) {
  const { severity, icon: Icon } = categorize(log.action);
  return (
    <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-dashed border-default px-4 py-3 transition-colors last:border-0 hover:bg-surface-muted/30 md:px-5">
      {/* Time — monospace + colon-separated for log-line feel */}
      <span
        className="font-mono text-[11.5px] tabular-nums text-muted-foreground"
        title={formatDate(log.createdAt)}
      >
        {logTime(log.createdAt)}
      </span>

      {/* Severity dot + category icon */}
      <span className="flex items-center gap-2">
        <span aria-hidden className={cn("h-2 w-2 rounded-full", SEV_DOT_CLS[severity])} />
        <Icon className={cn("h-4 w-4 shrink-0", SEV_ICON_TINT[severity])} />
      </span>

      {/* Action description */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-foreground">
          {humanize(log.action)}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{entityHumanized(log.entityType)}</span>
          {log.entityId && (
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10.5px] text-foreground">
              {log.entityId.slice(0, 10)}
            </code>
          )}
        </span>
      </div>

      {/* Actor + branch */}
      <div className="hidden flex-col items-end gap-0.5 text-right md:flex">
        <span className="truncate text-[12px] font-medium text-foreground">
          {log.actor?.name ?? "System"}
        </span>
        <span className="truncate text-[10.5px] text-muted-foreground">
          {log.branch ? `${log.branch.code} · ${log.branch.name}` : "—"}
        </span>
      </div>
    </div>
  );
}

function PaginationButton({
  href,
  direction,
  label,
}: {
  href: string | null;
  direction: "prev" | "next";
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const inner = (
    <>
      {direction === "prev" && <Icon className="h-3.5 w-3.5" />}
      {label}
      {direction === "next" && <Icon className="h-3.5 w-3.5" />}
    </>
  );
  if (!href) {
    return (
      <span className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-default bg-surface px-3 text-[12.5px] font-medium leading-none text-muted-foreground opacity-50">
        {inner}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-default bg-surface px-3 text-[12.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted"
    >
      {inner}
    </Link>
  );
}
