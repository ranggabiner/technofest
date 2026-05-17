import { describe, expect, it } from "vitest";

import { kycUploadErrorMessage, type KycUploadErrorMessages } from "./upload-errors";

const messages: KycUploadErrorMessages = {
  empty_file: "File upload failed because the file is empty. Please choose another file.",
  file_too_large: "File upload failed because the file size exceeds the 5 MB limit. Please upload a smaller file.",
  unsupported_type: "File upload failed because this file type is not supported. Please upload a valid file format.",
  network: "File upload failed due to a network issue. Please check your connection and try again.",
  server: "File upload failed because the upload service returned an error. Please try again in a moment.",
  unknown: "File upload failed for an unexpected reason. Please try again or choose a different file.",
};

describe("KYC upload error messages", () => {
  it("maps validation failures to reason-based messages", () => {
    expect(kycUploadErrorMessage(new Error("file_too_large"), messages)).toBe(messages.file_too_large);
    expect(kycUploadErrorMessage(new Error("unsupported_type"), messages)).toBe(messages.unsupported_type);
    expect(kycUploadErrorMessage(new Error("empty_file"), messages)).toBe(messages.empty_file);
  });

  it("maps browser and connection failures to network guidance", () => {
    expect(kycUploadErrorMessage(new TypeError("Failed to fetch"), messages, "client")).toBe(messages.network);
    expect(kycUploadErrorMessage(new Error("ECONNRESET while uploading"), messages)).toBe(messages.network);
  });

  it("maps Supabase/API failures separately from unknown thrown values", () => {
    expect(kycUploadErrorMessage({ message: "Bucket not found", statusCode: 500 }, messages)).toBe(messages.server);
    expect(kycUploadErrorMessage(null, messages)).toBe(messages.unknown);
  });
});
