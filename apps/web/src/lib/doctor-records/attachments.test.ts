import { describe, expect, it } from "vitest";

import { validateMedicalAttachmentFile } from "./attachments";

describe("medical attachment validation", () => {
  it("accepts PDF/JPG/PNG files up to 10MB", () => {
    expect(validateMedicalAttachmentFile({ name: "lab.pdf", type: "application/pdf", size: 10 * 1024 * 1024 }).ok).toBe(true);
    expect(validateMedicalAttachmentFile({ name: "scan.jpg", type: "image/jpeg", size: 1024 }).ok).toBe(true);
    expect(validateMedicalAttachmentFile({ name: "xray.png", type: "image/png", size: 1024 }).ok).toBe(true);
  });

  it("rejects empty, unsupported, or oversized files", () => {
    expect(validateMedicalAttachmentFile({ name: "empty.pdf", type: "application/pdf", size: 0 })).toEqual({
      ok: false,
      reason: "empty_file",
    });
    expect(validateMedicalAttachmentFile({ name: "notes.txt", type: "text/plain", size: 1024 })).toEqual({
      ok: false,
      reason: "unsupported_type",
    });
    expect(validateMedicalAttachmentFile({ name: "large.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 })).toEqual({
      ok: false,
      reason: "file_too_large",
    });
  });
});
