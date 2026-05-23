"use client";

import { useId, useMemo } from "react";
import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  filled?: boolean;
  strokeWidth?: number;
}

/**
 * Tiny inline SVG sparkline. Auto-scales to its container width.
 * Renders a smooth path with optional gradient fill underneath.
 */
export function Sparkline({
  data,
  color = "#0EA5E9",
  height = 28,
  width = 96,
  filled = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  const id = useId().replace(/:/g, "");
  const { points, area } = useMemo(() => {
    if (data.length === 0) return { points: "", area: "" };
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const span = max - min || 1;
    const stepX = width / Math.max(1, data.length - 1);
    const yScale = (v: number) => height - 4 - ((v - min) / span) * (height - 8);
    const pts = data.map((v, i) => `${i * stepX},${yScale(v)}`).join(" ");
    const areaPoints = `${pts} ${(data.length - 1) * stepX},${height} 0,${height}`;
    return { points: pts, area: areaPoints };
  }, [data, height, width]);

  if (!data.length) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block h-full w-full"
    >
      {filled && (
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && <motion.polygon
        points={area}
        fill={`url(#sp-${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}
