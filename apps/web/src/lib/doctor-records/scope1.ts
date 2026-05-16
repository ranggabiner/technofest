import { canonicalJson, hmacSha256Hex, sha256Hex } from "../crypto/hashing";

export const scope1RecordTypes = [
  "lab",
  "xray",
  "diagnosis",
  "prescription",
  "vaccine",
  "action",
  "note",
] as const;

export type Scope1RecordType = (typeof scope1RecordTypes)[number];

export type EncryptedTriplet = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function isScope1RecordType(value: string): value is Scope1RecordType {
  return (scope1RecordTypes as readonly string[]).includes(value);
}

export function validateScope1RecordInput(input: {
  recordType: string;
  title: string;
  description?: string | null;
}) {
  const recordType = input.recordType.trim();
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";

  if (!isScope1RecordType(recordType)) throw new Error("Jenis rekam medis tidak valid");
  if (!title) throw new Error("Judul rekam medis wajib diisi");
  if (title.length > 160) throw new Error("Judul rekam medis maksimal 160 karakter");
  if (description.length > 4000) throw new Error("Deskripsi rekam medis maksimal 4000 karakter");

  return {
    recordType,
    title,
    description: description || null,
  };
}

export function buildScope1RecordProof(input: {
  pepper: string;
  recordId: string;
  patientId: string;
  doctorId: string;
  amendsRecordId: string | null;
  recordType: EncryptedTriplet;
  title: EncryptedTriplet;
  description: EncryptedTriplet | null;
  attachmentFileId: string | null;
  attachmentFileSha256: string | null;
  keyVersion: string;
  createdAt: string;
}) {
  const payload = {
    proof_type: "scope_1_record",
    schema_version: "v1",
    record_ref_hash: hmacSha256Hex(input.pepper, input.recordId),
    patient_hash: hmacSha256Hex(input.pepper, input.patientId),
    doctor_hash: hmacSha256Hex(input.pepper, input.doctorId),
    amends_record_ref_hash: input.amendsRecordId
      ? hmacSha256Hex(input.pepper, input.amendsRecordId)
      : null,
    record_type_ciphertext: input.recordType.ciphertext,
    record_type_iv: input.recordType.iv,
    record_type_tag: input.recordType.tag,
    title_ciphertext: input.title.ciphertext,
    title_iv: input.title.iv,
    title_tag: input.title.tag,
    description_ciphertext: input.description?.ciphertext ?? null,
    description_iv: input.description?.iv ?? null,
    description_tag: input.description?.tag ?? null,
    attachment_file_ref_hash: input.attachmentFileId
      ? hmacSha256Hex(input.pepper, input.attachmentFileId)
      : null,
    attachment_file_sha256: input.attachmentFileSha256,
    key_version: input.keyVersion,
    created_at: input.createdAt,
  };
  const canonicalPayload = canonicalJson(payload);

  return {
    hash: sha256Hex(canonicalPayload),
    canonicalPayload,
  };
}
