import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseAdminEmailAllowlist, requireEnv } from "@/lib/config/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { parseAuthIntent, roleIntentCookie } from "./intent";
import {
  resolveRoleFromRows,
  roleHomePath,
  type AdminRow,
  type DoctorRow,
  type PatientRow,
  type ResolvedRole,
} from "./roles";

type RoleRows = {
  patient: PatientRow | null;
  doctor: DoctorRow | null;
  admin: AdminRow | null;
};

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentRole(): Promise<ResolvedRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return ensureRoleForUser(user);
}

export async function requireRole(): Promise<ResolvedRole> {
  const role = await getCurrentRole();
  if (!role) redirect("/login");
  return role;
}

export async function requireAdminRole() {
  const role = await requireRole();
  if (role.kind !== "medical_admin") redirect("/login?error=unauthorized");
  return role;
}

export async function requireDoctorRole() {
  const role = await requireRole();
  if (role.kind !== "doctor") redirect("/login?error=unauthorized");
  return role;
}

type EnsureRoleOptions = {
  clearIntentCookie?: boolean;
};

export async function ensureRoleForUser(
  user: User,
  options: EnsureRoleOptions = {},
): Promise<ResolvedRole> {
  const env = requireEnv(["core"]);
  const cookieStore = await cookies();
  const intent = parseAuthIntent(cookieStore.get(roleIntentCookie)?.value);
  const email = user.email?.toLowerCase();
  const fullName = displayNameFromUser(user);

  if (!email) {
    throw new Error("Google account did not return an email");
  }

  const admin = createAdminClient();
  const rows = await loadRoleRows(user.id);
  const adminAllowlist = parseAdminEmailAllowlist(env.data.ADMIN_EMAIL_ALLOWLIST);
  const role = resolveRoleFromRows({
    authUserId: user.id,
    email,
    fullName,
    adminAllowlist,
    intent,
    ...rows,
  });

  if (role.kind === "medical_admin" && !rows.admin) {
    const { error } = await admin.from("medical_admins").insert({
      auth_user_id: user.id,
      email,
      full_name: fullName,
    });
    if (error) throw error;
  }

  if (role.kind === "doctor" && !rows.doctor) {
    const { error } = await admin.from("doctors").insert({
      auth_user_id: user.id,
      email,
      full_name: fullName,
      account_status: "pending",
    });
    if (error) throw error;
  }

  if (role.kind === "patient" && !rows.patient) {
    const { error } = await admin.from("patients").insert({
      auth_user_id: user.id,
      email,
      full_name: fullName,
    });
    if (error) throw error;
  }

  if (options.clearIntentCookie) {
    cookieStore.delete(roleIntentCookie);
  }

  const refreshed = await loadRoleRows(user.id);

  return resolveRoleFromRows({
    authUserId: user.id,
    email,
    fullName,
    adminAllowlist,
    intent,
    ...refreshed,
  });
}

export async function redirectToRoleHome() {
  const role = await requireRole();
  redirect(roleHomePath(role));
}

async function loadRoleRows(authUserId: string): Promise<RoleRows> {
  const admin = createAdminClient();
  const [patient, doctor, medicalAdmin] = await Promise.all([
    admin
      .from("patients")
      .select("patient_id,email,full_name")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    admin
      .from("doctors")
      .select("doctor_id,email,full_name,account_status,rejection_reason")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    admin
      .from("medical_admins")
      .select("admin_id,email,full_name")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
  ]);

  if (patient.error) throw patient.error;
  if (doctor.error) throw doctor.error;
  if (medicalAdmin.error) throw medicalAdmin.error;

  return {
    patient: patient.data as PatientRow | null,
    doctor: doctor.data as DoctorRow | null,
    admin: medicalAdmin.data as AdminRow | null,
  };
}

function displayNameFromUser(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;
  const name = metadata.full_name ?? metadata.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "Pengguna MedProof";
}
