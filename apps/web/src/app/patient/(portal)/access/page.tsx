import { redirect } from "next/navigation";

import {
  loadPatientAccessPermissionOptions,
  loadPatientAccessState,
} from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { InlineStatusMessage } from "@/components/state-panel";

import {
  AccessHistoryList,
  DoctorAccessActivity,
  DoctorAccessClient,
  DoctorAccessStatusLog,
} from "../../_components/doctor-access-client";
import { DashboardCard } from "../../_components/patient-layout";

export const dynamic = "force-dynamic";

export default async function PatientAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ access_error?: string; access_status?: string }>;
}) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return null;
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const params = (await searchParams) ?? {};
  const [accessState, permissionOptions] = await Promise.all([
    loadPatientAccessState(role, { accessLogLimit: 30 }),
    loadPatientAccessPermissionOptions(role),
  ]);

  return (
    <section
      className="grid gap-8"
      data-doctor-access-page="main"
    >
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
          {copy.patient.access.shortTitle}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
          {copy.patient.access.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.patient.access.description}
        </p>
      </header>

      {params.access_error ? (
        <InlineStatusMessage tone="danger" message={params.access_error} />
      ) : null}

      <section data-doctor-access-section="grant">
        <DashboardCard className="grid gap-8 p-6 md:p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold leading-tight text-[var(--color-midnight)]">
              {copy.patient.access.newAccessTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
              {copy.patient.access.newAccessDescription}
            </p>
          </div>
          <DoctorAccessClient copy={copy} permissionOptions={permissionOptions} />
        </DashboardCard>
      </section>

      <section className="grid gap-5" data-doctor-access-section="activity">
        <div>
          <h2 className="text-xl font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.patient.access.activityTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ash)]">
            {copy.patient.access.activityDescription}
          </p>
        </div>

        <DashboardCard className="grid content-start gap-4 p-6">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[var(--color-midnight)]">
              {copy.patient.access.activeAccess}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
              {copy.patient.dashboard.activeAccessDescription}
            </p>
          </div>
          <DoctorAccessActivity state={accessState} locale={locale} copy={copy} />
        </DashboardCard>

        <div className="grid gap-5 xl:grid-cols-2" data-doctor-access-section="history">
          <DashboardCard className="grid content-start gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-[var(--color-midnight)]">
                {copy.patient.dashboard.accessLogTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
                {copy.patient.dashboard.accessLogDescription}
              </p>
            </div>
            <DoctorAccessStatusLog items={accessState.accessLog} locale={locale} copy={copy} />
          </DashboardCard>

          <DashboardCard className="grid content-start gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-[var(--color-midnight)]">
                {copy.patient.access.historyTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
                {copy.patient.access.historyDescription}
              </p>
            </div>
            <AccessHistoryList history={accessState.history} locale={locale} copy={copy} />
          </DashboardCard>
        </div>
      </section>

    </section>
  );
}
