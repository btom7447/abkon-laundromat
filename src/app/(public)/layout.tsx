import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
              A
            </div>
            <span className="text-lg font-semibold text-slate-900">Abkon Laundromat</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-700">
            <a href="#services" className="hover:text-brand-600">Services</a>
            <a href="#how-it-works" className="hover:text-brand-600">How it works</a>
            <a href="#contact" className="hover:text-brand-600">Contact</a>
            <Link
              href="/login"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
            >
              Staff login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} Abkon Laundromat. All rights reserved.</span>
            <span>Made with care in Nigeria.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
