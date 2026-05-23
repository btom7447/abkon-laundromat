import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/logo";
import { AuthPanel } from "./auth-panel";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { callbackUrl, error } = await searchParams;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_1fr]">
      {/* Poster — fills the left 3fr on lg, hidden on mobile */}
      <aside className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <Image
          src="/auth-poster.jpg"
          alt="Abkon Laundromat"
          fill
          priority
          sizes="(min-width: 1024px) 75vw, 0px"
          className="object-cover"
        />
        {/* Brand wordmark — top-left over the poster */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2.5 px-8 pt-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 shadow-[0_4px_12px_-2px_rgb(11_18_38/0.25)]">
            <LogoMark size={28} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
              Abkon
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
              Laundromat
            </span>
          </span>
        </div>

        {/* Bottom gradient overlay + tagline */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 bg-gradient-to-t from-navy-900/85 via-navy-900/40 to-transparent px-8 pb-10 pt-32 text-white">
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] md:text-[42px]">
            Clean clothes,
            <br />
            done right.
          </h1>
          <p className="max-w-xl text-[14.5px] leading-snug text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            The reception and ticketing system that runs the floor — walk-ins, WhatsApp pickups,
            deliveries, all in one place.
          </p>
        </div>
      </aside>

      {/* Form panel — 1fr on lg, full-width on mobile */}
      <main className="relative flex flex-col items-stretch justify-center bg-background px-5 py-10 sm:px-8 md:px-12 lg:px-10">
        {/* Mobile brand strip (poster is hidden on mobile) */}
        <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-[0_1px_3px_0_rgb(15_23_42/0.08)] ring-1 ring-default">
            <LogoMark size={28} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight text-foreground">Abkon</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Laundromat
            </span>
          </span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <AuthPanel callbackUrl={callbackUrl} initialError={error} />

          <p className="mt-8 text-center text-[11.5px] text-muted-foreground">
            Not staff?{" "}
            <Link
              href="/"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              Go back to the homepage
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
