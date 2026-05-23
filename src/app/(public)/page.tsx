import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  MessageCircle,
  Sparkles,
  WashingMachine,
  Anvil,
  Droplets,
  Wind,
  Phone,
  ArrowRight,
  Sofa,
  Square,
  PaintRoller,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Illustration } from "@/components/brand/illustrations";
import { WhatsAppQR } from "@/components/public/whatsapp-qr";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerChild,
  MountFade,
} from "@/components/public/animated-section";
import { env } from "@/lib/env";

// ── Content ──────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = "2348030000000";
const WHATSAPP_GREETING = "Hi Abkon, I'd like to book a service.";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;

const LAUNDRY_SERVICES = [
  {
    Icon: WashingMachine,
    name: "Wash",
    desc: "Cold or warm cycle, color-safe detergent, fold-and-pack ready in 2 days.",
  },
  {
    Icon: Anvil,
    name: "Iron",
    desc: "Crisp finish — including starching for agbada, senator, and formal wear.",
  },
  {
    Icon: Droplets,
    name: "Wash & Iron",
    desc: "Our most popular combo — laundered, pressed, and hung in 2 working days.",
  },
  {
    Icon: Wind,
    name: "Dry clean",
    desc: "Suits, agbadas, gowns, delicate fabrics — done in-house, never outsourced.",
  },
] as const;

const CLEANING_SERVICES = [
  {
    Icon: Sofa,
    name: "Sofa & upholstery",
    desc: "Deep-extraction cleaning for fabric and leather couches — at home or pickup.",
  },
  {
    Icon: Square,
    name: "Rug & carpet",
    desc: "Pickup, deep wash, sun-dried, and delivered back fresh within 3 days.",
  },
  {
    Icon: PaintRoller,
    name: "Curtain & blinds",
    desc: "We take them down, wash, iron, and rehang. The ladder is on us.",
  },
  {
    Icon: Sparkles,
    name: "Home deep clean",
    desc: "Whole-home or post-construction. Trained crew, supplies included.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    t: "Book on WhatsApp",
    d: 'Send "Hi" to our number — or walk into the Ikeja branch any day of the week.',
  },
  {
    n: "02",
    t: "Drop off + ticket",
    d: "Reception indexes your items and hands you a printed ticket number.",
  },
  {
    n: "03",
    t: "We do the work",
    d: "Laundry, cleaning, or repair — standard turnaround is 2 working days.",
  },
  {
    n: "04",
    t: "SMS when ready",
    d: "We text you the moment it's ready. Come collect, or schedule delivery.",
  },
];

const AREAS = [
  "Ikeja GRA",
  "Maryland",
  "Ojota",
  "Ogba",
  "Magodo",
  "Anthony",
  "Ketu",
  "Ikorodu Rd",
  "Allen Avenue",
  "Opebi",
];

const FAQS = [
  {
    q: "How long does it take?",
    a: "Standard turnaround is 2 working days. Same-day is available if you drop off before 10am (50% surcharge).",
  },
  {
    q: "Do you collect from my house?",
    a: "Yes — free pickup and delivery on tickets above ₦5,000 within our 10 service areas. Outside that, drop off at the Ikeja branch.",
  },
  {
    q: "Can you clean my couch / rug / curtains?",
    a: "Yes. Sofa, upholstery, rugs, and curtains are part of our home-cleaning service. Quote depends on size and fabric — we send it on WhatsApp before we start.",
  },
  {
    q: "I lost my ticket — what now?",
    a: "Call or message us with your phone number; we'll find your ticket. ID verification is required at pickup.",
  },
  {
    q: "Payment methods?",
    a: "Cash and bank transfer. No card terminal yet. Pay at drop-off or on collection — your choice.",
  },
  {
    q: "Operating hours?",
    a: "Monday to Saturday 8am to 7pm. Sunday 10am to 4pm. Public holidays are posted in-branch.",
  },
];

