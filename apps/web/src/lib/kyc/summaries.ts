import { type KycDocumentType, requiredKycDocumentTypes } from "./types";

export type KycDocumentSummaryInput = {
  documentType: KycDocumentType;
  documentId: string | null;
  filename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
};

export type KycDocumentSummary = KycDocumentSummaryInput & {
  uploaded: boolean;
};

export function normalizeKycDocumentSummaries(
  documents: readonly KycDocumentSummaryInput[],
): KycDocumentSummary[] {
  const byType = new Map(documents.map((document) => [document.documentType, document]));

  return requiredKycDocumentTypes.map((documentType) => ({
    documentType,
    documentId: byType.get(documentType)?.documentId ?? null,
    filename: byType.get(documentType)?.filename ?? null,
    mimeType: byType.get(documentType)?.mimeType ?? null,
    fileSizeBytes: byType.get(documentType)?.fileSizeBytes ?? null,
    uploaded: Boolean(byType.get(documentType)?.documentId),
  }));
}
