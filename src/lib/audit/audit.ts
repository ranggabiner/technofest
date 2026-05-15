import "server-only";

import { randomUUID } from "node:crypto";

import { requireEnv } from "@/lib/config/env";
import { canonicalJson, hmacSha256Hex, sha256Hex } from "@/lib/crypto/hashing";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "admin_doctor_approved"
  | "admin_doctor_rejected"
  | "doctor_kyc_email_notification_failed"
  | "ai_processing_consent_accepted"
  | "doctor_access_code_lookup_failed"
  | "patient_grant_created"
  | "patient_grant_replaced"
  | "patient_grant_revoked";

export type AuditStatus =
  | "accepted"
  | "approved"
  | "rejected"
  | "created"
  | "replaced"
  | "revoked"
  | "failed";

export function buildAuditEventHash(input: {
  hashPepper: string;
  logId: string;
  actorAuthUserId: string;
  actorRole: "medical_admin" | "doctor" | "patient";
  action: AuditAction;
  accessStatus: AuditStatus;
  targetType?: string | null;
  targetId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  reason?: string | null;
  createdAt: string;
}) {
  const payload = {
    proof_type: "audit_event",
    schema_version: "v1",
    log_ref_hash: hmacSha256Hex(input.hashPepper, input.logId),
    actor_hash: hmacSha256Hex(input.hashPepper, input.actorAuthUserId),
    actor_role: input.actorRole,
    action: input.action,
    target_type: input.targetType ?? null,
    target_ref_hash: input.targetId ? hmacSha256Hex(input.hashPepper, input.targetId) : null,
    patient_hash: input.patientId ? hmacSha256Hex(input.hashPepper, input.patientId) : null,
    doctor_hash: input.doctorId ? hmacSha256Hex(input.hashPepper, input.doctorId) : null,
    access_status: input.accessStatus,
    reason_code: input.reason ?? null,
    created_at: input.createdAt,
  };

  return sha256Hex(canonicalJson(payload));
}

export async function writeAuditLog(input: {
  actorAuthUserId: string;
  actorRole: "medical_admin" | "doctor" | "patient";
  action: AuditAction;
  accessStatus: AuditStatus;
  targetType?: string;
  targetId?: string;
  patientId?: string | null;
  doctorId?: string | null;
  reason?: string | null;
  ipAddress?: string | null;
}) {
  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const logId = randomUUID();
  const createdAt = new Date().toISOString();
  const auditEventHash = buildAuditEventHash({
    hashPepper: env.data.HASH_PEPPER,
    logId,
    actorAuthUserId: input.actorAuthUserId,
    actorRole: input.actorRole,
    action: input.action,
    accessStatus: input.accessStatus,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    patientId: input.patientId ?? null,
    doctorId: input.doctorId ?? null,
    reason: input.reason ?? null,
    createdAt,
  });

  const { error } = await admin.from("audit_logs").insert({
    log_id: logId,
    actor_auth_user_id: input.actorAuthUserId,
    actor_role: input.actorRole,
    action: input.action,
    access_status: input.accessStatus,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    patient_id: input.patientId ?? null,
    doctor_id: input.doctorId ?? null,
    reason: input.reason ?? null,
    ip_address: input.ipAddress ?? null,
    audit_event_hash: auditEventHash,
    blockchain_status: "pending",
    created_at: createdAt,
  });

  if (error) throw error;
}
