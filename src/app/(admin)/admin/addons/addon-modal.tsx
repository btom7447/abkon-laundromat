"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  X,
  Tag,
  Layers,
  Receipt,
  Percent,
  Banknote,
  Droplets,
  Flame,
  Sparkles,
  Wind,
  PowerOff,
  Power,
  Anvil,
  Truck,
  PackageOpen,
  Zap,
  Scissors,
  Sparkle,
} from "lucide-react";
import type { AddOn, AddOnScope, PricingMode } from "@prisma/client";
import { toast } from "sonner";
import {
  createAddOnAction,
  updateAddOnAction,
  type AddOnFormState,
} from "@/server/actions/addons";
import {
  ADDON_CATEGORIES,
  ADDON_CATEGORY_PILL_CLS,
  categoryForAddOn,
  type AddOnCategoryId,
} from "@/lib/addon-categories";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  mode: "new" | "edit";
  addOn: AddOn | null;
  branchId: string;
  branchName: string;
}

const initialState: AddOnFormState = {};

const SCOPE_OPTIONS = [
  { value: "PER_ITEM" as AddOnScope, label: "Per item", hint: "Applied to each line" },
  { value: "PER_TICKET" as AddOnScope, label: "Per ticket", hint: "Applied once to the whole bag" },
];

const MODE_OPTIONS = [
  { value: "FLAT" as PricingMode, label: "Flat ₦", hint: "Fixed naira amount" },
  { value: "PERCENTAGE" as PricingMode, label: "Percentage", hint: "% of the subtotal" },
];

const CATEGORY_OPTIONS = ADDON_CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
  value: c.id,
  label: c.label,
  hint: c.hint,
}));

// Mirrors the page's name → icon mapping so the modal header matches the card.
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

