"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  X,
  Building2,
  Tag,
  MapPin,
  Map,
  Clock,
  CalendarDays,
  Truck,
  Zap,
  Percent,
  Banknote,
  Hourglass,
  Archive,
  Power,
  PowerOff,
} from "lucide-react";
import type { Branch, PricingMode } from "@prisma/client";
import { toast } from "sonner";
import {
  createBranchAction,
  updateBranchAction,
  type BranchFormState,
} from "@/server/actions/branches";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  mode: "new" | "edit";
  branch: Branch | null;
}

const initialState: BranchFormState = {};

const MODE_OPTIONS = [
  { value: "FLAT" as PricingMode, label: "Flat ₦", hint: "Fixed naira amount" },
  { value: "PERCENTAGE" as PricingMode, label: "Percentage", hint: "% of the subtotal" },
];

const DAYS: Array<{ id: number; short: string; long: string }> = [
  { id: 1, short: "Mon", long: "Monday" },
  { id: 2, short: "Tue", long: "Tuesday" },
  { id: 3, short: "Wed", long: "Wednesday" },
  { id: 4, short: "Thu", long: "Thursday" },
  { id: 5, short: "Fri", long: "Friday" },
  { id: 6, short: "Sat", long: "Saturday" },
  { id: 0, short: "Sun", long: "Sunday" },
];

