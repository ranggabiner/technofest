import { beforeEach, describe, expect, it, vi } from "vitest";

const testKey = Buffer.alloc(32, 7).toString("base64");

const mocks = vi.hoisted(() => ({
  queryResult: {
    data: [] as unknown[],
    error: null as unknown,
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/config/env", () => ({
  requireEnv: () => ({
    data: {
      ENCRYPTION_MASTER_KEY: testKey,
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const query = {
        select: () => query,
        eq: () => Promise.resolve(mocks.queryResult),
      };
      return query;
    },
  }),
}));

import { loadKycDocumentSummaries } from "./service";

describe("loadKycDocumentSummaries", () => {
  beforeEach(() => {
    mocks.queryResult = { data: [], error: null };
    vi.restoreAllMocks();
  });

  it("keeps uploaded KYC documents visible when legacy filename metadata cannot decrypt", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.queryResult = {
      error: null,
      data: [
        {
          document_id: "str-doc",
          document_type: "str",
          secure_files: {
            file_id: "str-file",
            original_filename_ciphertext: Buffer.from("not-valid-gcm").toString("base64"),
            original_filename_iv: Buffer.alloc(12, 1).toString("base64"),
            original_filename_tag: Buffer.alloc(16, 2).toString("base64"),
            mime_type: "application/pdf",
            file_size_bytes: 585,
            key_version: "v1",
          },
        },
      ],
    };

    await expect(loadKycDocumentSummaries("doctor-1")).resolves.toMatchObject([
      {
        documentType: "str",
        documentId: "str-doc",
        fileId: "str-file",
        filename: null,
        mimeType: "application/pdf",
        fileSizeBytes: 585,
        uploaded: true,
      },
      {
        documentType: "sip",
        uploaded: false,
      },
      {
        documentType: "ktp",
        uploaded: false,
      },
    ]);
    expect(warn).toHaveBeenCalledWith(
      "KYC filename metadata could not be decrypted",
      expect.objectContaining({
        doctorId: "doctor-1",
        documentType: "str",
        fileId: "str-file",
      }),
    );
  });
});
