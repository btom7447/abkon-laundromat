import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Privacy Policy · Abkon Services",
  description:
    "How Abkon Services (operating as Abkon Laundromat) collects, uses, and protects your personal information.",
};

const CONTACT_EMAIL = "abkon350@gmail.com";
const CONTACT_PHONE = "+234 913 564 4777";
const BUSINESS_ADDRESS = "193 Aba Road, Ikot Ekpene, Akwa Ibom State, Nigeria";
const LAST_UPDATED = "27 May 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LegalHeader />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <h1 className="mb-2 text-[clamp(32px,4.4vw,44px)] font-bold leading-tight tracking-[-0.025em]">
          Privacy Policy
        </h1>
        <p className="mb-12 text-[13px] uppercase tracking-[0.12em] text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Who we are">
          <p>
            Abkon Services (registered with the Corporate Affairs Commission of Nigeria) operates the
            Abkon Laundromat brand and the website at <strong>abkonservices.com.ng</strong>. In this
            policy, &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;Abkon&rdquo; refers to Abkon Services.
          </p>
          <p>
            Registered office: {BUSINESS_ADDRESS}.
          </p>
        </Section>

        <Section title="2. What information we collect">
          <p>We collect only what we need to provide our laundry and home-cleaning services:</p>
          <ul>
            <li>Your name, phone number, and WhatsApp number — to identify your tickets and contact you.</li>
            <li>Your delivery address — when you use pickup or home-delivery service.</li>
            <li>Details of items you bring to us, services requested, and amounts paid.</li>
            <li>Messages you send us on WhatsApp or via the website contact form.</li>
            <li>Basic device/log data (IP address, browser, timestamps) when you visit the website.</li>
          </ul>
          <p>We do not knowingly collect data from anyone under 18.</p>
        </Section>

        <Section title="3. How we use it">
          <ul>
            <li>To process your bookings, generate tickets, and contact you about your laundry.</li>
            <li>To send you SMS or WhatsApp notifications when your items are ready for pickup.</li>
            <li>To respond to your enquiries, complaints, or refund requests.</li>
            <li>To keep records required by Nigerian tax and consumer-protection laws.</li>
            <li>To improve our services and prevent fraud.</li>
          </ul>
        </Section>

        <Section title="4. WhatsApp Business communication">
          <p>
            We use WhatsApp Business Platform (provided by Meta) to communicate with customers.
            When you message us on WhatsApp, your phone number, the messages you send, and the
            messages we send you are processed by Meta in accordance with their own privacy policy.
            You can read Meta&apos;s policy at{" "}
            <a
              href="https://www.whatsapp.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300"
            >
              whatsapp.com/legal/privacy-policy
            </a>
            .
          </p>
        </Section>

        <Section title="5. Who we share data with">
          <p>We do not sell your personal information. We share limited information only with:</p>
          <ul>
            <li>Service providers who help us run the business (SMS provider, hosting, payment processors), strictly to provide their service.</li>
            <li>Government authorities when required by Nigerian law.</li>
          </ul>
        </Section>

        <Section title="6. How long we keep it">
          <p>
            We keep customer records for as long as your account is active and for up to 6 years
            after your last ticket, to comply with Nigerian tax and audit requirements. You may
            request earlier deletion (see section 7).
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>You have the right to:</p>
          <ul>
            <li>Ask what personal data we hold about you.</li>
            <li>Ask us to correct anything that&apos;s wrong.</li>
            <li>Ask us to delete your data (we may retain anonymised records for legal purposes).</li>
            <li>Withdraw consent for marketing messages at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
              {CONTACT_EMAIL}
            </a>{" "}
            or message {CONTACT_PHONE} on WhatsApp. We respond within 14 days.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We protect customer records with reasonable technical and organisational measures
            (encrypted database connections, hashed passwords, access controls). No system is 100%
            secure — we&apos;ll notify you promptly if a breach affects your information.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the
            top reflects the most recent revision. Material changes will be announced on this page.
          </p>
        </Section>

        <Section title="10. Contact us">
          <p>For any privacy questions:</p>
          <ul>
            <li>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">{CONTACT_EMAIL}</a></li>
            <li>Phone / WhatsApp: {CONTACT_PHONE}</li>
            <li>Address: {BUSINESS_ADDRESS}</li>
          </ul>
        </Section>
      </main>

      <LegalFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
      <div className="prose prose-sm max-w-none space-y-3 text-[14.5px] leading-[1.7] text-foreground/85 [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

function LegalHeader() {
  return (
    <header className="border-b border-default bg-background">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
          <LogoMark size={28} />
          Abkon
        </Link>
        <Link href="/" className="text-[13.5px] text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-default bg-background">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-[12.5px] text-muted-foreground md:px-10">
        <span>© {new Date().getFullYear()} Abkon Services · Operating as Abkon Laundromat</span>
        <span className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </span>
      </div>
    </footer>
  );
}
