import { describe, expect, it } from "vitest";

import {
  buildGranularScopeHash,
  parseScope2DateRangeFilter,
  normalizeGranularGrantInput,
  parseScope2FilterValue,
} from "./granular-grants";

const recordA = "30000000-0000-0000-0000-000000000001";
const recordB = "30000000-0000-0000-0000-000000000002";
const sessionA = "40000000-0000-0000-0000-000000000001";

describe("granular access grant selection", () => {
  it("parses supported Scope 2 filter form values", () => {
    expect(parseScope2FilterValue("last_n_days:90")).toEqual({
      mode: "last_n_days",
      windowDays: 90,
      sessionId: null,
    });
    expect(parseScope2FilterValue(`selected_session:${sessionA}`)).toEqual({
      mode: "selected_session",
      windowDays: null,
      sessionId: sessionA,
    });
    expect(parseScope2FilterValue("")).toBeNull();
    expect(parseScope2FilterValue("last_n_days:0")).toBeNull();
  });

  it("parses custom Scope 2 date ranges", () => {
    expect(parseScope2DateRangeFilter("2026-02-01", "2026-05-17")).toEqual({
      mode: "date_range",
      startDate: "2026-02-01",
      endDate: "2026-05-17",
      windowDays: null,
      sessionId: null,
    });

    expect(parseScope2DateRangeFilter("2026-05-18", "2026-05-17")).toBeNull();
    expect(parseScope2DateRangeFilter("", "2026-05-17")).toBeNull();
    expect(parseScope2DateRangeFilter("2026-02-01", "")).toBeNull();
  });

  it("normalizes duplicate record selections and derives attachment download scope", () => {
    expect(
      normalizeGranularGrantInput({
        canViewScope1: true,
        canViewScope2Mental: true,
        canViewScope2Physical: false,
        attachmentRecordIds: [recordB, recordA, recordA, "not-a-uuid"],
        scope2MentalFilter: parseScope2FilterValue("last_n_days:90"),
        scope2PhysicalFilter: parseScope2FilterValue(`selected_session:${sessionA}`),
      }),
    ).toEqual({
      canViewScope1: true,
      canViewScope2Mental: true,
      canViewScope2Physical: false,
      canDownloadAttachments: true,
      attachmentRecordIds: [recordA, recordB],
      scope2MentalFilter: {
        mode: "last_n_days",
        windowDays: 90,
        sessionId: null,
      },
      scope2PhysicalFilter: null,
    });
  });

  it("builds deterministic privacy-preserving granular proof fragments", () => {
    const first = buildGranularScopeHash({
      pepper: "test-pepper-with-enough-length",
      attachmentRecordIds: [recordB, recordA],
      scope2MentalFilter: parseScope2FilterValue("last_n_days:90"),
      scope2PhysicalFilter: parseScope2FilterValue(`selected_session:${sessionA}`),
    });
    const second = buildGranularScopeHash({
      pepper: "test-pepper-with-enough-length",
      attachmentRecordIds: [recordA, recordB],
      scope2MentalFilter: parseScope2FilterValue("last_n_days:90"),
      scope2PhysicalFilter: parseScope2FilterValue(`selected_session:${sessionA}`),
    });

    expect(first.hash).toBe(second.hash);
    expect(first.hash).toHaveLength(64);
    expect(first.canonicalPayload).not.toContain(recordA);
    expect(first.canonicalPayload).not.toContain(recordB);
    expect(first.canonicalPayload).not.toContain(sessionA);
    expect(first.canonicalPayload).toContain("attachment_record_hashes");
  });
});
