import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
          A
        </div>
        <span className="text-xl font-semibold text-slate-900">Abkon Laundromat</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>For staff use only — admin and reception.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-500">
        Not staff? <Link href="/" className="text-brand-600 hover:underline">Go back to the homepage</Link>.
      </p>
    </div>
  );
}
