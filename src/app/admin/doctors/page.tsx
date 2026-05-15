import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { BlockchainRetryButton } from "@/components/blockchain-retry-button";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; specialization?: string; date?: string }>;
}) {
  const role = await requireRole();
  if (role.kind !== "medical_admin") {
    return (
      <AppShell title="Admin Medis" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const params = (await searchParams) ?? {};
  const status = ["pending", "approved", "rejected"].includes(params.status ?? "")
    ? params.status
    : "";
  const specialization = params.specialization?.trim() ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : "";
  const admin = createAdminClient();
  let query = admin
    .from("doctors")
    .select("doctor_id,full_name,email,specialization,account_status,created_at")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("account_status", status);
  }
  if (specialization) {
    query = query.ilike("specialization", `%${specialization}%`);
  }
  if (date) {
    const nextDate = new Date(`${date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    query = query.gte("created_at", `${date}T00:00:00.000Z`).lt("created_at", nextDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  return (
    <AppShell title="Admin Medis" nav={[{ href: "/admin/doctors", label: "Verifikasi Dokter" }]}>
      <Card>
        <CardHeader>
          <CardTitle>Antrean verifikasi dokter</CardTitle>
          <CardDescription>Admin hanya melihat data KYC dokter, bukan data medis pasien.</CardDescription>
        </CardHeader>
        <div className="mb-5">
          <BlockchainRetryButton />
        </div>

        <form className="mb-5 grid gap-3 rounded-[10px] bg-[var(--color-stone-surface)] p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
          <Field>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="">Semua</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="specialization">Spesialisasi</Label>
            <Input
              id="specialization"
              name="specialization"
              defaultValue={specialization}
              placeholder="Contoh: Anak"
            />
          </Field>
          <Field>
            <Label htmlFor="date">Tanggal daftar</Label>
            <Input id="date" name="date" type="date" defaultValue={date} />
          </Field>
          <Button type="submit" className="rounded-[10px]">
            Terapkan
          </Button>
          <Button asChild variant="ghost" className="rounded-[10px]">
            <Link href="/admin/doctors">Reset</Link>
          </Button>
        </form>

        <div className="divide-y divide-[var(--color-stone-surface)]">
          {data.length === 0 ? (
            <p className="py-8 text-sm text-[var(--color-ash)]">Belum ada registrasi dokter.</p>
          ) : (
            data.map((doctor) => {
              const statusTone =
                doctor.account_status === "pending" ||
                doctor.account_status === "approved" ||
                doctor.account_status === "rejected"
                  ? doctor.account_status
                  : "neutral";

              return (
                <Link
                  key={doctor.doctor_id}
                  href={`/admin/doctors/${doctor.doctor_id}`}
                  className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-midnight)]">{doctor.full_name}</p>
                    <p className="text-sm text-[var(--color-ash)]">
                      {doctor.specialization ?? "Tanpa spesialisasi"} · {doctor.email}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone}>
                    {doctor.account_status === "pending"
                      ? "Menunggu"
                      : doctor.account_status === "approved"
                        ? "Disetujui"
                        : "Ditolak"}
                  </StatusBadge>
                </Link>
              );
            })
          )}
        </div>
      </Card>
    </AppShell>
  );
}
