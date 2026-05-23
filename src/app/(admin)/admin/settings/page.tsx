import Link from "next/link";
import {
  Settings as SettingsIcon,
  BellRing,
  Languages,
  ShieldCheck,
  Building2,
  Database,
  ChevronRight,
} from "lucide-react";
import { requireSession } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const PLANNED_SECTIONS = [
  {
    icon: BellRing,
    title: "Notifications",
    desc: "Choose which alerts you receive in the app, by SMS, or email — and how loud they are.",
  },
  {
    icon: Languages,
    title: "Localization",
    desc: "Language, time zone, date format, and the currency the app displays.",
  },
  {
    icon: ShieldCheck,
    title: "Security & sessions",
    desc: "Active sign-ins across devices, login history, and two-factor authentication.",
  },
  {
    icon: Building2,
    title: "Branch defaults",
    desc: "Default branch, dashboard layout preferences, and POS shortcuts.",
  },
  {
    icon: Database,
    title: "Data & privacy",
    desc: "Export your activity, request deletion, and review what we store on your account.",
  },
];

export default async function SettingsPage() {
  await requireSession();
  return (
    <>
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-7 md:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[28px]">
            Settings
          </h1>
          <p className="mt-1 max-w-170 text-[13px] leading-snug text-muted-foreground md:text-sm">
            Personal preferences live here once they ship. For now, account details live on the
            Profile page.
          </p>
        </div>
        <Link
          href="/admin/profile"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-strong bg-surface px-3.5 text-[13.5px] font-medium leading-none text-foreground transition-colors hover:bg-surface-muted"
        >
          Go to Profile
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:gap-5 md:px-7 md:pb-8 md:pt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-default bg-card p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300">
            <SettingsIcon className="h-6 w-6" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-[16px] font-semibold text-foreground">Coming soon</h2>
            <p className="text-[12.5px] text-muted-foreground">
              We&apos;re bundling preferences into one home. Here&apos;s the rough roadmap.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {PLANNED_SECTIONS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-default bg-card p-5 opacity-90 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  Coming soon
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
              <p className="text-[12.5px] leading-snug text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
