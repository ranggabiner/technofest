import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Textarea } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

import { approveDoctorAction, rejectDoctorAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const role = await requireRole();
  if (role.kind !== "medical_admin") {
    return (
      <AppShell title="Detail Dokter" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const { doctorId } = await params;
  const admin = createAdminClient();
  const doctorResult = await admin
    .from("doctors")
    .select(
      "doctor_id,full_name,email,phone_number,specialization,account_status,rejection_reason,created_at,doctor_access_code,qr_code_token",
    )
    .eq("doctor_id", doctorId)
    .single();

  if (doctorResult.error) throw doctorResult.error;

  const documents = await admin
    .from("doctor_kyc_documents")
    .select("document_id,document_type,created_at")
    .eq("doctor_id", doctorId)
    .order("document_type", { ascending: true });

  if (documents.error) throw documents.error;

  const audits = await admin
    .from("audit_logs")
    .select("log_id,action,access_status,reason,blockchain_status,blockchain_tx_hash,blockchain_last_error,created_at")
    .eq("doctor_id", doctorId)
    .is("patient_id", null)
    .in("action", [
      "admin_doctor_approved",
      "admin_doctor_rejected",
      "doctor_kyc_email_notification_failed",
    ])
    .order("created_at", { ascending: false })
    .limit(10);

  if (audits.error) throw audits.error;

  const doctor = doctorResult.data;
  const statusTone =
    doctor.account_status === "pending" ||
    doctor.account_status === "approved" ||
    doctor.account_status === "rejected"
      ? doctor.account_status
      : "neutral";

  return (
    <AppShell title="Detail Dokter" nav={[{ href: "/admin/doctors", label: "Verifikasi Dokter" }]}>
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="mb-2">
              <StatusBadge tone={statusTone}>
                {doctor.account_status === "pending"
                  ? "Menunggu"
                  : doctor.account_status === "approved"
                    ? "Disetujui"
                    : "Ditolak"}
              </StatusBadge>
            </div>
            <CardTitle>{doctor.full_name}</CardTitle>
            <CardDescription>
              {doctor.specialization ?? "Tanpa spesialisasi"} · {doctor.email} · {doctor.phone_number ?? "Tanpa telepon"}
            </CardDescription>
          </CardHeader>
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6">
            Lakukan pengecekan STR, SIP, dan KTP secara manual di luar MedProof bila diperlukan. MedProof tidak
            memanggil API KKI pada Sprint 1.
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumen KYC</CardTitle>
            <CardDescription>Pratinjau didekripsi hanya setelah otorisasi admin.</CardDescription>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            {documents.data.map((document) => (
              <Link
                key={document.document_id}
                href={`/admin/doctors/${doctorId}/documents/${document.document_id}`}
                className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm font-semibold uppercase text-[var(--color-midnight)]"
              >
                {document.document_type}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keputusan admin</CardTitle>
            <CardDescription>Status DB tetap menjadi sumber kebenaran walau email Resend gagal.</CardDescription>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <form action={approveDoctorAction}>
              <input type="hidden" name="doctor_id" value={doctorId} />
              <Button type="submit" className="w-full">
                Setujui dokter
              </Button>
            </form>
            <form action={rejectDoctorAction} className="grid gap-3">
              <input type="hidden" name="doctor_id" value={doctorId} />
              <Field>
                <Label htmlFor="rejection_reason">Alasan penolakan</Label>
                <Textarea id="rejection_reason" name="rejection_reason" required />
              </Field>
              <Button type="submit" variant="destructive">
                Tolak dokter
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit KYC</CardTitle>
            <CardDescription>Proof audit admin tanpa akses ke data medis pasien.</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            {audits.data.length > 0 ? (
              audits.data.map((audit) => (
                <div
                  key={audit.log_id}
                  className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={auditStatusTone(audit.access_status)}>{auditStatusLabel(audit.access_status)}</StatusBadge>
                    <StatusBadge tone={proofTone(audit.blockchain_status)}>
                      Proof {proofLabel(audit.blockchain_status)}
                    </StatusBadge>
                  </div>
                  <p className="font-semibold text-[var(--color-midnight)]">{describeAuditAction(audit.action)}</p>
                  <p className="text-sm text-[var(--color-ash)]">
                    {formatDateTime(audit.created_at)}
                    {audit.reason ? ` · ${audit.reason}` : ""}
                  </p>
                  <ProofStatus
                    proofType="audit_log"
                    id={audit.log_id}
                    blockchainStatus={audit.blockchain_status}
                    txHash={audit.blockchain_tx_hash}
                    lastError={audit.blockchain_last_error}
                  />
                </div>
              ))
            ) : (
              <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
                Belum ada audit KYC untuk dokter ini.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function auditStatusTone(status: string): "approved" | "failed" | "pending" | "neutral" {
  if (["approved", "allowed", "created"].includes(status)) return "approved";
  if (["rejected", "failed", "mismatch"].includes(status)) return "failed";
  if (status === "pending") return "pending";
  return "neutral";
}

function auditStatusLabel(status: string) {
  if (status === "approved") return "disetujui";
  if (status === "rejected") return "ditolak";
  if (status === "failed") return "gagal";
  if (status === "allowed") return "diizinkan";
  if (status === "created") return "dibuat";
  if (status === "mismatch") return "mismatch";
  if (status === "pending") return "pending";
  return status;
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

function describeAuditAction(action: string) {
  if (action === "admin_doctor_approved") return "Dokter disetujui";
  if (action === "admin_doctor_rejected") return "Dokter ditolak";
  if (action === "doctor_kyc_email_notification_failed") return "Email KYC gagal dikirim";
  return action;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
