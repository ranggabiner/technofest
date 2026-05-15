import "server-only";

import { randomUUID } from "node:crypto";

import { generateText } from "ai";

import { writeAuditLog } from "@/lib/audit/audit";
import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { decryptBytes, decryptString, encryptBytes, encryptString } from "@/lib/crypto/server";
import { sha256Hex } from "@/lib/crypto/hashing";
import { createDeepSeekChatModel } from "@/lib/ai/deepseek";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import {
  medicalAttachmentValidationMessage,
  validateMedicalAttachmentFile,
  type MedicalAttachmentFileLike,
} from "./attachments";
import {
  describeDoctorGrantScopes,
  evaluateGrantAccess,
  type DoctorGrantScope,
  type GrantAccessInput,
} from "./access";
import {
  buildScope1RecordProof,
  validateScope1RecordInput,
  type EncryptedTriplet,
} from "./scope1";
import {
  DOCTOR_RAG_DISCLAIMER,
  buildDoctorRagPrompt,
  ensureDoctorRagDisclaimer,
  selectAuthorizedRagRows,
  type DoctorRagRow,
} from "./rag";

type DoctorRow = Pick<
  Database["public"]["Tables"]["doctors"]["Row"],
  "doctor_id" | "full_name" | "specialization" | "qr_code_token" | "doctor_access_code"
>;

type PatientRow = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "patient_id" | "full_name" | "email"
>;

type GrantRow = Pick<
  Database["public"]["Tables"]["access_grants"]["Row"],
  | "grant_id"
  | "patient_id"
  | "doctor_id"
  | "can_view_scope1"
  | "can_view_scope2_mental"
  | "can_view_scope2_physical"
  | "can_download_attachments"
  | "granted_at"
  | "expires_at"
  | "is_revoked"
  | "revoked_at"
  | "blockchain_status"
  | "blockchain_tx_hash"
>;

type Scope1RecordRow = Pick<
  Database["public"]["Tables"]["scope_1_medical_records"]["Row"],
  | "record_id"
  | "patient_id"
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
  secure_files?: SecureFileRow | SecureFileRow[] | null;
};

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

type Scope2MentalRow = Pick<
  Database["public"]["Tables"]["scope_2_mental"]["Row"],
  | "log_id"
  | "session_id"
  | "log_date"
  | "mood_score_ciphertext"
  | "mood_score_iv"
  | "mood_score_tag"
  | "anxiety_level_ciphertext"
  | "anxiety_level_iv"
  | "anxiety_level_tag"
  | "sleep_hours_ciphertext"
  | "sleep_hours_iv"
  | "sleep_hours_tag"
  | "trigger_notes_ciphertext"
  | "trigger_notes_iv"
  | "trigger_notes_tag"
  | "raw_quote_ciphertext"
  | "raw_quote_iv"
  | "raw_quote_tag"
  | "is_emergency_flagged_ciphertext"
  | "is_emergency_flagged_iv"
  | "is_emergency_flagged_tag"
  | "extraction_confidence_ciphertext"
  | "extraction_confidence_iv"
  | "extraction_confidence_tag"
  | "ai_model"
  | "schema_version"
  | "key_version"
  | "created_at"
>;

type Scope2PhysicalRow = Pick<
  Database["public"]["Tables"]["scope_2_physical"]["Row"],
  | "log_id"
  | "session_id"
  | "log_date"
  | "symptom_type_ciphertext"
  | "symptom_type_iv"
  | "symptom_type_tag"
  | "severity_ciphertext"
  | "severity_iv"
  | "severity_tag"
  | "body_location_ciphertext"
  | "body_location_iv"
  | "body_location_tag"
  | "duration_note_ciphertext"
  | "duration_note_iv"
  | "duration_note_tag"
  | "raw_quote_ciphertext"
  | "raw_quote_iv"
  | "raw_quote_tag"
  | "is_emergency_flagged_ciphertext"
  | "is_emergency_flagged_iv"
  | "is_emergency_flagged_tag"
  | "extraction_confidence_ciphertext"
  | "extraction_confidence_iv"
  | "extraction_confidence_tag"
  | "ai_model"
  | "schema_version"
  | "key_version"
  | "created_at"
>;

