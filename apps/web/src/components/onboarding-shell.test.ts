import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("OnboardingShell header", () => {
  it("does not render the non-logout onboarding exit action", () => {
    const source = readFileSync(new URL("./onboarding-shell.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("contextAction");
    expect(source).not.toContain("exitHref");
    expect(source).not.toContain("exitLabel");
  });
});
