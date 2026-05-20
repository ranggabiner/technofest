import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("root layout render readiness", () => {
  const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

  it("does not hide server-rendered app HTML behind a CSS readiness gate", () => {
    expect(source).not.toContain("appCssReadinessCriticalCss");
    expect(source).not.toContain("appCssReadinessScript");
    expect(source).not.toContain("data-app-css-ready");
    expect(source).not.toContain('link[rel="stylesheet"][href*="/_next/static/"]');
    expect(source).not.toContain("<noscript>");
    expect(source).toContain('id="app-shell"');
    expect(source).toContain("data-app-shell");
  });

  it("sets the saved theme before hydration to avoid light-to-dark flicker", () => {
    expect(source).toContain("appThemeInitScript");
    expect(source).toContain("medproof_theme");
    expect(source).toContain("localStorage.getItem");
    expect(source).toContain("prefers-color-scheme: dark");
    expect(source).toContain("document.documentElement.setAttribute(\"data-theme\"");
  });

  it("does not keep a root full-screen loading fallback above route skeletons", () => {
    expect(existsSync(new URL("./loading.tsx", import.meta.url))).toBe(false);
  });
});