export type DoctorDashboardGrant = {
  grantId: string;
  patientName: string;
  patientEmail: string;
  scopes: string[];
  expiresAt: string;
  blockchainStatus: string;
  blockchainTxHash: string | null;
};

export type DoctorDashboardState = {
  doctor: DoctorRow;
  activeGrants: DoctorDashboardGrant[];
};

export type AuthorizedDoctorGrant = {
  grantId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  grantedAt: string;
  expiresAt: string;
  blockchainStatus: string;
  blockchainTxHash: string | null;
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
};

export type Scope1RecordView = {
  recordId: string;
  amendsRecordId: string | null;
  recordType: string;
  title: string;
  description: string | null;
  attachmentFileId: string | null;
  attachmentFilename: string | null;
  attachmentMimeType: string | null;
  attachmentCanDownload: boolean;
  recordHash: string;
  blockchainStatus: string;
  blockchainTxHash: string | null;
  blockchainLastError: string | null;
  createdAt: string;
};

export type Scope2MentalView = {
  logId: string;
  logDate: string;
  moodScore: string | null;
  anxietyLevel: string | null;
  sleepHours: string | null;
  triggerNotes: string | null;
  rawQuote: string;
  emergencyFlagged: boolean;
  extractionConfidence: string | null;
  aiModel: string | null;
  schemaVersion: string;
  sessionId: string;
  createdAt: string;
};

export type Scope2PhysicalView = {
  logId: string;
  logDate: string;
  symptomType: string | null;
  severity: string | null;
  bodyLocation: string | null;
  durationNote: string | null;
  rawQuote: string;
  emergencyFlagged: boolean;
  extractionConfidence: string | null;
  aiModel: string | null;
  schemaVersion: string;
  sessionId: string;
  createdAt: string;
};

export type DoctorGrantPageState = {
  grant: AuthorizedDoctorGrant;
  scope1Records: Scope1RecordView[];
  mentalRows: Scope2MentalView[];
  physicalRows: Scope2PhysicalView[];
  ragAvailable: boolean;
};

export class DoctorAccessError extends Error {
  constructor(
    message: string,
    readonly reason: "unauthorized" | "not_found" | "expired" | "revoked" | "missing_scope",
  ) {
    super(message);
  }
}

export class DoctorRagNoDataError extends Error {
  constructor() {
    super("Belum ada data Scope 2 terotorisasi untuk ditanyakan");
  }
}

export async function loadDoctorDashboardState(role: ResolvedRole): Promise<DoctorDashboardState> {
  const doctorId = requireApprovedDoctorId(role);
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [doctorResult, grantsResult] = await Promise.all([
    admin
      .from("doctors")
      .select("doctor_id,full_name,specialization,qr_code_token,doctor_access_code")
      .eq("doctor_id", doctorId)
      .single(),
    admin
      .from("access_grants")
      .select(
        "grant_id,patient_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,blockchain_status,blockchain_tx_hash,patients(patient_id,full_name,email)",
      )
      .eq("doctor_id", doctorId)
      .eq("is_revoked", false)
      .gt("expires_at", now)
      .order("expires_at", { ascending: true }),
  ]);

  if (doctorResult.error) throw doctorResult.error;
  if (grantsResult.error) throw grantsResult.error;

  return {
    doctor: doctorResult.data as DoctorRow,
    activeGrants: ((grantsResult.data ?? []) as Array<GrantRow & { patients?: PatientRow | PatientRow[] | null }>).map(
      (grant) => {
        const patient = normalizePatientJoin(grant.patients);
        return {
          grantId: grant.grant_id,
          patientName: patient?.full_name ?? "Pasien",
          patientEmail: patient?.email ?? "Email tidak tersedia",
          scopes: describeDoctorGrantScopes(toAccessInput(grant)),
          expiresAt: grant.expires_at,
          blockchainStatus: grant.blockchain_status,
          blockchainTxHash: grant.blockchain_tx_hash,
        };
      },
    ),
  };
}

