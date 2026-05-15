import "server-only";

import { randomUUID } from "node:crypto";

import { buildAuditEventHash, writeAuditLog } from "@/lib/audit/audit";
import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  DOCTOR_LOOKUP_DAILY_WINDOW_MS,
  DOCTOR_LOOKUP_GENERIC_ERROR,
  buildAccessGrantProof,
  getDoctorLookupLimitState,
  parseDoctorLookupInput,
} from "./grants";

const DOCTOR_LOOKUP_RATE_LIMIT_ERROR =
  "Terlalu banyak percobaan kode dokter. Coba lagi nanti.";
const LONG_EXPIRY_WARNING_DAYS = 30;

type AccessGrantRow = {
  grant_id: string;
  doctor_id: string;
  can_view_scope1: boolean;
  can_view_scope2_mental: boolean;
  can_view_scope2_physical: boolean;
  can_download_attachments: boolean;
  granted_at: string;
  expires_at: string;
  is_revoked: boolean;
  revoked_at: string | null;
  replaced_by_grant_id: string | null;
  blockchain_status: string;
  blockchain_tx_hash: string | null;
  created_at: string;
};

type AuditLogRow = {
  log_id: string;
  action: string;
  access_status: string;
  target_type: string | null;
  target_id: string | null;
  doctor_id: string | null;
  reason: string | null;
  blockchain_status: string;
  blockchain_tx_hash: string | null;
  created_at: string;
};

type DoctorLookupRow = {
  doctor_id: string;
  full_name: string;
  specialization: string | null;
};

export type DoctorLookupResult = {
  doctorId: string;
  fullName: string;
  specialization: string | null;
};

export type PatientAccessGrantView = {
  grantId: string;
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  scopes: string[];
  canDownloadAttachments: boolean;
  grantedAt: string;
  expiresAt: string;
  blockchainStatus: string;
  blockchainTxHash: string | null;
};

export type PatientAccessHistoryItem = {
  id: string;
  action: string;
  label: string;
  status: string;
  doctorName: string | null;
  reason: string | null;
  blockchainStatus: string;
  blockchainTxHash: string | null;
  createdAt: string;
};

export type PatientAccessState = {
  activeGrants: PatientAccessGrantView[];
  history: PatientAccessHistoryItem[];
};

