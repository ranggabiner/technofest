import { describe, expect, it } from "vitest";

import { getDoctorAccessDisplayStatus } from "./display-status";

describe("doctor access display status", () => {
  const now = new Date("2026-05-15T12:00:00.000Z");

  it("marks an active unexpired grant as currently viewed", () => {
    expect(
      getDoctorAccessDisplayStatus(
        {
          expiresAt: "2026-05-15T12:30:00.000Z",
          isRevoked: false,
          replacedByGrantId: null,
        },
        now,
      ),
    ).toBe("ongoing");
  });

  it("marks a revoked grant as completed", () => {
    expect(
      getDoctorAccessDisplayStatus(
        {
          expiresAt: "2026-05-15T12:30:00.000Z",
          isRevoked: true,
          replacedByGrantId: null,
        },
        now,
      ),
    ).toBe("completed");
  });

  it("marks a replaced grant as completed", () => {
    expect(
      getDoctorAccessDisplayStatus(
        {
          expiresAt: "2026-05-15T12:30:00.000Z",
          isRevoked: false,
          replacedByGrantId: "80000000-0000-0000-0000-000000000099",
        },
        now,
      ),
    ).toBe("completed");
  });

  it("marks an expired grant as completed", () => {
    expect(
      getDoctorAccessDisplayStatus(
        {
          expiresAt: "2026-05-15T11:59:59.000Z",
          isRevoked: false,
          replacedByGrantId: null,
        },
        now,
      ),
    ).toBe("completed");
  });
});
