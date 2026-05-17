import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const revealComponentUrl = new URL("../components/landing-scroll-reveal.tsx", import.meta.url);
const revealSource = existsSync(revealComponentUrl) ? readFileSync(revealComponentUrl, "utf8") : "";

describe("landing scroll reveal animation", () => {
  it("wires the landing page to the scroll reveal controller", () => {
    expect(existsSync(revealComponentUrl)).toBe(true);
    expect(pageSource).toContain('import { LandingScrollReveal } from "@/components/landing-scroll-reveal";');
    expect(pageSource).toContain("<LandingScrollReveal />");
  });

  it("marks relevant landing sections and components for scroll reveal", () => {
    expect(pageSource.match(/data-scroll-reveal/g)?.length).toBeGreaterThanOrEqual(20);
    expect(pageSource).toContain('section data-scroll-reveal=""');
    expect(pageSource).toContain('data-scroll-reveal-group="hero-copy"');
    expect(pageSource).toContain('data-scroll-reveal-group="about-card"');
    expect(pageSource).toContain('data-scroll-reveal-group="feature-card"');
    expect(pageSource).toContain('data-scroll-reveal-group="article-card"');
    expect(pageSource).toContain('data-scroll-reveal-group="workflow-step"');
  });

  it("uses IntersectionObserver once per element without React state re-renders", () => {
    expect(revealSource).toContain('"use client";');
    expect(revealSource).toContain("IntersectionObserver");
    expect(revealSource).toContain("observer.unobserve(entry.target)");
    expect(revealSource).toContain("observer.disconnect()");
    expect(revealSource).not.toContain("useState");
  });

  it("defines subtle fade-up animation with reduced-motion support", () => {
    expect(cssSource).toContain("[data-scroll-reveal]");
    expect(cssSource).toContain('data-scroll-reveal-ready="true"');
    expect(cssSource).toContain('data-scroll-reveal-visible="true"');
    expect(cssSource).toContain("translate3d(0, 18px, 0)");
    expect(cssSource).toContain("prefers-reduced-motion: reduce");
  });
});