export async function loadPatientAccessState(role: ResolvedRole): Promise<PatientAccessState> {
  const patientId = requirePatientId(role);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const [grantsResult, historyResult] = await Promise.all([
    admin
      .from("access_grants")
      .select(
        "grant_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,replaced_by_grant_id,blockchain_status,blockchain_tx_hash,created_at",
      )
      .eq("patient_id", patientId)
      .eq("is_revoked", false)
      .gt("expires_at", now)
      .order("granted_at", { ascending: false }),
    admin
      .from("audit_logs")
      .select(
        "log_id,action,access_status,target_type,target_id,doctor_id,reason,blockchain_status,blockchain_tx_hash,created_at",
      )
      .eq("patient_id", patientId)
      .in("action", [
        "doctor_access_code_lookup_failed",
        "patient_grant_created",
        "patient_grant_replaced",
        "patient_grant_revoked",
        "doctor_patient_view_allowed",
        "doctor_patient_view_denied",
        "scope1_record_created",
        "scope1_record_amended",
        "doctor_rag_requested",
        "blockchain_verification_mismatch",
      ])
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (grantsResult.error) throw grantsResult.error;
  if (historyResult.error) throw historyResult.error;

  const grants = (grantsResult.data ?? []) as AccessGrantRow[];
  const history = (historyResult.data ?? []) as AuditLogRow[];
  const doctorMap = await loadDoctorMap([
    ...grants.map((grant) => grant.doctor_id),
    ...history.map((item) => item.doctor_id).filter((doctorId): doctorId is string => Boolean(doctorId)),
  ]);

  return {
    activeGrants: grants.map((grant) => ({
      grantId: grant.grant_id,
      doctorId: grant.doctor_id,
      doctorName: doctorMap.get(grant.doctor_id)?.full_name ?? "Dokter",
      specialization: doctorMap.get(grant.doctor_id)?.specialization ?? null,
      scopes: describeScopes(grant),
      canDownloadAttachments: grant.can_download_attachments,
      grantedAt: grant.granted_at,
      expiresAt: grant.expires_at,
      blockchainStatus: grant.blockchain_status,
      blockchainTxHash: grant.blockchain_tx_hash,
    })),
    history: history.map((item) => ({
      id: item.log_id,
      action: item.action,
      label: describeAuditAction(item.action),
      status: item.access_status,
      doctorName: item.doctor_id ? (doctorMap.get(item.doctor_id)?.full_name ?? "Dokter") : null,
      reason: item.reason,
      blockchainStatus: item.blockchain_status,
      blockchainTxHash: item.blockchain_tx_hash,
      createdAt: item.created_at,
    })),
  };
}

export async function lookupDoctorForPatient(
  role: ResolvedRole,
  rawLookupValue: string,
  requestIp: string | null,
): Promise<DoctorLookupResult> {
  const patientId = requirePatientId(role);
  const ipAddress = normalizeIpAddress(requestIp) ?? "0.0.0.0";
  await assertLookupRateLimit(role.authUserId, ipAddress);

  let lookup;
  try {
    lookup = parseDoctorLookupInput(rawLookupValue);
  } catch {
    await writeFailedLookupAudit(role, patientId, ipAddress, "generic_lookup_failed");
    throw new Error(DOCTOR_LOOKUP_GENERIC_ERROR);
  }

  const admin = createAdminClient();
  const lookupColumn =
    lookup.kind === "qr_token" ? "qr_code_token" : "doctor_access_code";
  const { data, error } = await admin
    .from("doctors")
    .select("doctor_id,full_name,specialization")
    .eq(lookupColumn, lookup.value)
    .eq("account_status", "approved")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    await writeFailedLookupAudit(role, patientId, ipAddress, "generic_lookup_failed");
    throw new Error(DOCTOR_LOOKUP_GENERIC_ERROR);
  }

  const doctor = data as DoctorLookupRow;

  return {
    doctorId: doctor.doctor_id,
    fullName: doctor.full_name,
    specialization: doctor.specialization,
  };
}

export async function createOrReplaceDoctorGrant(
  role: ResolvedRole,
  input: {
    doctorId: string;
    canViewScope1: boolean;
    canViewScope2Mental: boolean;
    canViewScope2Physical: boolean;
    canDownloadAttachments: boolean;
    expiresAt: string;
  },
  requestIp: string | null,
) {
  const patientId = requirePatientId(role);
  const flags = validateGrantFlags(input);
  const expiresAt = validateExpiry(input.expiresAt);
  const doctor = await loadApprovedDoctor(input.doctorId);
  if (!doctor) throw new Error(DOCTOR_LOOKUP_GENERIC_ERROR);

  const existingGrant = await loadActiveGrant(patientId, doctor.doctor_id);
  const env = requireEnv(["core"]);
  const grantId = randomUUID();
  const auditLogId = randomUUID();
  const mutationAt = new Date().toISOString();
  const consentHash = buildAccessGrantProof({
    pepper: env.data.HASH_PEPPER,
    grantId,
    patientId,
    doctorId: doctor.doctor_id,
    canViewScope1: flags.canViewScope1,
    canViewScope2Mental: flags.canViewScope2Mental,
    canViewScope2Physical: flags.canViewScope2Physical,
    canDownloadAttachments: flags.canDownloadAttachments,
    grantedAt: mutationAt,
    expiresAt,
    isRevoked: false,
    revokedAt: null,
    replacedByGrantId: null,
    createdAt: mutationAt,
  }).hash;
  const priorReplacementConsentHash = existingGrant
    ? buildAccessGrantProof({
        pepper: env.data.HASH_PEPPER,
        grantId: existingGrant.grant_id,
        patientId,
        doctorId: doctor.doctor_id,
        canViewScope1: existingGrant.can_view_scope1,
        canViewScope2Mental: existingGrant.can_view_scope2_mental,
        canViewScope2Physical: existingGrant.can_view_scope2_physical,
        canDownloadAttachments: existingGrant.can_download_attachments,
        grantedAt: existingGrant.granted_at,
        expiresAt: existingGrant.expires_at,
        isRevoked: true,
        revokedAt: mutationAt,
        replacedByGrantId: grantId,
        createdAt: existingGrant.created_at,
      }).hash
    : null;
  const action = existingGrant ? "patient_grant_replaced" : "patient_grant_created";
  const accessStatus = existingGrant ? "replaced" : "created";
  const auditEventHash = buildAuditEventHash({
    hashPepper: env.data.HASH_PEPPER,
    logId: auditLogId,
    actorAuthUserId: role.authUserId,
    actorRole: "patient",
    action,
    accessStatus,
    targetType: "access_grant",
    targetId: grantId,
    patientId,
    doctorId: doctor.doctor_id,
    createdAt: mutationAt,
  });

  const supabase = await createClient();
  const { error } = await supabase.rpc("replace_active_access_grant_v2", {
    target_grant_id: grantId,
    target_patient_id: patientId,
    target_doctor_id: doctor.doctor_id,
    allow_scope1: flags.canViewScope1,
    allow_scope2_mental: flags.canViewScope2Mental,
    allow_scope2_physical: flags.canViewScope2Physical,
    allow_download_attachments: flags.canDownloadAttachments,
    target_granted_at: mutationAt,
    target_expires_at: expiresAt,
    target_consent_hash: consentHash,
    prior_replacement_consent_hash: priorReplacementConsentHash,
    target_audit_log_id: auditLogId,
    target_audit_event_hash: auditEventHash,
    target_ip_address: normalizeIpAddress(requestIp),
  });

  if (error) throw new Error("Akses dokter gagal disimpan");
}

export async function revokeDoctorGrant(
  role: ResolvedRole,
  input: { grantId: string },
  requestIp: string | null,
) {
  const patientId = requirePatientId(role);
  const existingGrant = await loadActiveGrantById(patientId, input.grantId);
  if (!existingGrant) throw new Error("Akses dokter tidak aktif atau sudah dicabut");

  const env = requireEnv(["core"]);
  const revokedAt = new Date().toISOString();
  const auditLogId = randomUUID();
  const consentHash = buildAccessGrantProof({
    pepper: env.data.HASH_PEPPER,
    grantId: existingGrant.grant_id,
    patientId,
    doctorId: existingGrant.doctor_id,
    canViewScope1: existingGrant.can_view_scope1,
    canViewScope2Mental: existingGrant.can_view_scope2_mental,
    canViewScope2Physical: existingGrant.can_view_scope2_physical,
    canDownloadAttachments: existingGrant.can_download_attachments,
    grantedAt: existingGrant.granted_at,
    expiresAt: existingGrant.expires_at,
    isRevoked: true,
    revokedAt,
    replacedByGrantId: null,
    createdAt: existingGrant.created_at,
  }).hash;
  const auditEventHash = buildAuditEventHash({
    hashPepper: env.data.HASH_PEPPER,
    logId: auditLogId,
    actorAuthUserId: role.authUserId,
    actorRole: "patient",
    action: "patient_grant_revoked",
    accessStatus: "revoked",
    targetType: "access_grant",
    targetId: existingGrant.grant_id,
    patientId,
    doctorId: existingGrant.doctor_id,
    createdAt: revokedAt,
  });

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_active_access_grant", {
    target_grant_id: existingGrant.grant_id,
    target_patient_id: patientId,
    target_revoked_at: revokedAt,
    target_consent_hash: consentHash,
    target_audit_log_id: auditLogId,
    target_audit_event_hash: auditEventHash,
    target_ip_address: normalizeIpAddress(requestIp),
  });

  if (error) throw new Error("Akses dokter gagal dicabut");
}

