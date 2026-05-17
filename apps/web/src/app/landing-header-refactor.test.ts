import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("landing header refactor", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const footerSource = readFileSync(new URL("../components/site-footer.tsx", import.meta.url), "utf8");

  it("uses the shared header instead of a local landing header duplicate", () => {
    expect(source).toContain('import { SharedHeader } from "@/components/shared-header";');
    expect(source).toContain("<SharedHeader");
    expect(source).toContain('brandAction="scroll-top"');
    expect(source).toContain("navigationItems={landing.nav}");
    expect(source).toContain('primaryAction={{ href: "/login", label: copy.marketing.loginCta }}');
    expect(source).not.toContain("showLanguageSwitcher={false}");
    expect(source).not.toContain("showThemeToggle={false}");
    expect(source).not.toContain("function LandingHeader");
  });

  it("uses scroll-to-top brand controls through shared header and footer components", () => {
    expect(source).toContain('import { SiteFooter } from "@/components/site-footer";');
    expect(source).toContain("<SiteFooter");
    expect(footerSource).toContain("scrollToTopLabel={copy.common.scrollToTop}");
    expect(source).not.toContain('<Link href="/" className="flex cursor-pointer items-center gap-2"');
  });

  it("does not render removed landing testimonials or contact sections", () => {
    expect(source).not.toContain("<TestimonialSection");
    expect(source).not.toContain("<ContactSection");
    expect(source).not.toContain("function TestimonialSection");
    expect(source).not.toContain("function ContactSection");
    expect(source).not.toContain("LandingTestimonialsCarousel");
    expect(source).not.toContain('href="#testimonials"');
    expect(source).not.toContain('href="#contact"');
  });

  it("uses existing theme tokens instead of light-only landing colors", () => {
    expect(source).toContain("bg-[var(--color-warm-canvas)]");
    expect(source).toContain("text-[var(--color-midnight)]");
    expect(source).toContain("bg-[var(--color-card)]");
    expect(source).toContain("border-[var(--color-stone-surface)]");
    expect(source).toContain("color-mix(in_srgb,var(--color-teal-primary)");

    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("border-white");
    expect(source).not.toContain("rgba(");
    expect(source).not.toContain("brightness-0 invert");
  });
});
