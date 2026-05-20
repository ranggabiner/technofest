import "server-only";

import { requireEnv } from "@/lib/config/env";
import { decryptString, encryptString } from "@/lib/crypto/server";
import { loadKycDocumentSummaries, storeEncryptedKycFile, type KycDocumentType } from "@/lib/kyc/service";
import { replaceProfilePhoto } from "@/lib/profile/photo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { ResolvedRole } from "@/lib/auth/roles";

type PatientRow = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  | "patient_id"
  | "full_name"
  | "email"
  | "date_of_birth"
  | "profile_photo_url"
  | "profiling_data_ciphertext"
  | "profiling_data_iv"
  | "profiling_data_tag"
  | "key_version"
>;

type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

const genderValues = new Set(["male", "female", "other", "prefer_not_to_say"]);

export type PatientProfileState = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  profiling: {
    activityLevel: string;
    sleepHours: string;
    currentFeeling: string;
    livingEnvironment: string;
    allergies: string;
    knownHistory: string;
    discoveredFrom: string;
  };
};

export async function loadPatientProfileState(role: ResolvedRole): Promise<PatientProfileState> {
  const patientId = requirePatientId(role);
  const { data, error } = await createAdminClient()
    .from("patients")
    .select(
      "patient_id,full_name,email,date_of_birth,profile_photo_url,profiling_data_ciphertext,profiling_data_iv,profiling_data_tag,key_version",
    )
    .eq("patient_id", patientId)
    .single();

  if (error) throw error;

  const profile = parsePatientProfile(decryptPatientProfile(data));
  const basic = readRecord(profile.onboarding_basic);
  const health = readRecord(profile.onboarding_health);

  return {
    fullName: data.full_name,
    email: data.email,
    dateOfBirth: data.date_of_birth ?? "",
    gender: readString(basic.gender),
    profiling: {
      activityLevel: readString(health.activity_level),
      sleepHours: readString(health.sleep_hours),
      currentFeeling: readString(health.current_feeling),
      livingEnvironment: readString(health.living_environment),
      allergies: readString(health.allergies),
      knownHistory: readString(profile.known_history),
      discoveredFrom: readString(profile.discovered_from),
    },
  };
}

export async function updatePatientAccountSettings(
  role: ResolvedRole,
  input: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    profilePhoto?: File | null;
  },
) {
  const patientId = requirePatientId(role);
  const fullName = input.fullName.trim();
  const dateOfBirth = normalizeDate(input.dateOfBirth);
  const gender = normalizeGender(input.gender);

  if (!fullName) throw new Error("Nama lengkap wajib diisi");

  await saveWithOptionalProfilePhoto(role, input.profilePhoto, async (profilePhotoUrl) => {
    await savePatientProfilePatch(
      patientId,
      {
        onboarding_basic: {
          gender,
        },
      },
      {
        full_name: fullName,
        date_of_birth: dateOfBirth,
        ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {}),
        updated_at: new Date().toISOString(),
      },
    );
  });
}

export async function updatePatientProfiling(
  role: ResolvedRole,
  input: {
    activityLevel: string;
    sleepHours: string;
    currentFeeling: string;
    livingEnvironment: string;
    allergies: string;
    knownHistory: string;
    discoveredFrom: string;
  },
) {
  const patientId = requirePatientId(role);

  await savePatientProfilePatch(
    patientId,
    {
      onboarding_health: {
        activity_level: input.activityLevel.trim(),
        sleep_hours: input.sleepHours.trim(),
        current_feeling: input.currentFeeling.trim(),
        living_environment: input.livingEnvironment.trim(),
        allergies: input.allergies.trim(),
      },
      known_history: input.knownHistory.trim(),
      discovered_from: input.discoveredFrom.trim(),
    },
    {
      updated_at: new Date().toISOString(),
    },
  );
}

export async function loadDoctorProfileState(role: ResolvedRole) {
  const doctorId = requireDoctorId(role);
  const fallbackStatus = role.kind === "doctor" ? role.status : "pending";
  const [doctor, documents] = await Promise.all([
    createAdminClient()
      .from("doctors")
      .select("full_name,email,phone_number,specialization,account_status,age_years,gender")
      .eq("doctor_id", doctorId)
      .single(),
    loadKycDocumentSummaries(doctorId),
  ]);

  if (doctor.error) throw doctor.error;
  const doctorData = doctor.data;

  return {
    doctor: {
      ...doctorData,
      full_name: readString(doctorData.full_name) || role.fullName,
      email: readString(doctorData.email) || role.email,
      phone_number: readNullableString(doctorData.phone_number),
      specialization: readNullableString(doctorData.specialization),
      account_status: readString(doctorData.account_status) || fallbackStatus,
      gender: readNullableString(doctorData.gender),
    },
    documents,
  };
}

