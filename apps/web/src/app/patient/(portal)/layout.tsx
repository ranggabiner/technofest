import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";

import { PatientForbiddenLayout, PatientLayout } from "../_components/patient-layout";

export const dynamic = "force-dynamic";

export default async function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "patient") {
    return <PatientForbiddenLayout title={copy.patient.dashboard.title} role={role} />;
  }

  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  return (
    <PatientLayout
      copy={copy}
      patientEmail={role.email}
      patientName={role.fullName}
      title={copy.patient.dashboard.title}
    >
      {children}
    </PatientLayout>
  );
}
