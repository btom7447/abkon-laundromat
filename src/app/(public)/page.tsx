import Link from "next/link";
import { Shirt, Sparkles, Truck, Clock, ShieldCheck, MessageCircle } from "lucide-react";
import { WhatsAppQR } from "@/components/public/whatsapp-qr";

// TODO: replace with real WhatsApp business number once provisioned via Meta Cloud API
const WHATSAPP_NUMBER = "2348000000000";
const WHATSAPP_GREETING = "Hi Abkon, I'd like to book a laundry pickup.";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                <Sparkles className="h-3.5 w-3.5" /> Now booking via WhatsApp
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Clean clothes, <span className="text-brand-600">delivered fresh</span>.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-slate-600">
                Drop-off or home pickup — Abkon Laundromat handles your washing, ironing
                and dry cleaning with care. Book in seconds via WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Book on WhatsApp
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900 hover:bg-slate-50"
                >
                  How it works
                </a>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
                <p className="mb-3 text-center text-sm font-medium text-slate-700">
                  Scan to book
                </p>
                <WhatsAppQR phoneNumber={WHATSAPP_NUMBER} message={WHATSAPP_GREETING} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Our services</h2>
            <p className="mt-3 text-slate-600">
              Wash, iron, dry cleaning, and a long list of garment-care add-ons. Mix and match
              per item — pay only for what you need.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <ServiceCard
              icon={<Shirt className="h-6 w-6" />}
              title="Wash"
              description="From shirts and trousers to duvets and bedspreads. Color-safe, gentle, fresh-scented."
            />
            <ServiceCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Iron"
              description="Crisp finishes for shirts, agbada, native wear and pleated skirts. Done by hand."
            />
            <ServiceCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Dry Clean"
              description="Suits, gowns, delicates — handled professionally, returned ready to wear."
            />
          </div>

          <div className="mt-12 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
            <AddOnPill label="Starching" />
            <AddOnPill label="Stain removal" />
            <AddOnPill label="Whitening" />
            <AddOnPill label="Color restoration" />
            <AddOnPill label="Sanitizing" />
            <AddOnPill label="Perfuming" />
            <AddOnPill label="Button replacement" />
            <AddOnPill label="Minor stitching" />
            <AddOnPill label="Hem adjustment" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-600">Three ways to use Abkon — pick what fits your day.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StepCard
              number={1}
              icon={<Truck className="h-5 w-5" />}
              title="Book a pickup on WhatsApp"
              description="Open WhatsApp, follow the prompts, pick your items and add-ons. We pick up from your address."
            />
            <StepCard
              number={2}
              icon={<Shirt className="h-5 w-5" />}
              title="Or walk in"
              description="Bring your clothes to our showroom. Reception indexes everything and gives you a ticket number on the spot."
            />
            <StepCard
              number={3}
              icon={<Clock className="h-5 w-5" />}
              title="Collect when ready"
              description="You'll get an SMS when your clothes are ready. Standard turnaround is 2 days; urgent is 1 day with a small surcharge."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white shadow-xl md:p-14">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-3xl font-bold">Ready to skip laundry day?</h2>
                <p className="mt-3 text-brand-100">
                  Scan the code or tap the button to start a booking on WhatsApp.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-medium text-brand-700 hover:bg-brand-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Book on WhatsApp
                </a>
              </div>
              <div className="flex justify-center">
                <WhatsAppQR phoneNumber={WHATSAPP_NUMBER} message={WHATSAPP_GREETING} size={140} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staff hint */}
      <div className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-slate-400">
        Staff member? <Link href="/login" className="text-brand-600 hover:underline">Sign in here</Link>.
      </div>
    </>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function StepCard({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {number}
        </span>
        <span className="text-brand-700">{icon}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function AddOnPill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
      <Sparkles className="h-3.5 w-3.5 text-brand-500" />
      {label}
    </div>
  );
}
