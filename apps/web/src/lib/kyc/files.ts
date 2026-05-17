export const KYC_MAX_FILE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export type KycFileLike = {
  name: string;
  type: string;
  size: number;
};

export type KycFileValidation =
  | { ok: true }
  | { ok: false; reason: "unsupported_type" | "file_too_large" | "empty_file" };

export function validateKycFile(file: KycFileLike): KycFileValidation {
  if (file.size <= 0) {
    return { ok: false, reason: "empty_file" };
  }

  if (file.size > KYC_MAX_FILE_BYTES) {
    return { ok: false, reason: "file_too_large" };
  }

  if (!allowedMimeTypes.has(file.type)) {
    return { ok: false, reason: "unsupported_type" };
  }

  return { ok: true };
}
