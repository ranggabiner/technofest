"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { updatePatientAccountSettings, updatePatientProfiling } from "@/lib/profile/service";

export async function updatePatientAccountSettingsAction(formData: FormData) {
  const role = await requireRole();
  if (role.kind !== "patient") redirect("/login?error=unauthorized");

  await updatePatientAccountSettings(role, {
    fullName: readText(formData, "full_name"),
    dateOfBirth: readText(formData, "date_of_birth"),
    gender: readText(formData, "gender"),
  });

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
