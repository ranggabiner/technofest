import { describe, expect, it } from "vitest";

import {
  CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS,
  buildAttachmentContextForAi,
  normalizeAttachmentText,
  patientChatAttachmentErrorMessage,
  validatePatientChatAttachment,
} from "./patient-chat-attachments";

const messages = {
  empty_file: "File kosong.",
  file_too_large: "File terlalu besar.",
  unsupported_type: "Tipe file tidak didukung.",
  multiple_files: "Pilih satu file.",
  no_readable_text: "Tidak ada teks terbaca.",
  parse_failed: "Ekstraksi gagal.",
  upload_failed: "Upload gagal detail.",
};

describe("patient chat attachment handling", () => {
  it("reuses medical attachment limits for patient chat files", () => {
    expect(validatePatientChatAttachment({ name: "hasil.pdf", type: "application/pdf", size: 10 * 1024 * 1024 }).ok).toBe(true);
    expect(validatePatientChatAttachment({ name: "foto.jpg", type: "image/jpeg", size: 1024 }).ok).toBe(true);
    expect(validatePatientChatAttachment({ name: "scan.png", type: "image/png", size: 1024 }).ok).toBe(true);
  });

  it("returns specific validation reasons for invalid files", () => {
    expect(validatePatientChatAttachment({ name: "kosong.pdf", type: "application/pdf", size: 0 })).toEqual({
      ok: false,
      reason: "empty_file",
    });
    expect(validatePatientChatAttachment({ name: "catatan.txt", type: "text/plain", size: 512 })).toEqual({
      ok: false,
      reason: "unsupported_type",
    });
    expect(validatePatientChatAttachment({ name: "besar.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 })).toEqual({
      ok: false,
      reason: "file_too_large",
    });
  });

  it("normalizes and caps extracted text before it reaches AI context", () => {
    const oversized = `  baris pertama\n\n${"x".repeat(CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS + 20)}  `;
    const normalized = normalizeAttachmentText(oversized);

    expect(normalized.text).toHaveLength(CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS);
    expect(normalized.truncated).toBe(true);
    expect(normalized.text).toContain("baris pertama");
    expect(normalized.text).not.toMatch(/\n\n\n/);
  });

  it("builds bounded attachment context for AI without exposing raw file bytes", () => {
    const context = buildAttachmentContextForAi({
      filename: "hasil-lab.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1536,
      extractedText: "Hemoglobin 13 g/dL",
      extractedTextTruncated: false,
    });

    expect(context).toContain("hasil-lab.pdf");
    expect(context).toContain("application/pdf");
    expect(context).toContain("1536 bytes");
    expect(context).toContain("Hemoglobin 13 g/dL");
    expect(context).not.toContain("base64");
  });

  it("maps attachment errors to localized specific messages", () => {
    expect(patientChatAttachmentErrorMessage("unsupported_type", messages)).toBe(messages.unsupported_type);
    expect(patientChatAttachmentErrorMessage("file_too_large", messages)).toBe(messages.file_too_large);
    expect(patientChatAttachmentErrorMessage("upload_failed", messages)).toBe(messages.upload_failed);
  });
});