export async function updateDoctorProfile(
  role: ResolvedRole,
  input: {
    fullName: string;
    specialization: string;
    phoneNumber: string;
    profilePhoto?: File | null;
  },
) {
  const doctorId = requireDoctorId(role);
  const fullName = input.fullName.trim();
  const specialization = input.specialization.trim();
  const phoneNumber = input.phoneNumber.trim();

  if (!fullName) throw new Error("Nama dokter wajib diisi");

  await saveWithOptionalProfilePhoto(role, input.profilePhoto, async (profilePhotoUrl) => {
    const { error } = await createAdminClient()
      .from("doctors")
      .update({
        full_name: fullName,
        specialization: specialization || null,
        phone_number: phoneNumber || null,
        ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {}),
        account_status: "pending",
        rejection_reason: null,
        qr_code_token: null,
        doctor_access_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("doctor_id", doctorId);

    if (error) throw error;
  });
}

export async function updateDoctorLetters(
  role: ResolvedRole,
  files: Partial<Record<KycDocumentType, File>>,
) {
  const doctorId = requireDoctorId(role);
  let changed = false;

  for (const documentType of ["str", "sip", "ktp"] as const) {
    const file = files[documentType];
    if (!file || file.size <= 0) continue;
    await storeEncryptedKycFile({
      doctorId,
      authUserId: role.authUserId,
      documentType,
      file,
    });
    changed = true;
  }

  if (!changed) return;

  const { error } = await createAdminClient()
    .from("doctors")
    .update({
      account_status: "pending",
      rejection_reason: null,
      qr_code_token: null,
      doctor_access_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doctor_id", doctorId);

  if (error) throw error;
}

export async function loadAdminProfileState(role: ResolvedRole) {
  const adminId = requireAdminId(role);
  const { data, error } = await createAdminClient()
    .from("medical_admins")
    .select("full_name,email,phone_number")
    .eq("admin_id", adminId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdminProfile(
  role: ResolvedRole,
  input: {
    fullName: string;
    phoneNumber: string;
    profilePhoto?: File | null;
  },
) {
  const adminId = requireAdminId(role);
  const fullName = input.fullName.trim();
  const phoneNumber = input.phoneNumber.trim();

  if (!fullName) throw new Error("Nama admin wajib diisi");

  await saveWithOptionalProfilePhoto(role, input.profilePhoto, async (profilePhotoUrl) => {
    const { error } = await createAdminClient()
      .from("medical_admins")
      .update({
        full_name: fullName,
        phone_number: phoneNumber || null,
        ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("admin_id", adminId);

    if (error) throw error;
  });
}

async function saveWithOptionalProfilePhoto(
  role: ResolvedRole,
  file: File | null | undefined,
  saveProfile: (profilePhotoUrl: string | null) => Promise<void>,
) {
  if (!isSelectedProfilePhotoFile(file)) {
    await saveProfile(null);
    return;
  }

  await replaceProfilePhoto({
    authUserId: role.authUserId,
    file,
    previousPhotoUrl: role.avatarUrl,
    savePhotoUrl: saveProfile,
  });
}

function isSelectedProfilePhotoFile(file: File | null | undefined): file is File {
  return file instanceof File && (file.size > 0 || file.name.trim() !== "");
}

async function savePatientProfilePatch(
  patientId: string,
  patch: Record<string, unknown>,
  update: PatientUpdate,
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patients")
    .select("patient_id,full_name,email,date_of_birth,profile_photo_url,profiling_data_ciphertext,profiling_data_iv,profiling_data_tag,key_version")
    .eq("patient_id", patientId)
    .single();

  if (error) throw error;

  const current = parsePatientProfile(decryptPatientProfile(data));
  const encrypted = encryptString(
    JSON.stringify(mergePatientProfile(current, patch)),
    requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY,
  );

  const result = await admin
    .from("patients")
    .update({
      ...update,
      profiling_data_ciphertext: encrypted.ciphertext,
      profiling_data_iv: encrypted.iv,
      profiling_data_tag: encrypted.tag,
      key_version: encrypted.keyVersion,
    })
    .eq("patient_id", patientId);

  if (result.error) throw result.error;
}

function decryptPatientProfile(patient: PatientRow) {
  if (!patient.profiling_data_ciphertext || !patient.profiling_data_iv || !patient.profiling_data_tag) {
    return null;
  }

  return decryptString(
    {
      ciphertext: patient.profiling_data_ciphertext,
      iv: patient.profiling_data_iv,
      tag: patient.profiling_data_tag,
      keyVersion: patient.key_version,
    },
    requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY,
  );
}

function parsePatientProfile(value: string | null) {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function mergePatientProfile(current: Record<string, unknown>, patch: Record<string, unknown>) {
  return {
    ...current,
    ...patch,
    onboarding_basic: {
      ...readRecord(current.onboarding_basic),
      ...readRecord(patch.onboarding_basic),
    },
    onboarding_health: {
      ...readRecord(current.onboarding_health),
      ...readRecord(patch.onboarding_health),
    },
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readString(value: unknown) {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown) {
  const text = readString(value).trim();
  return text || null;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) throw new Error("Tanggal lahir tidak valid");

  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    throw new Error("Tanggal lahir tidak valid");
  }

  return trimmed;
}

function normalizeGender(value: string) {
  const trimmed = value.trim();
  if (!genderValues.has(trimmed)) throw new Error("Gender wajib dipilih");
  return trimmed;
}

function requirePatientId(role: ResolvedRole) {
  if (role.kind !== "patient" || !role.patientId) throw new Error("Akses pasien wajib digunakan");
  return role.patientId;
}

function requireDoctorId(role: ResolvedRole) {
  if (role.kind !== "doctor" || !role.doctorId) throw new Error("Akses dokter wajib digunakan");
  return role.doctorId;
}

function requireAdminId(role: ResolvedRole) {
  if (role.kind !== "medical_admin" || !role.adminId) throw new Error("Akses admin wajib digunakan");
  return role.adminId;
}
