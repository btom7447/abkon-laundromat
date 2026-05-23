"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Camera,
  Trash2,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Settings as SettingsIcon,
  ArrowRight,
  Smartphone,
  Bell,
  AlertTriangle,
  History,
  RefreshCw,
  Pin,
  PinOff,
  Search,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { toast } from "sonner";
import {
  updateProfileAction,
  requestPasswordChangeOtpAction,
  completePasswordChangeAction,
  updateNotificationPrefsAction,
  requestAccountDeletionAction,
  cancelAccountDeletionAction,
  togglePinnedItemAction,
  type ProfileState,
  type PasswordChangeRequestState,
  type PasswordChangeCompleteState,
} from "@/server/actions/profile";
import type { NotificationPrefs } from "@/lib/notification-prefs";
import {
  initMfaSetupAction,
  verifyMfaSetupAction,
  disableMfaAction,
  regenerateRecoveryCodesAction,
  type MfaSetupState,
  type MfaVerifyState,
} from "@/server/actions/mfa";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: Role;
    branchName: string | null;
    branchCode: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    passwordChangedAt: string | null;
    mfaEnabled: boolean;
    mfaRecoveryCount: number;
    notificationPrefs: NotificationPrefs;
    deletionRequestedAt: string | null;
  };
  loginHistory: Array<{
    when: string;
    ip: string | null;
    userAgent: string | null;
    usedRecovery: boolean;
  }>;
  pinnedItems: Array<{ id: string; name: string }>;
  availableItems: Array<{ id: string; name: string; branchId: string }>;
}

const TARGET_AVATAR_SIZE = 384; // px — crisp 2x for 192px displays
const MAX_AVATAR_BYTES = 110_000; // ~110 KB after compression

const ROLE_PILL_CLS: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  RECEPTION: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
};

