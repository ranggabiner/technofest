import { describe, expect, it } from "vitest";

import { DOCTOR_RAG_DISCLAIMER, buildDoctorRagPrompt, selectAuthorizedRagRows } from "./rag";

const mentalRow = {
  category: "mental" as const,
  logDate: "2026-05-15",
  rawQuote: "Saya cemas dan tidur empat jam.",
  emergencyFlagged: false,
  provenance: "session-a",
  details: ["mood: 4"],
};

const physicalRow = {
  category: "physical" as const,
  logDate: "2026-05-15",
  rawQuote: "Sakit kepala sejak pagi.",
  emergencyFlagged: false,
  provenance: "session-b",
  details: ["severity: 3"],
};

describe("Doctor RAG helpers", () => {
  it("selects only authorized Scope 2 categories", () => {
    expect(
      selectAuthorizedRagRows([mentalRow], [physicalRow], {
        canViewScope2Mental: true,
        canViewScope2Physical: false,
      }),
    ).toEqual([mentalRow]);
  });

  it("builds Indonesian prompt with disclaimer and without Scope 1 context", () => {
    const prompt = buildDoctorRagPrompt({
      question: "Apa konteks utama pasien?",
      rows: [mentalRow, physicalRow],
    });

    expect(prompt).toContain(DOCTOR_RAG_DISCLAIMER);
    expect(prompt).toContain("Saya cemas");
    expect(prompt).not.toContain("Scope 1");
    expect(prompt).not.toContain("diagnosis pasien");
  });
});
