"use client";

import {
  Plus,
  CheckCircle2,
  Wallet,
  UserCircle,
  Zap,
  Percent,
  XCircle,
  ShieldAlert,
  Archive,
  Receipt,
  Edit,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  actorName: string | null;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
}

type Tone = "success" | "sky" | "warn" | "danger";

const ICON_MAP: Record<string, { icon: LucideIcon; tone: Tone }> = {
  ticket_created: { icon: Plus, tone: "sky" },
  ticket_ready: { icon: CheckCircle2, tone: "success" },
  ticket_collected: { icon: Receipt, tone: "sky" },
  ticket_cancelled: { icon: XCircle, tone: "danger" },
  ticket_in_storage: { icon: Archive, tone: "warn" },
  ticket_paid: { icon: Wallet, tone: "sky" },
  discount_applied: { icon: Percent, tone: "warn" },
  customer_created: { icon: UserCircle, tone: "sky" },
  customer_updated: { icon: Edit, tone: "sky" },
  item_price_changed: { icon: Edit, tone: "warn" },
  addon_price_changed: { icon: Edit, tone: "warn" },
  login_success: { icon: ShieldAlert, tone: "sky" },
  login_failure: { icon: ShieldAlert, tone: "warn" },
  login_locked: { icon: ShieldAlert, tone: "danger" },
  cash_reconciliation_created: { icon: Wallet, tone: "sky" },
  cash_reconciliation_updated: { icon: Wallet, tone: "warn" },
};

const TONE_CLS: Record<Tone, string> = {
  sky: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function pickIcon(action: string): { icon: LucideIcon; tone: Tone } {
  return ICON_MAP[action] ?? { icon: Zap, tone: "sky" };
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No activity yet. As you create tickets, they&apos;ll show up here.
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-1.5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
    >
      {items.map((item) => {
        const { icon: Icon, tone } = pickIcon(item.action);
        return (
          <motion.div
            key={item.id}
            className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-dashed border-default px-1 py-2.5 last:border-0"
            variants={{
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
            }}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full [&_svg]:h-3.5 [&_svg]:w-3.5",
                TONE_CLS[tone]
              )}
            >
              <Icon />
            </span>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[13px] text-foreground">{item.summary}</div>
              <div className="text-[11.5px] text-muted-foreground">
                {item.actorName ? item.actorName : "System"}
                {item.entityId && (
                  <>
                    {" · "}
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      {item.entityId.slice(0, 8)}…
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="whitespace-nowrap text-[11.5px] text-muted-foreground">
              {relativeTime(item.createdAt)}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
