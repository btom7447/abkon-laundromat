"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Clock,
  Wallet,
  MessageCircle,
  CheckCircle2,
  CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/actions/notifications";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  tone: "sky" | "success" | "warn" | "danger";
  title: string;
  body: string;
  ticketNumber?: string | null;
  href: string;
  createdAt: Date;
  /** Server-loaded read state for the current user. */
  read?: boolean;
}

/** Custom event channel for the ProfileMenu (mobile) to open this dropdown. */
export const NOTIFICATIONS_OPEN_EVENT = "abkon:open-notifications";

function relTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function iconFor(title: string, tone: NotificationItem["tone"]) {
  const t = title.toLowerCase();
  if (t.includes("sms")) return MessageCircle;
  if (t.includes("cash") || t.includes("reconcile")) return Wallet;
  if (t.includes("urgent")) return AlertTriangle;
  if (t.includes("uncollected") || t.includes("waiting")) return Clock;
  if (tone === "success") return CheckCircle2;
  return Bell;
}

const TONE_CLASSES: Record<NotificationItem["tone"], string> = {
  sky: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function formatBadgeCount(n: number): string {
  if (n < 10) return String(n);
  if (n < 100) return String(n);
  return "99+";
}

export function NotificationsButton({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  // Locally-overridden read set so mark-as-read feels instant. Seeded from
  // the server `read` field; cleared on dropdown re-open.
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const seededRead = useMemo(
    () => new Set(items.filter((i) => i.read).map((i) => i.id)),
    [items]
  );

  // Effective read set = server-seeded ∪ locally-marked
  const readSet = useMemo(() => {
    const s = new Set(seededRead);
    locallyRead.forEach((id) => s.add(id));
    return s;
  }, [seededRead, locallyRead]);

  const unreadCount = items.filter((i) => !readSet.has(i.id)).length;
  const allRead = items.length > 0 && unreadCount === 0;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Listen for the mobile profile-dropdown's request to open us.
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(NOTIFICATIONS_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(NOTIFICATIONS_OPEN_EVENT, onOpen);
  }, []);

  function markOneRead(id: string) {
    setLocallyRead((s) => {
      const next = new Set(s);
      next.add(id);
      return next;
    });
    startTransition(() => {
      markNotificationReadAction(id).catch(() => {
        // Server failed — swallow; user sees a UI revert on next refresh.
      });
    });
  }

  function markAllRead() {
    const ids = items.map((i) => i.id).filter((id) => !readSet.has(id));
    if (ids.length === 0) return;
    setLocallyRead((s) => {
      const next = new Set(s);
      ids.forEach((id) => next.add(id));
      return next;
    });
    startTransition(() => {
      markAllNotificationsReadAction(ids).catch(() => {});
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Bell />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9.5px] font-bold tabular-nums text-white ring-2 ring-surface",
              unreadCount >= 100 && "min-w-[22px]"
            )}
          >
            {formatBadgeCount(unreadCount)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-x-3 top-[calc(56px+8px)] z-50 flex max-h-[calc(100dvh-80px)] flex-col overflow-hidden rounded-xl border border-default bg-card shadow-[0_12px_32px_-8px_rgb(11_18_38_/_0.18),_0_6px_12px_-6px_rgb(11_18_38_/_0.1)] sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:max-h-[480px] sm:w-[380px]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-default px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold text-foreground">Notifications</span>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} new` : `${items.length}`}
                </span>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={allRead}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-brand-700 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60 dark:text-brand-300 [&_svg]:h-3 [&_svg]:w-3"
                >
                  <CheckCheck />
                  {allRead ? "All read" : "Mark all read"}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="text-[13.5px] font-semibold text-foreground">All caught up</span>
                  <span className="text-[12px] text-muted-foreground">
                    Nothing needs your attention.
                  </span>
                </div>
              ) : (
                items.map((n) => {
                  const Icon = iconFor(n.title, n.tone);
                  const isRead = readSet.has(n.id);
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => {
                        markOneRead(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "group grid grid-cols-[32px_1fr_auto] items-start gap-3 border-b border-default px-4 py-3 transition-colors last:border-0 hover:bg-surface-muted",
                        isRead && "opacity-60"
                      )}
                    >
                      <span
                        className={cn(
                          "relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          TONE_CLASSES[n.tone]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {!isRead && (
                          <span
                            aria-hidden
                            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-card"
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span
                          className={cn(
                            "line-clamp-1 text-[13.5px] leading-snug",
                            isRead
                              ? "font-medium text-muted-foreground"
                              : "font-semibold text-foreground"
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="line-clamp-2 text-[12.5px] leading-snug text-foreground/70 dark:text-foreground/65">
                          {n.body}
                        </span>
                        {n.ticketNumber && (
                          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 group-hover:bg-brand-100 dark:bg-navy-800 dark:text-brand-300 dark:ring-navy-700">
                            {n.ticketNumber}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] font-medium text-muted-foreground">
                        {relTime(n.createdAt)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
