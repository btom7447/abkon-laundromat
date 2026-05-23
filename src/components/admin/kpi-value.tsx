"use client";

import CountUp from "react-countup";

interface Props {
  value: number;
  /** Currency formatter for Naira; if true, prefixes ₦ and uses thousand separators with M/k abbreviation. */
  currency?: boolean;
  duration?: number;
  className?: string;
}

function abbreviateThreshold(v: number): { divisor: number; suffix: string; decimals: number } | null {
  if (v >= 1_000_000) return { divisor: 1_000_000, suffix: "M", decimals: 2 };
  if (v >= 100_000) return { divisor: 1000, suffix: "k", decimals: 0 };
  return null;
}

/**
 * Animated numeric KPI value. For currency, falls back to abbreviated form
 * (₦1.23M, ₦450k) past thresholds so the digit stream is still readable.
 */
export function KpiValue({ value, currency = false, duration = 0.6, className }: Props) {
  if (currency) {
    const abbr = abbreviateThreshold(value);
    if (abbr) {
      return (
        <CountUp
          start={0}
          end={value / abbr.divisor}
          duration={duration}
          decimals={abbr.decimals}
          prefix="₦"
          suffix={abbr.suffix}
          preserveValue
          className={className}
        />
      );
    }
    return (
      <CountUp
        start={0}
        end={value}
        duration={duration}
        prefix="₦"
        separator=","
        preserveValue
        className={className}
      />
    );
  }

  return (
    <CountUp
      start={0}
      end={value}
      duration={duration}
      separator=","
      preserveValue
      className={className}
    />
  );
}
