import QRCode from "qrcode";

import { DoctorDashboardClient } from "@/app/doctor/_components/doctor-dashboard-client";
import { requireApprovedDoctorPortalRole } from "@/app/doctor/_components/doctor-portal-role";
import { loadDoctorDashboardState } from "@/lib/doctor-records/service";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireApprovedDoctorPortalRole();

  const state = await loadDoctorDashboardState(role);
  const qrData = state.doctor.qr_code_token
    ? await QRCode.toDataURL(`medproof://doctor/${state.doctor.qr_code_token}`)
    : null;

  return (
    <section className="grid gap-8" data-doctor-dashboard-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
          {copy.doctor.dashboard.sidebarSection}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
          {copy.doctor.dashboard.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.doctor.dashboard.activePatientsDescription}
        </p>
      </header>
      <DoctorDashboardClient state={state} qrData={qrData} locale={locale} copy={copy} />
    </section>
  );
}
