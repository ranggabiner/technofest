import { describe, expect, it } from "vitest";

import {
  validateMentalExtractionValues,
  validatePhysicalExtractionValues,
  validateScope1RecordType,
} from "./validators";

describe("health value validators", () => {
  it("accepts only Sprint 1 Scope 1 record types", () => {
    expect(validateScope1RecordType("diagnosis")).toEqual({ ok: true, value: "diagnosis" });
    expect(validateScope1RecordType("surgery")).toEqual({
      ok: false,
      errors: ["record_type must be one of lab, xray, diagnosis, prescription, vaccine, action, note"],
    });
  });

  it("validates mental extraction ranges before encryption", () => {
    expect(
      validateMentalExtractionValues({
        moodScore: 10,
        anxietyLevel: 1,
        sleepHours: 7.5,
        isEmergencyFlagged: false,
        extractionConfidence: 0.92,
      }),
    ).toEqual({ ok: true });

    expect(
      validateMentalExtractionValues({
        moodScore: 0,
        anxietyLevel: 11,
        sleepHours: -1,
        isEmergencyFlagged: "false",
        extractionConfidence: 1.1,
      }),
    ).toEqual({
      ok: false,
      errors: [
        "mood_score must be an integer from 1 to 10",
        "anxiety_level must be an integer from 1 to 10",
        "sleep_hours must be a number from 0 to 24",
        "is_emergency_flagged must be boolean",
        "extraction_confidence must be a number from 0 to 1",
      ],
    });
  });

  it("validates physical extraction values and raw quote hash before encryption", () => {
    expect(
      validatePhysicalExtractionValues({
        severity: 6,
        isEmergencyFlagged: true,
        extractionConfidence: 0,
        rawQuoteHash: "abc123",
      }),
    ).toEqual({ ok: true });

    expect(
      validatePhysicalExtractionValues({
        severity: 12,
        isEmergencyFlagged: null,
        extractionConfidence: -0.1,
        rawQuoteHash: "",
      }),
    ).toEqual({
      ok: false,
      errors: [
        "severity must be an integer from 1 to 10",
        "is_emergency_flagged must be boolean",
        "extraction_confidence must be a number from 0 to 1",
        "raw_quote_hash is required for physical Scope 2 rows",
      ],
    });
  });
});
