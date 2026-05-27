import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Terms of Service · Abkon Services",
  description:
    "Terms governing use of Abkon Services (operating as Abkon Laundromat) — laundry, dry cleaning, ironing, and home cleaning.",
};

const CONTACT_EMAIL = "abkon350@gmail.com";
const CONTACT_PHONE = "+234 913 564 4777";
const BUSINESS_ADDRESS = "193 Aba Road, Ikot Ekpene, Akwa Ibom State, Nigeria";
const LAST_UPDATED = "27 May 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LegalHeader />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <h1 className="mb-2 text-[clamp(32px,4.4vw,44px)] font-bold leading-tight tracking-[-0.025em]">
          Terms of Service
        </h1>
        <p className="mb-12 text-[13px] uppercase tracking-[0.12em] text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. About these terms">
          <p>
            These terms govern your use of services provided by Abkon Services (registered with the
            Corporate Affairs Commission of Nigeria), operating under the brand name &ldquo;Abkon
            Laundromat.&rdquo; Registered office: {BUSINESS_ADDRESS}.
          </p>
          <p>
            By booking a service, dropping items at our shop, or messaging us on WhatsApp, you
            agree to these terms. If you don&apos;t agree, please don&apos;t use our services.
          </p>
        </Section>

        <Section title="2. Services we offer">
          <ul>
            <li>Laundry: washing, ironing, wash-and-iron combinations.</li>
            <li>Dry cleaning for suits, agbada, gowns, and delicate fabrics.</li>
            <li>Home cleaning: sofas, rugs, curtains, and full-home deep cleaning.</li>
            <li>Pickup and delivery within our published service areas.</li>
          </ul>
          <p>
            Service availability, turnaround times, and pricing are listed on the website and may
            be updated from time to time. The price quoted at intake is the price you pay, unless
            additional items are added with your agreement.
          </p>
        </Section>

        <Section title="3. Bookings and tickets">
          <ul>
            <li>Every drop-off generates a printed ticket with a unique ticket number.</li>
            <li>Keep your ticket — you&apos;ll need it (or ID verification) to collect items.</li>
            <li>If you lose your ticket, we can find your record using your phone number and ID.</li>
          </ul>
        </Section>

        <Section title="4. Pricing and payment">
          <ul>
            <li>Prices are quoted in Nigerian Naira (₦) and shown on the website and ticket.</li>
            <li>Accepted methods: cash and bank transfer. We do not currently accept card payments.</li>
            <li>Payment is due at drop-off or pickup — your choice, agreed at intake.</li>
            <li>Unusual or negotiable items are priced before work begins. We will not proceed until you confirm the quote.</li>
          </ul>
        </Section>

        <Section title="5. Turnaround and pickup">
          <ul>
            <li>Standard turnaround is 2 working days from drop-off.</li>
            <li>Same-day service is available for drop-offs before 10am (50% surcharge).</li>
            <li>You will receive an SMS or WhatsApp message when your items are ready.</li>
            <li>
              Items not collected within 14 days are moved to long-term storage. Items not collected
              within 90 days may be sold or disposed of to recover storage costs, after reasonable
              attempts to contact you.
            </li>
          </ul>
        </Section>

        <Section title="6. Care guarantee and our limits">
          <p>
            We sort by fabric, check pockets at intake, and check each item before release. If we
            damage an item through our negligence (e.g., shrinking, fading, button loss), we will
            either repair, refund, or replace at our discretion.
          </p>
          <p>
            Our liability is limited to the lower of (a) ten times the cleaning charge for that
            item, or (b) the documented replacement value of the item. We are not liable for:
          </p>
          <ul>
            <li>Pre-existing damage, fading, or weakness in fabrics.</li>
            <li>Items not declared at intake (e.g., hidden valuables in pockets).</li>
            <li>Items left uncollected past 90 days.</li>
            <li>Indirect, consequential, or special damages.</li>
          </ul>
        </Section>

        <Section title="7. Pickup and delivery">
          <ul>
            <li>Free pickup and delivery is available on tickets above ₦5,000 within our service areas.</li>
            <li>For pickup, please ensure someone over 18 is available at the address.</li>
            <li>Delivery is to the door — we do not enter your home unless explicitly invited for home-cleaning service.</li>
          </ul>
        </Section>

        <Section title="8. WhatsApp communication">
          <p>
            When you message us on WhatsApp, you agree that we may send you booking confirmations,
            ready notifications, reminders, and occasional service updates. You can stop service
            messages at any time by replying STOP. Marketing messages will be sent only with your
            explicit opt-in.
          </p>
        </Section>

        <Section title="9. Cancellations and refunds">
          <ul>
            <li>You may cancel a booking at no charge before we begin work.</li>
            <li>Once work has started, only the unworked portion may be refunded.</li>
            <li>Refunds are paid to the same payment channel used at intake, within 7 working days.</li>
          </ul>
        </Section>

        <Section title="10. Disputes">
          <p>
            We always prefer to resolve issues directly — please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
              {CONTACT_EMAIL}
            </a>{" "}
            or {CONTACT_PHONE} on WhatsApp. Any dispute that cannot be resolved informally will be
            handled under the laws of the Federal Republic of Nigeria, with venue in Akwa Ibom State.
          </p>
        </Section>

        <Section title="11. Changes to these terms">
          <p>
            We may update these terms from time to time. The &ldquo;Last updated&rdquo; date at the
            top reflects the most recent revision. Continued use of our services after a change
            constitutes acceptance of the updated terms.
          </p>
        </Section>

        <Section title="12. Contact us">
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
