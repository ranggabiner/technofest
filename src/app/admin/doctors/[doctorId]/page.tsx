import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Textarea } from "@/components/ui/form";
import { requireAdminRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

import { approveDoctorAction, rejectDoctorAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  await requireAdminRole();
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
            <CardDescription>Preview didekripsi hanya setelah otorisasi admin.</CardDescription>
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
      </div>
    </AppShell>
  );
}
