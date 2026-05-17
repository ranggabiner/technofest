export const MEDICAL_ATTACHMENT_MAX_FILE_BYTES = 10 * 1024 * 1024;

const allowedMedicalAttachmentMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export type MedicalAttachmentFileLike = {
  name: string;
  type: string;
  size: number;
};

export type MedicalAttachmentValidation =
  | { ok: true }
  | { ok: false; reason: "unsupported_type" | "file_too_large" | "empty_file" };

export function validateMedicalAttachmentFile(
  file: MedicalAttachmentFileLike,
): MedicalAttachmentValidation {
  if (file.size <= 0) return { ok: false, reason: "empty_file" };
  if (file.size > MEDICAL_ATTACHMENT_MAX_FILE_BYTES) {
    return { ok: false, reason: "file_too_large" };
  }
  if (!allowedMedicalAttachmentMimeTypes.has(file.type)) {
    return { ok: false, reason: "unsupported_type" };
  }
  return { ok: true };
}

export function medicalAttachmentValidationMessage(
  reason: Exclude<MedicalAttachmentValidation, { ok: true }>["reason"],
) {
  if (reason === "empty_file") return "Lampiran wajib berisi data";
  if (reason === "file_too_large") return "Lampiran maksimal 10MB";
  return "Lampiran harus PDF, JPG, atau PNG";
}
