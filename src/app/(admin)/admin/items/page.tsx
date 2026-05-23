import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { getActiveBranchCookie } from "@/server/actions/branch-switch";
import { formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Illustration } from "@/components/brand/illustrations";
import {
  POS_CATEGORIES,
  categoryForItem,
  illustrationForItem,
  type PosCategoryId,
} from "@/lib/pos-categories";
import { ItemModal } from "./item-modal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ new?: string; edit?: string; category?: string }>;
}

const CATEGORY_PILL_CLS: Record<PosCategoryId, string> = {
  all: "",
  tops: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  bottoms: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  native: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  formal: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  household: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  negotiable: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default async function ItemsPage({ searchParams }: PageProps) {
  const user = await requireSession();
  const { new: newFlag, edit: editId, category: categoryFilter } = await searchParams;
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
            {user.role === "ADMIN"
              ? "Create a branch first to add items."
              : "You are not assigned to a branch. Ask an admin to update your account."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const itemsRaw = await db.itemType.findMany({
    where: { branchId: ctx.branchId },
    orderBy: [{ active: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
  });

  // Decorate each item with its resolved catalog category. The helper prefers
  // the stored `it.category` (admin's explicit choice) and falls back to the
  // built-in name+unit lookup when null.
  const items = itemsRaw.map((it) => ({
    ...it,
    resolvedCategory: categoryForItem(it.name, it.unit, it.category),
  }));

  // Per-category counts for the filter chip bar — only show chips that have items.
  const categoryCounts = new Map<PosCategoryId, number>();
  for (const it of items) {
    categoryCounts.set(it.resolvedCategory, (categoryCounts.get(it.resolvedCategory) ?? 0) + 1);
  }

  const activeCategory = (categoryFilter as PosCategoryId | undefined) ?? "all";
  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((it) => it.resolvedCategory === activeCategory);

  // Look up the modal target (admin-only — staff can't edit, so we never load
  // an edit target for them even if `?edit=ID` is in the URL).
  const isAdmin = user.role === "ADMIN";
  let editTarget = null as Awaited<ReturnType<typeof db.itemType.findUnique>> | null;
  if (isAdmin && editId) {
    editTarget = await db.itemType.findUnique({ where: { id: editId } });
    if (editTarget && editTarget.branchId !== ctx.branchId) editTarget = null;
    if (editId && !editTarget) notFound();
  }
  const showNewModal = isAdmin && newFlag === "1" && !editTarget;

  const activeCount = items.filter((i) => i.active).length;
  const lineAgg = await db.ticketLineItem.groupBy({
    by: ["itemTypeNameSnapshot"],
    where: { ticket: { branchId: ctx.branchId, status: { not: "CANCELLED" } } },
    _sum: { quantity: true, lineSubtotal: true },
  });
  const topRev = lineAgg
    .filter((g) => g._sum.lineSubtotal)
    .sort((a, b) => (b._sum.lineSubtotal ?? 0) - (a._sum.lineSubtotal ?? 0))[0];
  const topVol = lineAgg
    .filter((g) => g._sum.quantity)
    .sort((a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0))[0];

  const offeredPrices = items.flatMap((i) =>
    [i.washPrice, i.ironPrice, i.washAndIronPrice, i.dryCleanPrice].filter(
      (p): p is number => p != null && p > 0
    )
  );
  const avgPrice = offeredPrices.length
    ? Math.round(offeredPrices.reduce((s, p) => s + p, 0) / offeredPrices.length)
    : 0;

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Items &amp; prices
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Catalog of laundry items and their per-service prices. Price changes don&apos;t affect
            existing tickets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          {isAdmin && (
            <Link
              href="/admin/items?new=1"
              scroll={false}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
            >
              <Plus /> New item
            </Link>
          )}
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBox label="Active items" value={activeCount} sub={`${items.length} total`} />
          <KpiBox
            label="Top by revenue"
            value={topRev?.itemTypeNameSnapshot ?? "—"}
            valueLg={false}
            sub={topRev ? formatNaira(topRev._sum.lineSubtotal ?? 0) : "No data yet"}
          />
          <KpiBox
            label="Top by volume"
            value={topVol?.itemTypeNameSnapshot ?? "—"}
            valueLg={false}
            sub={topVol ? `${topVol._sum.quantity ?? 0} pieces` : "No data yet"}
          />
          <KpiBox label="Avg price" value={formatNaira(avgPrice)} sub="Across offered services" />
        </div>

        {/* Category filter chip bar — only chips with items are rendered */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <CategoryChip
              href="/admin/items"
              active={activeCategory === "all"}
              label="All items"
              count={items.length}
            />
            {POS_CATEGORIES.filter((c) => c.id !== "all" && (categoryCounts.get(c.id) ?? 0) > 0).map(
              (c) => (
                <CategoryChip
                  key={c.id}
                  href={`/admin/items?category=${c.id}`}
                  active={activeCategory === c.id}
                  label={c.label}
                  count={categoryCounts.get(c.id) ?? 0}
                />
              )
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-xl border border-default bg-card p-5 text-center text-sm text-muted-foreground">
            No items yet for this branch.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-default bg-card p-5 text-center text-sm text-muted-foreground">
            No items in this category.{" "}
            <Link href="/admin/items" scroll={false} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Clear filter
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((it) => {
              const combinedDerived =
                it.washAndIronPrice == null && it.washPrice != null && it.ironPrice != null;
              const combined =
                it.washAndIronPrice ?? (combinedDerived ? it.washPrice! + it.ironPrice! : null);
              const categoryLabel =
                POS_CATEGORIES.find((c) => c.id === it.resolvedCategory)?.label ?? "Other";
              return (
                <Link
                  key={it.id}
                  href={isAdmin ? `/admin/items?edit=${it.id}` : "#"}
                  scroll={false}
                  aria-disabled={!isAdmin}
                  className="grid grid-cols-[56px_1fr] gap-3.5 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-all hover:-translate-y-px hover:border-brand-300 aria-disabled:cursor-default aria-disabled:hover:translate-y-0 aria-disabled:hover:border-default"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-surface-muted text-navy-800 dark:text-brand-200">
                    <Illustration name={illustrationForItem(it.name)} size={44} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14.5px] font-semibold text-foreground">{it.name}</span>
                      {!it.active && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          CATEGORY_PILL_CLS[it.resolvedCategory]
                        )}
                      >
                        {categoryLabel}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ·{" "}
                        {it.unit === "SQM"
                          ? "Per sqm"
                          : it.unit === "NEGOTIABLE"
                            ? "Negotiable"
                            : "Per piece"}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-full mt-1 grid grid-cols-4 gap-2 border-t border-dashed border-default pt-3">
                    <PriceCell k="Wash" value={it.washPrice} />
                    <PriceCell k="Iron" value={it.ironPrice} />
                    <PriceCell k="Wash & Iron" value={combined} derived={combinedDerived} />
                    <PriceCell k="Dry clean" value={it.dryCleanPrice} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {editTarget && (
        <ItemModal
          mode="edit"
          item={editTarget}
          branchId={ctx.branchId}
          branchName={ctx.branchName}
        />
      )}
      {showNewModal && (
        <ItemModal
          mode="new"
          item={null}
          branchId={ctx.branchId}
          branchName={ctx.branchName}
        />
      )}
    </>
  );
}

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

function CategoryChip({
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

function PriceCell({ k, value, derived }: { k: string; value: number | null; derived?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
        {k}
      </span>
      {value != null ? (
        <span
          className={cn(
            "text-[13.5px] font-semibold tabular-nums",
            derived ? "text-brand-700 dark:text-brand-300" : "text-foreground"
          )}
        >
          {formatNaira(value)}
          {derived && <span className="ml-1 text-[10px] opacity-70">auto</span>}
        </span>
      ) : (
        <span className="text-[13.5px] font-medium text-muted-foreground opacity-70">—</span>
      )}
    </div>
  );
}
