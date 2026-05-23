"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import {
  LayoutDashboard,
  Tickets,
  UserCircle,
  Wallet,
  BarChart3,
  Shirt,
  LayersPlus,
  Building2,
  Users,
  ScrollText,
  Plus,
  ChevronsLeft,
  LogOut,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { signOutAction } from "@/server/actions/auth";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: { count: number | string; tone?: "default" | "warn" };
}

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: Role;
  activeBranch: { id: string; name: string; code: string } | null;
  branches: { id: string; name: string; code: string }[];
  ticketsBadge?: number;
  cashAttention?: boolean;
  /** Count of active catalog items in the active branch. */
  itemsBadge?: number;
  /** Count of active add-ons in the active branch. */
  addonsBadge?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const SMOOTH = "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export function Sidebar({
  userRole,
  ticketsBadge,
  cashAttention,
  itemsBadge,
  addonsBadge,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const workflow: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/tickets",
      label: "Tickets",
      icon: Tickets,
      badge: ticketsBadge && ticketsBadge > 0 ? { count: ticketsBadge } : undefined,
    },
    { href: "/admin/customers", label: "Customers", icon: UserCircle },
    {
      href: "/admin/cash",
      label: "Cash",
      icon: Wallet,
      badge: cashAttention ? { count: "!", tone: "warn" } : undefined,
    },
    { href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: true },
  ];

  const catalog: NavItem[] = [
    {
      href: "/admin/items",
      label: "Items & prices",
      icon: Shirt,
      badge: itemsBadge && itemsBadge > 0 ? { count: itemsBadge } : undefined,
    },
    {
      href: "/admin/addons",
      label: "Add-ons",
      icon: LayersPlus,
      badge: addonsBadge && addonsBadge > 0 ? { count: addonsBadge } : undefined,
    },
    { href: "/admin/branches", label: "Branches", icon: Building2, adminOnly: true },
    { href: "/admin/users", label: "Staff", icon: Users, adminOnly: true },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText, adminOnly: true },
  ];

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={cn(
        "relative flex h-full w-full flex-col border-r border-default bg-surface py-3.5",
        SMOOTH,
        collapsed ? "px-2" : "px-3"
      )}
    >
      {/* Collapse handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-4.5 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full border border-default bg-surface text-muted-foreground shadow-[0_2px_6px_-1px_rgb(15_23_42/0.12)] transition-all hover:scale-105 hover:text-foreground"
      >
        <ChevronsLeft className={cn("h-3 w-3 transition-transform duration-200", collapsed && "rotate-180")} />
      </button>

      {/* Wordmark — logo scales between width:60 (max) and width:40 (min), height auto */}
      <Link
        href="/admin"
        className={cn(
          "flex items-center pt-1 pb-3",
          SMOOTH,
          collapsed ? "justify-center gap-0" : "gap-2.5 px-2"
        )}
        aria-label="Abkon Laundromat — admin home"
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            SMOOTH,
            collapsed ? "w-10" : "w-15"
          )}
        >
          <LogoMark size={60} className="w-full !h-auto" priority />
        </span>
        <span
          className={cn(
            "flex min-w-0 flex-col leading-tight whitespace-nowrap",
            SMOOTH,
            collapsed && "pointer-events-none w-0 opacity-0"
          )}
        >
          <span className="text-[15px] font-bold tracking-tight text-foreground">Abkon</span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Laundromat
          </span>
        </span>
      </Link>

      {/* Divider between brand and CTA */}
      <span
        aria-hidden
        className={cn(
          "block h-px bg-[hsl(var(--border))]",
          SMOOTH,
          collapsed ? "mx-2" : "mx-2"
        )}
      />

      {/* New ticket CTA */}
      <Link
        href="/admin/tickets/new"
        title={collapsed ? "New ticket" : undefined}
        className={cn(
          "mb-2 mt-3 inline-flex items-center justify-center rounded-lg bg-brand-500 font-semibold text-white shadow-sm hover:bg-brand-600 hover:shadow-md",
          SMOOTH,
          collapsed
            ? "h-11 w-11 self-center gap-0 p-0"
            : "gap-2 px-3 py-2.5 text-[13px] hover:-translate-y-px"
        )}
      >
        <Plus className="h-5 w-5" />
        <span
          className={cn(
            "whitespace-nowrap",
            SMOOTH,
            collapsed && "pointer-events-none ml-0 w-0 overflow-hidden opacity-0"
          )}
        >
          New ticket
        </span>
      </Link>

      {/* Nav groups */}
      <LayoutGroup id="sidebar-stripe">
        <div
          className={cn(
            "flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-visible",
            collapsed ? "items-stretch" : "pr-0.5"
          )}
        >
          <NavGroup label="Workflow" items={workflow} userRole={userRole} isActive={isActive} collapsed={collapsed} />
          <NavGroup label="Catalog" items={catalog} userRole={userRole} isActive={isActive} collapsed={collapsed} />
        </div>
      </LayoutGroup>

      {/* Footer — Sign out, always visible */}
      <div className={cn("pt-2", collapsed ? "" : "border-t border-default mt-2")}>
        <form action={signOutAction} className={collapsed ? "flex justify-center" : ""}>
          <button
            type="submit"
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex items-center rounded-lg text-[13px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300",
              collapsed ? "h-11 w-11 justify-center" : "w-full gap-2.5 px-3 py-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap",
                SMOOTH,
                collapsed && "pointer-events-none w-0 opacity-0"
              )}
            >
              Sign out
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  userRole,
  isActive,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  userRole: Role;
  isActive: (href: string) => boolean;
  collapsed: boolean;
}) {
  const visible = items.filter((i) => !i.adminOnly || userRole === "ADMIN");

  return (
    <div>
      <div
        className={cn(
          "px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap",
          SMOOTH,
          collapsed ? "pointer-events-none h-0 overflow-hidden opacity-0 pt-0 pb-0" : "pb-1.5 pt-2"
        )}
      >
        {label}
      </div>
      <nav className={cn("flex flex-col gap-0.5", collapsed && "items-center")}>
        {visible.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-lg text-[13.5px]",
                SMOOTH,
                !collapsed && "overflow-hidden",
                collapsed
                  ? "h-11 w-11 justify-center self-center px-0 py-0 gap-0"
                  : "gap-2.5 px-3 py-2",
                active
                  ? "font-semibold text-brand-700 dark:text-brand-200"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              )}
            >
              {active &&
                (collapsed ? (
                  <span className="absolute inset-0 rounded-lg bg-brand-100 ring-1 ring-inset ring-brand-200 dark:bg-navy-700 dark:ring-navy-600" />
                ) : (
                  <>
                    <motion.span
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-lg bg-brand-50 dark:bg-navy-800"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                    />
                    <motion.span
                      layoutId="sidebar-active-stripe"
                      className="absolute left-0 top-2 bottom-2 w-0.75 rounded-r bg-brand-500"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                    />
                  </>
                ))}
              <Icon className="relative z-10 h-7 w-7 shrink-0" />
              <span
                className={cn(
                  "relative z-10 truncate whitespace-nowrap",
                  SMOOTH,
                  collapsed ? "pointer-events-none w-0 opacity-0" : "flex-1"
                )}
              >
                {item.label}
              </span>
              {/* Badge — abbreviates large counts via formatBadgeCount (1k, 2.5k, …) */}
              {item.badge && !collapsed && (
                <span
                  className={cn(
                    "relative z-10 rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums",
                    item.badge.tone === "warn"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-brand-100 text-brand-700 dark:bg-navy-700 dark:text-brand-300"
                  )}
                >
                  {formatBadgeCount(item.badge.count)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Abbreviate a sidebar count badge once it crosses 1k so it doesn't overflow
 * the pill. Leaves strings (e.g. "!" warning markers) alone.
 * 1234 → "1.2k", 9800 → "9.8k", 12_000 → "12k", 1_500_000 → "1.5M".
 */
function formatBadgeCount(value: number | string): string {
  if (typeof value !== "number") return value;
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const k = value / 1000;
    // Show 1 decimal under 10k (1.2k, 9.8k), drop it past 10k (12k, 124k)
    return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}k`;
  }
  const m = value / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)}M`;
}
