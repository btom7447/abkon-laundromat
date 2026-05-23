"use client";

import { useState } from "react";
import { Check, Copy, Plus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Props {
  ticketId: string;
  ticketNumber: string;
  customerName: string;
  itemCount: number;
  grandTotal: number;
  pickupDate: Date;
  paid: boolean;
  onCreateAnother: () => void;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", { weekday: "short", month: "short", day: "numeric" }).format(d);
}

export function SuccessView({
  ticketId,
  ticketNumber,
  customerName,
  itemCount,
  grandTotal,
  pickupDate,
  paid,
  onCreateAnother,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ticketNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_oklab,hsl(var(--background))_80%,transparent)] p-4 backdrop-blur-md md:p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px] rounded-[20px] border border-default bg-card p-7 text-center shadow-[0_24px_56px_-16px_rgb(11_18_38/0.22)] md:p-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 [&_svg]:h-7 [&_svg]:w-7"
          >
            <Check />
          </motion.div>

          <h2 className="mb-1.5 text-[22px] font-bold tracking-tight text-foreground">
            Ticket created
          </h2>
          <p className="mb-7 text-[14px] text-muted-foreground">
            Write this number on the laundry tag. SMS has been queued to {customerName}.
          </p>

          <div className="mb-5 rounded-2xl border border-dashed border-strong bg-surface-muted px-4 py-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Ticket number
            </div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="break-all font-mono text-[clamp(28px,5vw,40px)] font-bold tracking-wide text-foreground"
            >
              {ticketNumber}
            </motion.div>
            <button
              type="button"
              onClick={copy}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-strong bg-surface px-3.5 py-2 text-[12.5px] font-medium text-foreground transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/12 dark:hover:text-brand-200 [&_svg]:h-3 [&_svg]:w-3"
            >
              <Copy />
              {copied ? "Copied" : "Copy number"}
            </button>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <span>
              <strong className="font-semibold text-foreground">{itemCount}</strong> item
              {itemCount === 1 ? "" : "s"}
            </span>
            <span>
              <strong className="font-semibold text-foreground">{formatNaira(grandTotal)}</strong>
              {paid ? " · paid" : " · due"}
            </span>
            <span>
              Pickup{" "}
              <strong className="font-semibold text-foreground">{formatDate(pickupDate)}</strong>
            </span>
          </div>

          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCreateAnother}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted [&_svg]:h-3.5 [&_svg]:w-3.5"
            >
              <Plus /> Create another
            </button>
            <Link
              href={`/admin/tickets/${ticketId}`}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
            >
              Open ticket <ChevronRight />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
