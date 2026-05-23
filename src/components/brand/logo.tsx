import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Abkon Laundromat logo.
 *
 * The source is a navy single-color PNG (`/public/logo.png`). On dark
 * backgrounds we invert it to read as light against navy surfaces.
 *
 * If/when the owner provides a true white/light variant SVG, drop it in and
 * branch on theme instead of using the filter trick.
 */
interface LogoMarkProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function LogoMark({ size = 32, className, priority = false }: LogoMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="Abkon Laundromat"
      width={size}
      height={size}
      priority={priority}
      className={cn("select-none dark:brightness-0 dark:invert", className)}
      style={{ width: size, height: "auto" }}
    />
  );
}

interface LogoProps extends LogoMarkProps {
  withWordmark?: boolean;
  wordmarkClassName?: string;
}

export function Logo({ size = 32, className, withWordmark = false, wordmarkClassName, priority }: LogoProps) {
  if (!withWordmark) {
    return <LogoMark size={size} className={className} priority={priority} />;
  }
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} priority={priority} />
      <span className={cn("font-semibold tracking-tight", wordmarkClassName)}>Abkon Laundromat</span>
    </span>
  );
}
