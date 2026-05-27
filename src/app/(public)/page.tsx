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
  Mail,
  ArrowRight,
  ArrowDown,
  Sofa,
  Square,
  PaintRoller,
  Check,
  ShieldCheck,
  Truck,
  Clock,
  CalendarClock,
  Package,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Illustration } from "@/components/brand/illustrations";
import { WhatsAppQR } from "@/components/public/whatsapp-qr";
import {
  StaggerContainer,
  StaggerChild,
  MountFade,
} from "@/components/public/animated-section";
import {
  ScrollProgressBar,
  ParallaxImage,
  ParallaxBackdrop,
  MarqueeStrip,
  RiseIn,
  ScrollScale,
  ScrollFloat,
} from "@/components/public/landing-motion";
import { AppointmentForm } from "@/components/public/appointment-form";
import { StatsCounter } from "@/components/public/stats-counter";
import { TestimonialsCarousel } from "@/components/public/testimonials-carousel";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { env } from "@/lib/env";

// ── Content ──────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = "2349135644777";
const WHATSAPP_GREETING = "Hi Abkon, I'd like to book a service.";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
const CONTACT_EMAIL = "abkon350@gmail.com";
const CONTACT_PHONE_DISPLAY = "+234 913 564 4777";
const HERO_IMAGE = "/auth-poster.jpg";

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

const ABOUT_HIGHLIGHTS = [
  "Nigerian-owned, locally-trained team",
  "Ankara, agbada, and senator-wear specialists",
  "Color-safe detergents, sun-dried where possible",
  "Two-day standard, same-day rush available",
  "Free pickup and delivery within Ikot Ekpene",
  "Pay cash or transfer — never both required",
];

const FEATURE_CARDS = [
  {
    Icon: ShieldCheck,
    title: "100% care guarantee",
    desc: "Damaged a button? Faded a fabric? We refund or replace, no haggling.",
  },
  {
    Icon: Truck,
    title: "Free pickup & delivery",
    desc: "On every ticket above ₦5,000 within our service areas.",
  },
  {
    Icon: Clock,
    title: "Always reachable",
    desc: "WhatsApp replies in under 10 minutes during business hours.",
  },
];

const WHY_CHOOSE_US = [
  "Trained reception verifies every item at intake — nothing goes missing",
  "Printed ticket per bag, SMS the moment it's ready for pickup",
  "In-house dry cleaning — your suits never leave our shop",
  "Negotiable pricing for unusual items, locked in before we start",
];

const WORK_STEPS = [
  {
    Icon: CalendarClock,
    n: "01",
    t: "Schedule your service",
    d: "Send a WhatsApp message or walk into Ikot Ekpene. Reception books you in within minutes.",
  },
  {
    Icon: Sparkles,
    n: "02",
    t: "Expert cleaning process",
    d: "Sorted by fabric, washed at the right temperature, pressed by hand for delicate items.",
  },
  {
    Icon: Package,
    n: "03",
    t: "Packaging & delivery",
    d: "Folded, hung, or wrapped — your choice. SMS when ready, delivered to your door.",
  },
];

const TEAM = [
  {
    initials: "RL",
    role: "Reception Lead",
    note: "Greets, indexes, and tickets every bag.",
  },
  {
    initials: "WS",
    role: "Wash Specialist",
    note: "Sorts fabrics and runs the wash lines.",
  },
  {
    initials: "IP",
    role: "Ironing & Press",
    note: "Crisp finishes for agbada and formal wear.",
  },
  {
    initials: "DC",
    role: "Delivery Coordinator",
    note: "Routes pickups and delivery across Ikot Ekpene.",
  },
];

const STATS = [
  { value: 2, suffix: "-day", label: "Standard turnaround" },
  { value: 10, suffix: "", label: "Service areas in Akwa Ibom" },
  { value: 8, suffix: "", label: "Services under one roof" },
];

// TODO: replace with real customer quotes once the shop has feedback.
const TESTIMONIALS = [
  {
    quote:
      "Dropped off three agbadas before a wedding and they came back perfect. Pickup was on time and the SMS update is genuinely useful.",
    name: "[Customer Name]",
    title: "Ikot Ekpene Town",
    initials: "TO",
  },
  {
    quote:
      "Sofa pickup was painless. They wrapped everything, took it the same day, and delivered it cleaner than when we bought it.",
    name: "[Customer Name]",
    title: "Itak",
    initials: "AA",
  },
  {
    quote:
      "Reception actually checks every item before you leave. First laundromat I've used in Akwa Ibom that hasn't lost a single sock.",
    name: "[Customer Name]",
    title: "Uyo",
    initials: "JN",
  },
];

