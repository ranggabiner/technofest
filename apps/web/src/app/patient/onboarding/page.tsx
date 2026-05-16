import { redirect } from "next/navigation";

import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PatientOnboardingIndexPage() {
  const role = await requireRole();
  redirect(roleEntryPath(role));
}
