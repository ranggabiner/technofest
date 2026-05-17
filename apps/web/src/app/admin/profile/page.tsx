import { redirect } from "next/navigation";

import { ProfileShell } from "@/app/_components/profile-shell";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loadAdminProfileState } from "@/lib/profile/service";

import { AdminProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "medical_admin") redirect(roleEntryPath(role));
  if (!role.adminId) redirect("/login?error=unauthorized");

  const admin = await loadAdminProfileState(role);

  return (
    <ProfileShell role="admin" copy={copy.profile} active="profile">
      <AdminProfileClient copy={copy.profile} admin={admin} />
    </ProfileShell>
  );
}