// ── Schema.org structured data ────────────────────────────────────────

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Abkon Laundromat",
  alternateName: "Abkon",
  description:
    "Lagos laundromat and home-cleaning service. Wash, iron, dry-clean, sofa and rug cleaning with 2-day turnaround.",
  url: env.APP_URL,
  logo: `${env.APP_URL}/logo.png`,
  image: `${env.APP_URL}/opengraph-image`,
  telephone: `+${WHATSAPP_NUMBER}`,
  priceRange: "₦200 – ₦25,000",
  currenciesAccepted: "NGN",
  paymentAccepted: "Cash, Bank Transfer",
  address: {
    "@type": "PostalAddress",
    streetAddress: "14 Allen Avenue",
    addressLocality: "Ikeja",
    addressRegion: "Lagos",
    addressCountry: "NG",
  },
  areaServed: AREAS.map((a) => ({ "@type": "Place", name: a })),
};

// ── Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <MarketingHeader />

      <Hero />
      <ServicesSection />
      <HowItWorksSection />
      <AreasSection />
      <FaqSection />
      <CtaBanner />

      <MarketingFooter />
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-default bg-gradient-to-b from-brand-50/60 via-background to-background dark:from-brand-950/30">
      {/* Decorative bokeh — top-right, subtle */}
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={600}
        height={400}
        priority
        className="pointer-events-none absolute -right-24 -top-16 h-[420px] w-[640px] opacity-50 dark:opacity-[0.15]"
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-28">
        {/* Copy column */}
        <MountFade className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/30 dark:text-brand-200">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Now booking via WhatsApp
          </span>

          <h1 className="text-[clamp(40px,6.4vw,72px)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
            Clean clothes,
            <br />
            <span className="text-brand-600 dark:text-brand-300">clean home.</span>
            <br />
            Done right.
          </h1>

          <p className="max-w-xl text-[17px] leading-[1.55] text-muted-foreground md:text-[18px]">
            Lagos&apos;s neighborhood laundromat — wash, iron, and dry clean — plus
            sofa, rug, and full home cleaning. Pickup at your door, ready in 2 days,
            pay how you like.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-[15px] font-semibold leading-none text-white shadow-[0_4px_14px_-2px_rgb(22_163_74/0.35)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Book on WhatsApp
            </a>
            <a
              href="#services"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-lg border border-strong bg-surface px-6 text-[15px] font-semibold leading-none text-foreground transition-colors hover:bg-surface-muted"
            >
              Explore services
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Brand illustration strip — clothing line-up beneath the CTAs */}
          <div className="mt-2 flex items-center gap-5 border-t border-dashed border-default pt-5 opacity-80 [&_svg]:text-navy-800 dark:[&_svg]:text-brand-200">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              We clean it all
            </span>
            <span className="flex items-center gap-3">
              <Illustration name="shirt" size={28} />
              <Illustration name="suit" size={28} />
              <Illustration name="agbada" size={28} />
              <Illustration name="duvet" size={28} />
              <Illustration name="sofa" size={28} />
              <Illustration name="rug" size={28} />
              <Illustration name="curtain" size={28} />
            </span>
          </div>
        </MountFade>

        {/* Visual column — real photo of the laundromat with floating QR overlay */}
        <MountFade delay={0.15} className="relative">
          <div className="relative aspect-[5/6] w-full max-w-[460px] overflow-hidden rounded-3xl shadow-[0_30px_60px_-20px_rgb(11_18_38/0.35)] lg:ml-auto">
            <Image
              src="/auth-poster.jpg"
              alt="The Abkon Laundromat shop floor"
              fill
              priority
              sizes="(min-width: 1024px) 460px, 100vw"
              className="object-cover"
            />
            {/* Bottom gradient for readable badge contrast */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-900/55 via-navy-900/20 to-transparent"
            />
            {/* Top brand tag */}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-navy-900 backdrop-blur-sm">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ikeja branch
            </span>
            {/* Floating QR card */}
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 rounded-2xl bg-card/95 p-4 shadow-[0_16px_40px_-12px_rgb(11_18_38/0.45)] backdrop-blur-sm">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Scan to chat
              </span>
              <WhatsAppQR
                phoneNumber={WHATSAPP_NUMBER}
                message={WHATSAPP_GREETING}
                size={120}
                compact
              />
            </div>
          </div>
        </MountFade>
      </div>
    </section>
  );
}

