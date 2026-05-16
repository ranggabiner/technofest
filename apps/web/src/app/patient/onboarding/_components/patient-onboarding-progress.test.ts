import { describe, expect, it } from "vitest";

import { getPatientOnboardingProgressItems } from "./patient-onboarding-progress";

describe("getPatientOnboardingProgressItems", () => {
  const steps = ["Data Diri", "Keseharian", "Selesai"] as const;

  it("marks prior steps complete, current step active, and later steps upcoming", () => {
    expect(getPatientOnboardingProgressItems(steps, 2)).toEqual([
      { number: 1, label: "Data Diri", status: "complete" },
      { number: 2, label: "Keseharian", status: "active" },
      { number: 3, label: "Selesai", status: "upcoming" },
    ]);
  });

  it("keeps the final step active when the patient is confirming onboarding", () => {
    expect(getPatientOnboardingProgressItems(steps, 3)).toEqual([
      { number: 1, label: "Data Diri", status: "complete" },
      { number: 2, label: "Keseharian", status: "complete" },
      { number: 3, label: "Selesai", status: "active" },
    ]);
  });
});
