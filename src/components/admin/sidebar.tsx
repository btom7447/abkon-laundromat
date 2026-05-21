"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Shirt, Sparkles, LayoutDashboard, ScrollText, Receipt, UserCircle, Plus, BarChart3, Wallet } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  section?: "ops" | "config";
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "ops" },
  { href: "/admin/tickets/new", label: "New ticket", icon: Plus, section: "ops" },
  { href: "/admin/tickets", label: "Tickets", icon: Receipt, section: "ops" },
  { href: "/admin/customers", label: "Customers", icon: UserCircle, section: "ops" },
  { href: "/admin/cash", label: "Cash", icon: Wallet, section: "ops" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: true, section: "ops" },
  { href: "/admin/branches", label: "Branches", icon: Building2, adminOnly: true, section: "config" },
  { href: "/admin/users", label: "Staff", icon: Users, adminOnly: true, section: "config" },
  { href: "/admin/items", label: "Items & prices", icon: Shirt, section: "config" },
  { href: "/admin/addons", label: "Add-ons", icon: Sparkles, section: "config" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, adminOnly: true, section: "config" },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = navItems.filter((item) => !item.adminOnly || role === "ADMIN");
  const ops = visible.filter((i) => i.section === "ops");
  const config = visible.filter((i) => i.section === "config");

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const exact = pathname === item.href;
    const isPrefix = item.href !== "/admin" && pathname.startsWith(item.href);
    // Special-case: /admin/tickets/new shouldn't activate /admin/tickets too
    const otherMoreSpecific = visible.some(
      (i) => i !== item && pathname.startsWith(i.href) && i.href.length > item.href.length
    );
    const active = exact || (isPrefix && !otherMoreSpecific);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-brand-100 text-brand-800" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <nav className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">{ops.map(renderItem)}</div>
      <div>
        <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Configuration
        </div>
        <div className="flex flex-col gap-1">{config.map(renderItem)}</div>
      </div>
    </nav>
  );
}
