import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Clock, History, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { EmptyState, ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";
import { loadPatientJournalState } from "@/lib/ai/journal-service";
import { loadPatientDashboardState } from "@/lib/patient/dashboard";

import { patientNav } from "./_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title="Dashboard Pasien" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.patientId) redirect(roleHomePath(role));

  const [journalState, accessState, dashboardState] = await Promise.all([
    loadPatientJournalState(role),
    loadPatientAccessState(role),
    loadPatientDashboardState(role),
  ]);
  const latestHistory = accessState.history.slice(0, 3);

  return (
    <AppShell title="Dashboard Pasien" nav={patientNav("/patient")}>
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Halo, {role.fullName}</CardTitle>
            <CardDescription>
              Pantau jurnal, rekam medis, akses dokter, dan status Proof untuk data demo/test.
            </CardDescription>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-3 rounded-[10px] bg-[var(--color-teal-muted)] p-4 text-sm text-[var(--color-charcoal-primary)] sm:grid-cols-3">
              <StatusLine icon={<LockKeyhole size={16} />} label="Data jurnal" value="Terenkripsi server" />
              <StatusLine
                icon={<KeyRound size={16} />}
                label="Akses dokter aktif"
                value={`${accessState.activeGrants.length} grant`}
              />
              <StatusLine
                icon={<ShieldCheck size={16} />}
                label="Proof pending"
                value={`${dashboardState.proofCounts.pending} item`}
              />
            </div>
            <Button asChild>
              <Link href="/patient/chat">
                <Bot size={16} />
                Buka Jurnal AI
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rekam medis Scope 1 terbaru</CardTitle>
              <CardDescription>Ringkasan rekam medis dari dokter yang sudah diotorisasi.</CardDescription>
            </CardHeader>
            <div className="grid gap-3">
              {dashboardState.recentScope1Records.length > 0 ? (
                dashboardState.recentScope1Records.map((record) => (
                  <div key={record.recordId} className="grid gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral">{record.recordType}</StatusBadge>
                      <StatusBadge tone={proofTone(record.blockchainStatus)}>
                        Proof {proofLabel(record.blockchainStatus)}
                      </StatusBadge>
                    </div>
                    <p className="font-semibold text-[var(--color-midnight)]">{record.title}</p>
                    <p className="text-xs text-[var(--color-ash)]">{formatDateTime(record.createdAt)}</p>
                    <ProofStatus
                      proofType="scope1_record"
                      id={record.recordId}
                      blockchainStatus={record.blockchainStatus}
                      txHash={record.blockchainTxHash}
                    />
                  </div>
                ))
              ) : (
                <EmptyState message="Belum ada rekam medis Scope 1." />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan jurnal Scope 2</CardTitle>
              <CardDescription>Ringkasan muncul setelah sesi AI diakhiri dan ekstraksi selesai.</CardDescription>
            </CardHeader>
            {journalState.latestSummary ? (
              <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
                {journalState.latestSummary}
              </p>
            ) : (
              <EmptyState message={journalState.consentAccepted ? "Belum ada ringkasan jurnal." : "Persetujuan AI belum diberikan."} />
            )}
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <StatusBadge tone={accessState.activeGrants.length > 0 ? "approved" : "neutral"}>
                {accessState.activeGrants.length} akses aktif
              </StatusBadge>
            </div>
            <CardTitle>Akses dokter aktif</CardTitle>
            <CardDescription>Setiap akses memiliki batas waktu dan cakupan yang ditentukan pasien.</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            {accessState.activeGrants.length > 0 ? (
              accessState.activeGrants.map((grant) => (
                <div key={grant.grantId} className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-midnight)]">{grant.doctorName}</p>
                    <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                      Proof {proofLabel(grant.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-[var(--color-ash)]">
                    <Clock size={15} />
                    Sampai {formatDateTime(grant.expiresAt)}
                  </p>
                  <p className="text-sm text-[var(--color-charcoal-primary)]">{grant.scopes.join(", ")}</p>
                </div>
              ))
            ) : (
              <EmptyState message="Belum ada akses dokter aktif." />
            )}
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/patient/access">Kelola akses dokter</Link>
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat akses</CardTitle>
            <CardDescription>Aktivitas grant, revoke, akses dokter, RAG, dan status Proof.</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            {latestHistory.length > 0 ? (
              latestHistory.map((item) => (
                <div key={item.id} className="grid gap-1 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusBadge>
                    <StatusBadge tone={proofTone(item.blockchainStatus)}>
                      Proof {proofLabel(item.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="font-semibold text-[var(--color-midnight)]">{item.label}</p>
                  <p className="text-[var(--color-ash)]">
                    {item.doctorName ?? "Tanpa dokter"} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="Riwayat akses belum tersedia." />
            )}
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/patient/access-history">
                <History size={16} />
                Lihat semua riwayat
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatusLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[var(--color-teal-deep)]">{icon}</span>
      <span>
        <span className="block text-xs text-[var(--color-ash)]">{label}</span>
        <span className="font-semibold">{value}</span>
      </span>
    </div>
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

function statusTone(status: string): "approved" | "failed" | "pending" | "neutral" {
  if (["created", "replaced", "revoked", "allowed", "accepted", "approved", "amended"].includes(status)) {
    return "approved";
  }
  if (["failed", "denied", "rejected", "mismatch"].includes(status)) return "failed";
  if (status === "pending") return "pending";
  return "neutral";
}

function statusLabel(status: string) {
  if (status === "created") return "dibuat";
  if (status === "replaced") return "diganti";
  if (status === "revoked") return "dicabut";
  if (status === "allowed") return "diizinkan";
  if (status === "denied") return "ditolak";
  if (status === "failed") return "gagal";
  if (status === "mismatch") return "mismatch";
  if (status === "accepted") return "diterima";
  if (status === "amended") return "diamendemen";
  return status;
}
