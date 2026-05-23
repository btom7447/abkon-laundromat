import { cn } from "@/lib/utils";

interface Props {
  /** Display name — first letters become the fallback initials. */
  name: string;
  /** Stable seed for the fallback background colour (usually email or id). */
  seed?: string;
  /** Avatar image URL (data URL or external). When absent, initials fall back. */
  src?: string | null;
  /** Pixel size — applied to both height + width + font scale. */
  size?: number;
  className?: string;
  /** When true, ring around the avatar (used for headers / hero placements). */
  ring?: boolean;
}

const PALETTE = [
  "#0EA5E9",
  "#16A34A",
  "#0369A1",
  "#7C3AED",
  "#DB2777",
  "#F59E0B",
  "#DC2626",
  "#0891B2",
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Universal staff/customer avatar. Renders the uploaded image when `src` is
 * present, otherwise a colour-hashed initials disc. Keeps the same visual
 * contract everywhere so the dashboard stays consistent.
 */
export function Avatar({ name, seed, src, size = 40, className, ring }: Props) {
  const fontSize = Math.max(10, Math.round(size * 0.36));
  const initials = initialsOf(name);

  if (src) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 overflow-hidden rounded-full bg-surface-muted",
          ring && "ring-2 ring-card",
          className
        )}
        style={{ height: size, width: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        ring && "ring-2 ring-card",
        className
      )}
      style={{
        height: size,
        width: size,
        background: colorFor(seed ?? name),
        fontSize,
      }}
    >
      {initials}
    </span>
  );
}
