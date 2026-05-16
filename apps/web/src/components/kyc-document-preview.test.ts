import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  KycDocumentCompactPreview,
  kycDocumentCompactPreviewSurfaceClassName,
} from "./kyc-document-preview";

const labels = {
  fileName: "Nama file",
  fileType: "Jenis file",
  fileSize: "Ukuran file",
  uploadStatus: "Status unggah",
  uploadSuccess: "Berhasil diunggah",
  previewUnavailable: "Pratinjau tidak tersedia.",
  pdfFallback: "Pratinjau PDF tidak tersedia di browser ini.",
};

const longDocument = {
  documentType: "str" as const,
  documentId: "document-1",
  fileId: "file-1",
  filename: "surat-tanda-registrasi-dokter-dengan-nama-file-yang-sangat-panjang.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 1_024_000,
  uploaded: true,
};

describe("KYC document compact preview", () => {
  it("keeps the shared compact preview surface fixed to the Step 2 dimensions", () => {
    expect(kycDocumentCompactPreviewSurfaceClassName).toContain("h-[140px]");
    expect(kycDocumentCompactPreviewSurfaceClassName).toContain("w-full");
    expect(kycDocumentCompactPreviewSurfaceClassName).toContain("overflow-hidden");
    expect(kycDocumentCompactPreviewSurfaceClassName).toContain("rounded-lg");
    expect(kycDocumentCompactPreviewSurfaceClassName).not.toContain("min-h-[140px]");
    expect(kycDocumentCompactPreviewSurfaceClassName).not.toContain("min-h-[240px]");
    expect(kycDocumentCompactPreviewSurfaceClassName).not.toContain("h-[420px]");
  });

  it("renders file metadata inside truncating content that cannot resize the surface", () => {
    const html = renderToStaticMarkup(
      React.createElement(KycDocumentCompactPreview, {
        document: longDocument,
        title: "STR",
        previewUrl: "/doctor/onboarding/documents/document-1",
        labels,
      }),
    );

    expect(html).toContain('data-kyc-preview="compact"');
    expect(html).toContain("h-[140px]");
    expect(html).toContain("grid-cols-[minmax(88px,42%)_minmax(0,1fr)]");
    expect(html).toContain("p-3");
    expect(html).toContain("truncate");
    expect(html).not.toContain("min-h-[240px]");
    expect(html).not.toContain("h-[420px]");
  });
});
