import { redirect } from "next/navigation";

import { ProfileShell } from "@/app/_components/profile-shell";
import { roleEntryPath, roleOnboardingPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loadPatientProfileState } from "@/lib/profile/service";

import { PatientProfileSettingsClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "patient") redirect(roleEntryPath(role));
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const patient = await loadPatientProfileState(role);

  return (
    <ProfileShell role="patient" copy={copy.profile} active="profile">
      <PatientProfileSettingsClient copy={copy.profile} patient={patient} avatarUrl={role.avatarUrl} />
    </ProfileShell>
  );
}
