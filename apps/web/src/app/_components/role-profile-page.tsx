import { redirect } from "next/navigation";

import { AdminProfileClient } from "@/app/admin/profile/profile-client";
import { DoctorProfileClient } from "@/app/doctor/profile/profile-client";
import { PatientProfileSettingsClient, PatientProfilingClient } from "@/app/patient/profile/profile-client";
import { roleEntryPath, roleOnboardingPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loadAdminProfileState, loadDoctorProfileState, loadPatientProfileState } from "@/lib/profile/service";

import { ProfileShell } from "./profile-shell";

export async function RoleProfilePage({
  routeRole,
  active = "profile",
}: {
  routeRole: "patient" | "doctor" | "admin" | "superadmin";
  active?: "profile" | "profiling";
}) {
  const copy = await getDictionary();
  const role = await requireRole();

  if (routeRole === "patient") {
    if (role.kind !== "patient") redirect(roleEntryPath(role));
    const onboardingPath = roleOnboardingPath(role);
    if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

    const patient = await loadPatientProfileState(role);

    return (
      <ProfileShell
        role="patient"
        copy={copy.profile}
        successToastMessages={copy.common.successToast}
        active={active}
        backHref={roleEntryPath(role)}
        profileHref="/patient/profile"
      >
        {active === "profiling" ? (
          <PatientProfilingClient copy={copy.profile} patient={patient} />
        ) : (
          <PatientProfileSettingsClient copy={copy.profile} patient={patient} avatarUrl={role.avatarUrl} />
        )}
      </ProfileShell>
    );
  }

  if (routeRole === "doctor") {
    if (role.kind !== "doctor") redirect(roleEntryPath(role));
    if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

    const state = await loadDoctorProfileState(role);

    return (
      <ProfileShell
        role="doctor"
        copy={copy.profile}
        successToastMessages={copy.common.successToast}
        active="profile"
        backHref={roleEntryPath(role)}
        profileHref="/doctor/profile"
      >
        <DoctorProfileClient
          copy={copy.profile}
          doctor={state.doctor}
          documents={state.documents}
          avatarUrl={role.avatarUrl}
        />
      </ProfileShell>
    );
  }

  if (role.kind !== "medical_admin") redirect(roleEntryPath(role));
  if (!role.adminId) redirect("/login?error=unauthorized");
  if (routeRole === "admin" && role.adminLevel === "superadmin") redirect("/superadmin/profile");
  if (routeRole === "superadmin" && role.adminLevel !== "superadmin") redirect("/admin/profile");

  const admin = await loadAdminProfileState(role);
  const profileHref = role.adminLevel === "superadmin" ? "/superadmin/profile" : "/admin/profile";

  return (
    <ProfileShell
      role="admin"
      copy={copy.profile}
      successToastMessages={copy.common.successToast}
      active="profile"
      backHref={roleEntryPath(role)}
      profileHref={profileHref}
    >
      <AdminProfileClient copy={copy.profile} admin={admin} avatarUrl={role.avatarUrl} />
    </ProfileShell>
  );
}
