"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { buildAuditEventHash, writeAuditLog } from "@/lib/audit/audit";
import { requireAdminRole } from "@/lib/auth/session";
import { requireEnv } from "@/lib/config/env";
import { createDoctorAccessCode, createQrCodeToken } from "@/lib/doctors/codes";
import { sendDoctorStatusEmail } from "@/lib/email/resend";
import { getDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function approveDoctorAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireAdminRole();
  const doctorId = String(formData.get("doctor_id") ?? "");
  const redirectTo = safeAdminRedirect(String(formData.get("redirect_to") ?? ""), `/admin/approval?status=pending`);
  if (!doctorId) throw new Error(copy.admin.detail.doctorIdRequired);

  const doctor = await loadDoctor(doctorId);
  const verifiedAt = new Date().toISOString();
  const auditLogId = randomUUID();
  const auditEventHash = buildAuditEventHash({
    hashPepper: requireEnv(["core"]).data.HASH_PEPPER,
    logId: auditLogId,
    actorAuthUserId: role.authUserId,
    actorRole: "medical_admin",
    action: "admin_doctor_approved",
    accessStatus: "approved",
    targetType: "doctor",
    targetId: doctorId,
    doctorId,
    createdAt: verifiedAt,
  });
  const supabase = await createClient();

  let updateError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const update = await supabase.rpc("approve_doctor_with_audit", {
      target_doctor_id: doctorId,
      target_qr_code_token: createQrCodeToken(),
      target_doctor_access_code: createDoctorAccessCode(),
      target_verified_at: verifiedAt,
      target_audit_log_id: auditLogId,
      target_audit_event_hash: auditEventHash,
    });

    if (!update.error) {
      updateError = null;
      break;
    }

    updateError = update.error;
    if (update.error.code !== "23505") break;
  }

  if (updateError) throw new Error(updateError.message ?? copy.admin.detail.approveFailed);

  const emailResult = await sendDoctorStatusEmail({
    to: doctor.email,
    doctorName: doctor.full_name,
    status: "approved",
  });

  if (!emailResult.ok) {
    await writeAuditLog({
      actorAuthUserId: role.authUserId,
      actorRole: "medical_admin",
      action: "doctor_kyc_email_notification_failed",
      accessStatus: "failed",
      targetType: "doctor",
      targetId: doctorId,
      doctorId,
      reason: emailResult.reason,
    });
  }

  revalidateAdminReviewPaths(doctorId);
  redirect(appendUpdatedParam(redirectTo, "approved"));
}

export async function rejectDoctorAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireAdminRole();
  const doctorId = String(formData.get("doctor_id") ?? "");
  const redirectTo = safeAdminRedirect(String(formData.get("redirect_to") ?? ""), `/admin/approval?status=pending`);
  const rejectionReason = String(formData.get("rejection_reason") ?? "").trim() || "manual_rejection";
  if (!doctorId || !rejectionReason) throw new Error(copy.admin.detail.rejectionReasonRequired);

  const doctor = await loadDoctor(doctorId);
  const verifiedAt = new Date().toISOString();
  const auditLogId = randomUUID();
  const auditEventHash = buildAuditEventHash({
    hashPepper: requireEnv(["core"]).data.HASH_PEPPER,
    logId: auditLogId,
    actorAuthUserId: role.authUserId,
    actorRole: "medical_admin",
    action: "admin_doctor_rejected",
    accessStatus: "rejected",
    targetType: "doctor",
    targetId: doctorId,
    doctorId,
    reason: "manual_rejection",
    createdAt: verifiedAt,
  });
  const supabase = await createClient();
  const update = await supabase.rpc("reject_doctor_with_audit", {
    target_doctor_id: doctorId,
    target_rejection_reason: rejectionReason,
    target_verified_at: verifiedAt,
    target_audit_log_id: auditLogId,
    target_audit_event_hash: auditEventHash,
  });

  if (update.error) throw update.error;

  const emailResult = await sendDoctorStatusEmail({
    to: doctor.email,
    doctorName: doctor.full_name,
    status: "rejected",
    reason: rejectionReason,
  });

  if (!emailResult.ok) {
    await writeAuditLog({
      actorAuthUserId: role.authUserId,
      actorRole: "medical_admin",
      action: "doctor_kyc_email_notification_failed",
      accessStatus: "failed",
      targetType: "doctor",
      targetId: doctorId,
      doctorId,
      reason: emailResult.reason,
    });
  }

  revalidateAdminReviewPaths(doctorId);
  redirect(appendUpdatedParam(redirectTo, "rejected"));
}

async function loadDoctor(doctorId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctors")
    .select("doctor_id,email,full_name")
    .eq("doctor_id", doctorId)
    .single();

  if (error) throw error;
  return data;
}

function safeAdminRedirect(value: string, fallback: string) {
  if (!value.startsWith("/admin/")) return fallback;
  if (value.startsWith("//") || value.includes("://")) return fallback;
  return value;
}

function appendUpdatedParam(path: string, status: "approved" | "rejected") {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}updated=${status}`;
}

function revalidateAdminReviewPaths(doctorId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/approval");
  revalidatePath("/admin/doctors");
  revalidatePath(`/admin/doctors/${doctorId}`);
}