export async function loadDoctorGrantPageState(
  role: ResolvedRole,
  grantId: string,
): Promise<DoctorGrantPageState> {
  const grant = await authorizeDoctorGrant(role, grantId, null, { auditAllowedView: true });
  const [scope1Records, mentalRows, physicalRows] = await Promise.all([
    grant.canViewScope1 ? loadScope1Records(grant) : Promise.resolve([]),
    grant.canViewScope2Mental ? loadScope2Mental(grant.patientId) : Promise.resolve([]),
    grant.canViewScope2Physical ? loadScope2Physical(grant.patientId) : Promise.resolve([]),
  ]);

  return {
    grant,
    scope1Records,
    mentalRows,
    physicalRows,
    ragAvailable: grant.canViewScope2Mental || grant.canViewScope2Physical,
  };
}

export async function createScope1Record(
  role: ResolvedRole,
  input: {
    grantId: string;
    recordType: string;
    title: string;
    description?: string | null;
    amendsRecordId?: string | null;
    attachment?: File | null;
  },
) {
  const grant = await authorizeDoctorGrant(role, input.grantId, "scope1");
  const normalized = validateScope1RecordInput(input);
  const amendsRecordId = normalizeOptionalUuid(input.amendsRecordId);

  if (amendsRecordId) await assertAmendedRecordBelongsToGrant(amendsRecordId, grant);

  const env = requireEnv(["core"]);
  const recordId = randomUUID();
  const createdAt = new Date().toISOString();
  const recordType = encryptString(normalized.recordType, env.data.ENCRYPTION_MASTER_KEY);
  const title = encryptString(normalized.title, env.data.ENCRYPTION_MASTER_KEY);
  const description = normalized.description
    ? encryptString(normalized.description, env.data.ENCRYPTION_MASTER_KEY)
    : null;
  const attachment = await storeEncryptedMedicalAttachment({
    role,
    grant,
    file: input.attachment ?? null,
  });
  const proof = buildScope1RecordProof({
    pepper: env.data.HASH_PEPPER,
    recordId,
    patientId: grant.patientId,
    doctorId: grant.doctorId,
    amendsRecordId,
    recordType: toTriplet(recordType),
    title: toTriplet(title),
    description: description ? toTriplet(description) : null,
    attachmentFileId: attachment?.fileId ?? null,
    attachmentFileSha256: attachment?.fileSha256 ?? null,
    keyVersion: "v1",
    createdAt,
  });

  const admin = createAdminClient();
  const { error } = await admin.from("scope_1_medical_records").insert({
    record_id: recordId,
    patient_id: grant.patientId,
    doctor_id: grant.doctorId,
    amends_record_id: amendsRecordId,
    record_type_ciphertext: recordType.ciphertext,
    record_type_iv: recordType.iv,
    record_type_tag: recordType.tag,
    title_ciphertext: title.ciphertext,
    title_iv: title.iv,
    title_tag: title.tag,
    description_ciphertext: description?.ciphertext ?? null,
    description_iv: description?.iv ?? null,
    description_tag: description?.tag ?? null,
    attachment_file_id: attachment?.fileId ?? null,
    record_hash: proof.hash,
    blockchain_status: "pending",
    key_version: "v1",
    created_at: createdAt,
  });

  if (error) throw error;

  await writeAuditLog({
    actorAuthUserId: role.authUserId,
    actorRole: "doctor",
    action: amendsRecordId ? "scope1_record_amended" : "scope1_record_created",
    accessStatus: amendsRecordId ? "amended" : "created",
    targetType: "scope_1_medical_record",
    targetId: recordId,
    patientId: grant.patientId,
    doctorId: grant.doctorId,
  });

  return recordId;
}

