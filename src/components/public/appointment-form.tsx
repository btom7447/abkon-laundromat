"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";

const SERVICES = [
  "Wash",
  "Iron",
  "Wash & Iron",
  "Dry clean",
  "Sofa & upholstery",
  "Rug & carpet",
  "Curtain & blinds",
  "Home deep clean",
] as const;

type ServiceName = (typeof SERVICES)[number];

interface AppointmentFormProps {
  phoneNumber: string;
}

export function AppointmentForm({ phoneNumber }: AppointmentFormProps) {
  const [service, setService] = useState<ServiceName | "">("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const greeting = service
      ? `Hi Abkon, I'd like to book a ${service} service.`
      : "Hi Abkon, I'd like to book a service.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(greeting)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-default bg-card p-5 shadow-[0_20px_40px_-20px_rgb(11_18_38/0.25)] sm:flex-row sm:items-center sm:gap-2 sm:p-2"
    >
      <label className="flex-1">
        <span className="sr-only">Choose a service</span>
        <div className="relative">
          <select
            value={service}
            onChange={(e) => setService(e.target.value as ServiceName | "")}
            className="h-13 w-full appearance-none rounded-xl border border-default bg-surface px-5 pr-12 text-[15px] font-medium text-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 sm:border-transparent sm:bg-transparent sm:focus:bg-surface"
          >
            <option value="">Select a service…</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </label>

      <button
        type="submit"
        className="inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-6 text-[15px] font-semibold leading-none text-white shadow-[0_4px_14px_-2px_rgb(22_163_74/0.35)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
      >
        <MessageCircle className="h-4 w-4" />
        Book on WhatsApp
      </button>
    </form>
  );
}
