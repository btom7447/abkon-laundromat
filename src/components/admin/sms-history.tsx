"use client";

import { useState, useTransition } from "react";
import { Check, AlertTriangle, RotateCw, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SmsStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { resendSms } from "@/server/actions/sms";
import { cn } from "@/lib/utils";

export type SmsHistoryItem = {
  id: string;
  customerPhone: string;
  content: string;
  status: SmsStatus;
  createdAt: Date;
  sentAt: Date | null;
  error: string | null;
};

interface Props {
  items: SmsHistoryItem[];
}

const STATUS_TONE: Record<SmsStatus, { label: string; cls: string }> = {
  QUEUED: {
    label: "Queued",
    cls: "bg-surface-muted text-muted-foreground ring-[hsl(var(--border))]",
  },
  SENT: {
    label: "Sent",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/40",
  },
  DELIVERED: {
    label: "Delivered",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/40",
  },
  FAILED: {
    label: "Failed",
    cls: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/40",
  },
};

export function SmsHistory({ items }: Props) {
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleResend(id: string) {
    setResendingId(id);
    startTransition(async () => {
      const res = await resendSms({ smsLogId: id });
      setResendingId(null);
      if (res.ok) {
        toast.success("SMS resent", { description: "Provider delivery in flight." });
      } else {
        toast.error("Couldn't resend SMS", { description: res.error });
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">No SMS sent for this ticket yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => {
        const tone = STATUS_TONE[s.status];
        const isResending = resendingId === s.id;
        const failed = s.status === "FAILED";
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-lg border bg-surface px-3.5 py-3",
              failed
                ? "border-red-200 dark:border-red-900/50"
                : "border-default"
            )}
          >
            <div className="text-[13px] leading-snug text-foreground whitespace-pre-wrap">
              {s.content}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  To <span className="font-mono">{s.customerPhone}</span>
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDate(s.createdAt)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                    tone.cls
                  )}
                >
                  {s.status === "SENT" || s.status === "DELIVERED" ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : s.status === "FAILED" ? (
                    <AlertTriangle className="h-2.5 w-2.5" />
                  ) : null}
                  {tone.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleResend(s.id)}
                disabled={isResending}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition-colors",
                  failed
                    ? "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/70"
                    : "bg-surface-muted text-foreground hover:bg-[hsl(var(--border))] disabled:opacity-60",
                  "disabled:cursor-not-allowed"
                )}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Resending…
                  </>
                ) : (
                  <>
                    <RotateCw className="h-3 w-3" />
                    {failed ? "Retry send" : "Resend"}
                  </>
                )}
              </button>
            </div>

            {failed && s.error && (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50/60 px-2.5 py-1.5 text-[11.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                <span className="font-semibold">Provider:</span> {s.error}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
