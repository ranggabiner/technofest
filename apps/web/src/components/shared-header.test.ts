import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { MEDPROOF_LOGO_SRC, resolveSharedHeaderAction } from "./shared-header";

describe("shared header state", () => {
  const source = readFileSync(new URL("./shared-header.tsx", import.meta.url), "utf8");

  it("uses the landing MedProof logo asset as the shared header default", () => {
    expect(MEDPROOF_LOGO_SRC).toBe("/assets/landing/logo.webp");
  });

  it("keeps the landing header shell as the shared base implementation", () => {
    expect(source).toContain(
      "fixed inset-x-0 top-0 z-50 border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-warm-canvas)_90%,transparent)] shadow-[0_1px_10px_color-mix(in_srgb,var(--color-midnight)_4%,transparent)] backdrop-blur-md",
    );
    expect(source).toContain("mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6");
    expect(source).toContain("hidden items-center gap-6 lg:flex");
    expect(source).toContain("<details");
    expect(source).toContain("landing.mobileMenuLabel");
  });

  it("keeps mobile header controls and menu viewport-safe", () => {
    expect(source).toContain("h-8 w-auto object-contain sm:h-10");
    expect(source).toContain("text-xl font-semibold leading-none tracking-tight sm:text-2xl");
    expect(source).toContain("flex shrink-0 items-center gap-1.5 sm:gap-2");
    expect(source).toContain("w-[min(calc(100vw-2rem),18rem)] rounded-2xl");
    expect(source).toContain("motion.menuTrigger");
    expect(source).toContain("motion.menuPanel");
    expect(source).toContain("motion.navLink");
  });

  it("uses theme tokens instead of light-only header colors", () => {
    expect(source).toContain("bg-[var(--color-card)]");
    expect(source).toContain("text-[var(--color-midnight)]");
    expect(source).toContain("text-[var(--color-graphite)]");
    expect(source).toContain("border-[var(--color-stone-surface)]");
    expect(source).toContain("bg-[var(--color-teal-surface)]");
    expect(source).toContain("text-[var(--color-teal-deep)]");

    for (const lightOnlyClass of [
      "#faf9f8",
      "#f2f0ed",
      "#474645",
      "#121212",
      "#0bb8a9",
      "#099a8e",
      "#e6f8f6",
      "bg-white",
      "text-white",
    ]) {
      expect(source).not.toContain(lightOnlyClass);
    }
  });

  it("keeps page-specific content configurable through props", () => {
    expect(source).toContain("navigationItems");
    expect(source).toContain("primaryAction");
    expect(source).toContain("contextAction");
    expect(source).toContain('brandAction?: "home" | "scroll-top";');
    expect(source).toContain("showLanguageSwitcher");
    expect(source).toContain("showThemeToggle");
  });

  it("supports a landing-only brand scroll-to-top action without changing default home navigation", () => {
    expect(source).toContain('brandAction = "home"');
    expect(source).toContain("<BrandScrollTopButton");
    expect(source).toContain("scrollToTopLabel={copy.common.scrollToTop}");
    expect(source).toContain('href="/"');
    expect(source).toContain("aria-label={copy.common.brand}");
  });

  it("shows public actions for unauthenticated context", () => {
    expect(resolveSharedHeaderAction({ authMode: "auto", isAuthenticated: false })).toBe("login");
  });

  it("shows logout for authenticated context", () => {
    expect(resolveSharedHeaderAction({ authMode: "auto", isAuthenticated: true })).toBe("logout");
  });

  it("lets page context force public or authenticated actions", () => {
    expect(resolveSharedHeaderAction({ authMode: "public", isAuthenticated: true })).toBe("login");
    expect(resolveSharedHeaderAction({ authMode: "authenticated", isAuthenticated: false })).toBe("logout");
  });

  it("allows authenticated pages to hide the header auth action without changing default behavior", () => {
    expect(source).toContain("showAuthAction = true");
    expect(source).toContain("showAuthAction && action === \"logout\"");
  });

  it("does not render a saved authenticated profile photo in the navbar", () => {
    expect(source).not.toContain("ProfileAvatar");
    expect(source).not.toContain("userAvatarUrl");
    expect(source).not.toContain("userName");
  });

  it("renders logout through the shared async button with the original teal tone", () => {
    expect(source).toContain("<PendingSubmitButton");
    expect(source).toContain("loadingLabel={copy.common.logout}");
    expect(source).toContain("bg-[var(--color-teal-deep)]");
    expect(source).toContain("hover:bg-[var(--color-teal-primary)]");
  });
});
