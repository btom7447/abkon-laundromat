"use client";

import { useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  KeyRound,
  Phone,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { loginAction, type LoginState } from "./actions";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type RequestState,
  type ResetState,
} from "@/server/actions/password-reset";
import { cn } from "@/lib/utils";

interface Props {
  callbackUrl?: string;
  initialError?: string;
}

type Mode = "signin" | "forgot-phone" | "forgot-reset" | "forgot-done";

export function AuthPanel({ callbackUrl, initialError }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [resetPhone, setResetPhone] = useState<string>("");

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {mode === "signin" && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <SignInForm
              callbackUrl={callbackUrl}
              initialError={initialError}
              onForgot={() => setMode("forgot-phone")}
            />
          </motion.div>
        )}

        {mode === "forgot-phone" && (
          <motion.div
            key="forgot-phone"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ForgotPhoneForm
              onBack={() => setMode("signin")}
              onSent={(phone) => {
                setResetPhone(phone);
                setMode("forgot-reset");
              }}
            />
          </motion.div>
        )}

        {mode === "forgot-reset" && (
          <motion.div
            key="forgot-reset"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ForgotResetForm
              phone={resetPhone}
              onBack={() => setMode("forgot-phone")}
              onResend={() => setMode("forgot-phone")}
              onDone={() => setMode("forgot-done")}
            />
          </motion.div>
        )}

        {mode === "forgot-done" && (
          <motion.div
            key="forgot-done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ResetDoneScreen onBackToSignIn={() => setMode("signin")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sign In ────────────────────────────────────────────────────────────

function SignInForm({
  callbackUrl,
  initialError,
  onForgot,
}: {
  callbackUrl?: string;
  initialError?: string;
  onForgot: () => void;
}) {
  const [state, formAction, pending] = useActionState(loginAction, {} as LoginState);
  const [showPassword, setShowPassword] = useState(false);
  const errorMsg = state.error ?? initialError;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

      <Header
        title="Welcome back"
        sub="Sign in to your Abkon Laundromat account."
      />

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <FieldGroup label="Email" icon={<Mail />} error={state.fieldErrors?.email}>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          placeholder="you@abkon.ng"
          aria-invalid={!!state.fieldErrors?.email}
          className={inputCls}
        />
      </FieldGroup>

      <FieldGroup
        label="Password"
        icon={<KeyRound />}
        error={state.fieldErrors?.password}
        right={
          <button
            type="button"
            onClick={onForgot}
            className="text-[11.5px] font-medium text-brand-700 transition-colors hover:underline dark:text-brand-300"
          >
            Forgot password?
          </button>
        }
      >
        <div className="relative">
          <input
            id="signin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
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
      </FieldGroup>

      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

// ── Forgot password · step 1 (phone) ──────────────────────────────────

function ForgotPhoneForm({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: (phone: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    {} as RequestState
  );

  useEffect(() => {
    if (state.sent && state.phone) {
      toast.success("If your account is on file, we've sent a 6-digit code.");
      onSent(state.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sent]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <BackLink onClick={onBack} />

      <Header
        title="Reset your password"
        sub="Enter the phone number on your staff account. We'll text you a 6-digit code."
      />

      <FieldGroup label="Phone number" icon={<Phone />} error={state.fieldErrors?.phone}>
        <input
          id="reset-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+234 803 …"
          aria-invalid={!!state.fieldErrors?.phone}
          className={cn(inputCls, "font-mono")}
        />
      </FieldGroup>

      <SubmitButton pending={pending} pendingLabel="Sending code…">
        Send reset code
      </SubmitButton>

      <p className="text-center text-[11.5px] text-muted-foreground">
        Codes expire after 10 minutes for security.
      </p>
    </form>
  );
}

// ── Forgot password · step 2 (code + new password) ────────────────────

function ForgotResetForm({
  phone,
  onBack,
  onResend,
  onDone,
}: {
  phone: string;
  onBack: () => void;
  onResend: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {} as ResetState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Password reset. You can sign in with the new password.");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <BackLink onClick={onBack} />

      <Header
        title="Enter the code"
        sub={
          <>
            We sent a 6-digit code to <span className="font-mono font-semibold text-foreground">{phone}</span>.{" "}
            <button
              type="button"
              onClick={onResend}
              className="font-semibold text-brand-700 transition-colors hover:underline dark:text-brand-300"
            >
              Resend
            </button>
          </>
        }
      />

      <input type="hidden" name="phone" value={phone} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}

      <FieldGroup label="6-digit code" icon={<ShieldCheck />} error={state.fieldErrors?.code}>
        <input
          id="reset-code"
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
      </FieldGroup>

      <FieldGroup label="New password" icon={<KeyRound />} error={state.fieldErrors?.password}>
        <div className="relative">
          <input
            id="reset-password"
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
      </FieldGroup>

      <FieldGroup
        label="Confirm new password"
        icon={<KeyRound />}
        error={state.fieldErrors?.confirmPassword}
      >
        <input
          id="reset-confirm"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          placeholder="Type it again"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
          className={inputCls}
        />
      </FieldGroup>

      <SubmitButton pending={pending} pendingLabel="Resetting…">
        Reset password
      </SubmitButton>
    </form>
  );
}

// ── Done screen ───────────────────────────────────────────────────────

function ResetDoneScreen({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground">Password reset</h2>
        <p className="max-w-sm text-[13px] text-muted-foreground">
          Your password has been updated. Sign in with the new password to continue.
        </p>
      </div>
      <button
        type="button"
        onClick={onBackToSignIn}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-[14px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600"
      >
        Back to sign in
      </button>
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-md border border-input bg-surface px-3 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Header({ title, sub }: { title: string; sub: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-[22px] font-bold leading-tight tracking-tight text-foreground md:text-[24px]">
        {title}
      </h2>
      <p className="text-[13px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

function FieldGroup({
  label,
  icon,
  right,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground [&_svg]:h-7 [&_svg]:w-7 [&_svg]:shrink-0 [&_svg]:text-brand-700 dark:[&_svg]:text-brand-300">
          {icon}
          {label}
        </label>
        {right}
      </div>
      {children}
      {error && <p className="text-[11.5px] text-red-600 dark:text-red-400">{error[0]}</p>}
    </div>
  );
}

function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold leading-none text-white shadow-[0_4px_12px_-2px_rgb(14_165_233/0.30)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-fit items-center gap-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to sign in
    </button>
  );
}
