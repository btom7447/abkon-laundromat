"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  X,
  Tag,
  Ruler,
  Hash,
  Droplets,
  Flame,
  Sparkles,
  Wind,
  PowerOff,
  Power,
  Layers,
} from "lucide-react";
import type { ItemType, ItemUnit } from "@prisma/client";
import { toast } from "sonner";
import {
  createItemAction,
  updateItemAction,
  type ItemFormState,
} from "@/server/actions/items";
import { Illustration } from "@/components/brand/illustrations";
import {
  POS_CATEGORIES,
  categoryForItem,
  illustrationForItem,
  type PosCategoryId,
} from "@/lib/pos-categories";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  mode: "new" | "edit";
  item: ItemType | null;
  branchId: string;
  branchName: string;
}

const initialState: ItemFormState = {};

const UNIT_OPTIONS = [
  { value: "PIECE" as ItemUnit, label: "Per piece", hint: "Charged per individual piece" },
  { value: "SQM" as ItemUnit, label: "Per square meter", hint: "For rugs, curtains, large items" },
  { value: "NEGOTIABLE" as ItemUnit, label: "Negotiable", hint: "Reception sets price at till" },
];

const CATEGORY_OPTIONS = POS_CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
  value: c.id,
  label: c.label,
}));

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

function parsePrice(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

function withSeparators(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toLocaleString("en-NG");
}

export function ItemModal({ mode, item, branchId, branchName }: Props) {
  const router = useRouter();
  const action = mode === "new" ? createItemAction : updateItemAction.bind(null, item!.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(item?.name ?? "");
  const [unit, setUnit] = useState<ItemUnit>(item?.unit ?? "PIECE");
  const [displayOrder, setDisplayOrder] = useState<number>(item?.displayOrder ?? 0);
  const [active, setActive] = useState<boolean>(item?.active ?? true);
  const [category, setCategory] = useState<PosCategoryId>(
    categoryForItem(item?.name ?? "", item?.unit ?? "PIECE", item?.category)
  );

  const [washOffered, setWashOffered] = useState<boolean>(item ? item.washPrice != null : true);
  const [ironOffered, setIronOffered] = useState<boolean>(item ? item.ironPrice != null : true);
  const [washIronOffered, setWashIronOffered] = useState<boolean>(
    item ? item.washAndIronPrice != null || (item.washPrice != null && item.ironPrice != null) : true
  );
  const [dryCleanOffered, setDryCleanOffered] = useState<boolean>(item ? item.dryCleanPrice != null : false);

  const [washPrice, setWashPrice] = useState<number | null>(item?.washPrice ?? null);
  const [ironPrice, setIronPrice] = useState<number | null>(item?.ironPrice ?? null);
  const [washIronPrice, setWashIronPrice] = useState<number | null>(item?.washAndIronPrice ?? null);
  const [dryCleanPrice, setDryCleanPrice] = useState<number | null>(item?.dryCleanPrice ?? null);

  // When unit flips to NEGOTIABLE, snap category to "negotiable" — keeps the
  // POS sidebar in sync with the till-side behaviour.
  useEffect(() => {
    if (unit === "NEGOTIABLE") setCategory("negotiable");
  }, [unit]);

  const derivedWashIron = useMemo(() => {
    if (washIronPrice != null) return null;
    if (washOffered && ironOffered && washPrice != null && ironPrice != null) {
      return washPrice + ironPrice;
    }
    return null;
  }, [washIronPrice, washPrice, ironPrice, washOffered, ironOffered]);

  function close() {
    router.push("/admin/items", { scroll: false });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "new" ? "Item created" : "Item updated");
      close();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const displayName = name.trim() || (mode === "new" ? "New item" : item?.name ?? "Item");
  const illustration = illustrationForItem(displayName);
  const offeredCount = [washOffered, ironOffered, washIronOffered, dryCleanOffered].filter(Boolean).length;
  const categoryLabel = POS_CATEGORIES.find((c) => c.id === category)?.label ?? "Other";

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={() => !pending && close()}
        className="fixed inset-0 z-60 bg-[color-mix(in_oklab,#0B1226_55%,transparent)] backdrop-blur-sm"
      />
      <motion.div
        key="panel-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto p-4 md:p-8"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "new" ? "New item" : `Edit ${item?.name}`}
          initial={{ y: 12, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-default bg-card shadow-[0_24px_56px_-16px_rgb(11_18_38/0.26)]"
        >
          <form action={formAction} className="flex flex-col">
            <input type="hidden" name="branchId" value={branchId} />
            <input type="hidden" name="__modal" value="1" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-default bg-gradient-to-b from-brand-50/40 to-transparent px-6 pt-6 pb-5 dark:from-brand-950/20">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card text-navy-800 shadow-[0_1px_3px_0_rgb(15_23_42/0.08)] ring-1 ring-default dark:text-brand-200">
                  <Illustration name={illustration} size={52} />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[19px] font-bold leading-tight tracking-tight text-foreground md:text-[21px]">
                      {displayName}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                        active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                        CATEGORY_PILL_CLS[category]
                      )}
                    >
                      {categoryLabel}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    {mode === "new"
                      ? `Add a new catalog item to ${branchName}.`
                      : `${branchName} · ${UNIT_OPTIONS.find((u) => u.value === unit)?.label}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                disabled={pending}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.error && (
              <div className="mx-6 mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {state.error}
              </div>
            )}

            {/* Two-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:divide-x lg:divide-default">
              {/* LEFT — identity */}
              <div className="flex flex-col gap-5 px-6 py-6 lg:py-7">
                <SectionLabel>Identity</SectionLabel>

                <Field label="Item name" icon={<Tag />} required error={state.fieldErrors?.name}>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shirt, Agbada, Rug"
                    required
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field
                  label="Catalog category"
                  icon={<Layers />}
                  hint={unit === "NEGOTIABLE" ? "Locked while unit is Negotiable" : undefined}
                >
                  <Dropdown
                    name="category"
                    value={category}
                    onChange={(v) => setCategory(v as PosCategoryId)}
                    options={CATEGORY_OPTIONS}
                    disabled={unit === "NEGOTIABLE"}
                    triggerClassName="h-11"
                  />
                </Field>

                <Field label="Unit" icon={<Ruler />}>
                  <Dropdown
                    name="unit"
                    value={unit}
                    onChange={(v) => setUnit(v as ItemUnit)}
                    options={UNIT_OPTIONS}
                    triggerClassName="h-11"
                  />
                </Field>

                <Field
                  label="Display order"
                  icon={<Hash />}
                  hint="Lower first"
                >
                  <input
                    name="displayOrder"
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Math.max(0, Number(e.target.value) || 0))}
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-right text-[14px] tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>
              </div>

              {/* RIGHT — pricing */}
              <div className="flex flex-col gap-5 bg-surface-muted/20 px-6 py-6 lg:py-7">
                <div className="flex items-baseline justify-between gap-2">
                  <SectionLabel>Services & prices</SectionLabel>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {offeredCount}/4 offered
                  </span>
                </div>
                <p className="-mt-3 text-[11.5px] text-muted-foreground">
                  {unit === "PIECE"
                    ? "Each price applies per individual piece."
                    : unit === "SQM"
                      ? "Each price applies per square meter."
                      : "Prices below are guidance only — reception confirms at the till."}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ServiceTile
                    label="Wash"
                    icon={<Droplets />}
                    offered={washOffered}
                    onToggle={setWashOffered}
                    offeredName="washOffered"
                    priceName="washPrice"
                    value={washPrice}
                    onChange={setWashPrice}
                    error={state.fieldErrors?.washPrice}
                  />
                  <ServiceTile
                    label="Iron"
                    icon={<Flame />}
                    offered={ironOffered}
                    onToggle={setIronOffered}
                    offeredName="ironOffered"
                    priceName="ironPrice"
                    value={ironPrice}
                    onChange={setIronPrice}
                    error={state.fieldErrors?.ironPrice}
                  />
                  <ServiceTile
                    label="Wash & Iron"
                    icon={<Sparkles />}
                    offered={washIronOffered}
                    onToggle={setWashIronOffered}
                    offeredName="washAndIronOffered"
                    priceName="washAndIronPrice"
                    value={washIronPrice}
                    onChange={setWashIronPrice}
                    placeholder={
                      derivedWashIron != null
                        ? `Auto: ${formatNaira(derivedWashIron)}`
                        : "Set a price"
                    }
                    autoBadge={derivedWashIron != null}
                    helper={
                      washIronOffered && derivedWashIron != null
                        ? "Blank = auto-derive from wash + iron."
                        : undefined
                    }
                    error={state.fieldErrors?.washAndIronPrice}
                  />
                  <ServiceTile
                    label="Dry clean"
                    icon={<Wind />}
                    offered={dryCleanOffered}
                    onToggle={setDryCleanOffered}
                    offeredName="dryCleanOffered"
                    priceName="dryCleanPrice"
                    value={dryCleanPrice}
                    onChange={setDryCleanPrice}
                    error={state.fieldErrors?.dryCleanPrice}
                  />
                </div>

                {/* Availability — pinned to the bottom of the pricing column */}
                <div className="mt-auto flex items-center justify-between gap-4 rounded-lg border border-default bg-card px-4 py-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
                  <div className="flex min-w-0 items-center gap-3 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
                    {active ? <Power /> : <PowerOff />}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {active ? "Item is active" : "Item is hidden"}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {active
                          ? "Visible in new tickets and on the POS catalog."
                          : "Stays in history, hidden from new tickets."}
                      </span>
                    </div>
                  </div>
                  <Switch
                    name="active"
                    checked={active}
                    onChange={setActive}
                    ariaLabel="Item is active"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-default bg-surface-muted/30 px-6 py-4">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : mode === "new" ? (
                  "Create item"
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </h4>
  );
}

function Field({
  label,
  icon,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  required?: boolean;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
        {icon}
        {label}
        {required && <span aria-hidden className="text-red-500">*</span>}
        {hint && <span className="ml-auto text-[10.5px] font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}

function ServiceTile({
  label,
  icon,
  offered,
  onToggle,
  offeredName,
  priceName,
  value,
  onChange,
  placeholder = "Set a price",
  helper,
  autoBadge,
  error,
}: {
  label: string;
  icon: React.ReactNode;
  offered: boolean;
  onToggle: (v: boolean) => void;
  offeredName: string;
  priceName: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  helper?: string;
  autoBadge?: boolean;
  error?: string[];
}) {
  const [text, setText] = useState<string>(value != null ? withSeparators(value) : "");

  useEffect(() => {
    setText(value != null ? withSeparators(value) : "");
  }, [value]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 transition-all",
        offered
          ? "border-default shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
          : "border-dashed border-default/60 bg-card/40"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 [&_svg]:h-7 [&_svg]:w-7">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
              offered
                ? "bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300"
                : "bg-surface-muted text-muted-foreground"
            )}
          >
            {icon}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                "text-[13.5px] font-semibold leading-tight",
                offered ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              {offered ? "Offered" : "Not offered"}
            </span>
          </div>
        </div>
        <Switch
          name={offeredName}
          checked={offered}
          onChange={onToggle}
          ariaLabel={`${label} offered`}
          size="sm"
        />
      </div>

      {offered && (
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground"
            >
              ₦
            </span>
            <input
              id={priceName}
              name={priceName}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={text}
              onChange={(e) => {
                const n = parsePrice(e.target.value);
                onChange(n);
                setText(n != null ? withSeparators(n) : "");
              }}
              placeholder={placeholder}
              aria-invalid={!!error}
              className="h-11 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-right text-[15px] font-semibold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70"
            />
            {autoBadge && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-50 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-navy-800 dark:text-brand-300">
                Auto
              </span>
            )}
          </div>
          {helper && <p className="text-[10.5px] text-muted-foreground">{helper}</p>}
          {error && <p className="text-[11px] text-red-600">{error[0]}</p>}
        </div>
      )}
    </div>
  );
}
