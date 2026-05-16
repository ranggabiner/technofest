"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import {
  completePatientOnboarding,
  savePatientBasicOnboarding,
  savePatientHealthOnboarding,
} from "@/lib/ai/journal-service";

export async function savePatientBasicOnboardingAction(formData: FormData) {
  const role = await requireRole();
  if (role.kind !== "patient") redirect("/login?error=unauthorized");

  await savePatientBasicOnboarding(role, {
    fullName: readText(formData, "full_name"),
    ageYears: readNumber(formData, "age_years"),
    gender: readText(formData, "gender"),
  });

  revalidatePath("/patient");
  revalidatePath("/patient/onboarding");
  redirect("/patient/onboarding/step-2");
}

export async function savePatientHealthOnboardingAction(formData: FormData) {
  const role = await requireRole();
  if (role.kind !== "patient") redirect("/login?error=unauthorized");

  await savePatientHealthOnboarding(role, {
    activityLevel: readText(formData, "activity_level"),
    sleepHours: readNumber(formData, "sleep_hours"),
    currentFeeling: readText(formData, "current_feeling"),
    livingEnvironment: readText(formData, "living_environment"),
    allergies: readText(formData, "allergies"),
  });

  revalidatePath("/patient");
  revalidatePath("/patient/onboarding");
  redirect("/patient/onboarding/step-3");
}

export async function completePatientOnboardingAction() {
  const role = await requireRole();
  if (role.kind !== "patient") redirect("/login?error=unauthorized");

  await completePatientOnboarding(role);

  revalidatePath("/patient");
  revalidatePath("/patient/chat");
  revalidatePath("/patient/onboarding");
  redirect("/patient");
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return Number.NaN;
  return Number(raw);
}
