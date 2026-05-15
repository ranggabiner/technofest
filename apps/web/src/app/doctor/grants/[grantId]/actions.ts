"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireDoctorRole } from "@/lib/auth/session";
import { createScope1Record } from "@/lib/doctor-records/service";
import { getDictionary } from "@/lib/i18n/server";

export async function createScope1RecordAction(formData: FormData) {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  const grantId = readText(formData, "grant_id");

  try {
    await createScope1Record(role, {
      grantId,
      recordType: readText(formData, "record_type"),
      title: readText(formData, "title"),
      description: readText(formData, "description"),
      amendsRecordId: readText(formData, "amends_record_id"),
      attachment: readFile(formData, "attachment"),
    });
  } catch (error) {
    redirect(`/doctor/grants/${grantId}?scope1_error=${encodeURIComponent(readError(error, copy.doctor.grant.saveFailed))}`);
  }

  revalidatePath(`/doctor/grants/${grantId}`);
  revalidatePath("/doctor");
  redirect(`/doctor/grants/${grantId}?scope1_status=saved`);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