export function getRequestIp(headersList: { get(name: string): string | null }) {
  return (
    normalizeIpAddress(headersList.get("x-forwarded-for")?.split(",")[0] ?? null) ??
    normalizeIpAddress(headersList.get("x-real-ip")) ??
    "0.0.0.0"
  );
}

export function isLongExpiry(expiresAt: string, now: Date = new Date()) {
  const expiresMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresMs)) return false;
  return expiresMs - now.getTime() > LONG_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
}

async function assertLookupRateLimit(actorAuthUserId: string, ipAddress: string) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - DOCTOR_LOOKUP_DAILY_WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from("audit_logs")
    .select("created_at")
    .eq("actor_auth_user_id", actorAuthUserId)
    .eq("action", "doctor_access_code_lookup_failed")
    .eq("target_type", "doctor_lookup")
    .eq("ip_address", ipAddress)
    .gte("created_at", since);

  if (error) throw error;

  const limitState = getDoctorLookupLimitState(
    (data ?? []).map((item) => item.created_at),
    new Date(),
  );
  if (limitState.limited) throw new Error(DOCTOR_LOOKUP_RATE_LIMIT_ERROR);
}

async function writeFailedLookupAudit(
  role: ResolvedRole,
  patientId: string,
  ipAddress: string,
  reason: string,
) {
  await writeAuditLog({
    actorAuthUserId: role.authUserId,
    actorRole: "patient",
    action: "doctor_access_code_lookup_failed",
    accessStatus: "failed",
    targetType: "doctor_lookup",
    patientId,
    reason,
    ipAddress,
  });
}

