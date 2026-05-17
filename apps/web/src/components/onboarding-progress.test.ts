import { describe, expect, it } from "vitest";

import { getOnboardingProgressItems } from "./onboarding-progress";

describe("getOnboardingProgressItems", () => {
  const steps = ["Step 1", "Step 2", "Tinjauan"] as const;

  it("uses the Step 3 timeline state model across onboarding steps", () => {
    expect(getOnboardingProgressItems(steps, 2)).toEqual([
      { number: 1, label: "Step 1", status: "complete" },
      { number: 2, label: "Step 2", status: "active" },
      { number: 3, label: "Tinjauan", status: "upcoming" },
    ]);
  });
});
