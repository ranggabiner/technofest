import { describe, expect, it } from "vitest";

import { evaluateGrantAccess } from "./access";

const activeGrant = {
  isRevoked: false,
  expiresAt: "2026-05-20T10:00:00.000Z",
  canViewScope1: true,
  canViewScope2Mental: false,
  canViewScope2Physical: true,
  canDownloadAttachments: false,
};

describe("doctor grant access evaluation", () => {
  it("allows active grants for requested granted scope", () => {
    expect(
      evaluateGrantAccess(activeGrant, "scope1", new Date("2026-05-16T10:00:00.000Z")),
    ).toEqual({ allowed: true });
  });

  it("denies expired, revoked, and missing-scope grants", () => {
    expect(
      evaluateGrantAccess({ ...activeGrant, expiresAt: "2026-05-15T09:00:00.000Z" }, "scope1", new Date("2026-05-15T10:00:00.000Z")),
    ).toEqual({ allowed: false, reason: "expired" });
    expect(
      evaluateGrantAccess({ ...activeGrant, isRevoked: true }, "scope1", new Date("2026-05-15T10:00:00.000Z")),
    ).toEqual({ allowed: false, reason: "revoked" });
    expect(
      evaluateGrantAccess(activeGrant, "scope2_mental", new Date("2026-05-15T10:00:00.000Z")),
    ).toEqual({ allowed: false, reason: "missing_scope" });
  });
});
