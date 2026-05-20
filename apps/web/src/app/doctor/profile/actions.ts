"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireDoctorRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { updateDoctorLetters, updateDoctorProfile } from "@/lib/profile/service";
import { profileUpdateErrorMessage } from "@/lib/profile/errors";
import { readSelectedProfilePhotoFile } from "@/lib/profile/form-file";
import type { ProfileFormState } from "@/lib/profile/form-state";
import type { KycDocumentType } from "@/lib/kyc/service";

export async function updateDoctorProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  try {
    await updateDoctorProfile(role, {
      fullName: readText(formData, "full_name"),
      specialization: readText(formData, "specialization"),
      phoneNumber: readText(formData, "phone_number"),
      profilePhoto: readSelectedProfilePhotoFile(formData, "profile_photo"),
    });
  } catch (error) {
    return {
      status: "error",
      message: profileUpdateErrorMessage(error, copy.profile.photo.uploadErrors),
    };
  }

  revalidatePath("/doctor/profile");
  revalidatePath("/doctor/status");
  redirect("/doctor/profile?saved=profile");
}

export async function updateDoctorLettersAction(formData: FormData) {
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  const files: Partial<Record<KycDocumentType, File>> = {};
  for (const documentType of ["str", "sip", "ktp"] as const) {
    const file = formData.get(documentType);
    if (file instanceof File && file.size > 0) files[documentType] = file;
  }

  await updateDoctorLetters(role, files);

  revalidatePath("/doctor/profile");
  revalidatePath("/doctor/status");
  redirect("/doctor/profile?saved=letters");
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
