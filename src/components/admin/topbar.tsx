"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import type { Role } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsButton, type NotificationItem } from "@/components/admin/notifications-button";
import { GlobalSearch } from "@/components/admin/global-search";
import { ProfileMenu } from "@/components/admin/profile-menu";
import { BranchSwitcher } from "@/components/admin/branch-switcher";
import { useAdminShell } from "@/components/admin/admin-shell";

const ROUTE_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/tickets": "Tickets",
  "/admin/tickets/new": "New ticket",
  "/admin/customers": "Customers",
  "/admin/cash": "Cash",
  "/admin/reports": "Reports",
  "/admin/items": "Items & prices",
  "/admin/addons": "Add-ons",
  "/admin/branches": "Branches",
  "/admin/users": "Staff",
  "/admin/audit": "Audit log",
};

function buildCrumbs(pathname: string): Array<{ href: string; label: string }> {
  if (pathname === "/admin") return [{ href: "/admin", label: "Dashboard" }];
  const parts = pathname.split("/").filter(Boolean);
  const out: Array<{ href: string; label: string }> = [];
  let cursor = "/admin";
  // Start at i=1 so the "Admin" segment is dropped — top-level pages render
  // as a single crumb ("Tickets", "Customers"), with children appended.
  for (let i = 1; i < parts.length; i++) {
    cursor += "/" + parts[i];
    const seg = parts[i] ?? "";
    let label = ROUTE_LABELS[cursor];
    if (!label) {
      if (seg.length > 16 || /^[a-z0-9]{8,}$/.test(seg)) label = "Detail";
      else label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    }
    out.push({ href: cursor, label });
  }
  return out;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Props {
  notifications: NotificationItem[];
  branchId: string | null;
  user: { name: string; email: string; role: Role };
  activeBranch: Branch | null;
  branches: Branch[];
  canSwitchBranch: boolean;
}

export function Topbar({
  notifications,
  branchId,
  user,
  activeBranch,
  branches,
  canSwitchBranch,
}: Props) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  const shell = useAdminShell();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-default bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {shell && (
          <button
            type="button"
            onClick={shell.openMobileNav}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
          >
            <Menu />
          </button>
        )}

        {/* Breadcrumbs — intermediate crumbs hide on small screens */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            if (!last) {
              return (
                <span key={c.href} className="hidden items-center gap-1.5 sm:inline-flex">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
                  <Link
                    href={c.href as never}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                </span>
              );
            }
            return (
              <span key={c.href} className="inline-flex min-w-0 items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:inline-block" />
                )}
                <span className="truncate text-[16px] font-semibold tracking-tight text-foreground sm:text-[17px]">
                  {c.label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <BranchSwitcher
          active={activeBranch}
          branches={branches}
          canSwitch={canSwitchBranch}
          isAdmin={user.role === "ADMIN"}
        />
        <div className="hidden md:contents">
          <GlobalSearch branchId={branchId} />
          <NotificationsButton items={notifications} />
          <ThemeToggle />
          <span className="mx-1 h-5 w-px bg-[hsl(var(--border))]" aria-hidden />
        </div>
        <ProfileMenu
          name={user.name}
          email={user.email}
          role={user.role}
          branchCode={activeBranch?.code ?? null}
          notifications={notifications}
        />
      </div>
    </header>
  );
}
