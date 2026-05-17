import { describe, expect, it } from "vitest";

import {
  canDownloadAttachmentRecord,
  evaluateGrantAccess,
  scope2RowMatchesFilter,
} from "./access";

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

  it("allows attachment download only for records selected by the patient", () => {
    expect(
      canDownloadAttachmentRecord(
        {
          ...activeGrant,
          canDownloadAttachments: true,
          attachmentRecordIds: ["30000000-0000-0000-0000-000000000001"],
        },
        "30000000-0000-0000-0000-000000000001",
      ),
    ).toBe(true);
    expect(
      canDownloadAttachmentRecord(
        {
          ...activeGrant,
          canDownloadAttachments: true,
          attachmentRecordIds: ["30000000-0000-0000-0000-000000000001"],
        },
        "30000000-0000-0000-0000-000000000099",
      ),
    ).toBe(false);
  });

  it("matches Scope 2 rows against patient-selected filters", () => {
    const now = new Date("2026-05-16T10:00:00.000Z");

    expect(
      scope2RowMatchesFilter(
        {
          logDate: "2026-05-01",
          sessionId: "40000000-0000-0000-0000-000000000001",
        },
        { mode: "last_n_days", windowDays: 30, sessionId: null },
        now,
      ),
    ).toBe(true);
    expect(
      scope2RowMatchesFilter(
        {
          logDate: "2026-03-01",
          sessionId: "40000000-0000-0000-0000-000000000001",
        },
        { mode: "last_n_days", windowDays: 30, sessionId: null },
        now,
      ),
    ).toBe(false);
    expect(
      scope2RowMatchesFilter(
        {
          logDate: "2026-03-01",
          sessionId: "40000000-0000-0000-0000-000000000001",
        },
        {
          mode: "selected_session",
          windowDays: null,
          sessionId: "40000000-0000-0000-0000-000000000001",
        },
        now,
      ),
    ).toBe(true);
    expect(
      scope2RowMatchesFilter(
        {
          logDate: "2026-04-01",
          sessionId: "40000000-0000-0000-0000-000000000099",
        },
        {
          mode: "date_range",
          startDate: "2026-04-01",
          endDate: "2026-04-30",
          windowDays: null,
          sessionId: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      scope2RowMatchesFilter(
        {
          logDate: "2026-05-01",
          sessionId: "40000000-0000-0000-0000-000000000099",
        },
        {
          mode: "date_range",
          startDate: "2026-04-01",
          endDate: "2026-04-30",
          windowDays: null,
          sessionId: null,
        },
        now,
      ),
    ).toBe(false);
  });
});
