"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, User, ChevronDown, Bell, Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import type { Role } from "@prisma/client";
import {
  NOTIFICATIONS_OPEN_EVENT,
  type NotificationItem,
} from "@/components/admin/notifications-button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  email: string;
  role: Role;
  branchCode?: string | null;
  avatarUrl?: string | null;
  notifications?: NotificationItem[];
}

export function ProfileMenu({
  name,
  email,
  role,
  branchCode,
  avatarUrl,
  notifications = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const themeOptions = [
    { key: "light" as const, Icon: Sun, label: "Light" },
    { key: "dark" as const, Icon: Moon, label: "Dark" },
    { key: "system" as const, Icon: Monitor, label: "System" },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  function openNotifications() {
    setOpen(false);
    // Defer to next tick so the dropdown close animation kicks in first.
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_OPEN_EVENT));
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        className="relative inline-flex h-8 items-center gap-1.5 rounded-full pl-1 pr-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar name={name} seed={email} src={avatarUrl} size={28} />
        <ChevronDown
          className="h-3 w-3 text-muted-foreground transition-transform duration-200"
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
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-xl border border-default bg-card shadow-[0_12px_32px_-8px_rgb(11_18_38/0.18),0_6px_12px_-6px_rgb(11_18_38/0.1)]"
          >
            {/* Identity strip */}
            <div className="flex items-center gap-3 border-b border-default p-3">
              <Avatar name={name} seed={email} src={avatarUrl} size={40} />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[13.5px] font-semibold text-foreground">{name}</span>
                <span className="truncate text-[11.5px] text-muted-foreground">{email}</span>
                <span className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {role === "ADMIN" ? "Admin" : "Reception"}
                  {branchCode && ` · ${branchCode}`}
                </span>
              </div>
            </div>

            {/* Mobile-only: Theme + Notifications */}
            <div className="border-b border-default p-2 md:hidden">
              <div className="mb-2 flex items-center justify-between px-1.5">
                <span className="text-[12px] font-medium text-foreground">Theme</span>
                <div className="flex gap-0.5 rounded-md bg-surface-muted p-0.5">
                  {themeOptions.map(({ key, Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTheme(key)}
                      aria-label={label}
                      title={label}
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded transition-colors",
                        mounted && theme === key
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={openNotifications}
                className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-muted"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate text-[12px] font-medium text-foreground">
                  {notifications.length === 0
                    ? "No notifications"
                    : unreadCount > 0
                      ? `${unreadCount} unread`
                      : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-semibold tabular-nums text-white">
                    {unreadCount >= 100 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Items */}
            <div className="p-1">
              <MenuLink
                href="/admin/profile"
                icon={<User />}
                label="Profile"
                onSelect={() => setOpen(false)}
              />
              <MenuLink href="/admin/settings" icon={<Settings />} label="Settings" onSelect={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onSelect,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground opacity-50"
        title="Coming soon"
      >
        <span className="text-muted-foreground">{icon}</span>
        {label}
        <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-wider">Soon</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground transition-colors hover:bg-surface-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </Link>
  );
}
