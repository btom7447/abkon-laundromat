"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Search,
  UserPlus,
  X,
  Plus,
  Loader2,
  ArrowRight,
  User,
  Phone,
  MessageCircle,
  MapPin,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { searchCustomers, quickCreateCustomer } from "@/server/actions/customers";
import { cn } from "@/lib/utils";
import { isValidNigerianMobile, normalizeNigerianPhone } from "@/lib/phone";

export type PosCustomer = {
  id: string;
  name: string;
  phone: string;
  visits?: number;
  ltv?: number;
  lastVisitDays?: number | null;
};

interface Props {
  branchId: string;
  value: PosCustomer | null;
  onChange: (c: PosCustomer | null) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarColor(seed: string): string {
  const palette = ["#0EA5E9", "#16A34A", "#0369A1", "#7C3AED", "#DB2777", "#F59E0B"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length]!;
}

export function CustomerBar({ branchId, value, onChange }: Props) {
  if (value) return <SelectedBar customer={value} onChange={onChange} />;
  return <PickerBar branchId={branchId} onChange={onChange} />;
}

function SelectedBar({ customer, onChange }: { customer: PosCustomer; onChange: (c: PosCustomer | null) => void }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-default bg-surface px-4 py-3.5 md:flex-nowrap md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-white"
          style={{ background: avatarColor(customer.id) }}
        >
          {initials(customer.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[15px] font-semibold text-foreground">
            <span className="truncate">{customer.name}</span>
            <span className="font-mono text-[13px] font-normal text-muted-foreground">
              {customer.phone}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground">
            <span>
              {customer.visits ?? 0} past visit{customer.visits === 1 ? "" : "s"}
            </span>
            {customer.ltv != null && customer.ltv > 0 && (
              <>
                <Dot />
                <span>
                  <span className="font-semibold tabular-nums text-foreground">
                    ₦{customer.ltv.toLocaleString("en-NG")}
                  </span>{" "}
                  lifetime
                </span>
              </>
            )}
            {customer.lastVisitDays != null && (
              <>
                <Dot />
                <span>Last visit {customer.lastVisitDays}d ago</span>
              </>
            )}
            {(customer.visits ?? 0) >= 6 && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.02em] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                Regular
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted"
        >
          Change
        </button>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground/40" />
  );
}

function PickerBar({ branchId, onChange }: { branchId: string; onChange: (c: PosCustomer | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PosCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createWhatsapp, setCreateWhatsapp] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [existingDup, setExistingDup] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const wrap = useRef<HTMLDivElement>(null);

  function resetModal() {
    setCreating(false);
    setCreateName("");
    setCreatePhone("");
    setCreateWhatsapp("");
    setCreateAddress("");
    setCreateNotes("");
    setCreateError(null);
    setExistingDup(null);
  }

  function useExisting(c: { id: string; name: string; phone: string }) {
    onChange({ id: c.id, name: c.name, phone: c.phone, visits: 0 });
    resetModal();
    setQuery("");
  }

  // Close on Escape
  useEffect(() => {
    if (!creating) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) resetModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [creating, submitting]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchCustomers({ branchId, query });
        setResults(rows.map((r) => ({ ...r, visits: 0, ltv: 0, lastVisitDays: null })));
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [query, branchId]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function commitCreate() {
    setCreateError(null);
    setExistingDup(null);
    if (!createName.trim()) {
      setCreateError("Name + valid phone required");
      return;
    }
    if (!isValidNigerianMobile(normalizeNigerianPhone(createPhone))) {
      setCreateError("Enter a valid Nigerian mobile (e.g. 08012345678).");
      return;
    }
    setSubmitting(true);
    const res = await quickCreateCustomer({
      branchId,
      name: createName.trim(),
      phone: createPhone.trim(),
      whatsappNumber: createWhatsapp.trim() || undefined,
      defaultAddress: createAddress.trim() || undefined,
      notes: createNotes.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      setCreateError(res.error);
      if (res.existing) {
        setExistingDup(res.existing);
        toast.error("Phone already on file", {
          description: `"${res.existing.name}" — use that customer?`,
          action: {
            label: "Use existing",
            onClick: () => useExisting(res.existing!),
          },
        });
      } else {
        toast.error(res.error);
      }
      return;
    }
    toast.success("Customer created", { description: createName.trim() });
    onChange({ id: res.customerId, name: createName.trim(), phone: createPhone.trim(), visits: 0 });
    resetModal();
    setQuery("");
  }

  const phoneValid = isValidNigerianMobile(normalizeNigerianPhone(createPhone));
  const canSubmit = createName.trim().length > 0 && phoneValid && !submitting;

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-default bg-surface px-4 py-3.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4 md:px-6">
      <div className="flex flex-col gap-0.5 md:shrink-0">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Step 1 of 3
        </span>
        <span className="text-[15px] font-semibold text-foreground">Pick a customer</span>
      </div>
      <div ref={wrap} className="relative w-full md:max-w-[420px] md:flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            placeholder="Search by name or phone…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-[14px] text-foreground transition-colors focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-500/20"
          />
          <AnimatePresence>
            {open && (query.length >= 2 || results.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[320px] overflow-y-auto rounded-xl border border-default bg-card shadow-[0_12px_32px_-8px_rgb(11_18_38/0.18)]"
              >
                {results.length === 0 && (
                  <div className="px-4 py-4 text-center text-[13px] text-muted-foreground">
                    No matches for <strong>{query}</strong>.
                  </div>
                )}
                {results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-3 border-0 bg-transparent px-3.5 py-2.5 text-left transition-colors hover:bg-surface-muted"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                      style={{ background: avatarColor(c.id) }}
                    >
                      {initials(c.name)}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-[13.5px] font-semibold text-foreground">{c.name}</span>
                      <span className="truncate font-mono text-[12px] text-muted-foreground">{c.phone}</span>
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {c.visits ?? 0} visit{c.visits === 1 ? "" : "s"}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setCreating(true);
                    setCreateName(/^\d/.test(query) ? "" : query);
                    setCreatePhone(/^\d/.test(query) ? query : "");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 border-0 border-t border-solid border-default bg-surface-muted px-3.5 py-3 text-left text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-navy-700"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add new customer{query ? ` "${query}"` : ""}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      <div className="flex w-full shrink-0 gap-2 md:w-auto">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted md:w-auto [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          <Plus /> New customer
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <>
            <motion.div
              key="nc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => !submitting && resetModal()}
              className="fixed inset-0 z-60 bg-[color-mix(in_oklab,#0B1226_40%,transparent)] backdrop-blur-sm"
            />
            <motion.div
              key="nc-panel-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto p-4 md:p-8"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="New customer"
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
                      style={{ background: avatarColor(createPhone || createName || "new") }}
                    >
                      {createName.trim() ? initials(createName) : <UserPlus className="h-5 w-5" />}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[18px] font-bold leading-tight tracking-tight text-foreground">
                          {createName.trim() || "New customer"}
                        </h3>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          New
                        </span>
                      </div>
                      <p className="text-[12.5px] text-muted-foreground">
                        Add a customer to this branch.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetModal}
                    aria-label="Close"
                    disabled={submitting}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                  <div className="flex flex-col gap-4 px-6 py-5">
                    {createError && !existingDup && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        {createError}
                      </div>
                    )}
                    {existingDup && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                        <div className="flex items-start gap-2.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                            style={{ background: avatarColor(existingDup.id) }}
                          >
                            {initials(existingDup.name)}
                          </span>
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
                              Phone already on file
                            </div>
                            <div className="mt-0.5 text-[12.5px] text-amber-800/90 dark:text-amber-300/90">
                              <strong className="font-semibold">{existingDup.name}</strong> · {existingDup.phone}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => useExisting(existingDup)}
                          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700"
                        >
                          Use existing customer <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <NcField
                        label="Full name"
                        icon={<User />}
                        value={createName}
                        onChange={setCreateName}
                        placeholder="Adaeze Okafor"
                        autoFocus
                        disabled={submitting}
                        required
                      />
                      <NcField
                        label="Phone number"
                        icon={<Phone />}
                        placeholder="08012345678 or +2348012345678"
                        value={createPhone}
                        onChange={(v) => {
                          setCreatePhone(v);
                          if (existingDup) {
                            setExistingDup(null);
                            setCreateError(null);
                          }
                        }}
                        inputMode="tel"
                        disabled={submitting}
                        isMono
                        required
                      />
                      <NcField
                        label="WhatsApp number"
                        icon={<MessageCircle />}
                        value={createWhatsapp}
                        onChange={setCreateWhatsapp}
                        placeholder="(optional)"
                        inputMode="tel"
                        disabled={submitting}
                        isMono
                      />
                      <NcField
                        label="Default address"
                        icon={<MapPin />}
                        value={createAddress}
                        onChange={setCreateAddress}
                        placeholder="(optional)"
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nc-notes"
                        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground"
                      >
                        <StickyNote className="h-3.5 w-3.5 text-muted-foreground" /> Notes
                      </label>
                      <textarea
                        id="nc-notes"
                        rows={3}
                        value={createNotes}
                        onChange={(e) => setCreateNotes(e.target.value)}
                        placeholder="(optional)"
                        disabled={submitting}
                        className="min-h-20 w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-[13.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-default pt-4">
                      <button
                        type="button"
                        onClick={resetModal}
                        disabled={submitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={commitCreate}
                        disabled={!canSubmit}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
                          </>
                        ) : (
                          <>Create &amp; use</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NcField({
  label,
  icon,
  value,
  onChange,
  isMono,
  required,
  ...rest
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  isMono?: boolean;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = `nc-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-muted-foreground"
      >
        {icon}
        {label}
        {required && <span aria-hidden className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
          isMono && "font-mono"
        )}
        {...rest}
      />
    </div>
  );
}
