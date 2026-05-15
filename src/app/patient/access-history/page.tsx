import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";

import { AccessHistoryList } from "../_components/doctor-access-client";
import { patientNav } from "../_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientAccessHistoryPage() {
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title="Riwayat Akses" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.patientId) redirect(roleHomePath(role));

  const accessState = await loadPatientAccessState(role);

  return (
    <AppShell title="Riwayat Akses Pasien" nav={patientNav("/patient/access-history")}>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat akses dan Proof</CardTitle>
          <CardDescription>
            Aktivitas grant, pencabutan, akses dokter, penolakan akses, RAG, dan mismatch integritas.
          </CardDescription>
        </CardHeader>
        <AccessHistoryList history={accessState.history} />
      </Card>
    </AppShell>
  );
}
