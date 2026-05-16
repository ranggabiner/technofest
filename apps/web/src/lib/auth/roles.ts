export type AuthIntent = "patient" | "doctor" | null;
export type UserRoleName = "patient" | "doctor" | "admin";
export type DoctorStatus = "pending" | "approved" | "rejected";
export type PatientOnboardingStep = "basic" | "health" | "ai_consent" | "complete";
export type DoctorOnboardingStep = "profile" | "documents" | "review" | "complete";

export type PatientRow = {
  patient_id: string;
  email: string;
  full_name: string;
  onboarding_step?: PatientOnboardingStep | string | null;
  onboarding_completed_at?: string | null;
};

export type DoctorRow = {
  doctor_id: string;
  email: string;
  full_name: string;
  account_status: DoctorStatus;
  rejection_reason: string | null;
  onboarding_step?: DoctorOnboardingStep | string | null;
  onboarding_completed_at?: string | null;
};

export type AdminRow = {
  admin_id: string;
  email: string;
  full_name: string;
};

export type RoleResolutionInput = {
  authUserId: string;
  email: string;
  fullName: string;
  adminAllowlist: string[];
  intent: AuthIntent;
  patient: PatientRow | null;
  doctor: DoctorRow | null;
  admin: AdminRow | null;
};

export type ResolvedRole =
  | {
      kind: "medical_admin";
      authUserId: string;
      adminId: string | null;
      email: string;
      fullName: string;
    }
  | {
      kind: "doctor";
      authUserId: string;
      doctorId: string | null;
      status: DoctorStatus;
      email: string;
      fullName: string;
      rejectionReason: string | null;
      onboardingStep: DoctorOnboardingStep;
      onboardingCompletedAt: string | null;
      canAccessDoctorFeatures: boolean;
    }
  | {
      kind: "patient";
      authUserId: string;
      patientId: string | null;
      email: string;
      fullName: string;
      onboardingStep: PatientOnboardingStep;
      onboardingCompletedAt: string | null;
    };

export function resolveRoleFromRows(input: RoleResolutionInput): ResolvedRole | null {
  const email = input.email.trim().toLowerCase();
  const adminEmailSet = new Set(input.adminAllowlist.map((item) => item.trim().toLowerCase()));

  if (adminEmailSet.has(email)) {
    return {
      kind: "medical_admin",
      authUserId: input.authUserId,
      adminId: input.admin?.admin_id ?? null,
      email,
      fullName: input.admin?.full_name ?? input.fullName,
    };
  }

  if (input.doctor) {
    const status = input.doctor.account_status;

    return {
      kind: "doctor",
      authUserId: input.authUserId,
      doctorId: input.doctor.doctor_id,
      status,
      email,
      fullName: input.doctor.full_name,
      rejectionReason: input.doctor.rejection_reason,
      onboardingStep: normalizeDoctorOnboardingStep(input.doctor.onboarding_step),
      onboardingCompletedAt: input.doctor.onboarding_completed_at ?? null,
      canAccessDoctorFeatures: status === "approved",
    };
  }

  if (input.patient) {
    return {
      kind: "patient",
      authUserId: input.authUserId,
      patientId: input.patient.patient_id,
      email,
      fullName: input.patient.full_name,
      onboardingStep: normalizePatientOnboardingStep(input.patient.onboarding_step),
      onboardingCompletedAt: input.patient.onboarding_completed_at ?? null,
    };
  }

  return null;
}

export function roleHomePath(role: ResolvedRole): string {
  if (role.kind === "medical_admin") return "/admin/doctors";
  if (role.kind === "doctor") {
    return role.status === "approved" ? "/doctor" : "/doctor/status";
  }
  return "/patient";
}

export function userRoleName(role: ResolvedRole): UserRoleName {
  if (role.kind === "medical_admin") return "admin";
  return role.kind;
}

export function roleEntryPath(role: ResolvedRole): string {
  return roleOnboardingPath(role) ?? roleHomePath(role);
}

export function publicRouteRedirectPath(role: ResolvedRole | null): string | null {
  return role ? roleEntryPath(role) : null;
}

export function roleOnboardingPath(role: ResolvedRole): string | null {
  if (role.kind === "patient") {
    if (role.onboardingStep === "complete" && role.onboardingCompletedAt) return null;
    return patientOnboardingPath(role.onboardingStep);
  }

  if (role.kind === "doctor") {
    if (role.status === "approved") return null;
    if (role.onboardingStep === "complete" && role.onboardingCompletedAt) return null;
    return doctorOnboardingPath(role.onboardingStep);
  }

  return null;
}

export function patientOnboardingPath(step: PatientOnboardingStep): string {
  if (step === "health") return "/patient/onboarding/step-2";
  if (step === "ai_consent") return "/patient/onboarding/step-3";
  if (step === "complete") return "/patient";
  return "/patient/onboarding/step-1";
}

export function doctorOnboardingPath(step: DoctorOnboardingStep): string {
  if (step === "documents") return "/doctor/onboarding/step-2";
  if (step === "review") return "/doctor/onboarding/step-3";
  if (step === "complete") return "/doctor/status";
  return "/doctor/onboarding/step-1";
}

function normalizePatientOnboardingStep(value: string | null | undefined): PatientOnboardingStep {
  if (value === "health" || value === "ai_consent" || value === "complete") return value;
  return "basic";
}

function normalizeDoctorOnboardingStep(value: string | null | undefined): DoctorOnboardingStep {
  if (value === "documents" || value === "review" || value === "complete") return value;
  return "profile";
}
