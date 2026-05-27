"use client";

import { useState } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  initials: string;
}

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;

  const go = (delta: number) => {
    setIndex((i) => (i + delta + count) % count);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {testimonials.map((t) => (
            <article
              key={t.name + t.title}
              className="w-full flex-shrink-0 px-2"
            >
              <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-default bg-card p-8 text-center shadow-[0_24px_48px_-24px_rgb(11_18_38/0.2)] md:p-12">
                <Quote
                  aria-hidden
                  className="absolute right-6 top-6 h-10 w-10 text-brand-100 dark:text-brand-900/60"
                />
                <div className="flex items-center gap-1 text-amber-400 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:fill-current">
                  <Star /> <Star /> <Star /> <Star /> <Star />
                </div>
                <p className="text-[16px] leading-[1.65] text-foreground md:text-[18px]">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex flex-col items-center gap-2">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-[16px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    {t.initials}
                  </span>
                  <span className="text-[15px] font-semibold text-foreground">
                    {t.name}
                  </span>
                  <span className="text-[12.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    {t.title}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-default bg-card text-foreground transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-navy-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={
                "h-2 rounded-full transition-all " +
                (i === index
                  ? "w-6 bg-brand-600 dark:bg-brand-300"
                  : "w-2 bg-default hover:bg-strong")
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-default bg-card text-foreground transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-navy-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
