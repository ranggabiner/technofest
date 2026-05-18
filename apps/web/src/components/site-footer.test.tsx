import { existsSync, readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("SiteFooter", () => {
  const footerPath = new URL("./site-footer.tsx", import.meta.url);

  it("is a shared component built from the landing footer source of truth", async () => {
    expect(existsSync(footerPath)).toBe(true);

    const source = readFileSync(footerPath, "utf8");

    expect(source).toContain("export async function SiteFooter");
    expect(source).toContain("export function SiteFooterContent");
    expect(source).toContain('import { BrandScrollTopButton } from "@/components/brand-scroll-top-button";');
    expect(source).toContain('logoSrc="/assets/landing/logo.webp"');
    expect(source).toContain("landing.footer.description");
    expect(source).toContain("copy.common.copyright");
    expect(source).toContain("w-full bg-[var(--color-card)] px-4 pb-8 pt-14 text-[var(--color-graphite)] sm:px-6 sm:pb-10 sm:pt-20");
    expect(source).toContain("border-b border-[var(--color-stone-surface)] pb-8");
    expect(source).not.toContain('data-scroll-reveal-group="footer-copyright"');
  });

  it("removes quick links from the reusable footer", async () => {
    expect(existsSync(footerPath)).toBe(true);

    const { SiteFooterContent } = await import("./site-footer");
    const html = renderToStaticMarkup(
      React.createElement(SiteFooterContent, { copy: dictionary.id }),
    );

    expect(html).toContain(dictionary.id.common.brand);
    expect(html).toContain(dictionary.id.marketing.landing.footer.description);
    expect(html).toContain(dictionary.id.common.copyright);
    expect(html).not.toContain("Tautan Cepat");
    expect(html).not.toContain("Beranda");
    expect(html).not.toContain("Tentang Kami");
    expect(html).not.toContain("Fitur Unggulan");
    expect(html).not.toContain("Artikel");

    const source = readFileSync(footerPath, "utf8");
    expect(source).not.toContain("quickLinks");
    expect(source).not.toContain("FooterList");
    expect(source).not.toContain("getMarketingFooterLinks");
    expect(source).not.toContain('href="#about"');
    expect(source).not.toContain('href="#features"');
    expect(source).not.toContain('href="#articles"');
  });

  it("keeps the copyright visible outside individual scroll reveal animation", async () => {
    const { SiteFooterContent } = await import("./site-footer");
    const html = renderToStaticMarkup(
      React.createElement(SiteFooterContent, { copy: dictionary.id }),
    );

    expect(html).toContain(dictionary.id.common.copyright);
    expect(html).not.toContain('data-scroll-reveal-group="footer-copyright"');
    expect(html).not.toMatch(/<p[^>]*data-scroll-reveal[^>]*>© 2026 MedProof<\/p>/);
  });
});
