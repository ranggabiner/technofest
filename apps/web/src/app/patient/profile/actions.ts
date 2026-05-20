"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { profileUpdateErrorMessage } from "@/lib/profile/errors";
import { readSelectedProfilePhotoFile } from "@/lib/profile/form-file";
import type { ProfileFormState } from "@/lib/profile/form-state";
import { updatePatientAccountSettings, updatePatientProfiling } from "@/lib/profile/service";

export async function updatePatientAccountSettingsAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") redirect("/login?error=unauthorized");

  try {
    await updatePatientAccountSettings(role, {
      fullName: readText(formData, "full_name"),
      dateOfBirth: readText(formData, "date_of_birth"),
      gender: readText(formData, "gender"),
      profilePhoto: readSelectedProfilePhotoFile(formData, "profile_photo"),
    });
  } catch (error) {
    return {
      status: "error",
      message: profileUpdateErrorMessage(error, copy.profile.photo.uploadErrors),
    };
  }

  revalidatePath("/patient/profile");
  revalidatePath("/patient");
  redirect("/patient/profile?saved=1");
}

export async function updatePatientProfilingAction(formData: FormData) {
  const role = await requireRole();
  if (role.kind !== "patient") redirect("/login?error=unauthorized");

  await updatePatientProfiling(role, {
    activityLevel: readText(formData, "activity_level"),
    sleepHours: readText(formData, "sleep_hours"),
    currentFeeling: readText(formData, "current_feeling"),
    livingEnvironment: readText(formData, "living_environment"),
    allergies: readText(formData, "allergies"),
    knownHistory: readText(formData, "known_history"),
    discoveredFrom: readText(formData, "discovered_from"),
  });

  revalidatePath("/patient/profile/profiling");
  revalidatePath("/patient/chat");
  redirect("/patient/profile/profiling?saved=1");
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
