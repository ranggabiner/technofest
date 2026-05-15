import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseAdminEmailAllowlist, requireEnv } from "@/lib/config/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { roleIntentCookie } from "./intent";
import {
  resolveRoleFromRows,
  publicRouteRedirectPath,
  roleEntryPath,
  type AuthIntent,
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

export async function redirectAuthenticatedUserFromPublicRoute() {
  const user = await getCurrentUser();
  if (!user) return;

  const role = await resolveRoleForUser(user);
  redirect(publicRouteRedirectPath(role) ?? "/login/role");
}

export async function getCurrentRole(): Promise<ResolvedRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return resolveRoleForUser(user);
}

export async function requireRole(): Promise<ResolvedRole> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await resolveRoleForUser(user);
  if (!role) redirect("/login/role");
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
  const role = await resolveRoleForUser(user, options);
  if (!role) redirect("/login/role");

  return role;
}

export async function resolveRoleForUser(
  user: User,
  options: EnsureRoleOptions = {},
): Promise<ResolvedRole | null> {
  const env = requireEnv(["core"]);
  const cookieStore = await cookies();
  const email = user.email?.toLowerCase();
  const fullName = displayNameFromUser(user);

  if (!email) {
    throw new Error("Google account did not return an email");
  }

  const admin = createAdminClient();
  const rows = await loadRoleRows(user.id);
  const adminAllowlist = parseAdminEmailAllowlist(env.data.ADMIN_EMAIL_ALLOWLIST);
  let shouldReloadAdminProfile = false;
  let role = resolveRoleFromRows({
    authUserId: user.id,
    email,
    fullName,
    adminAllowlist,
    intent: null,
    ...rows,
  });

  if (role?.kind === "medical_admin" && !rows.admin) {
    const { error } = await admin.from("medical_admins").insert({
      auth_user_id: user.id,
      email,
      full_name: fullName,
    });
    if (error && error.code !== "23505") throw error;
    shouldReloadAdminProfile = true;
  }

  if (options.clearIntentCookie) {
    cookieStore.delete(roleIntentCookie);
  }

  if (shouldReloadAdminProfile) {
    const refreshed = await loadRoleRows(user.id);

    role = resolveRoleFromRows({
      authUserId: user.id,
      email,
      fullName,
      adminAllowlist,
      intent: null,
      ...refreshed,
    });

    if (role?.kind === "medical_admin" && !role.adminId) {
      throw new Error("Allowlisted admin profile could not be created");
    }
  }

  return role;
}

export async function completeRoleForUser(
  user: User,
  intent: Exclude<AuthIntent, null>,
): Promise<ResolvedRole> {
  const env = requireEnv(["core"]);
  const email = user.email?.toLowerCase();
  const fullName = displayNameFromUser(user);

  if (!email) {
    throw new Error("Google account did not return an email");
  }

  const existingRole = await resolveRoleForUser(user);
  if (existingRole) return existingRole;

  const admin = createAdminClient();
  const insert =
    intent === "doctor"
      ? await admin.from("doctors").insert({
          auth_user_id: user.id,
          email,
          full_name: fullName,
          account_status: "pending",
          onboarding_step: "profile",
        })
      : await admin.from("patients").insert({
          auth_user_id: user.id,
          email,
          full_name: fullName,
          onboarding_step: "basic",
        });

  if (insert.error) {
    if (insert.error.code === "23505") {
      const role = await resolveRoleForUser(user);
      if (role) return role;
    }

    throw insert.error;
  }

  const rows = await loadRoleRows(user.id);
  const role = resolveRoleFromRows({
    authUserId: user.id,
    email,
    fullName,
    adminAllowlist: parseAdminEmailAllowlist(env.data.ADMIN_EMAIL_ALLOWLIST),
    intent,
    ...rows,
  });

  if (!role) {
    throw new Error("Role selection did not create a MedProof profile");
  }

  return role;
}

export async function redirectToRoleHome() {
  const role = await requireRole();
  redirect(roleEntryPath(role));
}

async function loadRoleRows(authUserId: string): Promise<RoleRows> {
  const admin = createAdminClient();
  const [patient, doctor, medicalAdmin] = await Promise.all([
    admin
      .from("patients")
      .select("patient_id,email,full_name,onboarding_step,onboarding_completed_at")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    admin
      .from("doctors")
      .select("doctor_id,email,full_name,account_status,rejection_reason,onboarding_step,onboarding_completed_at")
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