const AREAS = [
  "Ikot Ekpene Town",
  "Itak",
  "Use Akpan Nya",
  "Ediene",
  "Abak",
  "Essien Udim",
  "Obot Akara",
  "Ikot Akpan Abia",
  "Ifuho",
  "Uyo",
];

const FAQS = [
  {
    q: "How long does it take?",
    a: "Standard turnaround is 2 working days. Same-day is available if you drop off before 10am (50% surcharge).",
  },
  {
    q: "Do you collect from my house?",
    a: "Yes — free pickup and delivery on tickets above ₦5,000 within our 10 service areas. Outside that, drop off at the Ikot Ekpene branch.",
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
    "Akwa Ibom laundromat and home-cleaning service. Wash, iron, dry-clean, sofa and rug cleaning with 2-day turnaround.",
  url: env.APP_URL,
  logo: `${env.APP_URL}/logo.png`,
  image: `${env.APP_URL}/opengraph-image`,
  telephone: `+${WHATSAPP_NUMBER}`,
  priceRange: "₦200 – ₦25,000",
  currenciesAccepted: "NGN",
  paymentAccepted: "Cash, Bank Transfer",
  address: {
    "@type": "PostalAddress",
    streetAddress: "193 Aba Road",
    addressLocality: "Ikot Ekpene",
    addressRegion: "Akwa Ibom",
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

      <ScrollProgressBar />
      <MarketingHeader />

      <HeroFull />
      <MarqueeBand />
      <AboutSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <WorkProcessSection />
      <StatsSection />
      <TeamSection />
      <AreasSection />
      <TestimonialsSection />
      <CtaBanner />
      <FaqSection />
      <AppointmentSection />

      <MarketingFooter />
    </>
  );
}

// ── Hero — full-bleed photo, white text, scroll cue ──────────────────

function HeroFull() {
  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100svh] w-full items-end overflow-hidden bg-navy-950 text-white"
    >
      <ParallaxBackdrop src={HERO_IMAGE} alt="Inside the Abkon Laundromat at Ikot Ekpene" />

      {/* Floating accent shapes */}
      <ScrollFloat amount={40} className="pointer-events-none absolute -right-24 top-32 z-10 hidden lg:block">
        <Image
          src="/assets/abkon/bubbles-bokeh.svg"
          alt=""
          aria-hidden
          width={500}
          height={400}
          className="h-[360px] w-[480px] opacity-50 mix-blend-screen"
        />
      </ScrollFloat>

      <div className="relative z-20 mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-6 pb-24 pt-32 md:px-10 md:pb-32 md:pt-40 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <MountFade className="flex max-w-3xl flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Now booking via WhatsApp
          </span>

          <h1 className="text-[clamp(44px,7.5vw,96px)] font-bold leading-[0.95] tracking-[-0.035em]">
            Clean clothes,
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
              clean home.
            </span>
            <br />
            Done right.
          </h1>

          <p className="max-w-2xl text-[16px] leading-[1.6] text-white/80 md:text-[19px]">
            Ikot Ekpene&apos;s neighborhood laundromat — wash, iron, and dry clean — plus
            sofa, rug, and full home cleaning. Pickup at your door, ready in 2 days,
            pay how you like.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 text-[15px] font-semibold leading-none text-white shadow-[0_12px_32px_-8px_rgb(16_185_129/0.55)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_16px_40px_-8px_rgb(16_185_129/0.65)]"
            >
              <MessageCircle className="h-4 w-4" />
              Book on WhatsApp
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#services"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 text-[15px] font-semibold leading-none text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              Explore services
            </a>
          </div>
        </MountFade>

        {/* Floating mini-info card */}
        <MountFade
          delay={0.25}
          className="flex w-full max-w-[320px] flex-col gap-4 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl lg:max-w-[280px]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Visit us
              </span>
              <span className="text-[14px] font-bold leading-tight">
                193 Aba Road, Ikot Ekpene
              </span>
            </div>
          </div>
          <div className="h-px bg-white/15" />
          <div className="flex items-center gap-3">
            <WhatsAppQR
              phoneNumber={WHATSAPP_NUMBER}
              message={WHATSAPP_GREETING}
              size={64}
              compact
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Scan to chat
              </span>
              <span className="text-[12px] leading-tight text-white/85">
                Replies under 10 min,
                <br />
                Mon–Sat
              </span>
            </div>
          </div>
        </MountFade>
      </div>

      {/* Bottom scroll cue */}
      <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/60">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em]">
          Scroll
        </span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}

