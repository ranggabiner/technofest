import "server-only";

import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { decryptBytes, decryptString, type EncryptedValue } from "@/lib/crypto/server";
import { scope1RecordTypes, type Scope1RecordType } from "@/lib/doctor-records/scope1";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export const patientHealthHistoryRecordFilters = ["all", ...scope1RecordTypes] as const;

export type PatientHealthHistoryRecordFilter = (typeof patientHealthHistoryRecordFilters)[number];

type Scope1RecordRow = Pick<
  Database["public"]["Tables"]["scope_1_medical_records"]["Row"],
  | "record_id"
  | "doctor_id"
  | "amends_record_id"
  | "record_type_ciphertext"
  | "record_type_iv"
  | "record_type_tag"
  | "title_ciphertext"
  | "title_iv"
  | "title_tag"
  | "description_ciphertext"
  | "description_iv"
  | "description_tag"
  | "attachment_file_id"
  | "record_hash"
  | "blockchain_tx_hash"
  | "blockchain_status"
  | "blockchain_last_error"
  | "key_version"
  | "created_at"
> & {
  doctors?: DoctorRow | DoctorRow[] | null;
  secure_files?: SecureFileRow | SecureFileRow[] | null;
};

type DoctorRow = Pick<
  Database["public"]["Tables"]["doctors"]["Row"],
  "doctor_id" | "full_name" | "specialization"
>;

type SecureFileRow = Pick<
  Database["public"]["Tables"]["secure_files"]["Row"],
  | "file_id"
  | "bucket_name"
  | "object_path"
  | "original_filename_ciphertext"
  | "original_filename_iv"
  | "original_filename_tag"
  | "mime_type"
  | "file_size_bytes"
  | "file_sha256"
  | "key_version"
>;

export type PatientHealthHistoryRecord = {
  recordId: string;
  doctorId: string;
  doctorName: string | null;
  doctorSpecialization: string | null;
  amendsRecordId: string | null;
  recordType: Scope1RecordType;
  title: string;
  description: string | null;
  attachmentFileId: string | null;
  attachmentFilename: string | null;
  attachmentMimeType: string | null;
  attachmentSizeBytes: number | null;
  recordHash: string;
  blockchainStatus: string;
  blockchainTxHash: string | null;
  blockchainLastError: string | null;
  createdAt: string;
};

export type PatientHealthHistoryRecordsState = {
  activeFilter: PatientHealthHistoryRecordFilter;
  records: PatientHealthHistoryRecord[];
  totalRecords: number;
};

export class PatientHealthHistoryAttachmentError extends Error {
  constructor(
    message: string,
    public readonly reason: "forbidden" | "not_found",
  ) {
    super(message);
  }
}

export function resolvePatientHealthHistoryRecordFilter(
  value: string | string[] | undefined,
): PatientHealthHistoryRecordFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || candidate === "all") return "all";
  return isScope1RecordType(candidate) ? candidate : "all";
}

