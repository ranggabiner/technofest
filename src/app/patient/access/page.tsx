import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, History } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";

import { DoctorAccessClient } from "../_components/doctor-access-client";
import { patientNav } from "../_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ access_error?: string; access_status?: string }>;
}) {
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title="Akses Dokter" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.patientId) redirect(roleHomePath(role));

  const params = (await searchParams) ?? {};
  const accessState = await loadPatientAccessState(role);

  return (
    <AppShell title="Kelola Akses Dokter" nav={patientNav("/patient/access")}>
      <div className="grid gap-5">
        {params.access_error ? (
          <StatusMessage tone="failed" message={params.access_error} />
        ) : null}

        {params.access_status === "granted" || params.access_status === "revoked" ? (
          <StatusMessage
            tone="approved"
            message={
              params.access_status === "granted"
                ? "Akses dokter tersimpan dengan Proof pending."
                : "Akses dokter dicabut dengan Proof pending."
            }
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Kelola akses dokter</CardTitle>
            <CardDescription>
              Cari dokter lewat QR atau kode 6 digit, pilih cakupan data, lalu tentukan batas waktu akses.
            </CardDescription>
          </CardHeader>
          <DoctorAccessClient state={accessState} />
        </Card>

        <Button asChild variant="ghost" className="w-fit">
          <Link href="/patient/access-history">
            <History size={16} />
            Buka riwayat akses
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}

function StatusMessage({ tone, message }: { tone: "approved" | "failed"; message: string }) {
  const isFailed = tone === "failed";

  return (
    <div className={`flex items-start gap-3 rounded-[10px] border p-4 text-sm ${
      isFailed
        ? "border-[var(--color-error-red)] bg-red-50 text-[var(--color-error-red)]"
        : "border-teal-200 bg-teal-50 text-teal-800"
    }`}
    >
      {isFailed ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      {message}
    </div>
  );
}
