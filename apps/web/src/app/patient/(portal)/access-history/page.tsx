import { redirect } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import { AccessHistoryList, DoctorAccessStatusLog } from "../../_components/doctor-access-client";

export const dynamic = "force-dynamic";

export default async function PatientAccessHistoryPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return null;
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const accessState = await loadPatientAccessState(role, { accessLogLimit: 30 });

  return (
    <>
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{copy.patient.dashboard.accessLogTitle}</CardTitle>
            <CardDescription>
              {copy.patient.dashboard.accessLogDescription}
            </CardDescription>
          </CardHeader>
          <DoctorAccessStatusLog items={accessState.accessLog} locale={locale} copy={copy} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.patient.access.historyTitle}</CardTitle>
            <CardDescription>
              {copy.patient.access.historyDescription}
            </CardDescription>
          </CardHeader>
          <AccessHistoryList history={accessState.history} locale={locale} copy={copy} />
        </Card>
      </div>
    </>
  );
}
