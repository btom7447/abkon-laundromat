"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !agreed) return;
    // TODO: wire to a /api/newsletter route or external list (Mailchimp/etc.)
    setSubmitted(true);
    setEmail("");
    setAgreed(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-300">
        <Check className="h-4 w-4 flex-shrink-0" />
        Thanks — we&apos;ll be in touch when there&apos;s news.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BABC8]" />
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border border-[#21304A] bg-[#0F1A33] pl-10 pr-3 text-[13.5px] text-[#F0F9FF] placeholder:text-[#5E708F] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-[1.45] text-[#9BABC8]">
        <input
          type="checkbox"
          required
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-[#21304A] bg-[#0F1A33] accent-brand-500"
        />
        <span>I agree to receive occasional updates from Abkon.</span>
      </label>
      <button
        type="submit"
        disabled={!email || !agreed}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[13px] font-semibold leading-none text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Subscribe Now
      </button>
    </form>
  );
}
