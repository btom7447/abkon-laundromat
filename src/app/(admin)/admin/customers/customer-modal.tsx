"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, User, Phone, MessageCircle, MapPin, StickyNote, Calendar } from "lucide-react";
import type { Customer } from "@prisma/client";
import { toast } from "sonner";
import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerFormState,
} from "@/server/actions/customers";
import { formatDate, formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CustomerBand = "regular" | "active" | "new" | "dormant";

const BAND_CLS: Record<CustomerBand, string> = {
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

interface EditStats {
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
}

interface Props {
  mode: "new" | "edit";
  /** For edit mode */
  customer: Customer | null;
  /** For edit mode */
  stats: EditStats | null;
  /** Computed tag (edit) or "new" (new mode) */
  band: CustomerBand;
  branchId: string;
  branchName: string;
}

function avatarColor(seed: string): string {
  const palette = ["#0EA5E9", "#16A34A", "#0369A1", "#7C3AED", "#DB2777", "#F59E0B", "#DC2626", "#0891B2"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length]!;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeDays(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const STATUS_BADGE_CLS: Record<string, string> = {
  RECEIVED: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  READY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  IN_STORAGE: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  COLLECTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const initialState: CustomerFormState = {};

export function CustomerModal({ mode, customer, stats, band, branchId, branchName }: Props) {
  const router = useRouter();
  const action = mode === "new"
    ? createCustomerAction
    : async (prev: CustomerFormState, formData: FormData) =>
        updateCustomerAction(customer!.id, prev, formData);
  const [state, formAction, pending] = useActionState(action, initialState);

  function close() {
    router.push("/admin/customers", { scroll: false });
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-close on success
  useEffect(() => {
    if (state.success) {
      toast.success(mode === "new" ? "Customer created" : "Customer updated");
      close();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const avatarSeed = customer?.phone ?? "new";
  const avatarLabel = customer?.name ?? "New";
  const phoneVal = customer?.phone ?? "";

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={close}
        className="fixed inset-0 z-60 bg-[color-mix(in_oklab,#0B1226_40%,transparent)] backdrop-blur-sm"
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
          aria-label={mode === "new" ? "New customer" : `Edit ${customer?.name}`}
          initial={{ y: 12, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="my-auto w-full max-w-160 overflow-hidden rounded-2xl border border-default bg-card shadow-[0_24px_56px_-16px_rgb(11_18_38/0.22)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-default px-6 pt-6 pb-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
                style={{ background: avatarColor(avatarSeed) }}
              >
                {initials(avatarLabel)}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[18px] font-bold leading-tight tracking-tight text-foreground">
                    {mode === "new" ? "New customer" : customer?.name}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      BAND_CLS[band]
                    )}
                  >
                    {BAND_LABEL[band]}
                  </span>
                </div>
                <p className="text-[12.5px] text-muted-foreground">
                  {mode === "new"
                    ? `Add a customer to ${branchName}.`
                    : phoneVal && (
                        <span className="font-mono">{phoneVal}</span>
                      )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              disabled={pending}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {/* Stats row (edit only) */}
            {mode === "edit" && stats && (
              <div className="grid grid-cols-3 gap-4 border-b border-default bg-surface-muted/40 px-6 py-4">
                <Stat label="Visits" value={String(stats.visits)} />
                <Stat label="Lifetime" value={formatNaira(stats.lifetime)} />
                <Stat
                  label="Last visit"
                  value={stats.lastVisit ? relativeDays(stats.lastVisit) : "—"}
                  small
                />
              </div>
            )}

            <form action={formAction} className="flex flex-col gap-4 px-6 py-5">
              <input type="hidden" name="branchId" value={branchId} />
              <input type="hidden" name="__modal" value="1" />

              {state.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {state.error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Full name"
                  name="name"
                  icon={<User />}
                  defaultValue={customer?.name}
                  error={state.fieldErrors?.name}
                  required
                  placeholder="Adaeze Okafor"
                />
                <FormField
                  label="Phone number"
                  name="phone"
                  icon={<Phone />}
                  defaultValue={customer?.phone}
                  error={state.fieldErrors?.phone}
                  required
                  inputMode="tel"
                  placeholder="08012345678 or +2348012345678"
                  isMono
                />
                <FormField
                  label="WhatsApp number"
                  name="whatsappNumber"
                  icon={<MessageCircle />}
                  defaultValue={customer?.whatsappNumber ?? ""}
                  error={state.fieldErrors?.whatsappNumber}
                  inputMode="tel"
                  placeholder="(optional, same format as phone)"
                  isMono
                />
                <FormField
                  label="Default address"
                  name="defaultAddress"
                  icon={<MapPin />}
                  defaultValue={customer?.defaultAddress ?? ""}
                  error={state.fieldErrors?.defaultAddress}
                  placeholder="(optional)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="notes"
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground"
                >
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" /> Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={customer?.notes ?? ""}
                  placeholder="(optional)"
                  className="min-h-20 w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-[13.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={customer?.active ?? true}
                  style={{ accentColor: "#0EA5E9" }}
                  className="h-4 w-4 rounded"
                />
                Active
              </label>

              {/* Recent tickets (edit only) */}
              {mode === "edit" && stats && stats.recentTickets.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5 border-t border-default pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Recent tickets
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {stats.visits} total
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {stats.recentTickets.map((t) => (
                      <Link
                        key={t.id}
                        href={`/admin/tickets/${t.id}`}
                        onClick={close}
                        className="flex items-center justify-between gap-3 rounded-lg border border-default bg-surface px-3 py-2 transition-colors hover:bg-surface-muted"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-[12.5px] font-semibold text-foreground">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              STATUS_BADGE_CLS[t.status] ?? STATUS_BADGE_CLS.RECEIVED
                            )}
                          >
                            {t.status.toLowerCase().replace("_", " ")}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-[11.5px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(t.createdAt)}
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatNaira(t.grandTotal)}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-default pt-4">
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : mode === "new" ? (
                    "Create customer"
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-bold tabular-nums tracking-tight text-foreground",
          small ? "text-[15px]" : "text-[18px]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FormField({
  label,
  name,
  icon,
  error,
  isMono,
  ...inputProps
}: {
  label: string;
  name: string;
  icon: React.ReactNode;
  error?: string[];
  isMono?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-muted-foreground"
      >
        {icon}
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMono && "font-mono"
        )}
        {...inputProps}
      />
      {error && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}
