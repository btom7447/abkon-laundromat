"use client";

import { motion } from "framer-motion";
import {
  Check,
  PackageOpen,
  Sparkles,
  Archive,
  Receipt,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { TicketStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type StepState = "done" | "active" | "future" | "cancelled";

export type TimelineStep = {
  key: string;
  label: string;
  when: string;
  state: StepState;
  meta?: string;
};

interface Props {
  steps: TimelineStep[];
  /** Current ticket status; shown in the eyebrow pill above the timeline. */
  currentStatus: TicketStatus;
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  RECEIVED: "Received",
  READY: "Ready for pickup",
  IN_STORAGE: "Moved to storage",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<TicketStatus, { badge: string; chip: string }> = {
  RECEIVED: {
    badge: "bg-brand-50 text-brand-800 ring-brand-200 dark:bg-navy-800 dark:text-brand-200 dark:ring-navy-700",
    chip: "bg-brand-500",
  },
  READY: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/40",
    chip: "bg-emerald-500",
  },
  IN_STORAGE: {
    badge: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40",
    chip: "bg-amber-500",
  },
  COLLECTED: {
    badge: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-navy-900 dark:text-navy-200 dark:ring-navy-700",
    chip: "bg-slate-500",
  },
  CANCELLED: {
    badge: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40",
    chip: "bg-red-500",
  },
};

const ICON_FOR_KEY: Record<string, LucideIcon> = {
  received: PackageOpen,
  ready: Sparkles,
  storage: Archive,
  awaiting: Sparkles,
  collected: Receipt,
  cancelled: XCircle,
};

export function TicketStatusTimeline({ steps, currentStatus }: Props) {
  const lastDoneIdx = steps.reduce(
    (latest, s, i) => (s.state === "done" ? i : latest),
    -1
  );
  const activeIdx = steps.findIndex((s) => s.state === "active");
  // Progress %: where the filled track ends. Use mid-points between nodes so
  // the line visibly extends past the last completed dot.
  const total = steps.length - 1;
  const progressIdx =
    activeIdx >= 0 ? activeIdx : lastDoneIdx >= 0 ? lastDoneIdx : 0;
  const progressPct = total > 0 ? (progressIdx / total) * 100 : 0;

  const tone = STATUS_TONE[currentStatus];

  return (
    <div className="rounded-2xl border border-default bg-card p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {currentStatus !== "CANCELLED" && currentStatus !== "COLLECTED" && (
              <span
                className={cn(
                  "absolute inset-0 animate-ping rounded-full opacity-75",
                  tone.chip
                )}
                style={{ animationDuration: "1.8s" }}
              />
            )}
            <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", tone.chip)} />
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] ring-1 ring-inset",
              tone.badge
            )}
          >
            {STATUS_LABEL[currentStatus]}
          </span>
        </div>
        <span className="text-[11.5px] font-medium text-muted-foreground">
          Step {Math.min(progressIdx + 1, steps.length)} of {steps.length}
        </span>
      </div>

      {/* Track */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute left-[18px] right-[18px] top-[18px] h-[2px] rounded-full bg-[hsl(var(--border))]" />
        {/* Filled line — animates on mount */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `calc(${progressPct}% * 1)` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className={cn(
            "absolute left-[18px] top-[18px] h-[2px] rounded-full",
            currentStatus === "CANCELLED" ? "bg-red-400/60" : "bg-brand-500"
          )}
          style={{ maxWidth: "calc(100% - 36px)" }}
        />

        {/* Nodes */}
        <ol
          className={cn(
            "relative grid gap-y-3",
            // 1col on small, columns equal to steps count on md+
            "grid-cols-1 md:[grid-template-columns:repeat(var(--n),1fr)]"
          )}
          style={{ ["--n" as never]: steps.length }}
        >
          {steps.map((s, idx) => {
            const Icon = ICON_FOR_KEY[s.key] ?? Sparkles;
            const isActive = s.state === "active";
            const isDone = s.state === "done";
            const isCancelled = s.state === "cancelled";
            const isFuture = s.state === "future";
            return (
              <li
                key={s.key}
                className="relative flex min-w-0 flex-col items-start md:items-center"
              >
                {/* Dot */}
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, delay: 0.1 + idx * 0.06 }}
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                    isDone && "bg-brand-500 text-white",
                    isActive && "bg-brand-500 text-white",
                    isCancelled && "bg-red-500 text-white",
                    isFuture && "border-2 border-dashed border-[hsl(var(--border-strong))] bg-card text-muted-foreground"
                  )}
                >
                  {/* Ping rings — CSS keyframe, two layered for smoother feel */}
                  {isActive && (
                    <>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand-500/60"
                        style={{ animationDuration: "1.8s" }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand-500/40"
                        style={{ animationDuration: "1.8s", animationDelay: "0.9s" }}
                      />
                    </>
                  )}
                  <span className="relative z-10 inline-flex">
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : isCancelled ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                </motion.span>

                {/* Label */}
                <div className="mt-2 flex flex-col items-start md:items-center md:text-center">
                  <span
                    className={cn(
                      "text-[12.5px] font-semibold leading-tight",
                      (isDone || isActive || isCancelled) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {s.when}
                  </span>
                  {s.meta && (
                    <span className="mt-1 line-clamp-2 max-w-[180px] text-[10.5px] italic leading-snug text-muted-foreground">
                      {s.meta}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
