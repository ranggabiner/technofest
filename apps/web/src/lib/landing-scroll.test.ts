import { describe, expect, it, vi } from "vitest";

import { getLandingScrollBehavior, scrollToLandingTop } from "./landing-scroll";

describe("landing scroll helpers", () => {
  it("scrolls to the top smoothly by default", () => {
    const scrollTo = vi.fn();

    scrollToLandingTop({
      matchMedia: () => ({ matches: false }),
      scrollTo,
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("uses auto behavior when reduced motion is preferred", () => {
    const scrollTo = vi.fn();

    scrollToLandingTop({
      matchMedia: () => ({ matches: true }),
      scrollTo,
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("resolves smooth behavior when matchMedia is unavailable", () => {
    expect(getLandingScrollBehavior({})).toBe("smooth");
  });
});
