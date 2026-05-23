"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Single-icon theme toggle. Click to flip between light and dark.
 * Respects the system preference until first user click.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const buttonCls =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (!mounted) {
    return <span className={buttonCls} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light" : "Switch to dark"}
      className={buttonCls}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 45, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="inline-flex"
          >
            <Moon />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -45, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="inline-flex"
          >
            <Sun />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
