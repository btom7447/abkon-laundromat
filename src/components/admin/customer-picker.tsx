"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { searchCustomers, quickCreateCustomer } from "@/server/actions/customers";

export type SelectedCustomer = { id: string; name: string; phone: string };

interface Props {
  branchId: string;
  value: SelectedCustomer | null;
  onChange: (customer: SelectedCustomer | null) => void;
}

export function CustomerPicker({ branchId, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SelectedCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [_, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2 || value) {
      setMatches([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const results = await searchCustomers({ branchId, query });
        setMatches(results);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query, branchId, value]);

  // Click outside closes dropdown
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
        <div>
          <div className="font-medium text-slate-900">{value.name}</div>
          <div className="text-sm text-slate-500">{value.phone}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
          aria-label="Clear customer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (creating) {
    return <InlineCreate branchId={branchId} initial={query} onCreated={(c) => { setCreating(false); onChange(c); }} onCancel={() => setCreating(false)} error={createError} onError={setCreateError} />;
  }

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        autoComplete="off"
        placeholder="Search by name or phone…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="pl-9"
      />

      {open && (query.length >= 2 || matches.length > 0) && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m); setOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{m.name}</span>
              <span className="text-sm text-slate-500">{m.phone}</span>
            </button>
          ))}
          {matches.length === 0 && query.length >= 2 && (
            <div className="px-4 py-2.5 text-sm text-slate-500">No matches.</div>
          )}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-brand-700 hover:bg-slate-100"
          >
            <UserPlus className="h-4 w-4" />
            New customer{query ? ` "${query}"` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

function InlineCreate({
  branchId,
  initial,
  onCreated,
  onCancel,
  error,
  onError,
}: {
  branchId: string;
  initial: string;
  onCreated: (c: SelectedCustomer) => void;
  onCancel: () => void;
  error: string | null;
  onError: (e: string | null) => void;
}) {
  const isPhone = /^[\d+\-\s()]{7,}$/.test(initial);
  const [name, setName] = useState(isPhone ? "" : initial);
  const [phone, setPhone] = useState(isPhone ? initial : "");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">New customer</span>
        <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-900">
          Cancel
        </button>
      </div>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="new-name">Name</Label>
          <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-phone">Phone</Label>
          <Input id="new-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          disabled={submitting || !name.trim() || phone.replace(/\s+/g, "").length < 7}
          onClick={async () => {
            setSubmitting(true);
            onError(null);
            const res = await quickCreateCustomer({ branchId, name: name.trim(), phone: phone.trim() });
            setSubmitting(false);
            if (!res.ok) {
              onError(res.error);
              return;
            }
            onCreated({ id: res.customerId, name: name.trim(), phone: phone.trim() });
          }}
        >
          Create & use
        </Button>
      </div>
    </div>
  );
}
