export type KycPreviewKind = "image" | "pdf" | "fallback";

const mimeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

export function getKycPreviewKind(mimeType: string | null): KycPreviewKind {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "fallback";
}

export function formatFileSize(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return `${formatted} ${units[exponent]}`;
}

export function getFileTypeLabel(mimeType: string | null, filename: string | null) {
  if (mimeType && mimeLabels[mimeType]) return mimeLabels[mimeType];

  const extension = filename?.split(".").pop()?.trim();
  return extension ? extension.toUpperCase() : "-";
}