function computeCompleteness(user: Props["user"]): { pct: number; missing: string[] } {
  const checks: Array<{ done: boolean; label: string }> = [
    { done: !!user.name && user.name.length >= 2, label: "Full name" },
    { done: !!user.phone, label: "Phone number" },
    { done: !!user.avatarUrl, label: "Profile photo" },
    { done: user.mfaEnabled, label: "Two-factor auth" },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}

export function ProfileClient({
  user,
  loginHistory,
  pinnedItems,
  availableItems,
}: Props) {
  const completeness = computeCompleteness(user);

  return (
    <>
      {/* Page head */}
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Your profile
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Update how you appear across the dashboard and change your sign-in password. Account
            email, role, and branch are managed by an admin.
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          <SettingsIcon />
          Settings
        </Link>
      </div>

      {/* Page body */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        {/* Completeness meter */}
        <CompletenessStrip pct={completeness.pct} missing={completeness.missing} />

        {user.deletionRequestedAt && (
          <DeletionRequestBanner requestedAt={user.deletionRequestedAt} />
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <AccountSection user={user} />
          <div className="flex flex-col gap-4">
            <SecuritySection
              hasPhone={!!user.phone}
              passwordChangedAt={user.passwordChangedAt}
            />
            <TwoFactorSection
              enabled={user.mfaEnabled}
              recoveryCount={user.mfaRecoveryCount}
            />
          </div>
        </div>

        <NotificationPrefsSection initial={user.notificationPrefs} />

        <PinnedItemsSection
          initialPinned={pinnedItems}
          availableItems={availableItems}
        />

        <LoginHistorySection history={loginHistory} />

        <DangerZoneSection
          deletionRequestedAt={user.deletionRequestedAt}
        />
      </div>
    </>
  );
}

// ── Completeness meter ────────────────────────────────────────────────

function CompletenessStrip({ pct, missing }: { pct: number; missing: string[] }) {
  const tone =
    pct === 100 ? "emerald" : pct >= 75 ? "sky" : pct >= 50 ? "amber" : "red";
  const TONE_CLS: Record<typeof tone, string> = {
    emerald: "bg-emerald-500",
    sky: "bg-brand-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-default bg-card p-4 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-muted-foreground">
          <CheckCircle2 />
          <span className="text-[12.5px] font-semibold text-foreground">
            Profile {pct === 100 ? "complete" : `${pct}% complete`}
          </span>
        </div>
        {missing.length > 0 && (
          <span className="text-[11.5px] text-muted-foreground">
            Add{" "}
            <span className="font-semibold text-foreground">
              {missing.slice(0, 2).join(", ")}
              {missing.length > 2 ? `, +${missing.length - 2}` : ""}
            </span>{" "}
            to finish
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn("h-full transition-[width] duration-500", TONE_CLS[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Deletion banner (when already requested) ─────────────────────────

function DeletionRequestBanner({ requestedAt }: { requestedAt: string }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
      <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
        <AlertTriangle className="text-amber-700 dark:text-amber-300" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
            Account deletion requested
          </span>
          <span className="text-[11.5px] text-amber-800/85 dark:text-amber-200/85">
            Submitted {requestedAt}. An admin will review and confirm before anything is removed.
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          startTransition(async () => {
            await cancelAccountDeletionAction();
            toast.success("Deletion request cancelled");
            router.refresh();
          });
        }}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 text-[12.5px] font-semibold leading-none text-amber-900 transition-colors hover:bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
      >
        Cancel request
      </button>
    </div>
  );
}

// ── Account section ───────────────────────────────────────────────────

function AccountSection({ user }: { user: Props["user"] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, {} as ProfileState);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [resizing, setResizing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Profile updated");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setResizing(true);
    try {
      const dataUrl = await resizeImage(file, TARGET_AVATAR_SIZE, MAX_AVATAR_BYTES);
      setAvatarUrl(dataUrl);
    } catch (err) {
      toast.error("Couldn't process that image. Try a different file.");
      console.error(err);
    } finally {
      setResizing(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex items-baseline justify-between border-b border-dashed border-default pb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
          <UserIcon />
          Account
        </h2>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        {/* Hidden inputs that carry the controlled state to the server action */}
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />

        {state.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {state.error}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              name={name || "You"}
              seed={user.email}
              src={avatarUrl}
              size={88}
              ring
            />
            {resizing && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-foreground">Profile photo</span>
            <p className="text-[11.5px] leading-snug text-muted-foreground">
              JPG, PNG, or WebP. We&apos;ll compress it for you — keep it under 4MB.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={resizing}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-default bg-surface px-3 text-[12.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-3.5 [&_svg]:w-3.5"
              >
                <Camera />
                {avatarUrl ? "Change" : "Upload"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  disabled={resizing}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-default bg-surface px-3 text-[12.5px] font-medium leading-none text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30 [&_svg]:h-3.5 [&_svg]:w-3.5"
                >
                  <Trash2 />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={pickFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Editable fields */}
        <div className="flex flex-col gap-4">
          <Field label="Full name" icon={<UserIcon />} required error={state.fieldErrors?.name}>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className={inputCls}
            />
          </Field>

          <Field
            label="Phone"
            icon={<Phone />}
            hint="Used for password reset codes"
            error={state.fieldErrors?.phone}
          >
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 803 …"
              className={cn(inputCls, "font-mono")}
            />
          </Field>
        </div>

        {/* Read-only account info */}
        <div className="grid grid-cols-1 gap-3 border-t border-dashed border-default pt-4 sm:grid-cols-2">
          <ReadOnlyRow icon={<Mail />} label="Email" value={user.email} />
          <ReadOnlyRow
            icon={<ShieldCheck />}
            label="Role"
            value={
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                  ROLE_PILL_CLS[user.role]
                )}
              >
                {user.role === "ADMIN" ? "Admin" : "Reception"}
              </span>
            }
          />
          <ReadOnlyRow
            icon={<Building2 />}
            label="Branch"
            value={
              user.branchName ? (
                <>
                  <span>{user.branchName}</span>
                  {user.branchCode && (
                    <code className="ml-1.5 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-foreground">
                      {user.branchCode}
                    </code>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">All branches</span>
              )
            }
          />
          <ReadOnlyRow icon={<Clock />} label="Last login" value={user.lastLoginAt ?? "—"} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-default pt-4">
          <button
            type="submit"
            disabled={pending || resizing}
            className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

// ── Security section ──────────────────────────────────────────────────

function SecuritySection({
  hasPhone,
  passwordChangedAt,
}: {
  hasPhone: boolean;
  passwordChangedAt: string | null;
}) {
  const [stage, setStage] = useState<"idle" | "code">("idle");

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex items-baseline justify-between border-b border-dashed border-default pb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
          <ShieldCheck />
          Password
        </h2>
        {passwordChangedAt && (
          <span className="text-[11px] text-muted-foreground">
            Last changed <span className="font-semibold text-foreground">{passwordChangedAt}</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[15px] font-bold text-foreground">Change password</h3>
        <p className="text-[12.5px] leading-snug text-muted-foreground">
          For security, password changes are verified with a one-time code sent to your registered
          phone number.
        </p>
      </div>

      {!hasPhone ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <Phone className="h-4 w-4 shrink-0" />
          <span>
            You don&apos;t have a phone number on file. Add one in the Account section above so we
            can send your verification code.
          </span>
        </div>
      ) : stage === "idle" ? (
        <RequestOtpForm onSent={() => setStage("code")} />
      ) : (
        <CompletePasswordForm onBack={() => setStage("idle")} />
      )}
    </section>
  );
}

function RequestOtpForm({ onSent }: { onSent: () => void }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordChangeOtpAction,
    {} as PasswordChangeRequestState
  );

  useEffect(() => {
    if (state.sent) {
      toast.success("Verification code sent to your phone");
      onSent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sent]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Sending code…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" />
            Send verification code
          </>
        )}
      </button>
      <p className="text-[11.5px] text-muted-foreground">
        Codes expire after 10 minutes.
      </p>
    </form>
  );
}

function CompletePasswordForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    completePasswordChangeAction,
    {} as PasswordChangeCompleteState
  );
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Password updated");
      setDone(true);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-semibold text-emerald-900 dark:text-emerald-100">
            Password updated
          </span>
          <span className="text-[12px] text-emerald-800/80 dark:text-emerald-200/80">
            Use the new password next time you sign in.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            onBack();
          }}
          className="text-[12px] font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-300"
        >
          Change again
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}

      <Field label="6-digit code" icon={<ShieldCheck />} error={state.fieldErrors?.code}>
        <input
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          pattern="\d{6}"
          placeholder="123456"
          aria-invalid={!!state.fieldErrors?.code}
          className={cn(inputCls, "font-mono text-center text-[18px] tracking-[0.4em]")}
        />
      </Field>

      <Field label="New password" icon={<KeyRound />} error={state.fieldErrors?.password}>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Min 10 chars · upper + lower + number"
            aria-invalid={!!state.fieldErrors?.password}
            className={cn(inputCls, "pr-10")}
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
      </Field>

      <Field
        label="Confirm new password"
        icon={<KeyRound />}
        error={state.fieldErrors?.confirmPassword}
      >
        <input
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          placeholder="Type it again"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
          className={inputCls}
        />
      </Field>

      <div className="flex items-center justify-between gap-2 border-t border-default pt-3">
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-md px-3 text-[12.5px] font-medium leading-none text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </>
          ) : (
            <>
              Update password
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Two-factor section ───────────────────────────────────────────────

function TwoFactorSection({
  enabled,
  recoveryCount,
}: {
  enabled: boolean;
  recoveryCount: number;
}) {
  const router = useRouter();
  const [pendingTransition, startTransition] = useTransition();
  const [stage, setStage] = useState<"idle" | "setup" | "verify" | "done">("idle");
  const [setupData, setSetupData] = useState<MfaSetupState | null>(null);
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyMfaSetupAction,
    {} as MfaVerifyState
  );
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (verifyState.success && verifyState.recoveryCodes) {
      setNewCodes(verifyState.recoveryCodes);
      setStage("done");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyState.success]);

  async function startSetup() {
    startTransition(async () => {
      const result = await initMfaSetupAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSetupData(result);
      setStage("setup");
    });
  }

  async function disable() {
    if (!confirm("Disable two-factor authentication?")) return;
    startTransition(async () => {
      const res = await disableMfaAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Two-factor authentication disabled");
      router.refresh();
    });
  }

  async function regenerate() {
    if (!confirm("Regenerate recovery codes? Old codes will stop working.")) return;
    startTransition(async () => {
      const res = await regenerateRecoveryCodesAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setNewCodes(res.codes);
      toast.success("New recovery codes generated");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex items-baseline justify-between border-b border-dashed border-default pb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
          <Smartphone />
          Two-factor authentication
        </h2>
        {enabled && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Enabled
          </span>
        )}
      </div>

      {/* New recovery codes — surfaced once after setup or regeneration */}
      {newCodes && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Save these recovery codes — you won&apos;t see them again
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {newCodes.map((c) => (
              <code
                key={c}
                className="rounded border border-amber-200 bg-white px-2 py-1 text-center font-mono text-[12px] font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
              >
                {c}
              </code>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(newCodes.join("\n")).then(() => {
                toast.success("Recovery codes copied");
              });
            }}
            className="text-[11.5px] font-semibold text-amber-900 transition-colors hover:underline dark:text-amber-200"
          >
            Copy all
          </button>
        </div>
      )}

      {enabled && stage !== "done" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-muted-foreground">
            Sign-in requires a 6-digit code from your authenticator app.{" "}
            <span className="text-foreground">
              {recoveryCount} recovery code{recoveryCount === 1 ? "" : "s"} remaining.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={pendingTransition}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-default bg-surface px-3.5 text-[12.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-3.5 [&_svg]:w-3.5"
            >
              <RefreshCw />
              Regenerate recovery codes
            </button>
            <button
              type="button"
              onClick={disable}
              disabled={pendingTransition}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 text-[12.5px] font-medium leading-none text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      ) : null}

      {!enabled && stage === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-muted-foreground">
            Add a second factor to sign-in. We&apos;ll scan a QR code with an authenticator app
            (Google Authenticator, 1Password, Authy, etc.) and verify a one-time code.
          </p>
          <button
            type="button"
            onClick={startSetup}
            disabled={pendingTransition}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTransition ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Set up two-factor auth
              </>
            )}
          </button>
        </div>
      )}

      {stage === "setup" && setupData?.qrDataUrl && setupData.secret && (
        <form
          action={verifyAction}
          className="flex flex-col gap-4 rounded-lg border border-default bg-surface-muted/40 p-4"
        >
          <input type="hidden" name="secret" value={setupData.secret} />
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-foreground">
              1. Scan with your authenticator
            </span>
            <div className="flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setupData.qrDataUrl}
                alt="2FA QR code"
                width={180}
                height={180}
                className="rounded-md border border-default bg-white p-2"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Or enter this secret manually:
                </span>
                <code className="block break-all rounded bg-surface px-2 py-1.5 font-mono text-[11.5px] text-foreground">
                  {setupData.secret}
                </code>
              </div>
            </div>
          </div>

          <Field
            label="2. Enter the 6-digit code"
            icon={<ShieldCheck />}
            error={verifyState.fieldErrors?.code}
          >
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              pattern="\d{6}"
              placeholder="123456"
              autoFocus
              className={cn(inputCls, "font-mono text-center text-[18px] tracking-[0.4em]")}
            />
          </Field>

          {verifyState.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {verifyState.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setSetupData(null);
              }}
              className="inline-flex h-10 items-center justify-center rounded-md px-3 text-[12.5px] font-medium leading-none text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify and enable"
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// ── Notification preferences ─────────────────────────────────────────

function NotificationPrefsSection({ initial }: { initial: NotificationPrefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [state, formAction, pending] = useActionState(
    updateNotificationPrefsAction,
    {} as ProfileState
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Notification preferences saved");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const items: Array<{
    key: keyof NotificationPrefs;
    label: string;
    desc: string;
  }> = [
    {
      key: "urgent",
      label: "Urgent pickups due today",
      desc: "Tickets marked urgent with a pickup date of today.",
    },
    {
      key: "uncollected",
      label: "Uncollected tickets",
      desc: "Tickets ready for 4+ days that haven't been picked up.",
    },
    {
      key: "unpaid",
      label: "Long-unpaid tickets",
      desc: "Tickets unpaid for 7+ days.",
    },
    {
      key: "smsFailed",
      label: "SMS delivery failures",
      desc: "Outgoing SMS that Termii rejected.",
    },
    {
      key: "cashReconcile",
      label: "Cash reconciliation reminders",
      desc: "Reminder if yesterday's drawer wasn't reconciled.",
    },
  ];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex items-baseline justify-between border-b border-dashed border-default pb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
          <Bell />
          Notification preferences
        </h2>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          {items.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-start justify-between gap-3 rounded-lg border border-default bg-card px-4 py-3 transition-colors hover:bg-surface-muted/40"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-foreground">{label}</span>
                <span className="text-[11.5px] text-muted-foreground">{desc}</span>
              </div>
              <Switch
                name={key}
                checked={prefs[key]}
                onChange={(next) => setPrefs((p) => ({ ...p, [key]: next }))}
                ariaLabel={label}
                size="sm"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-default pt-4">
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
            ) : (
              "Save preferences"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

// ── Pinned items (POS shortcuts) ─────────────────────────────────────

function PinnedItemsSection({
  initialPinned,
  availableItems,
}: {
  initialPinned: Array<{ id: string; name: string }>;
  availableItems: Array<{ id: string; name: string; branchId: string }>;
}) {
  const router = useRouter();
  const [pinned, setPinned] = useState<Set<string>>(
    () => new Set(initialPinned.map((p) => p.id))
  );
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const MAX_PINS = 10;

  function toggle(id: string) {
    const isPinned = pinned.has(id);
    if (!isPinned && pinned.size >= MAX_PINS) {
      toast.error(`Limit reached — keep your top ${MAX_PINS} pinned.`);
      return;
    }
    // Optimistic update
    setPinned((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    startTransition(async () => {
      const result = await togglePinnedItemAction(id);
      if (!result.ok) {
        toast.error(result.error);
        // Revert
        setPinned((s) => {
          const next = new Set(s);
          if (isPinned) next.add(id);
          else next.delete(id);
          return next;
        });
        return;
      }
      router.refresh();
    });
  }

  const lower = query.trim().toLowerCase();
  const filtered = lower
    ? availableItems.filter((i) => i.name.toLowerCase().includes(lower))
    : availableItems;

  // Order: pinned first (in current-pinned order), then everything else.
  const ordered = [...filtered].sort((a, b) => {
    const ap = pinned.has(a.id);
    const bp = pinned.has(b.id);
    if (ap === bp) return a.name.localeCompare(b.name);
    return ap ? -1 : 1;
  });

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-default pb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
          <Pin />
          POS shortcuts
        </h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {pinned.size} / {MAX_PINS} pinned
        </span>
      </div>

      <p className="-mt-1 text-[12.5px] leading-snug text-muted-foreground">
        Pin the items you ring up most often. Pinned items float to the top of the catalog when you
        create a new ticket — yours alone, every staff member has their own set.
      </p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-[13.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-lg border border-default">
        {ordered.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            No items match.
          </p>
        ) : (
          <ul className="divide-y divide-default">
            {ordered.map((it) => {
              const isPinned = pinned.has(it.id);
              return (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-2.5 truncate text-[13.5px] text-foreground">
                    {isPinned && (
                      <Pin className="h-3 w-3 shrink-0 text-brand-500" />
                    )}
                    <span className="truncate">{it.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-semibold leading-none transition-colors [&_svg]:h-3 [&_svg]:w-3",
                      isPinned
                        ? "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 dark:border-brand-900/40 dark:bg-brand-900/30 dark:text-brand-200"
                        : "border-default bg-surface text-foreground hover:bg-surface-muted"
                    )}
                  >
                    {isPinned ? (
                      <>
                        <PinOff />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin />
                        Pin
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Login history ────────────────────────────────────────────────────

function LoginHistorySection({
  history,
}: {
  history: Props["loginHistory"];
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="flex items-baseline justify-between border-b border-dashed border-default pb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
          <History />
          Recent sign-ins
        </h2>
        <span className="text-[11px] text-muted-foreground">Last {history.length}</span>
      </div>
      {history.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">No sign-ins recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {history.map((h, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-default bg-surface-muted/30 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[12.5px] font-semibold text-foreground tabular-nums">
                  {h.when}
                </span>
                {h.usedRecovery && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    Recovery code used
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {h.ip && <code className="font-mono">{h.ip}</code>}
                {h.userAgent && (
                  <span className="line-clamp-1 max-w-xs text-foreground/70">
                    {shortenUA(h.userAgent)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function shortenUA(ua: string): string {
  // Pull out a friendly browser/OS hint from a verbose UA string.
  if (/iPhone|iPad/.test(ua)) return "iOS · Safari";
  if (/Android/.test(ua)) return "Android";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return ua.slice(0, 40);
}

// ── Danger zone — account deletion request ───────────────────────────

function DangerZoneSection({
  deletionRequestedAt,
}: {
  deletionRequestedAt: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    requestAccountDeletionAction,
    {} as ProfileState
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Deletion request submitted to admin");
      setOpen(false);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  if (deletionRequestedAt) return null; // banner at top handles this state

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/40 dark:bg-red-950/15">
      <div className="flex items-baseline justify-between border-b border-dashed border-red-200/60 pb-3 dark:border-red-900/40">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-700 dark:text-red-300 [&_svg]:h-3.5 [&_svg]:w-3.5">
          <AlertTriangle />
          Danger zone
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-foreground">Request account deletion</span>
          <span className="text-[11.5px] text-muted-foreground">
            An admin reviews and confirms before anything is removed. Cancellable at any time.
          </span>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3.5 text-[12.5px] font-semibold leading-none text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            Request deletion
          </button>
        )}
      </div>

      {open && (
        <form action={formAction} className="flex flex-col gap-3 border-t border-dashed border-red-200/60 pt-4 dark:border-red-900/40">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-foreground">
              Reason <span className="text-muted-foreground">(optional)</span>
            </span>
            <textarea
              name="reason"
              rows={3}
              maxLength={500}
              placeholder="Help us understand — e.g. leaving the company, security concern."
              className="w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-[13.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {state.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {state.error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-strong bg-surface px-3.5 text-[12.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-[12.5px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(220_38_38/0.30)] transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit request"
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// ── Primitives ────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
      {error && <p className="text-[11.5px] text-red-600">{error[0]}</p>}
    </div>
  );
}

function ReadOnlyRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
      <span className="mt-0.5 flex items-center">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
        <span className="truncate text-[13px] text-foreground">{value}</span>
      </div>
    </div>
  );
}

// ── Client-side image resize ──────────────────────────────────────────

/**
 * Resize and compress an image client-side into a data URL. Walks down JPEG
 * quality until the encoded payload fits under `maxBytes` (~110KB default)
 * so we don't bloat the User row or the request.
 */
async function resizeImage(
  file: File,
  targetEdge: number,
  maxBytes: number
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  // Square crop from the center so all avatars are consistent.
  const minSide = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - minSide) / 2;
  const sy = (bitmap.height - minSide) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = targetEdge;
  canvas.height = targetEdge;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, targetEdge, targetEdge);

  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    // Rough byte-size check (data URL base64 length × 0.75)
    if (dataUrl.length * 0.75 <= maxBytes) return dataUrl;
  }
  // Fallback: aggressive scale-down + lowest quality
  const smallerCanvas = document.createElement("canvas");
  smallerCanvas.width = 256;
  smallerCanvas.height = 256;
  const sctx = smallerCanvas.getContext("2d");
  if (!sctx) throw new Error("Canvas not available");
  sctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, 256, 256);
  return smallerCanvas.toDataURL("image/jpeg", 0.5);
}
