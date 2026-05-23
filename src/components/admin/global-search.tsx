"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Receipt, UserCircle, Shirt, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { globalSearch, type SearchResults, type SearchHit } from "@/server/actions/search";
import { cn } from "@/lib/utils";

type Tab = "all" | "tickets" | "customers" | "items";

const TAB_LABEL: Record<Tab, string> = {
  all: "All",
  tickets: "Tickets",
  customers: "Customers",
  items: "Items",
};

const EMPTY: SearchResults = { tickets: [], customers: [], items: [] };

export function GlobalSearch({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(EMPTY);
      setTab("all");
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(EMPTY);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await globalSearch({ query, branchId });
        setResults(r);
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [query, branchId]);

  const totalCount = results.tickets.length + results.customers.length + results.items.length;
  const visibleHits =
    tab === "tickets"
      ? { tickets: results.tickets, customers: [], items: [] }
      : tab === "customers"
        ? { tickets: [], customers: results.customers, items: [] }
        : tab === "items"
          ? { tickets: [], customers: [], items: results.items }
          : results;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Search"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Search />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 flex max-h-135 w-130 flex-col overflow-hidden rounded-xl border border-default bg-card shadow-[0_12px_32px_-8px_rgb(11_18_38/0.18),0_6px_12px_-6px_rgb(11_18_38/0.1)]"
          >
            {/* Input */}
            <div className="relative border-b border-default p-2.5">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tickets, customers, items…"
                autoComplete="off"
                className="h-9 w-full rounded-md border border-input bg-surface pl-8 pr-12 text-[13.5px] text-foreground focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-500/20"
              />
              <kbd className="absolute right-5 top-1/2 -translate-y-1/2 rounded border border-default bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-default px-3 py-2">
              {(["all", "tickets", "customers", "items"] as Tab[]).map((t) => {
                const count =
                  t === "all"
                    ? totalCount
                    : t === "tickets"
                      ? results.tickets.length
                      : t === "customers"
                        ? results.customers.length
                        : results.items.length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                      tab === t
                        ? "bg-brand-50 text-brand-800 dark:bg-navy-800 dark:text-brand-200"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    )}
                  >
                    {TAB_LABEL[t]}
                    {count > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                          tab === t
                            ? "bg-brand-200 text-brand-800 dark:bg-navy-700 dark:text-brand-200"
                            : "bg-surface-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-1">
              {query.length < 2 ? (
                <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">
                  Type at least 2 characters to search.
                </div>
              ) : pending && totalCount === 0 ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-[13px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                </div>
              ) : totalCount === 0 ? (
                <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">
                  No matches for <strong className="text-foreground">{query}</strong>.
                </div>
              ) : (
                <>
                  {visibleHits.tickets.length > 0 && <Group label="Tickets" hits={visibleHits.tickets} onPick={() => setOpen(false)} />}
                  {visibleHits.customers.length > 0 && <Group label="Customers" hits={visibleHits.customers} onPick={() => setOpen(false)} />}
                  {visibleHits.items.length > 0 && <Group label="Items" hits={visibleHits.items} onPick={() => setOpen(false)} />}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Group({ label, hits, onPick }: { label: string; hits: SearchHit[]; onPick: () => void }) {
  return (
    <div>
      <div className="px-3 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      {hits.map((h) => {
        const Icon = h.type === "ticket" ? Receipt : h.type === "customer" ? UserCircle : Shirt;
        return (
          <Link
            key={`${h.type}-${h.id}`}
            href={h.href}
            onClick={onPick}
            className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-muted"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-muted text-brand-700 dark:text-brand-300">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="flex min-w-0 flex-col gap-px">
              <span
                className={cn(
                  "truncate text-[13px] font-semibold text-foreground",
                  h.type === "ticket" && "font-mono font-medium"
                )}
              >
                {h.primary}
              </span>
              {h.secondary && <span className="truncate text-[11.5px] text-muted-foreground">{h.secondary}</span>}
            </span>
            {h.meta && <span className="whitespace-nowrap text-[10.5px] text-muted-foreground">{h.meta}</span>}
          </Link>
        );
      })}
    </div>
  );
}