function parseInt0(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function withSeparators(n: number): string {
  return n.toLocaleString("en-NG");
}

export function AddOnModal({ mode, addOn, branchId, branchName }: Props) {
  const router = useRouter();
  const action =
    mode === "new" ? createAddOnAction : updateAddOnAction.bind(null, addOn!.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(addOn?.name ?? "");
  const [scope, setScope] = useState<AddOnScope>(addOn?.scope ?? "PER_ITEM");
  const [pricingMode, setPricingMode] = useState<PricingMode>(addOn?.pricingMode ?? "FLAT");
  const [amount, setAmount] = useState<number>(addOn?.amount ?? 0);
  const [amountText, setAmountText] = useState<string>(
    addOn?.amount != null && addOn.amount > 0 ? withSeparators(addOn.amount) : ""
  );
  const [active, setActive] = useState<boolean>(addOn?.active ?? true);
  const [category, setCategory] = useState<AddOnCategoryId>(
    categoryForAddOn(addOn?.name ?? "", addOn?.category)
  );

  const initialServices = new Set(addOn?.appliesToServices ?? []);
  const [appliesToWash, setAppliesToWash] = useState(initialServices.has("WASH"));
  const [appliesToIron, setAppliesToIron] = useState(initialServices.has("IRON"));
  const [appliesToWashAndIron, setAppliesToWashAndIron] = useState(initialServices.has("WASH_AND_IRON"));
  const [appliesToDryClean, setAppliesToDryClean] = useState(initialServices.has("DRY_CLEAN"));

  function close() {
    router.push("/admin/addons", { scroll: false });
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
      toast.success(mode === "new" ? "Add-on created" : "Add-on updated");
      close();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  // Clamp amount to 100 when percentage mode is on.
  useEffect(() => {
    if (pricingMode === "PERCENTAGE" && amount > 100) {
      setAmount(100);
      setAmountText("100");
    }
  }, [pricingMode, amount]);

  const displayName = name.trim() || (mode === "new" ? "New add-on" : addOn?.name ?? "Add-on");
  const Icon = iconForAddOn(displayName);
  const categoryLabel = ADDON_CATEGORIES.find((c) => c.id === category)?.label ?? "Other";
  const appliedCount = [appliesToWash, appliesToIron, appliesToWashAndIron, appliesToDryClean].filter(
    Boolean
  ).length;
  const appliesEverywhere = appliedCount === 0;

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
          aria-label={mode === "new" ? "New add-on" : `Edit ${addOn?.name}`}
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
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[0_1px_3px_0_rgb(15_23_42/0.08)] ring-1 ring-default">
                  <Icon className="h-9 w-9 text-brand-700 dark:text-brand-300" />
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
                        ADDON_CATEGORY_PILL_CLS[category]
                      )}
                    >
                      {categoryLabel}
                    </span>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] font-medium text-foreground">
                      {scope === "PER_ITEM" ? "Per item" : "Per ticket"}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    {mode === "new"
                      ? `Add an extra service to ${branchName}.`
                      : `${branchName} · ${appliesEverywhere ? "applies to every service" : `${appliedCount}/4 services`}`}
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
              {/* LEFT — Identity */}
              <div className="flex flex-col gap-5 px-6 py-6 lg:py-7">
                <SectionLabel>Identity</SectionLabel>

                <Field label="Add-on name" icon={<Tag />} required error={state.fieldErrors?.name}>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starching, Stain removal, Urgent surcharge"
                    required
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field label="Catalog category" icon={<Layers />}>
                  <Dropdown
                    name="category"
                    value={category}
                    onChange={(v) => setCategory(v as AddOnCategoryId)}
                    options={CATEGORY_OPTIONS}
                    triggerClassName="h-11"
                  />
                </Field>

                <Field label="Applied to" icon={<Receipt />}>
                  <Dropdown
                    name="scope"
                    value={scope}
                    onChange={(v) => setScope(v as AddOnScope)}
                    options={SCOPE_OPTIONS}
                    triggerClassName="h-11"
                  />
                </Field>

                <Field label="Pricing mode" icon={pricingMode === "FLAT" ? <Banknote /> : <Percent />}>
                  <Dropdown
                    name="pricingMode"
                    value={pricingMode}
                    onChange={(v) => setPricingMode(v as PricingMode)}
                    options={MODE_OPTIONS}
                    triggerClassName="h-11"
                  />
                </Field>

                <Field
                  label="Amount"
                  icon={pricingMode === "FLAT" ? <Banknote /> : <Percent />}
                  hint={pricingMode === "PERCENTAGE" ? "Max 100" : undefined}
                  error={state.fieldErrors?.amount}
                >
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground"
                    >
                      {pricingMode === "FLAT" ? "₦" : "%"}
                    </span>
                    <input
                      name="amount"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={amountText}
                      onChange={(e) => {
                        let n = parseInt0(e.target.value);
                        if (pricingMode === "PERCENTAGE" && n > 100) n = 100;
                        setAmount(n);
                        setAmountText(n > 0 ? withSeparators(n) : "");
                      }}
                      placeholder="0"
                      required
                      aria-invalid={!!state.fieldErrors?.amount}
                      className="h-11 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-right text-[15px] font-semibold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {pricingMode === "FLAT"
                      ? `Added as a flat ₦${withSeparators(amount)} charge.`
                      : `Adds ${amount}% of the relevant subtotal.`}
                  </p>
                </Field>
              </div>

              {/* RIGHT — Services + Availability */}
              <div className="flex flex-col gap-5 bg-surface-muted/20 px-6 py-6 lg:py-7">
                <div className="flex items-baseline justify-between gap-2">
                  <SectionLabel>Applies to services</SectionLabel>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {appliesEverywhere ? "All 4" : `${appliedCount}/4`}
                  </span>
                </div>
                <p className="-mt-3 text-[11.5px] text-muted-foreground">
                  Turn off every toggle to apply this add-on to every service.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ServiceToggle
                    label="Wash"
                    icon={<Droplets />}
                    name="appliesToWash"
                    checked={appliesToWash}
                    onChange={setAppliesToWash}
                  />
                  <ServiceToggle
                    label="Iron"
                    icon={<Flame />}
                    name="appliesToIron"
                    checked={appliesToIron}
                    onChange={setAppliesToIron}
                  />
                  <ServiceToggle
                    label="Wash & Iron"
                    icon={<Sparkles />}
                    name="appliesToWashAndIron"
                    checked={appliesToWashAndIron}
                    onChange={setAppliesToWashAndIron}
                  />
                  <ServiceToggle
                    label="Dry clean"
                    icon={<Wind />}
                    name="appliesToDryClean"
                    checked={appliesToDryClean}
                    onChange={setAppliesToDryClean}
                  />
                </div>

                {/* Availability — pinned to the bottom of the right column */}
                <div className="mt-auto flex items-center justify-between gap-4 rounded-lg border border-default bg-card px-4 py-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
                  <div className="flex min-w-0 items-center gap-3 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
                    {active ? <Power /> : <PowerOff />}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {active ? "Add-on is active" : "Add-on is hidden"}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {active
                          ? "Selectable in new tickets."
                          : "Stays in history, hidden from new tickets."}
                      </span>
                    </div>
                  </div>
                  <Switch
                    name="active"
                    checked={active}
                    onChange={setActive}
                    ariaLabel="Add-on is active"
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
                  "Create add-on"
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

function ServiceToggle({
  label,
  icon,
  name,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5 transition-all",
        checked
          ? "border-default shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
          : "border-dashed border-default/60 bg-card/40"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 [&_svg]:h-7 [&_svg]:w-7">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
            checked
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
              checked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {checked ? "Applies" : "Skipped"}
          </span>
        </div>
      </div>
      <Switch
        name={name}
        checked={checked}
        onChange={onChange}
        ariaLabel={`${label} applies`}
        size="sm"
      />
    </div>
  );
}
