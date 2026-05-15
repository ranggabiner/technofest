import { describe, expect, it } from "vitest";

import { normalizeKycDocumentSummaries } from "./summaries";

describe("normalizeKycDocumentSummaries", () => {
  it("returns KYC documents in STR, SIP, KTP order with missing placeholders", () => {
    expect(
      normalizeKycDocumentSummaries([
        {
          documentType: "ktp",
          documentId: "ktp-doc",
          filename: "ktp-demo.png",
          mimeType: "image/png",
          fileSizeBytes: 2048,
        },
        {
          documentType: "str",
          documentId: "str-doc",
          filename: "str-demo.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 4096,
        },
      ]),
    ).toEqual([
      {
        documentType: "str",
        documentId: "str-doc",
        filename: "str-demo.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 4096,
        uploaded: true,
      },
      {
        documentType: "sip",
        documentId: null,
        filename: null,
        mimeType: null,
        fileSizeBytes: null,
        uploaded: false,
      },
      {
        documentType: "ktp",
        documentId: "ktp-doc",
        filename: "ktp-demo.png",
        mimeType: "image/png",
        fileSizeBytes: 2048,
        uploaded: true,
      },
    ]);
  });
});
