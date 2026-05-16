import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("doctor document upload form", () => {
  const source = readFileSync(
    new URL("./step-2/doctor-document-upload-form.tsx", import.meta.url),
    "utf8",
  );

  it("keeps every upload state inside one fixed-size surface", () => {
    expect(source).toContain('data-upload-surface="doctor-kyc-document"');
    expect(source).toContain("h-[140px]");
    expect(source).not.toContain("min-h-[140px]");
    expect(source).not.toContain("<KycDocumentPreview");
  });
});
