"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import {
  acceptAiConsent,
  finalizeActiveAiSession,
  savePatientProfiling,
} from "@/lib/ai/journal-service";

export async function acceptAiConsentAction() {
  const role = await requireRole();
  await acceptAiConsent(role);
  revalidatePath("/patient");
}

export async function saveProfilingAction(formData: FormData) {
  const role = await requireRole();

  await savePatientProfiling(role, {
    ageOrBirthDate: readText(formData, "age_or_birth_date"),
    currentCondition: readText(formData, "current_condition"),
    dailyActivity: readText(formData, "daily_activity"),
    lifestyleContext: readText(formData, "lifestyle_context"),
    knownHistory: readText(formData, "known_history"),
    discoveredFrom: readText(formData, "discovered_from"),
  });

  revalidatePath("/patient");
}

export async function finishAiSessionAction() {
  const role = await requireRole();

  try {
    await finalizeActiveAiSession(role, "manual_end");
  } catch {
    redirect("/patient?ai_error=finalize_failed");
  }

  revalidatePath("/patient");
  redirect("/patient");
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