export async function loadMedicalAttachment(input: {
  role: ResolvedRole;
  grantId: string;
  fileId: string;
  requireDownload: boolean;
}) {
  const grant = await authorizeDoctorGrant(input.role, input.grantId, "scope1");
  if (input.requireDownload && !grant.canDownloadAttachments) {
    throw new DoctorAccessError("Unduhan lampiran tidak diizinkan pasien", "missing_scope");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_1_medical_records")
    .select(
      "record_id,patient_id,attachment_file_id,secure_files(file_id,bucket_name,object_path,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,file_size_bytes,file_sha256,key_version)",
    )
    .eq("patient_id", grant.patientId)
    .eq("attachment_file_id", input.fileId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.attachment_file_id) {
    throw new DoctorAccessError("Lampiran tidak ditemukan", "not_found");
  }

  const file = normalizeSecureFileJoin(data.secure_files as SecureFileRow | SecureFileRow[] | null);
  if (!file) throw new DoctorAccessError("Metadata lampiran tidak ditemukan", "not_found");

  const download = await admin.storage.from(file.bucket_name).download(file.object_path);
  if (download.error) throw download.error;

  const env = requireEnv(["core"]);
  const encrypted = JSON.parse(await download.data.text()) as {
    ciphertext: string;
    iv: string;
    tag: string;
    keyVersion: string;
  };
  const filename = decryptString(
    {
      ciphertext: file.original_filename_ciphertext,
      iv: file.original_filename_iv,
      tag: file.original_filename_tag,
      keyVersion: file.key_version,
    },
    env.data.ENCRYPTION_MASTER_KEY,
  );

  return {
    bytes: decryptBytes(encrypted, env.data.ENCRYPTION_MASTER_KEY),
    filename,
    mimeType: file.mime_type,
  };
}

export async function answerDoctorRag(input: {
  role: ResolvedRole;
  grantId: string;
  question: string;
}) {
  const question = input.question.trim();
  if (!question) throw new Error("Pertanyaan wajib diisi");
  if (question.length > 1000) throw new Error("Pertanyaan maksimal 1000 karakter");

  const grant = await authorizeDoctorGrant(input.role, input.grantId, null);
  if (!grant.canViewScope2Mental && !grant.canViewScope2Physical) {
    throw new DoctorAccessError("Grant tidak mencakup Scope 2", "missing_scope");
  }

  const [mentalRows, physicalRows] = await Promise.all([
    grant.canViewScope2Mental ? loadScope2MentalRagRows(grant.patientId) : Promise.resolve([]),
    grant.canViewScope2Physical ? loadScope2PhysicalRagRows(grant.patientId) : Promise.resolve([]),
  ]);
  const rows = selectAuthorizedRagRows(mentalRows, physicalRows, {
    canViewScope2Mental: grant.canViewScope2Mental,
    canViewScope2Physical: grant.canViewScope2Physical,
  }).slice(0, 20);

  if (rows.length === 0) throw new DoctorRagNoDataError();

  const result = await generateText({
    model: createDeepSeekChatModel(),
    prompt: buildDoctorRagPrompt({ question, rows }),
    maxOutputTokens: 700,
    temperature: 0.2,
    maxRetries: 1,
  });

  await writeAuditLog({
    actorAuthUserId: input.role.authUserId,
    actorRole: "doctor",
    action: "doctor_rag_requested",
    accessStatus: "allowed",
    targetType: "access_grant",
    targetId: grant.grantId,
    patientId: grant.patientId,
    doctorId: grant.doctorId,
  });

  return {
    answer: ensureDoctorRagDisclaimer(result.text),
    disclaimer: DOCTOR_RAG_DISCLAIMER,
  };
}

async function authorizeDoctorGrant(
  role: ResolvedRole,
  grantId: string,
  requiredScope: DoctorGrantScope | null,
  options: { auditAllowedView?: boolean } = {},
): Promise<AuthorizedDoctorGrant> {
  const doctorId = requireApprovedDoctorId(role);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_grants")
    .select(
      "grant_id,patient_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,blockchain_status,blockchain_tx_hash,patients(patient_id,full_name,email)",
    )
    .eq("grant_id", grantId)
    .eq("doctor_id", doctorId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new DoctorAccessError("Akses pasien tidak ditemukan", "not_found");

  const grant = data as GrantRow & { patients?: PatientRow | PatientRow[] | null };
  const access = evaluateGrantAccess(toAccessInput(grant), requiredScope);
  if (!access.allowed) {
    await writeDeniedAccessAudit(role, grant, access.reason);
    throw new DoctorAccessError(deniedMessage(access.reason), access.reason);
  }

  if (options.auditAllowedView) {
    await writeAuditLog({
      actorAuthUserId: role.authUserId,
      actorRole: "doctor",
      action: "doctor_patient_view_allowed",
      accessStatus: "allowed",
      targetType: "access_grant",
      targetId: grant.grant_id,
      patientId: grant.patient_id,
      doctorId: grant.doctor_id,
    });
  }

  const patient = normalizePatientJoin(grant.patients);
  return {
    grantId: grant.grant_id,
    patientId: grant.patient_id,
    doctorId: grant.doctor_id,
    patientName: patient?.full_name ?? "Pasien",
    patientEmail: patient?.email ?? "Email tidak tersedia",
    grantedAt: grant.granted_at,
    expiresAt: grant.expires_at,
    blockchainStatus: grant.blockchain_status,
    blockchainTxHash: grant.blockchain_tx_hash,
    canViewScope1: grant.can_view_scope1,
    canViewScope2Mental: grant.can_view_scope2_mental,
    canViewScope2Physical: grant.can_view_scope2_physical,
    canDownloadAttachments: grant.can_download_attachments,
  };
}

async function loadScope1Records(grant: AuthorizedDoctorGrant): Promise<Scope1RecordView[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_1_medical_records")
    .select(
      "record_id,patient_id,doctor_id,amends_record_id,record_type_ciphertext,record_type_iv,record_type_tag,title_ciphertext,title_iv,title_tag,description_ciphertext,description_iv,description_tag,attachment_file_id,record_hash,blockchain_tx_hash,blockchain_status,blockchain_last_error,key_version,created_at,secure_files(file_id,bucket_name,object_path,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,file_size_bytes,file_sha256,key_version)",
    )
    .eq("patient_id", grant.patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  return ((data ?? []) as Scope1RecordRow[]).map((row) => {
    const file = normalizeSecureFileJoin(row.secure_files ?? null);
    return {
      recordId: row.record_id,
      amendsRecordId: row.amends_record_id,
      recordType: decryptRequired(row, "record_type", encryptionKey),
      title: decryptRequired(row, "title", encryptionKey),
      description: decryptOptional(row, "description", encryptionKey),
      attachmentFileId: row.attachment_file_id,
      attachmentFilename: file ? decryptFilename(file, encryptionKey) : null,
      attachmentMimeType: file?.mime_type ?? null,
      attachmentCanDownload: grant.canDownloadAttachments,
      recordHash: row.record_hash,
      blockchainStatus: row.blockchain_status,
      blockchainTxHash: row.blockchain_tx_hash,
      blockchainLastError: row.blockchain_last_error,
      createdAt: row.created_at,
    };
  });
}

async function loadScope2Mental(patientId: string): Promise<Scope2MentalView[]> {
  const rows = await loadScope2MentalRows(patientId);
  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  return rows.map((row) => ({
    logId: row.log_id,
    logDate: row.log_date,
    moodScore: decryptOptional(row, "mood_score", encryptionKey),
    anxietyLevel: decryptOptional(row, "anxiety_level", encryptionKey),
    sleepHours: decryptOptional(row, "sleep_hours", encryptionKey),
    triggerNotes: decryptOptional(row, "trigger_notes", encryptionKey),
    rawQuote: decryptRequired(row, "raw_quote", encryptionKey),
    emergencyFlagged: parseEncryptedBoolean(row, "is_emergency_flagged", encryptionKey),
    extractionConfidence: decryptOptional(row, "extraction_confidence", encryptionKey),
    aiModel: row.ai_model,
    schemaVersion: row.schema_version,
    sessionId: row.session_id,
    createdAt: row.created_at,
  }));
}

async function loadScope2Physical(patientId: string): Promise<Scope2PhysicalView[]> {
  const rows = await loadScope2PhysicalRows(patientId);
  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  return rows.map((row) => ({
    logId: row.log_id,
    logDate: row.log_date,
    symptomType: decryptOptional(row, "symptom_type", encryptionKey),
    severity: decryptOptional(row, "severity", encryptionKey),
    bodyLocation: decryptOptional(row, "body_location", encryptionKey),
    durationNote: decryptOptional(row, "duration_note", encryptionKey),
    rawQuote: decryptRequired(row, "raw_quote", encryptionKey),
    emergencyFlagged: parseEncryptedBoolean(row, "is_emergency_flagged", encryptionKey),
    extractionConfidence: decryptOptional(row, "extraction_confidence", encryptionKey),
    aiModel: row.ai_model,
    schemaVersion: row.schema_version,
    sessionId: row.session_id,
    createdAt: row.created_at,
  }));
}

async function loadScope2MentalRagRows(patientId: string): Promise<DoctorRagRow[]> {
  const rows = await loadScope2MentalRows(patientId);
  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  return rows.map((row) => ({
    category: "mental",
    logDate: row.log_date,
    rawQuote: decryptRequired(row, "raw_quote", encryptionKey),
    emergencyFlagged: parseEncryptedBoolean(row, "is_emergency_flagged", encryptionKey),
    provenance: row.session_id,
    details: compactDetails([
      ["mood", decryptOptional(row, "mood_score", encryptionKey)],
      ["anxiety", decryptOptional(row, "anxiety_level", encryptionKey)],
      ["sleep_hours", decryptOptional(row, "sleep_hours", encryptionKey)],
      ["trigger_notes", decryptOptional(row, "trigger_notes", encryptionKey)],
      ["confidence", decryptOptional(row, "extraction_confidence", encryptionKey)],
      ["model", row.ai_model],
    ]),
  }));
}

async function loadScope2PhysicalRagRows(patientId: string): Promise<DoctorRagRow[]> {
  const rows = await loadScope2PhysicalRows(patientId);
  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  return rows.map((row) => ({
    category: "physical",
    logDate: row.log_date,
    rawQuote: decryptRequired(row, "raw_quote", encryptionKey),
    emergencyFlagged: parseEncryptedBoolean(row, "is_emergency_flagged", encryptionKey),
    provenance: row.session_id,
    details: compactDetails([
      ["symptom_type", decryptOptional(row, "symptom_type", encryptionKey)],
      ["severity", decryptOptional(row, "severity", encryptionKey)],
      ["body_location", decryptOptional(row, "body_location", encryptionKey)],
      ["duration_note", decryptOptional(row, "duration_note", encryptionKey)],
      ["confidence", decryptOptional(row, "extraction_confidence", encryptionKey)],
      ["model", row.ai_model],
    ]),
  }));
}

async function loadScope2MentalRows(patientId: string): Promise<Scope2MentalRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_2_mental")
    .select(
      "log_id,session_id,log_date,mood_score_ciphertext,mood_score_iv,mood_score_tag,anxiety_level_ciphertext,anxiety_level_iv,anxiety_level_tag,sleep_hours_ciphertext,sleep_hours_iv,sleep_hours_tag,trigger_notes_ciphertext,trigger_notes_iv,trigger_notes_tag,raw_quote_ciphertext,raw_quote_iv,raw_quote_tag,is_emergency_flagged_ciphertext,is_emergency_flagged_iv,is_emergency_flagged_tag,extraction_confidence_ciphertext,extraction_confidence_iv,extraction_confidence_tag,ai_model,schema_version,key_version,created_at",
    )
    .eq("patient_id", patientId)
    .order("log_date", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as Scope2MentalRow[];
}

async function loadScope2PhysicalRows(patientId: string): Promise<Scope2PhysicalRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_2_physical")
    .select(
      "log_id,session_id,log_date,symptom_type_ciphertext,symptom_type_iv,symptom_type_tag,severity_ciphertext,severity_iv,severity_tag,body_location_ciphertext,body_location_iv,body_location_tag,duration_note_ciphertext,duration_note_iv,duration_note_tag,raw_quote_ciphertext,raw_quote_iv,raw_quote_tag,is_emergency_flagged_ciphertext,is_emergency_flagged_iv,is_emergency_flagged_tag,extraction_confidence_ciphertext,extraction_confidence_iv,extraction_confidence_tag,ai_model,schema_version,key_version,created_at",
    )
    .eq("patient_id", patientId)
    .order("log_date", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as Scope2PhysicalRow[];
}

async function storeEncryptedMedicalAttachment(input: {
  role: ResolvedRole;
  grant: AuthorizedDoctorGrant;
  file: File | null;
}) {
  if (!input.file || input.file.size <= 0) return null;

  const validation = validateMedicalAttachmentFile(input.file as MedicalAttachmentFileLike);
  if (!validation.ok) throw new Error(medicalAttachmentValidationMessage(validation.reason));

  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const fileId = randomUUID();
  const originalName = encryptString(input.file.name, env.data.ENCRYPTION_MASTER_KEY);
  const plaintextBytes = Buffer.from(await input.file.arrayBuffer());
  const encrypted = encryptBytes(plaintextBytes, env.data.ENCRYPTION_MASTER_KEY);
  const storageBytes = Buffer.from(JSON.stringify(encrypted), "utf8");
  const objectPath = `${input.role.authUserId}/medical/${input.grant.patientId}/${fileId}.json`;
  const fileSha256 = sha256Hex(storageBytes);

  const upload = await admin.storage
    .from("encrypted-medical-attachments")
    .upload(objectPath, storageBytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });

  if (upload.error) throw upload.error;

  const insert = await admin.from("secure_files").insert({
    file_id: fileId,
    owner_role: "patient",
    owner_id: input.grant.patientId,
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

  if (insert.error) throw insert.error;

  return {
    fileId,
    fileSha256,
  };
}

async function assertAmendedRecordBelongsToGrant(
  amendsRecordId: string,
  grant: AuthorizedDoctorGrant,
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_1_medical_records")
    .select("record_id,patient_id")
    .eq("record_id", amendsRecordId)
    .eq("patient_id", grant.patientId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Rekam medis yang diamendemen tidak ditemukan");
}

async function writeDeniedAccessAudit(
  role: ResolvedRole,
  grant: GrantRow,
  reason: "expired" | "revoked" | "missing_scope",
) {
  await writeAuditLog({
    actorAuthUserId: role.authUserId,
    actorRole: "doctor",
    action: "doctor_patient_view_denied",
    accessStatus: "denied",
    targetType: "access_grant",
    targetId: grant.grant_id,
    patientId: grant.patient_id,
    doctorId: grant.doctor_id,
    reason,
  });
}

function requireApprovedDoctorId(role: ResolvedRole) {
  if (role.kind !== "doctor" || !role.doctorId || !role.canAccessDoctorFeatures) {
    throw new DoctorAccessError("Akun dokter belum disetujui", "unauthorized");
  }
  return role.doctorId;
}

function deniedMessage(reason: "expired" | "revoked" | "missing_scope") {
  if (reason === "expired") return "Akses pasien sudah kedaluwarsa";
  if (reason === "revoked") return "Akses pasien sudah dicabut";
  return "Akses pasien tidak mencakup data ini";
}

function toAccessInput(grant: GrantRow): GrantAccessInput {
  return {
    isRevoked: grant.is_revoked,
    expiresAt: grant.expires_at,
    canViewScope1: grant.can_view_scope1,
    canViewScope2Mental: grant.can_view_scope2_mental,
    canViewScope2Physical: grant.can_view_scope2_physical,
    canDownloadAttachments: grant.can_download_attachments,
  };
}

function normalizePatientJoin(value: PatientRow | PatientRow[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeSecureFileJoin(value: SecureFileRow | SecureFileRow[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toTriplet(value: EncryptedTriplet): EncryptedTriplet {
  return {
    ciphertext: value.ciphertext,
    iv: value.iv,
    tag: value.tag,
  };
}

function decryptRequired(row: Record<string, unknown>, prefix: string, encryptionKey: string) {
  const value = decryptOptional(row, prefix, encryptionKey);
  if (value == null) throw new Error(`Encrypted value ${prefix} is missing`);
  return value;
}

function decryptOptional(row: Record<string, unknown>, prefix: string, encryptionKey: string) {
  const ciphertext = row[`${prefix}_ciphertext`];
  const iv = row[`${prefix}_iv`];
  const tag = row[`${prefix}_tag`];
  if (typeof ciphertext !== "string" || typeof iv !== "string" || typeof tag !== "string") {
    return null;
  }

  return decryptString(
    {
      ciphertext,
      iv,
      tag,
      keyVersion: typeof row.key_version === "string" ? row.key_version : "v1",
    },
    encryptionKey,
  );
}

function parseEncryptedBoolean(row: Record<string, unknown>, prefix: string, encryptionKey: string) {
  return decryptRequired(row, prefix, encryptionKey) === "true";
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

function normalizeOptionalUuid(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function compactDetails(items: Array<[string, string | null]>) {
  return items
    .filter(([, value]) => value != null && value !== "")
    .map(([label, value]) => `${label}: ${value}`);
}
