"use client";

import { useEffect, useRef, useState } from "react";

interface StatProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}

function useCountUp(target: number, duration: number, start: boolean) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTs = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTs;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return current;
}

function Stat({ value, suffix = "", prefix = "", label, duration = 1400 }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const count = useCountUp(value, duration, inView);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-2 px-4 text-center sm:items-start sm:text-left"
    >
      <span className="text-[clamp(40px,6vw,68px)] font-bold leading-none tracking-[-0.03em] text-brand-600 tabular-nums dark:text-brand-300">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="max-w-[20ch] text-[13.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

export function StatsCounter({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-10 divide-y divide-dashed divide-default sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <Stat key={s.label} {...s} />
      ))}
    </div>
  );
}
