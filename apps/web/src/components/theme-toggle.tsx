"use client";

import { Moon, Sun } from "lucide-react";

import { useAppTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { getNextTheme } from "@/lib/theme/preferences";

export function ThemeToggle({
  labels,
  compact = false,
}: {
  labels: {
    light: string;
    dark: string;
    switchToLight: string;
    switchToDark: string;
  };
  compact?: boolean;
}) {
  const { mounted, resolvedTheme, setTheme } = useAppTheme();

  const currentTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const nextTheme = getNextTheme(currentTheme);
  const label = currentTheme === "dark" ? labels.dark : labels.light;
  const ariaLabel = nextTheme === "dark" ? labels.switchToDark : labels.switchToLight;
  const Icon = currentTheme === "dark" ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="ghost"
      className={[
        "min-h-11 min-w-11 rounded-full px-3 text-xs",
        compact ? "fixed right-4 top-4 z-50 shadow-[var(--shadow-subtle)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => setTheme(nextTheme)}
      disabled={!mounted}
    >
      <Icon size={15} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
