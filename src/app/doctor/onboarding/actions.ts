"use server";

import { redirect } from "next/navigation";

import { requireDoctorRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeEncryptedKycFile, type KycDocumentType } from "@/lib/kyc/service";

export async function submitDoctorKycAction(formData: FormData) {
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  const fullName = requiredText(formData, "full_name");
  const specialization = requiredText(formData, "specialization");
  const phoneNumber = requiredText(formData, "phone_number");
  const admin = createAdminClient();

  const update = await admin
    .from("doctors")
    .update({
      full_name: fullName,
      specialization,
      phone_number: phoneNumber,
      account_status: "pending",
      rejection_reason: null,
      qr_code_token: null,
      doctor_access_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doctor_id", role.doctorId);

  if (update.error) throw update.error;

  for (const documentType of ["str", "sip", "ktp"] as KycDocumentType[]) {
    const file = formData.get(documentType);
    if (!(file instanceof File)) {
      throw new Error(`Dokumen ${documentType.toUpperCase()} wajib diunggah`);
    }

    await storeEncryptedKycFile({
      doctorId: role.doctorId,
      authUserId: role.authUserId,
      documentType,
      file,
    });
  }

  redirect("/doctor/status?submitted=1");
}

function requiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} wajib diisi`);
  return value;
}
