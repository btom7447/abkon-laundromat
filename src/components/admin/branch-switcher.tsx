"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setActiveBranch } from "@/server/actions/branch-switch";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Props {
  active: Branch | null;
  branches: Branch[];
  canSwitch: boolean;
  isAdmin: boolean;
}

export function BranchSwitcher({ active, branches, canSwitch, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(id: string) {
    if (id === active?.id) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setActiveBranch(id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={active ? `Active branch: ${active.name}` : "No branch selected"}
        className="group inline-flex h-8 items-center gap-1 rounded-full bg-brand-50 pl-2 pr-1.5 text-brand-700 ring-1 ring-inset ring-brand-100 transition-colors hover:bg-brand-100 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-navy-800 dark:text-brand-200 dark:ring-navy-700 dark:hover:bg-navy-700"
      >
        <span className="text-[12px] font-bold tabular-nums tracking-wider">
          {active?.code ?? "—"}
        </span>
        <ChevronDown
          className="h-3 w-3 opacity-70 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-72 flex-col overflow-hidden rounded-xl border border-default bg-card shadow-[0_12px_32px_-8px_rgb(11_18_38/0.18),0_6px_12px_-6px_rgb(11_18_38/0.1)]"
            role="listbox"
          >
            <div className="flex items-center justify-between border-b border-default px-3.5 py-3">
              <span className="text-[13.5px] font-semibold text-foreground">Branch</span>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {branches.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              {branches.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                    <Building2 className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-[13px] font-semibold text-foreground">No branches yet</span>
                  <span className="max-w-[200px] text-[11.5px] text-muted-foreground">
                    Create your first branch to start receiving tickets.
                  </span>
                  {isAdmin && (
                    <Link
                      href="/admin/branches?new=1"
                      onClick={() => setOpen(false)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-brand-600"
                    >
                      <Plus className="h-3.5 w-3.5" /> New branch
                    </Link>
                  )}
                </div>
              ) : (
                branches.map((b) => {
                  const isActive = b.id === active?.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pick(b.id)}
                      role="option"
                      aria-selected={isActive}
                      disabled={!canSwitch && !isActive}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50",
                        isActive
                          ? "bg-brand-50 text-brand-800 dark:bg-navy-800 dark:text-brand-200"
                          : "hover:bg-surface-muted"
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-100 text-[11.5px] font-semibold text-brand-700 dark:bg-navy-700 dark:text-brand-300">
                        {b.code}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate text-[12.5px] font-semibold">{b.name}</span>
                        <span className="truncate text-[10.5px] text-muted-foreground">
                          Branch {b.code}
                        </span>
                      </span>
                      {pending && isActive ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-500" />
                      ) : isActive ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-400" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            {branches.length > 0 && isAdmin && (
              <Link
                href="/admin/branches?new=1"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 border-t border-default px-3.5 py-2 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> New branch
              </Link>
            )}
            {!canSwitch && branches.length > 0 && !isAdmin && (
              <div className="border-t border-default bg-surface-muted/50 px-3.5 py-2 text-[10.5px] text-muted-foreground">
                Branch fixed by your role.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
