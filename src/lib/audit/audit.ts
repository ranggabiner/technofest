import "server-only";

import { randomUUID } from "node:crypto";

import { requireEnv } from "@/lib/config/env";
import { canonicalJson, hmacSha256Hex, sha256Hex } from "@/lib/crypto/hashing";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "admin_doctor_approved"
  | "admin_doctor_rejected"
  | "doctor_kyc_email_notification_failed"
  | "ai_processing_consent_accepted";

export type AuditStatus = "accepted" | "approved" | "rejected" | "failed";

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
}) {
  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const logId = randomUUID();
  const createdAt = new Date().toISOString();
  const payload = {
    proof_type: "audit_event",
    schema_version: "v1",
    log_ref_hash: hmacSha256Hex(env.data.HASH_PEPPER, logId),
    actor_hash: hmacSha256Hex(env.data.HASH_PEPPER, input.actorAuthUserId),
    actor_role: input.actorRole,
    action: input.action,
    target_type: input.targetType ?? null,
    target_ref_hash: input.targetId ? hmacSha256Hex(env.data.HASH_PEPPER, input.targetId) : null,
    patient_hash: input.patientId ? hmacSha256Hex(env.data.HASH_PEPPER, input.patientId) : null,
    doctor_hash: input.doctorId ? hmacSha256Hex(env.data.HASH_PEPPER, input.doctorId) : null,
    access_status: input.accessStatus,
    reason_code: input.reason ?? null,
    created_at: createdAt,
  };
  const auditEventHash = sha256Hex(canonicalJson(payload));

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
    audit_event_hash: auditEventHash,
    blockchain_status: "pending",
    created_at: createdAt,
  });

  if (error) throw error;
}
