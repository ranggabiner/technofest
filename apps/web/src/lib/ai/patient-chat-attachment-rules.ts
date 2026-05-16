import {
  MEDICAL_ATTACHMENT_MAX_FILE_BYTES,
  type MedicalAttachmentFileLike,
  type MedicalAttachmentValidation,
  validateMedicalAttachmentFile,
} from "@/lib/doctor-records/attachments";

export const CHAT_ATTACHMENT_MAX_FILE_BYTES = MEDICAL_ATTACHMENT_MAX_FILE_BYTES;
export const CHAT_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS = 8000;
export const CHAT_ATTACHMENT_ACCEPT = "application/pdf,image/jpeg,image/png";

export type PatientChatAttachmentFileLike = MedicalAttachmentFileLike;

export type PatientChatAttachmentValidation =
  | MedicalAttachmentValidation
  | { ok: false; reason: "multiple_files" };

export type PatientChatAttachmentErrorReason =
  Exclude<PatientChatAttachmentValidation, { ok: true }>["reason"]
  | "no_readable_text"
  | "parse_failed"
  | "upload_failed";

export type PatientChatAttachmentErrorMessages = Record<PatientChatAttachmentErrorReason, string>;

const patientChatAttachmentErrorReasons = new Set<PatientChatAttachmentErrorReason>([
  "empty_file",
  "file_too_large",
  "multiple_files",
  "no_readable_text",
  "parse_failed",
  "unsupported_type",
  "upload_failed",
]);

export function validatePatientChatAttachment(
  file: PatientChatAttachmentFileLike,
): PatientChatAttachmentValidation {
  return validateMedicalAttachmentFile(file);
}

export function validatePatientChatAttachmentList(
  files: FileList | File[],
): { ok: true; file: File } | { ok: false; reason: PatientChatAttachmentErrorReason } {
  const fileArray = Array.from(files);
  if (fileArray.length > 1) return { ok: false, reason: "multiple_files" };

  const file = fileArray[0];
  if (!file) return { ok: false, reason: "empty_file" };

  const validation = validatePatientChatAttachment(file);
  if (!validation.ok) return validation;

  return { ok: true, file };
}

export function patientChatAttachmentErrorMessage(
  reason: PatientChatAttachmentErrorReason,
  messages: PatientChatAttachmentErrorMessages,
) {
  return messages[reason];
}

export function isPatientChatAttachmentErrorReason(
  value: unknown,
): value is PatientChatAttachmentErrorReason {
  return typeof value === "string" && patientChatAttachmentErrorReasons.has(value as PatientChatAttachmentErrorReason);
}