export async function loadPatientHealthHistoryRecordsState(
  role: ResolvedRole,
  activeFilter: PatientHealthHistoryRecordFilter = "all",
): Promise<PatientHealthHistoryRecordsState> {
  if (role.kind !== "patient" || !role.patientId) {
    throw new Error("Peran pasien wajib untuk riwayat rekam medis");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_1_medical_records")
    .select(
      "record_id,doctor_id,amends_record_id,record_type_ciphertext,record_type_iv,record_type_tag,title_ciphertext,title_iv,title_tag,description_ciphertext,description_iv,description_tag,attachment_file_id,record_hash,blockchain_tx_hash,blockchain_status,blockchain_last_error,key_version,created_at,doctors(doctor_id,full_name,specialization),secure_files(file_id,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,file_size_bytes,key_version)",
    )
    .eq("patient_id", role.patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  const records = ((data ?? []) as Scope1RecordRow[]).map((row) => {
    const doctor = normalizeJoin(row.doctors);
    const file = normalizeJoin(row.secure_files);
    const recordType = decryptRequired(row, "record_type", encryptionKey);

    return {
      recordId: row.record_id,
      doctorId: row.doctor_id,
      doctorName: doctor?.full_name ?? null,
      doctorSpecialization: doctor?.specialization ?? null,
      amendsRecordId: row.amends_record_id,
      recordType: isScope1RecordType(recordType) ? recordType : "note",
      title: decryptRequired(row, "title", encryptionKey),
      description: decryptOptional(row, "description", encryptionKey),
      attachmentFileId: row.attachment_file_id,
      attachmentFilename: file ? decryptFilename(file, encryptionKey) : null,
      attachmentMimeType: file?.mime_type ?? null,
      attachmentSizeBytes: file?.file_size_bytes ?? null,
      recordHash: row.record_hash,
      blockchainStatus: row.blockchain_status,
      blockchainTxHash: row.blockchain_tx_hash,
      blockchainLastError: row.blockchain_last_error,
      createdAt: row.created_at,
    };
  });

  return {
    activeFilter,
    records: activeFilter === "all" ? records : records.filter((record) => record.recordType === activeFilter),
    totalRecords: records.length,
  };
}

export async function loadPatientHealthHistoryAttachment(input: {
  role: ResolvedRole;
  recordId: string;
  fileId: string;
}) {
  if (input.role.kind !== "patient" || !input.role.patientId) {
    throw new PatientHealthHistoryAttachmentError("Peran pasien wajib untuk lampiran", "forbidden");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_1_medical_records")
    .select(
      "record_id,patient_id,attachment_file_id,secure_files(file_id,bucket_name,object_path,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,file_size_bytes,file_sha256,key_version)",
    )
    .eq("record_id", input.recordId)
    .eq("patient_id", input.role.patientId)
    .eq("attachment_file_id", input.fileId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.attachment_file_id) {
    throw new PatientHealthHistoryAttachmentError("Lampiran tidak ditemukan", "not_found");
  }

  const file = normalizeJoin(data.secure_files as SecureFileRow | SecureFileRow[] | null);
  if (!file) {
    throw new PatientHealthHistoryAttachmentError("Metadata lampiran tidak ditemukan", "not_found");
  }

  const download = await admin.storage.from(file.bucket_name).download(file.object_path);
  if (download.error) throw download.error;

  const env = requireEnv(["core"]);
  const encrypted = JSON.parse(await download.data.text()) as EncryptedValue;

  return {
    bytes: decryptBytes(encrypted, env.data.ENCRYPTION_MASTER_KEY),
    filename: decryptFilename(file, env.data.ENCRYPTION_MASTER_KEY),
    mimeType: file.mime_type,
  };
}

function isScope1RecordType(value: string): value is Scope1RecordType {
  return (scope1RecordTypes as readonly string[]).includes(value);
}

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function decryptRequired(
  row: Scope1RecordRow,
  field: "record_type" | "title",
  encryptionKey: string,
) {
  return decryptString(
    {
      ciphertext: row[`${field}_ciphertext`],
      iv: row[`${field}_iv`],
      tag: row[`${field}_tag`],
      keyVersion: row.key_version,
    },
    encryptionKey,
  );
}

function decryptOptional(row: Scope1RecordRow, field: "description", encryptionKey: string) {
  const ciphertext = row[`${field}_ciphertext`];
  const iv = row[`${field}_iv`];
  const tag = row[`${field}_tag`];
  if (!ciphertext || !iv || !tag) return null;

  return decryptString(
    {
      ciphertext,
      iv,
      tag,
      keyVersion: row.key_version,
    },
    encryptionKey,
  );
}

function decryptFilename(file: SecureFileRow, encryptionKey: string) {
  return decryptString(
    {
      ciphertext: file.original_filename_ciphertext,
      iv: file.original_filename_iv,
      tag: file.original_filename_tag,
      keyVersion: file.key_version,
    },
    encryptionKey,
  );
}
