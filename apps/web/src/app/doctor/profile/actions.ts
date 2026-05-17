"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireDoctorRole } from "@/lib/auth/session";
import { updateDoctorLetters, updateDoctorProfile } from "@/lib/profile/service";
import type { KycDocumentType } from "@/lib/kyc/service";

export async function updateDoctorProfileAction(formData: FormData) {
  const role = await requireDoctorRole();
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  await updateDoctorProfile(role, {
    fullName: readText(formData, "full_name"),
    specialization: readText(formData, "specialization"),
    phoneNumber: readText(formData, "phone_number"),
  });

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
