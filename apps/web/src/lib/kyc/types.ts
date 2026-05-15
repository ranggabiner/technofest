export type KycDocumentType = "str" | "sip" | "ktp";

export const requiredKycDocumentTypes = ["str", "sip", "ktp"] as const satisfies readonly KycDocumentType[];
