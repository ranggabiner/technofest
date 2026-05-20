"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createOrReplaceDoctorGrant,
  getRequestIp,
  isLongExpiry,
  revokeDoctorGrant,
} from "@/lib/access/doctor-access";
import { isActiveDoctorAccessSessionError } from "@/lib/access/grants";
import { parseScope2DateRangeFilter } from "@/lib/access/granular-grants";
import { requireRole } from "@/lib/auth/session";
import {
  acceptAiConsent,
  finishPatientChatSession,
  retryAiSessionSummaryGeneration,
  savePatientProfiling,
} from "@/lib/ai/journal-service";
import { getDictionary } from "@/lib/i18n/server";

export async function acceptAiConsentAction() {
  const role = await requireRole();
  await acceptAiConsent(role);
  revalidatePath("/patient");
  revalidatePath("/patient/chat");
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
  revalidatePath("/patient/chat");
}

export async function finishAiSessionAction(sessionId: string) {
  const role = await requireRole();
  const detail = await finishPatientChatSession(role, sessionId);

  revalidatePath("/patient");
  revalidatePath("/patient/chat");

  return detail;
}

export async function retryAiSessionSummaryAction(sessionId: string) {
  const role = await requireRole();
  const detail = await retryAiSessionSummaryGeneration(role, sessionId);

  revalidatePath("/patient");
  revalidatePath("/patient/chat");

  return detail;
}

export async function grantDoctorAccessAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireRole();
  const expiresAt = readText(formData, "expires_at");
  const longExpiryConfirmed = readCheckbox(formData, "confirm_long_expiry");
  const headerList = await headers();

  try {
    if (isLongExpiry(expiresAt) && !longExpiryConfirmed) {
      throw new Error(copy.patient.access.longExpiryError);
    }

    await createOrReplaceDoctorGrant(
      role,
      {
        doctorId: readText(formData, "doctor_id"),
        canViewScope1: readCheckbox(formData, "can_view_scope1"),
        canViewScope2Mental: readCheckbox(formData, "can_view_scope2_mental"),
        canViewScope2Physical: readCheckbox(formData, "can_view_scope2_physical"),
        attachmentRecordIds: readAllText(formData, "attachment_record_ids"),
        scope2MentalFilter: parseScope2DateRangeFilter(
          readText(formData, "scope2_mental_start_date"),
          readText(formData, "scope2_mental_end_date"),
        ),
        scope2PhysicalFilter: parseScope2DateRangeFilter(
          readText(formData, "scope2_physical_start_date"),
          readText(formData, "scope2_physical_end_date"),
        ),
        expiresAt,
      },
      getRequestIp(headerList),
    );
  } catch (error) {
    const message = isActiveDoctorAccessSessionError(error)
      ? copy.patient.access.activeSessionAlreadyExists
      : readErrorMessage(error, copy.patient.access.actionFailed);
    redirect(`/patient/access?access_error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/patient");
  revalidatePath("/patient/access");
  redirect("/patient/access?access_status=granted");
}

export async function revokeDoctorAccessAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireRole();
  const headerList = await headers();

  try {
    await revokeDoctorGrant(
      role,
      {
        grantId: readText(formData, "grant_id"),
      },
      getRequestIp(headerList),
    );
  } catch (error) {
    redirect(`/patient/access?access_error=${encodeURIComponent(readErrorMessage(error, copy.patient.access.actionFailed))}`);
  }

  revalidatePath("/patient");
  revalidatePath("/patient/access");
  redirect("/patient/access?access_status=revoked");
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readCheckbox(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function readAllText(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value).trim()).filter(Boolean);
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
