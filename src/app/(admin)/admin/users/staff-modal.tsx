"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  X,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  KeyRound,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import type { User, Role } from "@prisma/client";
import { toast } from "sonner";
import {
  createUserAction,
  updateUserAction,
  type UserFormState,
} from "@/server/actions/users";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
import { formatDate, cn } from "@/lib/utils";

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

interface Props {
  mode: "new" | "edit";
  user: User | null;
  branches: BranchOption[];
}

const initialState: UserFormState = {};

const ROLE_OPTIONS = [
  { value: "RECEPTION" as Role, label: "Reception", hint: "Branch-scoped — works the till" },
  { value: "ADMIN" as Role, label: "Admin", hint: "Full access across all branches" },
];

const ROLE_PILL_CLS: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  RECEPTION: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
};

export function StaffModal({ mode, user, branches }: Props) {
  const router = useRouter();
  const action = mode === "new" ? createUserAction : updateUserAction.bind(null, user!.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "RECEPTION");
  const [branchId, setBranchId] = useState<string>(user?.branchId ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [active, setActive] = useState<boolean>(user?.active ?? true);

  // ADMIN role can't be tied to a branch — clear it on role flip
  useEffect(() => {
    if (role === "ADMIN") setBranchId("");
  }, [role]);

  function close() {
    router.push("/admin/users", { scroll: false });
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
      toast.success(mode === "new" ? "Staff account created" : "Staff account updated");
      close();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const displayName = name.trim() || (mode === "new" ? "New staff member" : user?.name ?? "Staff");
  const isLocked = !!user?.lockedUntil && user.lockedUntil > new Date();
  const branchOptions = [
    { value: "", label: "— Select branch —", hint: "Required for reception" },
    ...branches.map((b) => ({ value: b.id, label: b.name, hint: `Code ${b.code}` })),
  ];

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
          aria-label={mode === "new" ? "New staff member" : `Edit ${user?.name}`}
          initial={{ y: 12, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-default bg-card shadow-[0_24px_56px_-16px_rgb(11_18_38/0.26)]"
        >
          <form action={formAction} className="flex flex-col">
            <input type="hidden" name="__modal" value="1" />
            {/* When ADMIN we still need branchId in the form for the schema. Empty string clears it server-side. */}
            <input type="hidden" name="branchId" value={role === "ADMIN" ? "" : branchId} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-default bg-gradient-to-b from-brand-50/40 to-transparent px-6 pt-6 pb-5 dark:from-brand-950/20">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar
                  name={name.trim() || displayName}
                  seed={email || displayName}
                  src={user?.avatarUrl ?? null}
                  size={64}
                  className="rounded-2xl shadow-[0_1px_3px_0_rgb(15_23_42/0.08)]"
                />
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
                        ROLE_PILL_CLS[role]
                      )}
                    >
                      {role === "ADMIN" ? "Admin" : "Reception"}
                    </span>
                    {isLocked && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        <Lock className="h-2.5 w-2.5" />
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    {mode === "new"
                      ? "Create a new admin or reception account."
                      : email || "Staff account"}
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
              {/* LEFT — Identity & Access */}
              <div className="flex flex-col gap-5 px-6 py-6 lg:py-7">
                <SectionLabel>Identity</SectionLabel>

                <Field label="Full name" icon={<UserIcon />} required error={state.fieldErrors?.name}>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Adaeze Okafor"
                    required
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field
                  label="Email"
                  icon={<Mail />}
                  required={mode === "new"}
                  hint={mode === "edit" ? "Used to sign in — locked" : undefined}
                  error={state.fieldErrors?.email}
                >
                  <input
                    id="staff-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={mode === "edit" ? undefined : (e) => setEmail(e.target.value)}
                    placeholder="adaeze@abkon.ng"
                    required={mode === "new"}
                    readOnly={mode === "edit"}
                    autoComplete={mode === "edit" ? "off" : "email"}
                    inputMode="email"
                    spellCheck={false}
                    className={cn(
                      "h-11 w-full rounded-md border border-input px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      mode === "edit"
                        ? "cursor-not-allowed bg-surface-muted/60 text-muted-foreground"
                        : "bg-surface text-foreground"
                    )}
                  />
                </Field>

                <Field label="Phone" icon={<Phone />} hint="(optional)" error={state.fieldErrors?.phone}>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 …"
                    className="h-11 w-full rounded-md border border-input bg-surface px-3 font-mono text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <div className="border-t border-dashed border-default pt-5">
                  <SectionLabel>Access</SectionLabel>
                </div>

                <Field label="Role" icon={<ShieldCheck />}>
                  <Dropdown
                    name="role"
                    value={role}
                    onChange={(v) => setRole(v as Role)}
                    options={ROLE_OPTIONS}
                    triggerClassName="h-11"
                  />
                </Field>

                <Field
                  label="Branch"
                  icon={<Building2 />}
                  hint={role === "ADMIN" ? "Admins see all branches" : "Required for reception"}
                  error={state.fieldErrors?.branchId}
                >
                  <Dropdown
                    value={role === "ADMIN" ? "" : branchId}
                    onChange={(v) => setBranchId(v)}
                    options={branchOptions}
                    disabled={role === "ADMIN"}
                    triggerClassName="h-11"
                    placeholder={role === "ADMIN" ? "All branches" : "Select branch…"}
                  />
                </Field>
              </div>

              {/* RIGHT — Activity & Availability */}
              <div className="flex flex-col gap-5 bg-surface-muted/20 px-6 py-6 lg:py-7">
                {mode === "new" ? (
                  <>
                    <SectionLabel>Initial password</SectionLabel>
                    <Field
                      label="Set a starter password"
                      icon={<KeyRound />}
                      hint="Min 10 chars · upper + lower + number"
                      required
                      error={state.fieldErrors?.password}
                    >
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Choose a strong password"
                          required
                          className="h-11 w-full rounded-md border border-input bg-surface px-3 pr-10 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Share this with the staff member. They can change it via their profile page after signing in.
                      </p>
                    </Field>
                  </>
                ) : (
                  <>
                    {/* In edit mode admins no longer reset other people's passwords —
                        staff own their password via /admin/profile (phone-OTP verified). */}
                    <SectionLabel>Password</SectionLabel>
                    <div className="flex items-start gap-3 rounded-lg border border-default bg-card p-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
                      <KeyRound className="mt-0.5 text-muted-foreground" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-foreground">
                          Managed by the staff member
                        </span>
                        <span className="text-[11.5px] text-muted-foreground">
                          Passwords are reset by the user on their profile page with a one-time
                          code to their phone. If this account is locked out, the OTP flow will
                          clear it.
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Security info (edit only) */}
                {mode === "edit" && user && (
                  <>
                    <div className="border-t border-dashed border-default pt-5">
                      <SectionLabel>Activity</SectionLabel>
                    </div>
                    <div className="flex flex-col gap-2.5 rounded-lg border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
                      <SecurityRow
                        icon={<Clock />}
                        label="Last login"
                        value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                      />
                      <SecurityRow
                        icon={<AlertTriangle />}
                        label="Failed attempts"
                        value={String(user.failedLoginAttempts)}
                        tone={user.failedLoginAttempts >= 3 ? "warn" : undefined}
                      />
                      {isLocked && user.lockedUntil && (
                        <SecurityRow
                          icon={<Lock />}
                          label="Locked until"
                          value={formatDate(user.lockedUntil)}
                          tone="warn"
                        />
                      )}
                    </div>
                  </>
                )}

                {/* Availability — pinned to the bottom of the right column */}
                <div className="mt-auto flex items-center justify-between gap-4 rounded-lg border border-default bg-card px-4 py-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
                  <div className="flex min-w-0 items-center gap-3 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
                    {active ? <Power /> : <PowerOff />}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {active ? "Account is active" : "Account is suspended"}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {active
                          ? "Can sign in and use the app."
                          : "Stays in history, can't sign in."}
                      </span>
                    </div>
                  </div>
                  <Switch
                    name="active"
                    checked={active}
                    onChange={setActive}
                    ariaLabel="Account is active"
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
                  "Create staff"
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

function SecurityRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "warn" ? "text-amber-700 dark:text-amber-300" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
