import { describe, expect, it } from "vitest";

import {
  DOCTOR_ACCESS_CODE_MAX_LENGTH,
  mergeDoctorAccessCodeInput,
  normalizeDoctorAccessCodeInput,
} from "./doctor-code-input";

describe("doctor code input helpers", () => {
  it("keeps only the first six digits", () => {
    expect(DOCTOR_ACCESS_CODE_MAX_LENGTH).toBe(6);
    expect(normalizeDoctorAccessCodeInput("12a3-4567")).toBe("123456");
    expect(normalizeDoctorAccessCodeInput("abc987654")).toBe("987654");
  });

  it("sanitizes pasted text into the current selection", () => {
    expect(
      mergeDoctorAccessCodeInput({
        currentValue: "123456",
        insertedValue: "ab90c",
        selectionStart: 2,
        selectionEnd: 5,
      }),
    ).toBe("12906");
  });

  it("truncates merged pasted text to six digits", () => {
    expect(
      mergeDoctorAccessCodeInput({
        currentValue: "12",
        insertedValue: "34x56789",
        selectionStart: 2,
        selectionEnd: 2,
      }),
    ).toBe("123456");
  });

  it("only displays manual doctor codes, not QR payloads", async () => {
    const { doctorAccessCodeDisplayValue } = await import("./doctor-code-input");

    expect(doctorAccessCodeDisplayValue("123 456")).toBe("123456");
    expect(doctorAccessCodeDisplayValue("medproof://doctor/dqr_token123")).toBe("");
  });
});
