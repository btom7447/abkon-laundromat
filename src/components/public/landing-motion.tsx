"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Scroll progress bar at top of page ──────────────────────────────

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400"
    />
  );
}

// ── Parallax image — moves Y as the section scrolls through the viewport

interface ParallaxImageProps {
  src: string;
  alt: string;
  /** % of element height to translate over the scroll range. e.g. 12 = 12% */
  amount?: number;
  /** "up" parallax (image floats up slower than scroll), "down" reverses */
  direction?: "up" | "down";
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
}

export function ParallaxImage({
  src,
  alt,
  amount = 14,
  direction = "up",
  className,
  imgClassName,
  sizes,
  priority,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const from = direction === "up" ? amount : -amount;
  const to = direction === "up" ? -amount : amount;
  const y = useTransform(scrollYProgress, [0, 1], [`${from}%`, `${to}%`]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }} className="absolute inset-[-12%]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      </motion.div>
    </div>
  );
}

// ── Background parallax — image as a scroll-linked backdrop ─────────

export function ParallaxBackdrop({
  src,
  alt = "",
  overlay = true,
  amount = 18,
  className,
}: {
  src: string;
  alt?: string;
  overlay?: boolean;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-amount}%`, `${amount}%`]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.02, 1.08]);

  return (
    <div ref={ref} className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div style={{ y, scale }} className="absolute inset-[-15%]">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      {overlay && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/45 to-navy-950/85"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(14_165_233/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgb(16_185_129/0.12),transparent_60%)]"
          />
        </>
      )}
    </div>
  );
}

// ── Marquee strip — pure-CSS infinite scroll ────────────────────────

interface MarqueeStripProps {
  items: ReactNode[];
  /** seconds per loop */
  duration?: number;
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
}

export function MarqueeStrip({
  items,
  duration = 32,
  className,
  itemClassName,
  separator,
}: MarqueeStripProps) {
  const sep = separator ?? (
    <span aria-hidden className="text-current/30">
      ◆
    </span>
  );

  // Duplicate for seamless loop
  const loop = [...items, ...items];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="flex w-max items-center gap-10 whitespace-nowrap"
        style={{
          animation: `landing-marquee ${duration}s linear infinite`,
        }}
      >
        {loop.map((item, i) => (
          <span key={i} className={cn("flex items-center gap-10", itemClassName)}>
            {item}
            {sep}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes landing-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="landing-marquee"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── RiseIn — dramatic viewport reveal with stagger support ──────────

export function RiseIn({
  className,
  delay = 0,
  y = 60,
  duration = 0.9,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; duration?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, ease: EASE, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── ScrollScale — element scales/fades subtly as it crosses viewport ─

export function ScrollScale({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.7]);

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={cn(className)}>
      {children}
    </motion.div>
  );
}

// ── ScrollFloat — counter-parallax for floating elements ────────────

export function ScrollFloat({
  children,
  className,
  amount = 30,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  return (
    <motion.div ref={ref} style={{ y }} className={cn(className)}>
      {children}
    </motion.div>
  );
}

// ── Section divider — animated SVG curve between color blocks ───────

export function CurveDivider({
  fill = "white",
  flip = false,
  className,
}: {
  fill?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 leading-[0]",
        flip ? "bottom-0 rotate-180" : "top-0",
        className
      )}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="block h-[60px] w-full md:h-[90px]"
      >
        <path
          d="M0,32 C320,80 720,0 1080,40 C1260,60 1380,30 1440,20 L1440,90 L0,90 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
