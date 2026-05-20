import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app error states", () => {
  it("provides an accessible app-level error boundary with retry", () => {
    const file = new URL("./error.tsx", import.meta.url);

    expect(existsSync(file)).toBe(true);

    const source = readFileSync(file, "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("reset");
    expect(source).toContain('role="alert"');
    expect(source).toContain("Coba lagi");
    expect(source).toContain('href="/"');
  });

  it("provides a branded not-found page instead of the generic Next.js 404", () => {
    const file = new URL("./not-found.tsx", import.meta.url);

    expect(existsSync(file)).toBe(true);

    const source = readFileSync(file, "utf8");

    expect(source).toContain("SharedHeader");
    expect(source).toContain("SiteFooter");
    expect(source).toContain("Halaman tidak ditemukan");
    expect(source).toContain('href="/"');
    expect(source).toContain('href="/articles"');
  });
});