// ── Marquee Band — colored strip between dark hero and light about ──

function MarqueeBand() {
  const items = [
    <span key="a" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="shirt" size={20} />
      Wash
    </span>,
    <span key="b" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="suit" size={20} />
      Iron & Press
    </span>,
    <span key="c" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="agbada" size={20} />
      Dry Clean
    </span>,
    <span key="d" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="sofa" size={20} />
      Sofa & Upholstery
    </span>,
    <span key="e" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="rug" size={20} />
      Rug & Carpet
    </span>,
    <span key="f" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="curtain" size={20} />
      Curtain & Blinds
    </span>,
    <span key="g" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em]">
      <Illustration name="duvet" size={20} />
      Duvet & Bedspread
    </span>,
  ];

  return (
    <section className="relative bg-brand-600 py-6 text-white">
      <MarqueeStrip items={items} duration={38} />
    </section>
  );
}

// ── About — light section, two-column with parallax photos ──────────

function AboutSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-background px-6 py-28 md:px-10 md:py-36"
    >
      {/* Subtle background pattern */}
      <Image
        src="/assets/abkon/droplet.svg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        className="pointer-events-none absolute -right-12 top-20 h-72 w-72 opacity-[0.05]"
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        {/* Photo cluster with parallax */}
        <div className="relative">
          <div className="relative grid grid-cols-2 gap-5">
            <RiseIn y={50} duration={1}>
              <ParallaxImage
                src={HERO_IMAGE}
                alt="Abkon shop floor"
                amount={10}
                direction="up"
                className="aspect-[3/4] rounded-3xl shadow-[0_30px_60px_-24px_rgb(11_18_38/0.3)]"
                sizes="(min-width: 1024px) 240px, 50vw"
              />
            </RiseIn>
            <RiseIn y={80} delay={0.15} duration={1} className="mt-12">
              <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-[0_30px_60px_-24px_rgb(2_132_199/0.4)] dark:from-brand-900/40 dark:to-brand-800/30">
                <div className="[&_svg]:text-brand-700 dark:[&_svg]:text-brand-200">
                  <Illustration name="washing-machine" size={130} />
                </div>
                <Image
                  src="/assets/abkon/bubbles-bokeh.svg"
                  alt=""
                  aria-hidden
                  width={300}
                  height={200}
                  className="pointer-events-none absolute -bottom-4 -right-4 h-44 w-52 opacity-70"
                />
              </div>
            </RiseIn>
          </div>
          {/* Floating stat badge */}
          <ScrollFloat amount={20} className="absolute -bottom-8 -left-2 lg:-left-6">
            <div className="flex items-center gap-3 rounded-2xl bg-navy-900 px-6 py-5 text-white shadow-[0_24px_48px_-16px_rgb(11_18_38/0.55)]">
              <span className="text-[44px] font-bold leading-none tracking-[-0.03em] text-brand-300">
                100%
              </span>
              <span className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.08em] text-white/85">
                In-house
                <br />
                cleaning
              </span>
            </div>
          </ScrollFloat>
        </div>

        {/* Copy */}
        <RiseIn className="flex flex-col gap-7">
          <Eyebrow>About us</Eyebrow>
          <h2 className="text-[clamp(32px,4.8vw,52px)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
            A neighborhood laundromat
            <br />
            <span className="text-brand-600 dark:text-brand-300">
              built for Nigerian wardrobes.
            </span>
          </h2>
          <p className="text-[16px] leading-[1.65] text-muted-foreground md:text-[17.5px]">
            Abkon is a family-run shop in Ikot Ekpene — built because finding a laundromat that
            knows how to handle agbada, ankara, and a real Nigerian wardrobe shouldn&apos;t
            be this hard. Every ticket is indexed, every bag is tracked, and every
            customer gets an SMS the moment their clothes are ready.
          </p>

          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {ABOUT_HIGHLIGHTS.map((h) => (
              <li
                key={h}
                className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-foreground"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {h}
              </li>
            ))}
          </ul>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-fit items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 text-[14px] font-semibold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50"
          >
            Chat with the shop on WhatsApp
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </RiseIn>
      </div>

      {/* Three feature cards */}
      <div className="relative mx-auto mt-28 max-w-[1200px]">
        <StaggerContainer
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          staggerDelay={0.1}
        >
          {FEATURE_CARDS.map(({ Icon, title, desc }) => (
            <StaggerChild
              key={title}
              className="group flex items-start gap-4 rounded-2xl border border-default bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_24px_48px_-16px_rgb(11_18_38/0.18)]"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition-transform group-hover:scale-110 dark:bg-brand-900/40 dark:text-brand-200 [&_svg]:h-6 [&_svg]:w-6">
                <Icon />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[15.5px] font-bold leading-tight text-foreground">
                  {title}
                </h3>
                <p className="text-[13px] leading-[1.5] text-muted-foreground">{desc}</p>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── Services — BRAND BLUE full-bleed section ────────────────────────

function ServicesSection() {
  return (
    <section
      id="services"
      className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-6 py-28 text-white md:px-10 md:py-36"
    >
      {/* Pattern overlays */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgb(255_255_255/0.12),transparent_45%),radial-gradient(circle_at_85%_80%,rgb(16_185_129/0.18),transparent_50%)]"
      />
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={600}
        height={400}
        className="pointer-events-none absolute -left-12 top-12 h-[420px] w-[560px] opacity-[0.10] mix-blend-screen"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <RiseIn>
          <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-5 text-center md:mb-20">
            <Eyebrow tone="onBrand">Services</Eyebrow>
            <h2 className="text-[clamp(34px,5.2vw,56px)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              Beyond the basket.
              <br />
              <span className="text-brand-200">Everything you wear and live in.</span>
            </h2>
            <p className="max-w-xl text-[15.5px] leading-[1.65] text-white/80 md:text-[17px]">
              From shirts to sofas — laundry, dry cleaning, and home cleaning under one roof,
              one ticket, one phone number.
            </p>
          </div>
        </RiseIn>

        <ServiceGroup title="Laundry" services={LAUNDRY_SERVICES} />
        <div className="mt-16">
          <ServiceGroup title="Home cleaning" services={CLEANING_SERVICES} />
        </div>
      </div>
    </section>
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
      <RiseIn y={30}>
        <div className="mb-6 flex items-baseline justify-between gap-3 border-b border-white/15 pb-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white">
            {title}
          </h3>
          <span className="text-[12px] tabular-nums text-white/55">
            {services.length} service{services.length === 1 ? "" : "s"}
          </span>
        </div>
      </RiseIn>
      <StaggerContainer
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        staggerDelay={0.08}
      >
        {services.map(({ Icon, name, desc }) => (
          <StaggerChild
            key={name}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/30 hover:bg-white/15"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl transition-opacity group-hover:opacity-100"
            />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-[0_8px_20px_-6px_rgb(0_0_0/0.25)] transition-transform group-hover:scale-110 [&_svg]:h-7 [&_svg]:w-7">
              <Icon />
            </span>
            <h4 className="relative text-[19px] font-bold leading-tight text-white">{name}</h4>
            <p className="relative text-[13.5px] leading-[1.6] text-white/75">{desc}</p>
          </StaggerChild>
        ))}
      </StaggerContainer>
    </div>
  );
}

// ── Why Choose Us — light section, two-column with parallax photo ───

function WhyChooseUsSection() {
  return (
    <section
      id="why-us"
      className="relative overflow-hidden bg-background px-6 py-28 md:px-10 md:py-36"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <RiseIn className="flex flex-col gap-7">
          <Eyebrow>Why choose us</Eyebrow>
          <h2 className="text-[clamp(32px,4.8vw,52px)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
            We take pride in
            <br />
            <span className="text-brand-600 dark:text-brand-300">
              perfecting your clothes.
            </span>
          </h2>
          <p className="text-[16px] leading-[1.65] text-muted-foreground md:text-[17.5px]">
            Most Nigerian laundromats lose socks and outsource dry cleaning. We don&apos;t.
            Every step happens in our shop, supervised, with a printed ticket per bag
            so you always know where your clothes are.
          </p>

          <ul className="flex flex-col gap-3">
            {WHY_CHOOSE_US.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 text-[14.5px] leading-[1.55] text-foreground"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {line}
              </li>
            ))}
          </ul>

          <a
            href="#appointment"
            className="group inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-[14px] font-semibold leading-none text-white shadow-[0_12px_28px_-8px_rgb(2_132_199/0.5)] transition-all hover:-translate-y-0.5 hover:bg-brand-700"
          >
            Make an appointment
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </RiseIn>

        {/* Photo with parallax + employee tag */}
        <RiseIn y={80} delay={0.15} duration={1.1} className="relative">
          <ParallaxImage
            src={HERO_IMAGE}
            alt="Inside the Abkon Laundromat"
            amount={12}
            className="aspect-[4/5] rounded-3xl shadow-[0_40px_80px_-24px_rgb(11_18_38/0.35)]"
            sizes="(min-width: 1024px) 580px, 100vw"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-3xl bg-gradient-to-t from-navy-950/80 via-navy-950/30 to-transparent"
          />
          {/* Floating employee tag */}
          <ScrollFloat amount={18} className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_20px_48px_-12px_rgb(11_18_38/0.45)] backdrop-blur-xl">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[14px] font-bold text-white">
                AB
              </span>
              <div className="flex flex-col">
                <span className="text-[14.5px] font-bold text-navy-900">
                  Abkon shop team
                </span>
                <span className="text-[11.5px] uppercase tracking-[0.08em] text-navy-500">
                  Ikot Ekpene, Akwa Ibom
                </span>
              </div>
              <Sparkles className="ml-auto h-5 w-5 text-brand-600" aria-hidden />
            </div>
          </ScrollFloat>
        </RiseIn>
      </div>
    </section>
  );
}

