"use server";

import { revalidatePath } from "next/cache";

import { requireDoctorRole } from "@/lib/auth/session";
import {
  DoctorAccessError,
  createScope1Record,
  loadDoctorGrantPageState,
  type DoctorGrantPageState,
} from "@/lib/doctor-records/service";
import { getDictionary } from "@/lib/i18n/server";

export type DoctorGrantModalStateResult =
  | { ok: true; state: DoctorGrantPageState }
  | { ok: false; error: string };

export async function loadDoctorGrantModalStateAction(
  grantId: string,
): Promise<DoctorGrantModalStateResult> {
  const role = await requireDoctorRole();
  const copy = await getDictionary();

  try {
    return {
      ok: true,
      state: await loadDoctorGrantPageState(role, grantId),
    };
  } catch (error) {
    if (error instanceof DoctorAccessError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: copy.doctor.dashboard.modalLoadFailed };
  }
}

export type CreateScope1RecordDashboardResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string };

export async function createScope1RecordFromDashboardAction(
  formData: FormData,
): Promise<CreateScope1RecordDashboardResult> {
  const copy = await getDictionary();
  const role = await requireDoctorRole();
  const grantId = readText(formData, "grant_id");

  try {
    const recordId = await createScope1Record(role, {
      grantId,
      recordType: readText(formData, "record_type"),
      title: readText(formData, "title"),
      description: readText(formData, "description"),
      amendsRecordId: readText(formData, "amends_record_id"),
      attachment: readFile(formData, "attachment"),
    });
    revalidatePath("/doctor");
    revalidatePath(`/doctor/grants/${grantId}`);
    return { ok: true, recordId };
  } catch (error) {
    return { ok: false, error: readError(error, copy.doctor.grant.saveFailed) };
  }
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
