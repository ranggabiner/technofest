import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { loadDoctorDashboardState } from "@/lib/doctor-records/service";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title="Dashboard Dokter" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.canAccessDoctorFeatures || !role.doctorId) redirect("/doctor/status");

  const state = await loadDoctorDashboardState(role);
  const qrData = state.doctor.qr_code_token
    ? await QRCode.toDataURL(`medproof://doctor/${state.doctor.qr_code_token}`)
    : null;

  return (
    <AppShell title="Dashboard Dokter" nav={[{ href: "/doctor", label: "Dashboard" }]}>
      <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>QR Dokter</CardTitle>
            <CardDescription>Tunjukkan QR ini ke pasien untuk permintaan akses.</CardDescription>
          </CardHeader>
          {qrData ? (
            <Image
              src={qrData}
              alt="QR dokter MedProof"
              width={192}
              height={192}
              unoptimized
              className="size-48"
            />
          ) : null}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{state.doctor.full_name}</CardTitle>
            <CardDescription>{state.doctor.specialization ?? "Spesialisasi belum diisi"}</CardDescription>
          </CardHeader>
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-5">
            <p className="text-sm text-[var(--color-ash)]">Kode Akses Dokter</p>
            <p className="mt-2 font-mono text-4xl font-semibold tracking-normal text-[var(--color-midnight)]">
              {state.doctor.doctor_access_code}
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Akses pasien aktif</CardTitle>
          <CardDescription>
            Daftar ini hanya berisi pasien yang memberi akses aktif. Tidak ada pencarian pasien bebas.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3">
          {state.activeGrants.length > 0 ? (
            state.activeGrants.map((grant) => (
              <div
                key={grant.grantId}
                className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-white p-4 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--color-midnight)]">
                      {grant.patientName}
                    </h3>
                    <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                      Proof {proofLabel(grant.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ash)]">
                    {grant.patientEmail} · sampai {formatDateTime(grant.expiresAt)}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-charcoal-primary)]">
                    <Clock size={15} />
                    {grant.scopes.join(", ")}
                  </p>
                  <div className="mt-3">
                    <ProofStatus
                      proofType="access_grant"
                      id={grant.grantId}
                      blockchainStatus={grant.blockchainStatus}
                      txHash={grant.blockchainTxHash}
                    />
                  </div>
                </div>
                <Button asChild className="self-start rounded-[10px]">
                  <Link href={`/doctor/grants/${grant.grantId}`}>
                    <FileText size={16} />
                    Buka data
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
              Belum ada pasien dengan akses aktif.
            </p>
          )}
        </div>
      </Card>
    </AppShell>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function proofTone(status: string): "approved" | "failed" | "pending" | "neutral" {
  if (status === "confirmed") return "approved";
  if (status === "failed") return "failed";
  if (status === "pending") return "pending";
  return "neutral";
}

function proofLabel(status: string) {
  if (status === "confirmed") return "terkonfirmasi";
  if (status === "failed") return "gagal";
  if (status === "pending") return "pending";
  return "belum tersedia";
}
