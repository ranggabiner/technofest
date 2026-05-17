import { describe, expect, it } from "vitest";

import { formatFileSize, getFileTypeLabel, getKycDocumentPreviewUrl, getKycPreviewKind } from "./preview";

describe("KYC preview helpers", () => {
  it("classifies image and PDF files for direct previews", () => {
    expect(getKycPreviewKind("image/png")).toBe("image");
    expect(getKycPreviewKind("image/jpeg")).toBe("image");
    expect(getKycPreviewKind("application/pdf")).toBe("pdf");
  });

  it("uses a fallback preview for unsupported or missing MIME types", () => {
    expect(getKycPreviewKind("text/plain")).toBe("fallback");
    expect(getKycPreviewKind(null)).toBe("fallback");
  });

  it("formats persisted file sizes for metadata display", () => {
    expect(formatFileSize(null)).toBe("-");
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("uses MIME type or filename extension as file type metadata", () => {
    expect(getFileTypeLabel("application/pdf", "str.pdf")).toBe("PDF");
    expect(getFileTypeLabel("image/jpeg", "ktp.jpg")).toBe("JPG");
    expect(getFileTypeLabel(null, "scan.png")).toBe("PNG");
    expect(getFileTypeLabel(null, null)).toBe("-");
  });

  it("builds preview URLs from both document id and latest file id", () => {
    expect(getKycDocumentPreviewUrl({ documentId: null, fileId: null })).toBeNull();
    expect(getKycDocumentPreviewUrl({ documentId: "doc-1", fileId: null })).toBeNull();
    expect(getKycDocumentPreviewUrl({ documentId: "doc-1", fileId: "file-v2" })).toBe(
      "/doctor/onboarding/documents/doc-1?v=file-v2",
    );
  });
});
