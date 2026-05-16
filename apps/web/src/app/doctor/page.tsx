import QRCode from "qrcode";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { requireRole } from "@/lib/auth/session";
import { roleEntryPath } from "@/lib/auth/roles";
import { loadDoctorDashboardState } from "@/lib/doctor-records/service";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import { DoctorDashboardClient } from "./_components/doctor-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title={copy.doctor.dashboard.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.canAccessDoctorFeatures || !role.doctorId) redirect(roleEntryPath(role));

  const state = await loadDoctorDashboardState(role);
  const qrData = state.doctor.qr_code_token
    ? await QRCode.toDataURL(`medproof://doctor/${state.doctor.qr_code_token}`)
    : null;

  return (
    <AppShell
      title={copy.doctor.dashboard.title}
      nav={[
        { href: "/doctor", label: copy.doctor.nav.dashboard, active: true },
        { href: "/doctor/medical-record-library", label: copy.doctor.nav.medicalRecordLibrary },
      ]}
    >
      <DoctorDashboardClient state={state} qrData={qrData} locale={locale} copy={copy} />
    </AppShell>
  );
}
