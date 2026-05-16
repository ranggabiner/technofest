"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isAppTheme, themeStorageKey, type AppTheme } from "@/lib/theme/preferences";

type AppThemeContextValue = {
  mounted: boolean;
  resolvedTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<AppTheme>(getInitialTheme);

  const setTheme = useCallback((theme: AppTheme) => {
    setResolvedTheme(theme);
    applyTheme(theme);
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const mountedTimer = window.setTimeout(() => setMounted(true), 0);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (readStoredTheme()) return;
      const nextTheme = getSystemTheme();
      setResolvedTheme(nextTheme);
      applyTheme(nextTheme);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== themeStorageKey) return;
      const nextTheme = isAppTheme(event.newValue) ? event.newValue : getSystemTheme();
      setResolvedTheme(nextTheme);
      applyTheme(nextTheme);
    };

    media.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(mountedTimer);
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      mounted,
      resolvedTheme,
      setTheme,
    }),
    [mounted, resolvedTheme, setTheme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return value;
}

function readStoredTheme(): AppTheme | null {
  if (typeof window === "undefined") return null;

  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return isAppTheme(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): AppTheme {
  return readStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}
