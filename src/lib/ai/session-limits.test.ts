import { describe, expect, it } from "vitest";

import { assertCanSendPatientMessage, MAX_PATIENT_MESSAGES_PER_SESSION } from "./session-limits";

describe("AI session message limits", () => {
  it("allows the fifth patient chat message in a manual DeepSeek test session", () => {
    expect(() => assertCanSendPatientMessage(MAX_PATIENT_MESSAGES_PER_SESSION - 1)).not.toThrow();
  });

  it("blocks patient chat messages after the configured manual DeepSeek limit", () => {
    expect(() => assertCanSendPatientMessage(MAX_PATIENT_MESSAGES_PER_SESSION)).toThrow(
      "Sesi uji AI dibatasi 5 pesan pasien",
    );
  });
});
