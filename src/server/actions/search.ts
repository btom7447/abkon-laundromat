"use server";

import { db } from "@/lib/db";
import { requireSession, branchScopeFor } from "@/lib/rbac";

export type SearchHit = {
  type: "ticket" | "customer" | "item";
  id: string;
  href: string;
  primary: string;
  secondary?: string;
  meta?: string;
};

export type SearchResults = {
  tickets: SearchHit[];
  customers: SearchHit[];
  items: SearchHit[];
};

const EMPTY: SearchResults = { tickets: [], customers: [], items: [] };

export async function globalSearch(input: { query: string; branchId?: string | null }): Promise<SearchResults> {
  const user = await requireSession();
  const q = input.query.trim();
  if (q.length < 2) return EMPTY;

  const scopedBranch = branchScopeFor(user, input.branchId ?? null);
  const phoneQuery = q.replace(/\s+/g, "");

  const [tickets, customers, items] = await Promise.all([
    db.ticket.findMany({
      where: {
        ...(scopedBranch ? { branchId: scopedBranch } : {}),
        OR: [
          { ticketNumber: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { customer: { phone: { contains: phoneQuery } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: { select: { name: true, phone: true } } },
    }),
    db.customer.findMany({
      where: {
        ...(scopedBranch ? { branchId: scopedBranch } : {}),
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: phoneQuery } },
        ],
      },
      orderBy: { name: "asc" },
      take: 6,
      include: { _count: { select: { tickets: true } } },
    }),
    db.itemType.findMany({
      where: {
        ...(scopedBranch ? { branchId: scopedBranch } : {}),
        active: true,
        name: { contains: q, mode: "insensitive" },
      },
      orderBy: { name: "asc" },
      take: 6,
    }),
  ]);

  return {
    tickets: tickets.map((t) => ({
      type: "ticket" as const,
      id: t.id,
      href: `/admin/tickets/${t.id}`,
      primary: t.ticketNumber,
      secondary: t.customer.name,
      meta: `${t.customer.phone} · ${t.status.toLowerCase().replace("_", " ")}`,
    })),
    customers: customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      href: `/admin/customers?edit=${c.id}`,
      primary: c.name,
      secondary: c.phone,
      meta: `${c._count.tickets} ticket${c._count.tickets === 1 ? "" : "s"}`,
    })),
    items: items.map((it) => ({
      type: "item" as const,
      id: it.id,
      href: `/admin/items?edit=${it.id}`,
      primary: it.name,
      secondary: it.unit === "SQM" ? "Per sqm" : it.unit === "NEGOTIABLE" ? "Negotiable" : "Per piece",
      meta: undefined,
    })),
  };
}
