import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("root layout CSS readiness guard", () => {
  const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

  it("keeps raw app HTML hidden until the Next.js stylesheet is ready", () => {
    expect(source).toContain("appCssReadinessCriticalCss");
    expect(source).toContain("appCssReadinessScript");
    expect(source).toContain('id="app-shell"');
    expect(source).toContain("data-app-shell");
    expect(source).toContain("data-app-css-ready");
    expect(source).toContain('link[rel="stylesheet"][href*="/_next/static/"]');
    expect(source).toContain("<noscript>");
  });
});