function parseInt0(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function withSeparators(n: number): string {
  return n.toLocaleString("en-NG");
}

export function BranchModal({ mode, branch }: Props) {
  const router = useRouter();
  const action =
    mode === "new" ? createBranchAction : updateBranchAction.bind(null, branch!.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(branch?.name ?? "");
  const [code, setCode] = useState(branch?.code ?? "");
  const [address, setAddress] = useState(branch?.address ?? "");
  const [areasText, setAreasText] = useState((branch?.serviceAreas ?? []).join(", "));
  const [openTime, setOpenTime] = useState(branch?.businessHoursOpen ?? "08:00");
  const [closeTime, setCloseTime] = useState(branch?.businessHoursClose ?? "20:00");
  const [businessDays, setBusinessDays] = useState<number[]>(branch?.businessDays ?? [1, 2, 3, 4, 5, 6]);
  const [homeDeliveryFee, setHomeDeliveryFee] = useState<number>(branch?.homeDeliveryFee ?? 1000);
  const [homeDeliveryText, setHomeDeliveryText] = useState<string>(
    branch?.homeDeliveryFee != null && branch.homeDeliveryFee > 0
      ? withSeparators(branch.homeDeliveryFee)
      : ""
  );
  const [urgentSurchargeAmount, setUrgentSurchargeAmount] = useState<number>(
    branch?.urgentSurchargeAmount ?? 500
  );
  const [urgentSurchargeText, setUrgentSurchargeText] = useState<string>(
    branch?.urgentSurchargeAmount != null && branch.urgentSurchargeAmount > 0
      ? withSeparators(branch.urgentSurchargeAmount)
      : ""
  );
  const [urgentMode, setUrgentMode] = useState<PricingMode>(branch?.urgentSurchargeMode ?? "FLAT");
  const [abandonedFlagDays, setAbandonedFlagDays] = useState<number>(branch?.abandonedFlagDays ?? 7);
  const [moveToStorageDays, setMoveToStorageDays] = useState<number>(branch?.moveToStorageDays ?? 14);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(branch?.maxDiscountPercent ?? 10);
  const [active, setActive] = useState<boolean>(branch?.active ?? true);

  function toggleDay(id: number) {
    setBusinessDays((d) =>
      d.includes(id) ? d.filter((x) => x !== id) : [...d, id].sort((a, b) => a - b)
    );
  }

  // Clamp urgent surcharge to 100 when percentage mode
  useEffect(() => {
    if (urgentMode === "PERCENTAGE" && urgentSurchargeAmount > 100) {
      setUrgentSurchargeAmount(100);
      setUrgentSurchargeText("100");
    }
  }, [urgentMode, urgentSurchargeAmount]);

  function close() {
    router.push("/admin/branches", { scroll: false });
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
      toast.success(mode === "new" ? "Branch created" : "Branch updated");
      close();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const displayName = name.trim() || (mode === "new" ? "New branch" : branch?.name ?? "Branch");
  const displayCode = code.trim() || (mode === "new" ? "—" : branch?.code ?? "—");

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
          aria-label={mode === "new" ? "New branch" : `Edit ${branch?.name}`}
          initial={{ y: 12, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-default bg-card shadow-[0_24px_56px_-16px_rgb(11_18_38/0.26)]"
        >
          <form action={formAction} className="flex flex-col">
            <input type="hidden" name="__modal" value="1" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-default bg-gradient-to-b from-brand-50/40 to-transparent px-6 pt-6 pb-5 dark:from-brand-950/20">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[0_1px_3px_0_rgb(15_23_42/0.08)] ring-1 ring-default">
                  <Building2 className="h-9 w-9 text-brand-700 dark:text-brand-300" />
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
                    <code className="inline-flex shrink-0 items-center rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[10.5px] font-semibold text-foreground">
                      {displayCode}
                    </code>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    {mode === "new"
                      ? "Set up a new branch location and its pricing config."
                      : `${openTime}–${closeTime} · ${businessDays.length} business day${businessDays.length === 1 ? "" : "s"}`}
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:divide-x lg:divide-default">
              {/* LEFT — Identity + Hours */}
              <div className="flex flex-col gap-5 px-6 py-6 lg:py-7">
                <SectionLabel>Identity</SectionLabel>

                <Field label="Branch name" icon={<Building2 />} required error={state.fieldErrors?.name}>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abkon Laundromat — Ikot Ekpene"
                    required
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field
                  label="Branch code"
                  icon={<Tag />}
                  hint="2–3 uppercase letters · used in ticket numbers"
                  required
                  error={state.fieldErrors?.code}
                >
                  <input
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="LG"
                    maxLength={3}
                    required
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 font-mono text-[15px] uppercase tracking-wider text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field label="Address" icon={<MapPin />} error={state.fieldErrors?.address}>
                  <input
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="(optional) — full street address"
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field
                  label="Service areas"
                  icon={<Map />}
                  hint="Comma-separated · used by WhatsApp bot"
                >
                  <input
                    name="serviceAreas"
                    value={areasText}
                    onChange={(e) => setAreasText(e.target.value)}
                    placeholder="Ikot Ekpene, Itak, Abak"
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <div className="border-t border-dashed border-default pt-5">
                  <SectionLabel>Opening hours</SectionLabel>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Opens at" icon={<Clock />} required error={state.fieldErrors?.businessHoursOpen}>
                    <input
                      name="businessHoursOpen"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      required
                      className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </Field>
                  <Field label="Closes at" icon={<Clock />} required error={state.fieldErrors?.businessHoursClose}>
                    <input
                      name="businessHoursClose"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      required
                      className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </Field>
                </div>

                <Field
                  label="Open days"
                  icon={<CalendarDays />}
                  hint={`${businessDays.length}/7 selected`}
                >
                  <input type="hidden" name="businessDays" value={businessDays.join(",")} />
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((d) => {
                      const isOn = businessDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDay(d.id)}
                          aria-pressed={isOn}
                          title={d.long}
                          className={cn(
                            "inline-flex h-9 min-w-12 items-center justify-center rounded-md border px-2.5 text-[12.5px] font-semibold transition-colors",
                            isOn
                              ? "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-800/60 dark:bg-navy-800 dark:text-brand-200"
                              : "border-default bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                          )}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              {/* RIGHT — Pricing + Lifecycle + Availability */}
              <div className="flex flex-col gap-5 bg-surface-muted/20 px-6 py-6 lg:py-7">
                <SectionLabel>Pricing & limits</SectionLabel>

                <PriceField
                  label="Home delivery fee"
                  icon={<Truck />}
                  name="homeDeliveryFee"
                  value={homeDeliveryFee}
                  text={homeDeliveryText}
                  onValueText={(v, t) => {
                    setHomeDeliveryFee(v);
                    setHomeDeliveryText(t);
                  }}
                  prefix="₦"
                  error={state.fieldErrors?.homeDeliveryFee}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Urgent mode"
                    icon={urgentMode === "FLAT" ? <Banknote /> : <Percent />}
                  >
                    <Dropdown
                      name="urgentSurchargeMode"
                      value={urgentMode}
                      onChange={(v) => setUrgentMode(v as PricingMode)}
                      options={MODE_OPTIONS}
                      triggerClassName="h-11"
                    />
                  </Field>
                  <PriceField
                    label="Urgent surcharge"
                    icon={<Zap />}
                    name="urgentSurchargeAmount"
                    value={urgentSurchargeAmount}
                    text={urgentSurchargeText}
                    onValueText={(v, t) => {
                      const clamped = urgentMode === "PERCENTAGE" && v > 100 ? 100 : v;
                      setUrgentSurchargeAmount(clamped);
                      setUrgentSurchargeText(clamped > 0 ? withSeparators(clamped) : "");
                    }}
                    prefix={urgentMode === "FLAT" ? "₦" : "%"}
                    error={state.fieldErrors?.urgentSurchargeAmount}
                  />
                </div>

                <Field
                  label="Max discount % (reception)"
                  icon={<Percent />}
                  hint="0–100"
                  required
                  error={state.fieldErrors?.maxDiscountPercent}
                >
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground"
                    >
                      %
                    </span>
                    <input
                      name="maxDiscountPercent"
                      type="number"
                      min={0}
                      max={100}
                      value={maxDiscountPercent}
                      onChange={(e) =>
                        setMaxDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                      }
                      required
                      className="h-11 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-right text-[15px] font-semibold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </Field>

                <div className="border-t border-dashed border-default pt-5">
                  <SectionLabel>Lifecycle thresholds</SectionLabel>
                </div>

                <Field
                  label="Abandoned flag"
                  icon={<Hourglass />}
                  hint="Days after ready"
                  required
                  error={state.fieldErrors?.abandonedFlagDays}
                >
                  <div className="relative">
                    <input
                      name="abandonedFlagDays"
                      type="number"
                      min={1}
                      max={365}
                      value={abandonedFlagDays}
                      onChange={(e) =>
                        setAbandonedFlagDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))
                      }
                      required
                      className="h-11 w-full rounded-md border border-input bg-surface pr-12 pl-3 text-right text-[15px] font-semibold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                      days
                    </span>
                  </div>
                </Field>
                <Field
                  label="Move to storage"
                  icon={<Archive />}
                  hint="Days after ready"
                  required
                  error={state.fieldErrors?.moveToStorageDays}
                >
                  <div className="relative">
                    <input
                      name="moveToStorageDays"
                      type="number"
                      min={1}
                      max={365}
                      value={moveToStorageDays}
                      onChange={(e) =>
                        setMoveToStorageDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))
                      }
                      required
                      className="h-11 w-full rounded-md border border-input bg-surface pr-12 pl-3 text-right text-[15px] font-semibold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                      days
                    </span>
                  </div>
                </Field>

                {/* Availability — pinned to the bottom of the right column */}
                <div className="mt-auto flex items-center justify-between gap-4 rounded-lg border border-default bg-card px-4 py-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
                  <div className="flex min-w-0 items-center gap-3 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
                    {active ? <Power /> : <PowerOff />}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {active ? "Branch is active" : "Branch is paused"}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {active
                          ? "Accepts new tickets and customers."
                          : "Stays in history, hidden from new ticket flows."}
                      </span>
                    </div>
                  </div>
                  <Switch
                    name="active"
                    checked={active}
                    onChange={setActive}
                    ariaLabel="Branch is active"
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
                  "Create branch"
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

function PriceField({
  label,
  icon,
  name,
  value,
  text,
  onValueText,
  prefix,
  error,
}: {
  label: string;
  icon: React.ReactNode;
  name: string;
  value: number;
  text: string;
  onValueText: (value: number, text: string) => void;
  prefix: string;
  error?: string[];
}) {
  return (
    <Field label={label} icon={icon} required error={error}>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground"
        >
          {prefix}
        </span>
        {/* Hidden input carries the raw integer to the server action; text
            input is purely for display + live-formatting. */}
        <input type="hidden" name={name} value={value} />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            const n = parseInt0(e.target.value);
            onValueText(n, n > 0 ? withSeparators(n) : "");
          }}
          placeholder="0"
          aria-invalid={!!error}
          aria-label={label}
          className="h-11 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-right text-[15px] font-semibold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70"
        />
      </div>
    </Field>
  );
}
