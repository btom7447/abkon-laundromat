import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Plus,
  Sparkles,
  Truck,
  PackageOpen,
  Zap,
  Anvil,
  Droplets,
  Scissors,
  Sparkle,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { resolveBranchContext } from "@/lib/branch-context";
import { getActiveBranchCookie } from "@/server/actions/branch-switch";
import { formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADDON_CATEGORIES,
  ADDON_CATEGORY_PILL_CLS,
  categoryForAddOn,
  type AddOnCategoryId,
} from "@/lib/addon-categories";
import { AddOnModal } from "./addon-modal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ new?: string; edit?: string; category?: string }>;
}

const SERVICE_LABEL: Record<string, string> = {
  WASH: "Wash",
  IRON: "Iron",
  WASH_AND_IRON: "Wash & Iron",
  DRY_CLEAN: "Dry clean",
};

function iconForAddOn(name: string) {
  const n = name.toLowerCase();
  if (n.includes("pickup") || n.includes("delivery")) return Truck;
  if (n.includes("bag") || n.includes("garment")) return PackageOpen;
  if (n.includes("urgent") || n.includes("rush")) return Zap;
  if (n.includes("stain") || n.includes("whiten")) return Droplets;
  if (n.includes("stitch") || n.includes("hem") || n.includes("button")) return Scissors;
  if (n.includes("starch")) return Anvil;
  if (n.includes("perfume") || n.includes("sanitiz")) return Sparkle;
  return Sparkles;
}

