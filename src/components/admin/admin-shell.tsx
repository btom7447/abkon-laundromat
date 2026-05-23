"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@prisma/client";
import { Sidebar } from "@/components/admin/sidebar";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "abkon_sidebar_collapsed";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface AdminShellProps {
  sidebarProps: {
    userName: string;
    userEmail: string;
    userRole: Role;
    activeBranch: Branch | null;
    branches: Branch[];
    ticketsBadge?: number;
    cashAttention?: boolean;
    itemsBadge?: number;
    addonsBadge?: number;
  };
  topbar: React.ReactNode;
  children: React.ReactNode;
}

interface ShellApi {
  openMobileNav: () => void;
}

const AdminShellCtx = createContext<ShellApi | null>(null);

export function useAdminShell(): ShellApi | null {
  return useContext(AdminShellCtx);
}

/**
 * Owns the sidebar collapsed state (desktop, localStorage-backed) and the
 * mobile drawer state. Renders Sidebar internally and exposes
 * `openMobileNav` via context so the topbar's hamburger can trigger the drawer.
 */
export function AdminShell({ sidebarProps, topbar, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
    setMounted(true);

    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        // Skip when typing in a form field
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        e.preventDefault();
        if (mq.matches) setMobileOpen((o) => !o);
        else setCollapsed((c) => !c);
      }
    }
    document.addEventListener("keydown", onKey);

    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  // Mobile: never appear collapsed when the drawer is open.
  const effectiveCollapsed = isMobile ? false : collapsed;

  return (
    <AdminShellCtx.Provider value={{ openMobileNav: () => setMobileOpen(true) }}>
      <div className="flex h-screen bg-background">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}

        {/* Sidebar — fixed drawer on mobile, static column on desktop */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "md:static md:translate-x-0 md:transition-[width] md:duration-300",
            effectiveCollapsed ? "md:w-16" : "md:w-65"
          )}
        >
          <Sidebar
            {...sidebarProps}
            collapsed={effectiveCollapsed}
            onToggleCollapse={() => {
              if (isMobile) setMobileOpen(false);
              else setCollapsed((c) => !c);
            }}
          />
        </div>

        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <main className="flex-1 overflow-y-auto overscroll-contain bg-surface-muted dark:bg-background">
            {children}
          </main>
        </div>
      </div>
    </AdminShellCtx.Provider>
  );
}