async function loadApprovedDoctor(doctorId: string): Promise<DoctorLookupRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctors")
    .select("doctor_id,full_name,specialization")
    .eq("doctor_id", doctorId)
    .eq("account_status", "approved")
    .maybeSingle();

  if (error) throw error;
  return (data as DoctorLookupRow | null) ?? null;
}

async function loadActiveGrant(patientId: string, doctorId: string): Promise<AccessGrantRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_grants")
    .select(
      "grant_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,replaced_by_grant_id,blockchain_status,blockchain_tx_hash,created_at",
    )
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId)
    .eq("is_revoked", false)
    .gt("expires_at", new Date().toISOString())
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as AccessGrantRow | null) ?? null;
}

async function loadActiveGrantById(patientId: string, grantId: string): Promise<AccessGrantRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_grants")
    .select(
      "grant_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,replaced_by_grant_id,blockchain_status,blockchain_tx_hash,created_at",
    )
    .eq("patient_id", patientId)
    .eq("grant_id", grantId)
    .eq("is_revoked", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return (data as AccessGrantRow | null) ?? null;
}

async function loadDoctorMap(doctorIds: string[]) {
  const uniqueIds = Array.from(new Set(doctorIds));
  const doctorMap = new Map<string, DoctorLookupRow>();
  if (uniqueIds.length === 0) return doctorMap;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctors")
    .select("doctor_id,full_name,specialization")
    .in("doctor_id", uniqueIds);

  if (error) throw error;
  for (const doctor of (data ?? []) as DoctorLookupRow[]) {
    doctorMap.set(doctor.doctor_id, doctor);
  }

  return doctorMap;
}

function validateGrantFlags(input: {
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
}) {
  if (!input.canViewScope1 && !input.canViewScope2Mental && !input.canViewScope2Physical) {
    throw new Error("Pilih minimal satu cakupan data");
  }

  if (input.canDownloadAttachments && !input.canViewScope1) {
    throw new Error("Unduhan lampiran membutuhkan akses Scope 1");
  }

  return input;
}

function validateExpiry(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
    throw new Error("Batas waktu akses harus di masa depan");
  }

  return date.toISOString();
}

function requirePatientId(role: ResolvedRole): string {
  if (role.kind !== "patient" || !role.patientId) {
    throw new Error("Hanya pasien yang dapat mengelola akses dokter");
  }

  return role.patientId;
}

function describeScopes(grant: {
  can_view_scope1: boolean;
  can_view_scope2_mental: boolean;
  can_view_scope2_physical: boolean;
}) {
  const scopes: string[] = [];
  if (grant.can_view_scope1) scopes.push("Scope 1");
  if (grant.can_view_scope2_mental) scopes.push("Mental");
  if (grant.can_view_scope2_physical) scopes.push("Fisik");
  return scopes;
}

function describeAuditAction(action: string) {
  if (action === "patient_grant_created") return "Akses dokter dibuat";
  if (action === "patient_grant_replaced") return "Akses dokter diganti";
  if (action === "patient_grant_revoked") return "Akses dokter dicabut";
  if (action === "doctor_access_code_lookup_failed") return "Pencarian kode dokter gagal";
  if (action === "doctor_patient_view_allowed") return "Dokter melihat data";
  if (action === "doctor_patient_view_denied") return "Akses dokter ditolak";
  if (action === "scope1_record_created") return "Rekam medis dibuat";
  if (action === "scope1_record_amended") return "Rekam medis diamendemen";
  if (action === "doctor_rag_requested") return "Tanya jawab dokter dibuat";
  if (action === "blockchain_verification_mismatch") return "Mismatch integritas terdeteksi";
  return action;
}

function normalizeIpAddress(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;
  if (/^[0-9a-fA-F:.]+$/.test(candidate)) return candidate;
  return null;
}
