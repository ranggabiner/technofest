import { describe, expect, it } from "vitest";

import { createDoctorAccessCode, createQrCodeToken } from "./codes";

describe("doctor code helpers", () => {
  it("creates a six digit access code", () => {
    expect(createDoctorAccessCode()).toMatch(/^[0-9]{6}$/);
  });

  it("creates opaque QR tokens", () => {
    expect(createQrCodeToken()).toMatch(/^dqr_[A-Za-z0-9_-]{32,}$/);
  });
});
