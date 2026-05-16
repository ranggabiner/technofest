import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

import { requireEnv } from "@/lib/config/env";
import { encryptBytes, encryptString, type EncryptedValue } from "@/lib/crypto/server";
import { sha256Hex } from "@/lib/crypto/hashing";
import { createAdminClient } from "@/lib/supabase/admin";

export {
  CHAT_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS,
  CHAT_ATTACHMENT_MAX_FILE_BYTES,
  isPatientChatAttachmentErrorReason,
  patientChatAttachmentErrorMessage,
  validatePatientChatAttachment,
  validatePatientChatAttachmentList,
  type PatientChatAttachmentErrorMessages,
  type PatientChatAttachmentErrorReason,
  type PatientChatAttachmentFileLike,
} from "./patient-chat-attachment-rules";

import {
  CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS,
  validatePatientChatAttachment,
} from "./patient-chat-attachment-rules";

type TesseractLanguageData = {
  code: string;
  gzip: boolean;
  langPath: string;
};

export type ParsedPatientChatAttachment = {
  text: string;
  truncated: boolean;
  method: "pdf_text" | "image_ocr";
};

export type PreparedPatientChatAttachment = {
  fileId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  fileSha256: string;
  extractedText: string;
  extractedTextTruncated: boolean;
  extractionMethod: "pdf_text" | "image_ocr";
};

export function normalizeAttachmentText(rawText: string) {
  const text = rawText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length <= CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS) {
    return { text, truncated: false };
  }

  return {
    text: text.slice(0, CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS).trimEnd(),
    truncated: true,
  };
}

export function buildAttachmentContextForAi(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  extractedTextTruncated: boolean;
}) {
  const truncatedNote = input.extractedTextTruncated
    ? "\nCatatan: teks lampiran dipotong agar tetap aman untuk konteks AI."
    : "";

  return [
    "Konteks lampiran pasien:",
    `Nama file: ${input.filename}`,
    `Tipe MIME: ${input.mimeType}`,
    `Ukuran: ${input.sizeBytes} bytes`,
    "Teks hasil ekstraksi:",
    input.extractedText,
    truncatedNote,
  ].filter(Boolean).join("\n");
}

export async function parsePatientChatAttachment(file: File): Promise<ParsedPatientChatAttachment> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const rawText = file.type === "application/pdf"
    ? await extractPdfText(bytes)
    : await extractImageText(Buffer.from(bytes));
  const normalized = normalizeAttachmentText(rawText);

  if (!normalized.text) {
    throw new Error("no_readable_text");
  }

  return {
    text: normalized.text,
    truncated: normalized.truncated,
    method: file.type === "application/pdf" ? "pdf_text" : "image_ocr",
  };
}

export async function preparePatientChatAttachment(input: {
  authUserId: string;
  patientId: string;
  file: File;
}): Promise<PreparedPatientChatAttachment> {
  const validation = validatePatientChatAttachment(input.file);
  if (!validation.ok) throw new Error(validation.reason);

  const parsed = await parsePatientChatAttachment(input.file);
  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const fileId = randomUUID();
  const originalName = encryptString(input.file.name, env.data.ENCRYPTION_MASTER_KEY);
  const plaintextBytes = Buffer.from(await input.file.arrayBuffer());
  const encrypted = encryptBytes(plaintextBytes, env.data.ENCRYPTION_MASTER_KEY);
  const storageBytes = Buffer.from(JSON.stringify(encrypted), "utf8");
  const objectPath = `${input.authUserId}/patient-chat/${input.patientId}/${fileId}.json`;
  const fileSha256 = sha256Hex(storageBytes);

  const upload = await admin.storage
    .from("encrypted-medical-attachments")
    .upload(objectPath, storageBytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });

  if (upload.error) throw new Error("upload_failed");

  const insert = await admin.from("secure_files").insert({
    file_id: fileId,
    owner_role: "patient",
    owner_id: input.patientId,
    bucket_name: "encrypted-medical-attachments",
    object_path: objectPath,
    original_filename_ciphertext: originalName.ciphertext,
    original_filename_iv: originalName.iv,
    original_filename_tag: originalName.tag,
    mime_type: input.file.type,
    file_size_bytes: storageBytes.byteLength,
    file_sha256: fileSha256,
    key_version: originalName.keyVersion,
  });

  if (insert.error) throw new Error("upload_failed");

  return {
    fileId,
    filename: input.file.name,
    mimeType: input.file.type,
    sizeBytes: input.file.size,
    fileSha256,
    extractedText: parsed.text,
    extractedTextTruncated: parsed.truncated,
    extractionMethod: parsed.method,
  };
}

export async function attachPatientChatAttachmentToMessage(input: {
  patientId: string;
  sessionId: string;
  messageId: string;
  attachment: PreparedPatientChatAttachment;
}) {
  const env = requireEnv(["core"]);
  const encryptedText: EncryptedValue = encryptString(
    input.attachment.extractedText,
    env.data.ENCRYPTION_MASTER_KEY,
  );
  const { error } = await createAdminClient().from("ai_message_attachments").insert({
    message_id: input.messageId,
    session_id: input.sessionId,
    patient_id: input.patientId,
    file_id: input.attachment.fileId,
    file_size_bytes: input.attachment.sizeBytes,
    extracted_text_ciphertext: encryptedText.ciphertext,
    extracted_text_iv: encryptedText.iv,
    extracted_text_tag: encryptedText.tag,
    extracted_text_truncated: input.attachment.extractedTextTruncated,
    extraction_method: input.attachment.extractionMethod,
    key_version: encryptedText.keyVersion,
  });

  if (error) throw new Error("upload_failed");
}

async function extractPdfText(bytes: Uint8Array) {
  const parser = new PDFParse({ data: bytes });

  try {
    const result = await parser.getText();
    return result.text;
  } catch {
    throw new Error("parse_failed");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractImageText(bytes: Buffer) {
  const require = createRequire(import.meta.url);
  const ind = require("@tesseract.js-data/ind") as TesseractLanguageData;
  const worker = await createWorker(ind.code, undefined, {
    langPath: ind.langPath,
    gzip: ind.gzip,
    logger: () => undefined,
  });

  try {
    const result = await worker.recognize(bytes);
    return result.data.text;
  } catch {
    throw new Error("parse_failed");
  } finally {
    await worker.terminate().catch(() => undefined);
  }
}
