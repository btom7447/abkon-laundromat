"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Section that fades + slides into view as it enters the viewport.
 * Respects `prefers-reduced-motion` (handled inside framer-motion).
 *
 * Tuned for marketing-site smoothness — pronounced y-offset, longer duration,
 * and a soft ease-out curve. The viewport `amount: 0.15` triggers when 15% of
 * the section is visible, so the user actually sees the motion happen rather
 * than landing on an already-finished state.
 */
const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

export function AnimatedSection({
  className,
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<"section"> & { delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.75, ease: EASE_OUT_QUART, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedDiv({
  className,
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: EASE_OUT_QUART, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container for grids — paired with <StaggerChild />.
 */
export function StaggerContainer({
  className,
  staggerDelay = 0.08,
  children,
  ...props
}: HTMLMotionProps<"div"> & { staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay, delayChildren: 0.1 } },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChild({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_QUART } },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Mount-time animation for above-the-fold elements like the hero. Fires once
 * on first paint (no scroll trigger) so the page feels alive on landing.
 */
export function MountFade({
  className,
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
