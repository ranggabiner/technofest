import "server-only";

import { redirect } from "next/navigation";

import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export async function requireApprovedDoctorPortalRole() {
  const role = await requireRole();

  if (role.kind !== "doctor" || !role.canAccessDoctorFeatures || !role.doctorId) {
    redirect(roleEntryPath(role));
  }

  return role;
}
