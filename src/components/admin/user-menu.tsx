"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/server/actions/auth";

export function UserMenu({ name, email, role }: { name: string; email: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right md:block">
        <div className="text-sm font-medium text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground">{email} · {role.toLowerCase()}</div>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md border border-default bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </form>
    </div>
  );
}
