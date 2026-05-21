"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/server/actions/auth";

export function UserMenu({ name, email, role }: { name: string; email: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium text-slate-900">{name}</div>
        <div className="text-xs text-slate-500">{email} · {role.toLowerCase()}</div>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </form>
    </div>
  );
}