// ── Services ──────────────────────────────────────────────────────────

function ServicesSection() {
  return (
    <AnimatedSection id="services" className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          eyebrow="Services"
          title={
            <>
              Beyond the basket.
              <br />
              <span className="text-muted-foreground">Everything you wear and live in.</span>
            </>
          }
          sub="From shirts to sofas — laundry, dry cleaning, and home cleaning under one roof, one ticket, one phone number."
        />

        {/* Laundry */}
        <ServiceGroup title="Laundry" services={LAUNDRY_SERVICES} />

        {/* Cleaning */}
        <div className="mt-16">
          <ServiceGroup title="Home cleaning" services={CLEANING_SERVICES} />
        </div>
      </div>
    </AnimatedSection>
  );
}

function ServiceGroup({
  title,
  services,
}: {
  title: string;
  services: readonly {
    Icon: React.ComponentType<{ className?: string }>;
    name: string;
    desc: string;
  }[];
}) {
  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-3 border-b border-dashed border-default pb-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground">
          {title}
        </h3>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {services.length} service{services.length === 1 ? "" : "s"}
        </span>
      </div>
      <StaggerContainer
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        staggerDelay={0.08}
      >
        {services.map(({ Icon, name, desc }) => (
          <StaggerChild
            key={name}
            className="group flex flex-col gap-4 rounded-2xl border border-default bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_20px_40px_-12px_rgb(11_18_38/0.18)]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 [&_svg]:h-7 [&_svg]:w-7">
              <Icon />
            </span>
            <h4 className="text-[18px] font-bold leading-tight text-foreground">{name}</h4>
            <p className="text-[13.5px] leading-[1.55] text-muted-foreground">{desc}</p>
          </StaggerChild>
        ))}
      </StaggerContainer>
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <AnimatedSection
      id="how-it-works"
      className="relative overflow-hidden border-y border-navy-800/60 bg-navy-900 px-6 py-24 text-white md:px-10 md:py-32"
    >
      {/* Brand bokeh accent — top-left of the dark band */}
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={500}
        height={400}
        className="pointer-events-none absolute -left-24 -top-10 h-[420px] w-[540px] opacity-[0.10]"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <SectionHeader
          eyebrow="How it works"
          title={
            <>
              Four steps.
              <br />
              <span className="text-brand-300">Two days. One ticket.</span>
            </>
          }
          sub="No app downloads, no signup forms. Send a message, drop your stuff, we handle the rest."
          tone="dark"
        />

        <StaggerContainer
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.08}
        >
          {STEPS.map((s, idx) => (
            <StaggerChild
              key={s.n}
              className="relative flex flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800/50 p-7 backdrop-blur-sm transition-colors hover:border-brand-400/60 hover:bg-navy-800"
            >
              {/* Connector line (desktop) */}
              {idx < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 top-12 hidden h-px w-6 bg-gradient-to-r from-navy-600 to-transparent lg:block"
                />
              )}

              {/* Big number */}
              <div className="flex items-baseline justify-between gap-2 border-b border-navy-700 pb-3">
                <span className="text-[42px] font-bold leading-none tracking-[-0.04em] text-brand-300 tabular-nums md:text-[48px]">
                  {s.n}
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  Step
                </span>
              </div>

              <h3 className="text-[18px] font-bold leading-tight text-white">{s.t}</h3>
              <p className="text-[13.5px] leading-[1.55] text-white/65">{s.d}</p>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedSection>
  );
}

// ── Service areas ─────────────────────────────────────────────────────

