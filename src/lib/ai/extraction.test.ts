import { describe, expect, it } from "vitest";

import { decryptString } from "../crypto/server";

import { buildScope2PersistencePayload } from "./extraction";

const key = Buffer.alloc(32, 8).toString("base64");

describe("Scope 2 AI extraction persistence payload", () => {
  it("encrypts extracted values and stores hashes for raw quotes", () => {
    const payload = buildScope2PersistencePayload({
      extraction: {
        summary: "Pasien tidur lebih baik, namun masih nyeri kepala ringan.",
        mental: {
          moodScore: 7,
          anxietyLevel: 3,
          sleepHours: 6.5,
          triggerNotes: "Pekerjaan menumpuk.",
          rawQuote: "Saya cemas sedikit tapi masih bisa tidur.",
          isEmergencyFlagged: false,
          extractionConfidence: 0.82,
        },
        physical: [
          {
            symptomType: "sakit kepala",
            severity: 4,
            bodyLocation: "kepala",
            durationNote: "sejak pagi",
            rawQuote: "Kepala saya nyeri sejak pagi.",
            isEmergencyFlagged: false,
            extractionConfidence: 0.76,
          },
        ],
      },
      patientId: "patient-1",
      sessionId: "session-1",
      encryptionKey: key,
      model: "deepseek-v4-flash",
      now: new Date("2026-05-15T08:00:00.000Z"),
    });

    expect(payload.sessionSummary.summary_text_ciphertext).not.toContain("tidur");
    expect(decryptString(payload.sessionSummary, key)).toBe(
      "Pasien tidur lebih baik, namun masih nyeri kepala ringan.",
    );

    expect(payload.mentalRow?.raw_quote_hash).toHaveLength(64);
    expect(payload.mentalRow?.raw_quote_ciphertext).not.toContain("cemas");
    expect(payload.physicalRows).toHaveLength(1);
    expect(payload.physicalRows[0].raw_quote_hash).toHaveLength(64);
    expect(payload.physicalRows[0].symptom_type_ciphertext).not.toContain("sakit kepala");
  });

  it("rejects invalid model values before encryption", () => {
    expect(() =>
      buildScope2PersistencePayload({
        extraction: {
          summary: "Ringkasan",
          mental: {
            moodScore: 11,
            anxietyLevel: null,
            sleepHours: null,
            triggerNotes: null,
            rawQuote: "Saya baik.",
            isEmergencyFlagged: false,
            extractionConfidence: 0.5,
          },
          physical: [
            {
              symptomType: "nyeri",
              severity: 4,
              bodyLocation: null,
              durationNote: null,
              rawQuote: "",
              isEmergencyFlagged: false,
              extractionConfidence: 0.5,
            },
          ],
        },
        patientId: "patient-1",
        sessionId: "session-1",
        encryptionKey: key,
        model: "deepseek-v4-flash",
        now: new Date("2026-05-15T08:00:00.000Z"),
      }),
    ).toThrow("mood_score must be an integer from 1 to 10");
  });
});
