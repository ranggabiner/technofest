import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function PatientPage() {
  const role = await requireRole();
  if (role.kind !== "patient") redirect(roleHomePath(role));

  return (
    <AppShell title="Dashboard Pasien" nav={[{ href: "/patient", label: "Ringkasan" }]}>
      <Card>
        <CardHeader>
          <CardTitle>Halo, {role.fullName}</CardTitle>
          <CardDescription>
            Akun pasien sudah siap. Fitur jurnal AI dan akses dokter akan dibuka pada scope sprint berikutnya.
          </CardDescription>
        </CardHeader>
        <div className="rounded-[10px] bg-[var(--color-teal-muted)] p-4 text-sm text-[var(--color-charcoal-primary)]">
          Gunakan data demo/test saja. MedProof Sprint 1 bukan layanan klinis produksi.
        </div>
      </Card>
    </AppShell>
  );
}
