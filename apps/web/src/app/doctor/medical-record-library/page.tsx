import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ForbiddenState } from "@/components/state-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleEntryPath } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorMedicalRecordLibraryPage() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "doctor") {
    return (
      <AppShell title={copy.doctor.library.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.canAccessDoctorFeatures || !role.doctorId) redirect(roleEntryPath(role));

  return (
    <AppShell
      title={copy.doctor.library.title}
      nav={[
        { href: "/doctor", label: copy.doctor.nav.dashboard },
        { href: "/doctor/medical-record-library", label: copy.doctor.nav.medicalRecordLibrary, active: true },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>{copy.doctor.library.title}</CardTitle>
          <CardDescription>{copy.doctor.library.description}</CardDescription>
        </CardHeader>
        <div className="grid gap-2">
          <h3 className="font-semibold text-[var(--color-midnight)]">{copy.doctor.library.emptyTitle}</h3>
          <EmptyState message={copy.doctor.library.emptyDescription} />
        </div>
      </Card>
    </AppShell>
  );
}
