"use server";

import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/audit";
import { requireAdminRole } from "@/lib/auth/session";
import { createDoctorAccessCode, createQrCodeToken } from "@/lib/doctors/codes";
import { sendDoctorStatusEmail } from "@/lib/email/resend";
import { getDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function approveDoctorAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireAdminRole();
  const doctorId = String(formData.get("doctor_id") ?? "");
  if (!doctorId) throw new Error(copy.admin.detail.doctorIdRequired);

  const admin = createAdminClient();
  const doctor = await loadDoctor(doctorId);

  let updateError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const update = await admin
      .from("doctors")
      .update({
        account_status: "approved",
        rejection_reason: null,
        verified_by: role.adminId,
        verified_at: new Date().toISOString(),
        qr_code_token: createQrCodeToken(),
        doctor_access_code: createDoctorAccessCode(),
        updated_at: new Date().toISOString(),
      })
      .eq("doctor_id", doctorId);

    if (!update.error) {
      updateError = null;
      break;
    }

    updateError = update.error;
    if (update.error.code !== "23505") break;
  }

  if (updateError) throw new Error(updateError.message ?? copy.admin.detail.approveFailed);

  await writeAuditLog({
    actorAuthUserId: role.authUserId,
    actorRole: "medical_admin",
    action: "admin_doctor_approved",
    accessStatus: "approved",
    targetType: "doctor",
    targetId: doctorId,
    doctorId,
  });

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

  redirect(`/admin/doctors/${doctorId}?updated=approved`);
}

export async function rejectDoctorAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireAdminRole();
  const doctorId = String(formData.get("doctor_id") ?? "");
  const rejectionReason = String(formData.get("rejection_reason") ?? "").trim();
  if (!doctorId || !rejectionReason) throw new Error(copy.admin.detail.rejectionReasonRequired);

  const admin = createAdminClient();
  const doctor = await loadDoctor(doctorId);
  const update = await admin
    .from("doctors")
    .update({
      account_status: "rejected",
      rejection_reason: rejectionReason,
      verified_by: role.adminId,
      verified_at: new Date().toISOString(),
      qr_code_token: null,
      doctor_access_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doctor_id", doctorId);

  if (update.error) throw update.error;

  await writeAuditLog({
    actorAuthUserId: role.authUserId,
    actorRole: "medical_admin",
    action: "admin_doctor_rejected",
    accessStatus: "rejected",
    targetType: "doctor",
    targetId: doctorId,
    doctorId,
    reason: "manual_rejection",
  });

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

  redirect(`/admin/doctors/${doctorId}?updated=rejected`);
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
