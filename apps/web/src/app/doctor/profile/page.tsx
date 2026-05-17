import { redirect } from "next/navigation";

import { ProfileShell } from "@/app/_components/profile-shell";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loadDoctorProfileState } from "@/lib/profile/service";

import { DoctorProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "doctor") redirect(roleEntryPath(role));
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  const state = await loadDoctorProfileState(role);

  return (
    <ProfileShell role="doctor" copy={copy.profile} active="profile">
      <DoctorProfileClient
        copy={copy.profile}
        doctor={state.doctor}
        documents={state.documents}
        avatarUrl={role.avatarUrl}
      />
    </ProfileShell>
  );
}
