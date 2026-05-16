import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  getNextTheme,
  themeStorageKey,
  themeToggleTargets,
  themes,
  type AppTheme,
} from "./preferences";

describe("theme preferences", () => {
  it("uses a stable storage key and light/dark app themes", () => {
    expect(themeStorageKey).toBe("medproof_theme");
    expect(themes).toEqual(["light", "dark"]);
    expect(themeToggleTargets).toEqual({
      light: "dark",
      dark: "light",
    });
  });

  it("toggles between persisted light and dark themes", () => {
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("light");
  });

  it("falls back to light when current theme is not an explicit app theme", () => {
    expect(getNextTheme(undefined)).toBe("light");
    expect(getNextTheme("system")).toBe("light");
    expect(getNextTheme("unknown")).toBe("light");
  });

  it("keeps AppTheme narrow", () => {
    const theme: AppTheme = "dark";

    expect(theme).toBe("dark");
  });

  it("keeps theme provider source free of raw script rendering", () => {
    const source = readFileSync(new URL("../../components/theme-provider.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("next-themes");
    expect(source).not.toContain("<script");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("does not ship next-themes because it injects an inline script element", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { dependencies?: Record<string, string> };

    expect(packageJson.dependencies).not.toHaveProperty("next-themes");
  });
});
