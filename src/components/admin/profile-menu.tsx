"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, User, ChevronDown, Bell, Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import type { Role } from "@prisma/client";
import type { NotificationItem } from "@/components/admin/notifications-button";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  email: string;
  role: Role;
  branchCode?: string | null;
  notifications?: NotificationItem[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarColor(seed: string): string {
  const palette = ["#0EA5E9", "#16A34A", "#0369A1", "#7C3AED", "#DB2777", "#F59E0B", "#DC2626", "#0891B2"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length]!;
}

export function ProfileMenu({ name, email, role, branchCode, notifications = [] }: Props) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        className="relative inline-flex h-8 items-center gap-2 rounded-full pl-1 pr-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-semibold text-white"
          style={{ background: avatarColor(email) }}
        >
          {initials(name)}
        </span>
        {/* Mobile-only red dot mirrors the bell badge since the bell is hidden */}
        {notifications.length > 0 && (
          <span
            aria-hidden
            className="absolute right-1 top-0.5 h-[7px] w-[7px] rounded-full bg-red-500 ring-2 ring-surface md:hidden"
          />
        )}
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
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                style={{ background: avatarColor(email) }}
              >
                {initials(name)}
              </span>
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

              {notifications.length === 0 ? (
                <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground">No notifications</span>
                </div>
              ) : (
                <Link
                  href={notifications[0]!.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-surface-muted"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-[12px] font-medium text-foreground">
                    {notifications.length === 1 ? notifications[0]!.title : `${notifications.length} notifications`}
                  </span>
                  <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {notifications.length}
                  </span>
                </Link>
              )}
            </div>

            {/* Items */}
            <div className="p-1">
              <MenuLink href="#" icon={<User />} label="Profile" onSelect={() => setOpen(false)} disabled />
              <MenuLink href="#" icon={<Settings />} label="Settings" onSelect={() => setOpen(false)} disabled />
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