function AreasSection() {
  return (
    <AnimatedSection id="areas" className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
      {/* Subtle droplet pattern in the corner */}
      <Image
        src="/assets/abkon/droplet.svg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        className="pointer-events-none absolute -right-10 top-12 h-64 w-64 opacity-[0.06] dark:opacity-[0.10]"
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeader
          eyebrow="Service areas"
          title={
            <>
              We pick up
              <br />
              and deliver here.
            </>
          }
          sub="Free pickup and delivery on tickets above ₦5,000. Outside these areas? Drop off at the Ikeja branch — same prices, same care."
          align="left"
        />

        <StaggerContainer
          className="flex flex-wrap gap-2.5"
          staggerDelay={0.03}
        >
          {AREAS.map((a) => (
            <StaggerChild
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full border border-default bg-card px-4 py-2.5 text-[13.5px] font-medium text-foreground transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-navy-800 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-brand-500"
            >
              <MapPin />
              {a}
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedSection>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────

function FaqSection() {
  return (
    <AnimatedSection id="faq" className="border-y border-default bg-surface-muted/40 px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered."
          sub="If something isn't covered here, send a quick WhatsApp message — we usually reply in under 10 minutes during business hours."
          align="left"
        />

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              className="group rounded-2xl border border-default bg-card transition-colors hover:border-strong"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-semibold text-foreground after:flex after:h-7 after:w-7 after:items-center after:justify-center after:rounded-full after:bg-surface-muted after:text-[18px] after:font-normal after:text-brand-700 after:transition-transform after:content-['+'] group-open:after:rotate-45 [&::-webkit-details-marker]:hidden">
                {f.q}
              </summary>
              <p className="mx-5 mb-4 border-t border-dashed border-default pt-3 text-[14px] leading-[1.55] text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ── CTA banner ────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <AnimatedSection className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900 px-8 py-14 md:px-16 md:py-20">
          {/* Decorative blur */}
          <div
            aria-hidden
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
          />

          {/* Faint brand illustration in the bottom-right of the banner */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-4 right-6 hidden opacity-[0.12] lg:block [&_svg]:text-white"
          >
            <Illustration name="shirt" size={180} />
          </div>

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                First-time offer
              </span>
              <h2 className="text-[clamp(28px,4.2vw,44px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
                Book your first ticket
                <br />
                on WhatsApp.
              </h2>
              <p className="max-w-xl text-[15px] leading-[1.55] text-white/85 md:text-[16px]">
                First-time customers get <span className="font-semibold text-white">free pickup</span>{" "}
                within Ikeja GRA. Send &ldquo;Hi&rdquo; — we&apos;ll take it from there.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-6 text-[15px] font-semibold leading-none text-brand-700 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.25)] transition-all hover:-translate-y-0.5 hover:bg-white/95"
              >
                <MessageCircle className="h-4 w-4" />
                Book on WhatsApp
              </a>
              <a
                href="#areas"
                className="inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/30 bg-white/10 px-6 text-[15px] font-semibold leading-none text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <MapPin className="h-4 w-4" />
                See service areas
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ── Shared primitives ────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  sub,
  align = "left",
  tone = "light",
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center md:mb-16"
          : "mb-12 flex flex-col gap-4 md:mb-16"
      }
    >
      <span
        className={
          tone === "dark"
            ? "inline-flex w-fit items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-brand-300"
            : "inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/30 dark:text-brand-200"
        }
      >
        <span aria-hidden className={"h-1 w-1 rounded-full " + (tone === "dark" ? "bg-brand-300" : "bg-brand-500")} />
        {eyebrow}
      </span>
      <h2
        className={
          tone === "dark"
            ? "max-w-3xl text-[clamp(32px,5vw,52px)] font-bold leading-[1.04] tracking-[-0.025em] text-white"
            : "max-w-3xl text-[clamp(32px,5vw,52px)] font-bold leading-[1.04] tracking-[-0.025em] text-foreground"
        }
      >
        {title}
      </h2>
      <p
        className={
          tone === "dark"
            ? "max-w-2xl text-[15px] leading-[1.6] text-white/65 md:text-[17px]"
            : "max-w-2xl text-[15px] leading-[1.6] text-muted-foreground md:text-[17px]"
        }
      >
        {sub}
      </p>
    </div>
  );
}

// ── Marketing chrome ─────────────────────────────────────────────────

function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-default bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-3.5 md:px-10">
        <Link
          href="/"
          aria-label="Abkon Laundromat — home"
          className="flex items-center gap-2.5 text-[18px] font-bold tracking-tight text-foreground"
        >
          <LogoMark size={32} priority />
          <span>Abkon</span>
        </Link>
        <nav className="hidden gap-7 text-[13.5px] font-medium text-muted-foreground sm:flex">
          <a href="#services" className="transition-colors hover:text-foreground">
            Services
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#areas" className="transition-colors hover:text-foreground">
            Areas
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-strong bg-surface px-3.5 text-[12.5px] font-semibold leading-none text-foreground transition-colors hover:bg-surface-muted sm:inline-flex"
          >
            Staff login
          </Link>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-[12.5px] font-semibold leading-none text-white shadow-[0_2px_8px_-2px_rgb(22_163_74/0.35)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Book ticket
          </a>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer id="find-us" className="bg-[#0B1226] px-6 pb-7 pt-16 text-[#F0F9FF] md:px-10">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-[20px] font-bold text-white">
            <LogoMark size={28} />
            Abkon
          </div>
          <p className="my-4 max-w-sm text-[13.5px] leading-[1.55] text-[#9BABC8]">
            Lagos&apos;s neighborhood laundromat and home-cleaning service. Pickup, deep clean, and delivery — every day except major holidays.
          </p>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-[13px] font-semibold leading-none text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp us
          </a>
        </div>
        <FooterCol heading="Quick links">
          <FooterLink href="#services">Services</FooterLink>
          <FooterLink href="#how-it-works">How it works</FooterLink>
          <FooterLink href="#areas">Service areas</FooterLink>
          <FooterLink href="#faq">FAQ</FooterLink>
        </FooterCol>
        <FooterCol heading="Contact">
          <li className="text-[#F0F9FF]/78">+234 803 000 0000</li>
          <li className="text-[#F0F9FF]/78">14 Allen Avenue, Ikeja</li>
          <li className="text-[#F0F9FF]/78">Mon–Sat 8am–7pm</li>
          <li className="text-[#F0F9FF]/78">Sun 10am–4pm</li>
        </FooterCol>
        <FooterCol heading="Follow">
          <li className="flex gap-2">
            <SocialBtn label="Instagram">
              <InstagramIcon />
            </SocialBtn>
            <SocialBtn label="X (Twitter)">
              <XIcon />
            </SocialBtn>
            <SocialBtn label="Facebook">
              <FacebookIcon />
            </SocialBtn>
            <SocialBtn label="Phone" href={`tel:+${WHATSAPP_NUMBER}`}>
              <Phone />
            </SocialBtn>
          </li>
        </FooterCol>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-[#21304A] pt-6 text-[12px] text-[#9BABC8]">
        <span>© {new Date().getFullYear()} Abkon Laundromat · Made with care in Nigeria</span>
        <span className="flex gap-4">
          <a className="transition-opacity hover:opacity-100 opacity-70" href="#">
            Privacy
          </a>
          <a className="transition-opacity hover:opacity-100 opacity-70" href="#">
            Terms
          </a>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9BABC8]">
        {heading}
      </h4>
      <ul className="flex flex-col gap-2.5 p-0 text-[13.5px]">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="opacity-78 transition-opacity hover:opacity-100">
        {children}
      </a>
    </li>
  );
}

function SocialBtn({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href ?? "#"}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#182338] transition-colors hover:bg-[#21304A] [&_svg]:h-3.5 [&_svg]:w-3.5"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.563 9.876v-6.987h-2.54V12h2.54V9.797c0-2.505 1.492-3.89 3.776-3.89 1.094 0 2.239.196 2.239.196v2.462h-1.261c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.889h-2.33v6.987A10 10 0 0 0 22 12z" />
    </svg>
  );
}
