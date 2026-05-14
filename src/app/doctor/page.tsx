import QRCode from "qrcode";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDoctorRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const role = await requireDoctorRole();
  if (!role.canAccessDoctorFeatures || !role.doctorId) redirect("/doctor/status");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctors")
    .select("full_name,specialization,qr_code_token,doctor_access_code")
    .eq("doctor_id", role.doctorId)
    .single();

  if (error) throw error;

  const qrData = data.qr_code_token
    ? await QRCode.toDataURL(`medproof://doctor/${data.qr_code_token}`)
    : null;

  return (
    <AppShell title="Dashboard Dokter" nav={[{ href: "/doctor", label: "Kode Akses" }]}>
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
            <CardTitle>{data.full_name}</CardTitle>
            <CardDescription>{data.specialization ?? "Spesialisasi belum diisi"}</CardDescription>
          </CardHeader>
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-5">
            <p className="text-sm text-[var(--color-ash)]">Doctor Access Code</p>
            <p className="mt-2 font-mono text-4xl font-semibold tracking-normal text-[var(--color-midnight)]">
              {data.doctor_access_code}
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
