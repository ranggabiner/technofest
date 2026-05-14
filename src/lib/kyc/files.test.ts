import { describe, expect, it } from "vitest";

import { validateKycFile } from "./files";

describe("KYC file validation", () => {
  it("accepts PDF/JPG/PNG up to 10MB", () => {
    expect(validateKycFile({ name: "str.pdf", type: "application/pdf", size: 10 * 1024 * 1024 }).ok).toBe(
      true,
    );
    expect(validateKycFile({ name: "ktp.jpg", type: "image/jpeg", size: 1024 }).ok).toBe(true);
    expect(validateKycFile({ name: "sip.png", type: "image/png", size: 1024 }).ok).toBe(true);
  });

  it("rejects unsupported or oversized files", () => {
    expect(validateKycFile({ name: "str.txt", type: "text/plain", size: 1024 }).ok).toBe(false);
    expect(validateKycFile({ name: "ktp.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 }).ok).toBe(
      false,
    );
  });
});
