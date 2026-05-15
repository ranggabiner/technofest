import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import { AccessHistoryList } from "../_components/doctor-access-client";
import { patientNav } from "../_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientAccessHistoryPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title={copy.patient.nav.history} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const accessState = await loadPatientAccessState(role);

  return (
    <AppShell title={copy.patient.nav.history} nav={patientNav("/patient/access-history", copy)}>
      <Card>
        <CardHeader>
          <CardTitle>{copy.patient.access.historyTitle}</CardTitle>
          <CardDescription>
            {copy.patient.access.historyDescription}
          </CardDescription>
        </CardHeader>
        <AccessHistoryList history={accessState.history} locale={locale} copy={copy} />
      </Card>
    </AppShell>
  );
}