// ── Work Process — NAVY DARK section with glowing steps ─────────────

function WorkProcessSection() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-navy-950 px-6 py-28 text-white md:px-10 md:py-36"
    >
      {/* Grid + glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:60px_60px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(14_165_233/0.15),transparent_70%)]"
      />
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={500}
        height={400}
        className="pointer-events-none absolute -left-20 top-0 h-[420px] w-[540px] opacity-[0.10] mix-blend-screen"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <RiseIn>
          <div className="mx-auto mb-20 flex max-w-2xl flex-col items-center gap-5 text-center">
            <Eyebrow tone="onDark">Work process</Eyebrow>
            <h2 className="text-[clamp(34px,5.2vw,56px)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              Three steps.
              <br />
              <span className="text-brand-300">Two days. One ticket.</span>
            </h2>
            <p className="max-w-xl text-[15.5px] leading-[1.65] text-white/65 md:text-[17px]">
              No app downloads, no signup forms. Send a message, drop your stuff, we handle the rest.
            </p>
          </div>
        </RiseIn>

        <StaggerContainer
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          staggerDelay={0.14}
        >
          {WORK_STEPS.map((s, idx) => (
            <StaggerChild
              key={s.n}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-brand-400/40"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-brand-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />

              {/* Connector arrow */}
              {idx < WORK_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-6 top-20 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-brand-500/20 text-brand-200 backdrop-blur-sm md:flex"
                >
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}

              <div className="relative flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_12px_28px_-8px_rgb(2_132_199/0.65)] [&_svg]:h-8 [&_svg]:w-8">
                  <s.Icon />
                </span>
                <span className="text-[42px] font-bold leading-none tracking-[-0.04em] text-brand-300/80 tabular-nums">
                  {s.n}
                </span>
              </div>

              <h3 className="relative text-[22px] font-bold leading-tight text-white">{s.t}</h3>
              <p className="relative text-[14px] leading-[1.65] text-white/70">{s.d}</p>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── Stats — BRAND BLUE full-bleed counter section ───────────────────