export default async function AddOnsPage({ searchParams }: PageProps) {
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
              ? "Create a branch first to add add-ons."
              : "You are not assigned to a branch."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const addOnsRaw = await db.addOn.findMany({
    where: { branchId: ctx.branchId },
    orderBy: [{ active: "desc" }, { scope: "asc" }, { name: "asc" }],
  });

  // Decorate each with resolved catalog category.
  const addOns = addOnsRaw.map((a) => ({
    ...a,
    resolvedCategory: categoryForAddOn(a.name, a.category),
  }));

  const categoryCounts = new Map<AddOnCategoryId, number>();
  for (const a of addOns) {
    categoryCounts.set(a.resolvedCategory, (categoryCounts.get(a.resolvedCategory) ?? 0) + 1);
  }

  const activeCategory = (categoryFilter as AddOnCategoryId | undefined) ?? "all";
  const filtered =
    activeCategory === "all" ? addOns : addOns.filter((a) => a.resolvedCategory === activeCategory);

  const perItem = filtered.filter((a) => a.scope === "PER_ITEM");
  const perTicket = filtered.filter((a) => a.scope === "PER_TICKET");
  const activeCount = addOns.filter((a) => a.active).length;

  // Modal targets — admin-only
  const isAdmin = user.role === "ADMIN";
  let editTarget = null as Awaited<ReturnType<typeof db.addOn.findUnique>> | null;
  if (isAdmin && editId) {
    editTarget = await db.addOn.findUnique({ where: { id: editId } });
    if (editTarget && editTarget.branchId !== ctx.branchId) editTarget = null;
    if (editId && !editTarget) notFound();
  }
  const showNewModal = isAdmin && newFlag === "1" && !editTarget;

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Add-ons
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Extra services like starching, stain removal, urgent surcharge. Per-item or per-ticket.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
          {isAdmin && (
            <Link
              href="/admin/addons?new=1"
              scroll={false}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
            >
              <Plus /> New add-on
            </Link>
          )}
        </div>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiBox label="Active add-ons" value={activeCount} sub={`${addOns.length} total`} />
          <KpiBox
            label="Per-item"
            value={addOns.filter((a) => a.scope === "PER_ITEM").length}
            sub="Applied to each line"
          />
          <KpiBox
            label="Per-ticket"
            value={addOns.filter((a) => a.scope === "PER_TICKET").length}
            sub="Applied to whole bag"
          />
        </div>

        {/* Category chip bar */}
        {addOns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-card p-3 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
            <CategoryChip
              href="/admin/addons"
              active={activeCategory === "all"}
              label="All add-ons"
              count={addOns.length}
            />
            {ADDON_CATEGORIES.filter((c) => c.id !== "all" && (categoryCounts.get(c.id) ?? 0) > 0).map(
              (c) => (
                <CategoryChip
                  key={c.id}
                  href={`/admin/addons?category=${c.id}`}
                  active={activeCategory === c.id}
                  label={c.label}
                  count={categoryCounts.get(c.id) ?? 0}
                />
              )
            )}
          </div>
        )}

        {addOns.length === 0 ? (
          <div className="rounded-xl border border-default bg-card p-5 text-center text-sm text-muted-foreground">
            No add-ons yet for this branch.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-default bg-card p-5 text-center text-sm text-muted-foreground">
            No add-ons in this category.{" "}
            <Link
              href="/admin/addons"
              scroll={false}
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Clear filter
            </Link>
          </div>
        ) : (
          <>
            {perItem.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Per-item · applied to each line
                </div>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {perItem.map((a) => (
                    <AddOnCard key={a.id} a={a} editable={isAdmin} />
                  ))}
                </div>
              </section>
            )}
            {perTicket.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Per-ticket · applied once to whole bag
                </div>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {perTicket.map((a) => (
                    <AddOnCard key={a.id} a={a} editable={isAdmin} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {editTarget && (
        <AddOnModal
          mode="edit"
          addOn={editTarget}
          branchId={ctx.branchId}
          branchName={ctx.branchName}
        />
      )}
      {showNewModal && (
        <AddOnModal mode="new" addOn={null} branchId={ctx.branchId} branchName={ctx.branchName} />
      )}
    </>
  );
}

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

function AddOnCard({
  a,
  editable,
}: {
  a: {
    id: string;
    name: string;
    pricingMode: string;
    amount: number;
    appliesToServices: string[];
    active: boolean;
    resolvedCategory: AddOnCategoryId;
  };
  editable: boolean;
}) {
  const Icon = iconForAddOn(a.name);
  const amountLabel = a.pricingMode === "FLAT" ? formatNaira(a.amount) : `${a.amount}%`;
  const categoryLabel = ADDON_CATEGORIES.find((c) => c.id === a.resolvedCategory)?.label ?? "Other";

  return (
    <Link
      href={editable ? `/admin/addons?edit=${a.id}` : "#"}
      scroll={false}
      aria-disabled={!editable}
      className="grid grid-cols-[56px_1fr] gap-3.5 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-all hover:-translate-y-px hover:border-brand-300 aria-disabled:cursor-default aria-disabled:hover:translate-y-0 aria-disabled:hover:border-default"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-surface-muted text-navy-800 dark:text-brand-200">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14.5px] font-semibold text-foreground">{a.name}</span>
          {!a.active && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Inactive
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              ADDON_CATEGORY_PILL_CLS[a.resolvedCategory]
            )}
          >
            {categoryLabel}
          </span>
          <span className="text-[11px] text-muted-foreground">
            · {a.pricingMode === "FLAT" ? "Flat" : "Percentage"}
          </span>
        </div>
      </div>

      {/* Footer: amount + applied-to chips */}
      <div className="col-span-full mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-default pt-3">
        <div className="text-[18px] font-bold tabular-nums tracking-tight text-foreground">
          +{amountLabel}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {a.pricingMode === "FLAT" ? "flat" : "of subtotal"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
          {a.appliesToServices.length === 0 ? (
            <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground">
              All services
            </span>
          ) : (
            a.appliesToServices.map((s) => (
              <span
                key={s}
                className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground"
              >
                {SERVICE_LABEL[s] ?? s}
              </span>
            ))
          )}
        </div>
      </div>
    </Link>
  );
}
