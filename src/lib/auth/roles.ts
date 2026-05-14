export type AuthIntent = "patient" | "doctor" | null;
export type DoctorStatus = "pending" | "approved" | "rejected";

export type PatientRow = {
  patient_id: string;
  email: string;
  full_name: string;
};

export type DoctorRow = {
  doctor_id: string;
  email: string;
  full_name: string;
  account_status: DoctorStatus;
  rejection_reason: string | null;
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
      canAccessDoctorFeatures: boolean;
    }
  | {
      kind: "patient";
      authUserId: string;
      patientId: string | null;
      email: string;
      fullName: string;
    };

export function resolveRoleFromRows(input: RoleResolutionInput): ResolvedRole {
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

  if (input.intent === "doctor" || input.doctor) {
    const status = input.doctor?.account_status ?? "pending";

    return {
      kind: "doctor",
      authUserId: input.authUserId,
      doctorId: input.doctor?.doctor_id ?? null,
      status,
      email,
      fullName: input.doctor?.full_name ?? input.fullName,
      rejectionReason: input.doctor?.rejection_reason ?? null,
      canAccessDoctorFeatures: status === "approved",
    };
  }

  return {
    kind: "patient",
    authUserId: input.authUserId,
    patientId: input.patient?.patient_id ?? null,
    email,
    fullName: input.patient?.full_name ?? input.fullName,
  };
}

export function roleHomePath(role: ResolvedRole): string {
  if (role.kind === "medical_admin") return "/admin/doctors";
  if (role.kind === "doctor") {
    return role.status === "approved" ? "/doctor" : "/doctor/status";
  }
  return "/patient";
}
