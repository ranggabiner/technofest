"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireDoctorRole } from "@/lib/auth/session";
import { fillTemplate } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasRequiredKycDocuments,
  loadKycDocumentSummary,
  loadKycDocumentTypes,
  requiredKycDocumentTypes,
  storeEncryptedKycFile,
  type KycDocumentType,
} from "@/lib/kyc/service";
import type { KycDocumentSummary } from "@/lib/kyc/summaries";
import { kycUploadErrorMessage } from "@/lib/kyc/upload-errors";

export type UploadDoctorKycDocumentResult =
  | { ok: true; document: KycDocumentSummary }
  | { ok: false; message: string };

export type ContinueDoctorDocumentsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveDoctorProfileStepAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  const fullName = requiredText(formData, "full_name", copy.doctor.onboarding.fullName, copy.doctor.onboarding.requiredField);
  const ageYears = readNumber(formData, "age_years");
  const gender = requiredText(formData, "gender", copy.doctor.onboarding.gender, copy.doctor.onboarding.requiredField);
  const specialization = requiredText(
    formData,
    "specialization",
    copy.doctor.onboarding.specialization,
    copy.doctor.onboarding.requiredField,
  );
  const phoneNumber = requiredText(formData, "phone_number", copy.doctor.onboarding.phone, copy.doctor.onboarding.requiredField);

  if (!Number.isInteger(ageYears) || ageYears < 18 || ageYears > 120) {
    throw new Error(copy.doctor.onboarding.invalidAge);
  }

  const admin = createAdminClient();

  const update = await admin
    .from("doctors")
    .update({
      full_name: fullName,
      age_years: ageYears,
      gender,
      specialization,
      phone_number: phoneNumber,
      account_status: "pending",
      rejection_reason: null,
      qr_code_token: null,
      doctor_access_code: null,
      onboarding_step: "documents",
      onboarding_completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doctor_id", role.doctorId);

  if (update.error) throw update.error;

  revalidatePath("/doctor/onboarding");
  revalidatePath("/doctor/status");
  redirect("/doctor/onboarding/step-2");
}

export async function saveDoctorDocumentsStepAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  for (const documentType of requiredKycDocumentTypes) {
    const file = formData.get(documentType);
    if (!(file instanceof File)) {
      throw new Error(fillTemplate(copy.doctor.onboarding.documentRequired, { document: documentType.toUpperCase() }));
    }

    await storeEncryptedKycFile({
      doctorId: role.doctorId,
      authUserId: role.authUserId,
      documentType,
      file,
    });
  }

  const admin = createAdminClient();
  const update = await admin
    .from("doctors")
    .update({
      onboarding_step: "review",
      onboarding_completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doctor_id", role.doctorId);

  if (update.error) throw update.error;

  revalidatePath("/doctor/onboarding");
  redirect("/doctor/onboarding/step-3");
}

export async function uploadDoctorKycDocumentAction(
  documentType: KycDocumentType,
  formData: FormData,
): Promise<UploadDoctorKycDocumentResult> {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  if (!role.doctorId) return { ok: false, message: copy.doctor.onboarding.uploadErrors.unknown };
  if (!isKycDocumentType(documentType)) {
    return { ok: false, message: copy.doctor.onboarding.uploadErrors.unsupported_type };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, message: copy.doctor.onboarding.uploadErrors.empty_file };
  }

  try {
    await storeEncryptedKycFile({
      doctorId: role.doctorId,
      authUserId: role.authUserId,
      documentType,
      file,
    });
    const document = await loadKycDocumentSummary({ doctorId: role.doctorId, documentType });

    revalidatePath("/doctor/onboarding");
    revalidatePath("/doctor/onboarding/step-2");
    revalidatePath("/doctor/onboarding/step-3");

    return { ok: true, document };
  } catch (error) {
    return {
      ok: false,
      message: kycUploadErrorMessage(error, copy.doctor.onboarding.uploadErrors),
    };
  }
}

export async function continueDoctorDocumentsStepAction(): Promise<ContinueDoctorDocumentsResult> {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  if (!role.doctorId) return { ok: false, message: copy.doctor.onboarding.uploadPreview.continueError };

  const documentTypes = await loadKycDocumentTypes(role.doctorId);
  if (!hasRequiredKycDocuments(documentTypes)) {
    return { ok: false, message: copy.doctor.onboarding.uploadPreview.continueBlocked };
  }

  const admin = createAdminClient();
  const update = await admin
    .from("doctors")
    .update({
      onboarding_step: "review",
      onboarding_completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doctor_id", role.doctorId);

  if (update.error) throw update.error;

  revalidatePath("/doctor/onboarding");
  return { ok: true };
}

export async function completeDoctorOnboardingAction() {
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  const documentTypes = await loadKycDocumentTypes(role.doctorId);
  if (!hasRequiredKycDocuments(documentTypes)) redirect("/doctor/onboarding/step-2");

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const update = await admin
    .from("doctors")
    .update({
      account_status: "pending",
      rejection_reason: null,
      qr_code_token: null,
      doctor_access_code: null,
      onboarding_step: "complete",
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq("doctor_id", role.doctorId);

  if (update.error) throw update.error;

  revalidatePath("/doctor/status");
  revalidatePath("/doctor/onboarding");
  redirect("/doctor/status?submitted=1");
}

function requiredText(formData: FormData, key: string, field: string, template: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(fillTemplate(template, { field }));
  return value;
}

function readNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return Number.NaN;
  return Number(raw);
}

function isKycDocumentType(value: string): value is KycDocumentType {
  return (requiredKycDocumentTypes as readonly string[]).includes(value);
}