function StatsSection() {
  return (
    <section
      id="stats"
      className="relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 px-6 py-24 md:px-10 md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgb(255_255_255/0.18),transparent_45%),radial-gradient(circle_at_80%_50%,rgb(16_185_129/0.18),transparent_45%)]"
      />
      <Image
        src="/assets/abkon/droplet.svg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        className="pointer-events-none absolute -right-8 -top-8 h-72 w-72 opacity-[0.08] mix-blend-screen"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <RiseIn>
          <div className="mb-14 flex max-w-2xl flex-col gap-3 text-white">
            <Eyebrow tone="onBrand">By the numbers</Eyebrow>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.05] tracking-[-0.025em]">
              Small shop, serious operation.
            </h2>
          </div>
        </RiseIn>
        <div className="rounded-3xl border border-white/15 bg-white/10 p-10 backdrop-blur-xl md:p-14">
          <StatsCounter stats={[...STATS]} />
        </div>
      </div>
    </section>
  );
}

// ── Team — light section, gradient avatars ──────────────────────────

function TeamSection() {
  return (
    <section
      id="team"
      className="relative overflow-hidden bg-background px-6 py-28 md:px-10 md:py-36"
    >
      <div className="mx-auto max-w-[1200px]">
        <RiseIn>
          <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-5 text-center">
            <Eyebrow>Our team</Eyebrow>
            <h2 className="text-[clamp(32px,4.8vw,52px)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
              The people behind
              <br />
              <span className="text-brand-600 dark:text-brand-300">your clean clothes.</span>
            </h2>
            <p className="max-w-xl text-[15.5px] leading-[1.65] text-muted-foreground md:text-[17px]">
              A small, trained crew. Roles are clear, hand-offs are written down, and every bag is signed for at every stage.
            </p>
          </div>
        </RiseIn>

        <StaggerContainer
          className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6"
          staggerDelay={0.1}
        >
          {TEAM.map((m) => (
            <StaggerChild
              key={m.role}
              className="group flex flex-col items-center gap-5 rounded-3xl border border-default bg-card p-7 text-center transition-all hover:-translate-y-2 hover:border-brand-300 hover:shadow-[0_30px_60px_-24px_rgb(11_18_38/0.25)]"
            >
              <div className="relative">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-[26px] font-bold text-white shadow-[0_16px_32px_-8px_rgb(2_132_199/0.55)] transition-transform group-hover:scale-105 sm:h-28 sm:w-28 sm:text-[28px]">
                  {m.initials}
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-brand-200 opacity-0 blur-2xl transition-opacity group-hover:opacity-80 dark:bg-brand-700/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-bold leading-tight text-foreground">
                  {m.role}
                </span>
                <span className="text-[12.5px] leading-[1.5] text-muted-foreground">
                  {m.note}
                </span>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── Areas — soft surface-muted tinted section ───────────────────────

function AreasSection() {
  return (
    <section
      id="areas"
      className="relative overflow-hidden bg-surface-muted/60 px-6 py-24 md:px-10 md:py-32 dark:bg-navy-900/40"
    >
      <Image
        src="/assets/abkon/droplet.svg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        className="pointer-events-none absolute -right-10 top-12 h-64 w-64 opacity-[0.08]"
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
        <RiseIn className="flex flex-col gap-5">
          <Eyebrow>Service areas</Eyebrow>
          <h2 className="text-[clamp(28px,4.4vw,46px)] font-bold leading-[1.05] tracking-[-0.025em] text-foreground">
            We pick up
            <br />
            and deliver here.
          </h2>
          <p className="max-w-lg text-[15px] leading-[1.6] text-muted-foreground md:text-[16.5px]">
            Free pickup and delivery on tickets above ₦5,000. Outside these areas? Drop off at the Ikot Ekpene branch — same prices, same care.
          </p>
        </RiseIn>

        <StaggerContainer className="flex flex-wrap gap-2.5" staggerDelay={0.04}>
          {AREAS.map((a) => (
            <StaggerChild
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full border border-default bg-card px-5 py-3 text-[14px] font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-[0_8px_20px_-8px_rgb(11_18_38/0.15)] dark:hover:bg-navy-800 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-brand-500"
            >
              <MapPin />
              {a}
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── Testimonials — light section with brand tint ────────────────────

function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-background to-background px-6 py-28 md:px-10 md:py-36 dark:from-brand-950/40 dark:via-background dark:to-background"
    >
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={500}
        height={400}
        className="pointer-events-none absolute -right-16 top-10 h-[360px] w-[460px] opacity-[0.20] dark:opacity-[0.08]"
      />

      <div className="relative mx-auto max-w-[1200px]">
        <RiseIn>
          <div className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-5 text-center">
            <Eyebrow>What customers say</Eyebrow>
            <h2 className="text-[clamp(32px,4.8vw,52px)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
              Real customers,
              <br />
              <span className="text-brand-600 dark:text-brand-300">real wardrobes.</span>
            </h2>
            <p className="max-w-xl text-[14.5px] leading-[1.6] text-muted-foreground md:text-[16px]">
              Reviews are placeholder until the shop collects real ones — we don&apos;t fake testimonials.
            </p>
          </div>
        </RiseIn>
        <ScrollScale>
          <TestimonialsCarousel testimonials={TESTIMONIALS} />
        </ScrollScale>
      </div>
    </section>
  );
}

// ── CTA banner — brand gradient ──────────────────────────────────────

function CtaBanner() {
  return (
    <section className="relative px-6 py-24 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <RiseIn>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900 px-8 py-16 md:px-16 md:py-24">
            <div
              aria-hidden
              className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-4 right-6 hidden opacity-[0.12] lg:block [&_svg]:text-white"
            >
              <Illustration name="shirt" size={200} />
            </div>

            <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="flex flex-col gap-5">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  First-time offer
                </span>
                <h2 className="text-[clamp(30px,4.6vw,48px)] font-bold leading-[1.04] tracking-[-0.025em] text-white">
                  You get premium laundry
                  <br />
                  service from us.
                </h2>
                <p className="max-w-xl text-[15.5px] leading-[1.6] text-white/85 md:text-[17px]">
                  First-time customers get <span className="font-semibold text-white">free pickup</span>{" "}
                  within Ikot Ekpene. Send &ldquo;Hi&rdquo; — we&apos;ll take it from there.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-7 text-[15px] font-semibold leading-none text-brand-700 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.3)] transition-all hover:-translate-y-0.5 hover:bg-white/95"
                >
                  <MessageCircle className="h-4 w-4" />
                  Get our services
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#appointment"
                  className="inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/30 bg-white/10 px-7 text-[15px] font-semibold leading-none text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Phone className="h-4 w-4" />
                  Contact us now
                </a>
              </div>
            </div>
          </div>
        </RiseIn>
      </div>
    </section>
  );
}

// ── FAQ — light tinted section ──────────────────────────────────────

function FaqSection() {
  return (
    <section
      id="faq"
      className="relative bg-surface-muted/60 px-6 py-28 md:px-10 md:py-36 dark:bg-navy-900/40"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <RiseIn className="flex flex-col gap-5">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-[clamp(32px,4.8vw,50px)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            Questions,
            <br />
            <span className="text-brand-600 dark:text-brand-300">answered.</span>
          </h2>
          <p className="max-w-md text-[15px] leading-[1.6] text-muted-foreground md:text-[16.5px]">
            If something isn&apos;t covered here, send a quick WhatsApp message — we usually reply in under 10 minutes during business hours.
          </p>
        </RiseIn>

        <StaggerContainer className="flex flex-col gap-3" staggerDelay={0.06}>
          {FAQS.map((f, i) => (
            <StaggerChild key={f.q}>
              <details
                open={i === 0}
                className="group rounded-2xl border border-default bg-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_12px_28px_-12px_rgb(11_18_38/0.15)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5 text-[15.5px] font-semibold text-foreground after:flex after:h-8 after:w-8 after:items-center after:justify-center after:rounded-full after:bg-brand-50 after:text-[20px] after:font-normal after:text-brand-700 after:transition-transform after:content-['+'] group-open:after:rotate-45 dark:after:bg-brand-900/40 dark:after:text-brand-200 [&::-webkit-details-marker]:hidden">
                  {f.q}
                </summary>
                <p className="mx-6 mb-5 border-t border-dashed border-default pt-4 text-[14px] leading-[1.6] text-muted-foreground">
                  {f.a}
                </p>
              </details>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── Appointment — NAVY DARK closing section ─────────────────────────

function AppointmentSection() {
  return (
    <section
      id="appointment"
      className="relative isolate overflow-hidden bg-navy-950 px-6 py-32 text-white md:px-10 md:py-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(14_165_233/0.18),transparent_60%)]"
      />
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={500}
        height={400}
        className="pointer-events-none absolute -left-12 top-0 h-[420px] w-[540px] opacity-[0.12] mix-blend-screen"
      />
      <Image
        src="/assets/abkon/droplet.svg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        className="pointer-events-none absolute -right-12 bottom-0 h-72 w-72 opacity-[0.10] mix-blend-screen"
      />

      <div className="relative mx-auto max-w-[840px] text-center">
        <RiseIn>
          <div className="mb-12 flex flex-col items-center gap-5">
            <Eyebrow tone="onDark">Book an appointment</Eyebrow>
            <h2 className="text-[clamp(36px,5.6vw,60px)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              Pick a service.
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-emerald-300 bg-clip-text text-transparent">
                We&apos;ll take it from there.
              </span>
            </h2>
            <p className="max-w-xl text-[15.5px] leading-[1.65] text-white/70 md:text-[17px]">
              Choose what you need below — it pre-fills the WhatsApp message so reception can confirm pickup time and quote in one reply.
            </p>
          </div>
        </RiseIn>
        <RiseIn delay={0.15} y={40}>
          <AppointmentForm phoneNumber={WHATSAPP_NUMBER} />
        </RiseIn>

        {/* Quick contact strip */}
        <RiseIn delay={0.3} y={30} className="mt-10 flex flex-col items-center justify-center gap-6 text-[13.5px] sm:flex-row">
          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" />
            {CONTACT_PHONE_DISPLAY}
          </a>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" />
            {CONTACT_EMAIL}
          </a>
        </RiseIn>
      </div>
    </section>
  );
}

// ── Shared primitives ────────────────────────────────────────────────

function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "onDark" | "onBrand";
}) {
  const styles =
    tone === "onDark"
      ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
      : tone === "onBrand"
        ? "border-white/30 bg-white/15 text-white"
        : "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/30 dark:text-brand-200";

  const dot = tone === "light" ? "bg-brand-500" : "bg-white";

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border ${styles} px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em]`}
    >
      <span aria-hidden className={`h-1 w-1 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

// ── Marketing chrome ─────────────────────────────────────────────────

function MarketingHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-navy-950/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-3.5 md:px-10">
        <Link
          href="/"
          aria-label="Abkon Laundromat — home"
          className="flex items-center gap-2.5 text-[18px] font-bold tracking-tight text-white"
        >
          <LogoMark size={32} priority />
          <span>Abkon</span>
        </Link>
        <nav className="hidden gap-7 text-[13.5px] font-medium text-white/70 sm:flex">
          <a href="#about" className="transition-colors hover:text-white">
            About
          </a>
          <a href="#services" className="transition-colors hover:text-white">
            Services
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-white">
            Process
          </a>
          <a href="#team" className="transition-colors hover:text-white">
            Team
          </a>
          <a href="#faq" className="transition-colors hover:text-white">
            FAQ
          </a>
          <a href="#appointment" className="transition-colors hover:text-white">
            Book
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 text-[12.5px] font-semibold leading-none text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:inline-flex"
          >
            Staff login
          </Link>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-[12.5px] font-semibold leading-none text-white shadow-[0_2px_8px_-2px_rgb(16_185_129/0.5)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
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
    <footer
      id="find-us"
      className="relative overflow-hidden bg-[#070D1C] px-6 pb-7 pt-24 text-[#F0F9FF] md:px-10"
    >
      <Image
        src="/assets/abkon/bubbles-bokeh.svg"
        alt=""
        aria-hidden
        width={500}
        height={400}
        className="pointer-events-none absolute -left-16 -top-10 h-[320px] w-[440px] opacity-[0.06]"
      />
      <Image
        src="/assets/abkon/droplet.svg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 opacity-[0.05]"
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr_1fr_1.3fr]">
        <div>
          <div className="flex items-center gap-2.5 text-[22px] font-bold text-white">
            <LogoMark size={32} />
            Abkon
          </div>
          <p className="my-5 max-w-sm text-[13.5px] leading-[1.6] text-[#9BABC8]">
            Ikot Ekpene&apos;s neighborhood laundromat and home-cleaning service. Pickup,
            deep clean, and delivery — every day except major holidays.
          </p>
          <ul className="flex flex-col gap-2 text-[13px] text-[#9BABC8]">
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> {CONTACT_PHONE_DISPLAY}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {CONTACT_EMAIL}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> 193 Aba Road, Ikot Ekpene, Akwa Ibom
            </li>
          </ul>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-[13px] font-semibold leading-none text-white transition-colors hover:bg-emerald-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp us
          </a>
        </div>

        <FooterCol heading="Services">
          <FooterLink href="#services">Wash</FooterLink>
          <FooterLink href="#services">Iron</FooterLink>
          <FooterLink href="#services">Dry clean</FooterLink>
          <FooterLink href="#services">Sofa & upholstery</FooterLink>
          <FooterLink href="#services">Rug & carpet</FooterLink>
          <FooterLink href="#services">Home deep clean</FooterLink>
        </FooterCol>

        <FooterCol heading="Company">
          <FooterLink href="#about">About</FooterLink>
          <FooterLink href="#how-it-works">Process</FooterLink>
          <FooterLink href="#team">Team</FooterLink>
          <FooterLink href="#areas">Service areas</FooterLink>
          <FooterLink href="#faq">FAQ</FooterLink>
          <FooterLink href="#appointment">Book a slot</FooterLink>
        </FooterCol>

        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9BABC8]">
            Newsletter
          </h4>
          <p className="mb-3 text-[12.5px] leading-[1.5] text-[#9BABC8]">
            Get occasional service updates and seasonal offers — no spam.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="relative mx-auto mt-14 flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-[#21304A] pt-6 text-[12px] text-[#9BABC8]">
        <span>© {new Date().getFullYear()} Abkon Services · Operating as Abkon Laundromat · Made with care in Nigeria</span>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
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
          </div>
          <span className="flex gap-4">
            <Link className="opacity-70 transition-opacity hover:opacity-100" href="/privacy">
              Privacy
            </Link>
            <Link className="opacity-70 transition-opacity hover:opacity-100" href="/terms">
              Terms
            </Link>
          </span>
        </div>
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
      <a href={href} className="text-[#F0F9FF]/78 transition-colors hover:text-white">
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
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#182338] transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
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
