import { redirect } from "next/navigation";
import { AlertTriangle, Bot, CheckCircle2, LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";
import { loadPatientJournalState } from "@/lib/ai/journal-service";

import { acceptAiConsentAction, saveProfilingAction } from "./actions";
import { AiJournalClient } from "./_components/ai-journal-client";

export const dynamic = "force-dynamic";

export default async function PatientPage({
  searchParams,
}: {
  searchParams?: Promise<{ ai_error?: string }>;
}) {
  const role = await requireRole();
  if (role.kind !== "patient") redirect(roleHomePath(role));
  const params = (await searchParams) ?? {};
  const state = await loadPatientJournalState(role);

  return (
    <AppShell
      title="Dashboard Pasien"
      nav={[
        { href: "/patient", label: "Jurnal AI" },
      ]}
    >
      <div className="grid gap-5">
        {params.ai_error === "finalize_failed" ? (
          <div className="flex items-start gap-3 rounded-[10px] border border-[var(--color-error-red)] bg-red-50 p-4 text-sm text-[var(--color-error-red)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Sesi gagal diringkas. Coba akhiri sesi lagi setelah koneksi AI stabil.
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Halo, {role.fullName}</CardTitle>
            <CardDescription>
              Gunakan jurnal AI untuk mencatat kondisi harian dengan data demo/test saja.
            </CardDescription>
          </CardHeader>
          <div className="grid gap-3 rounded-[10px] bg-[var(--color-teal-muted)] p-4 text-sm text-[var(--color-charcoal-primary)] sm:grid-cols-3">
            <StatusLine icon={<LockKeyhole size={16} />} label="Data jurnal" value="Terenkripsi server" />
            <StatusLine icon={<Bot size={16} />} label="Model AI" value="DeepSeek live" />
            <StatusLine
              icon={<CheckCircle2 size={16} />}
              label="Proof consent"
              value={state.consentBlockchainStatus ?? "Belum ada"}
            />
          </div>
        </Card>

        {!state.consentAccepted ? (
          <Card>
            <CardHeader>
              <CardTitle>Persetujuan pemrosesan AI</CardTitle>
              <CardDescription>
                DeepSeek akan memproses isi jurnal untuk membantu percakapan dan ekstraksi Scope 2.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-3 text-sm leading-6 text-[var(--color-charcoal-primary)]">
              <p>
                MedProof Sprint 1 hanya untuk demo/test. Jangan masukkan data klinis produksi,
                identitas pasien asli, diagnosis, resep, atau dokumen medis nyata.
              </p>
              <p>
                AI tidak memberi diagnosis atau saran terapi. Untuk tanda bahaya, cari bantuan
                medis darurat setempat.
              </p>
              <form action={acceptAiConsentAction}>
                <Button type="submit">Saya setuju memakai AI</Button>
              </form>
            </div>
          </Card>
        ) : null}

        {state.consentAccepted && !state.profilingComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>Profil awal pasien</CardTitle>
              <CardDescription>
                Jawaban disimpan terenkripsi untuk konteks percakapan AI.
              </CardDescription>
            </CardHeader>
            <form action={saveProfilingAction} className="grid gap-4">
              <Field>
                <Label htmlFor="discovered_from">Dari mana tahu MedProof?</Label>
                <Input id="discovered_from" name="discovered_from" placeholder="Contoh: demo kampus" />
              </Field>
              <Field>
                <Label htmlFor="age_or_birth_date">Usia atau tanggal lahir</Label>
                <Input id="age_or_birth_date" name="age_or_birth_date" placeholder="Contoh: 24 tahun" />
              </Field>
              <Field>
                <Label htmlFor="current_condition">Kondisi yang sedang dirasakan</Label>
                <Textarea
                  id="current_condition"
                  name="current_condition"
                  placeholder="Contoh: akhir-akhir ini sering lelah dan tidur kurang"
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="daily_activity">Aktivitas utama</Label>
                <Textarea
                  id="daily_activity"
                  name="daily_activity"
                  placeholder="Contoh: kuliah, bekerja di depan laptop, olahraga ringan"
                />
              </Field>
              <Field>
                <Label htmlFor="lifestyle_context">Gaya hidup dan lingkungan</Label>
                <Textarea
                  id="lifestyle_context"
                  name="lifestyle_context"
                  placeholder="Contoh: pola tidur, makan, aktivitas fisik, lingkungan rumah"
                />
              </Field>
              <Field>
                <Label htmlFor="known_history">Riwayat yang ingin dibagikan</Label>
                <Textarea
                  id="known_history"
                  name="known_history"
                  placeholder="Boleh dikosongkan jika tidak ingin menjawab"
                />
              </Field>
              <Button type="submit">Simpan profil terenkripsi</Button>
            </form>
          </Card>
        ) : null}

        {state.consentAccepted && state.profilingComplete ? (
          <Card>
            <CardHeader>
              <div className="mb-2 flex gap-2">
                <StatusBadge tone="approved">AI aktif</StatusBadge>
                <StatusBadge tone={state.latestSummaryStatus === "generated" ? "approved" : "pending"}>
                  {state.latestSummaryStatus === "generated"
                    ? "Ringkasan siap"
                    : state.activeSessionId
                      ? "Sesi berjalan"
                      : "Belum ada sesi"}
                </StatusBadge>
              </div>
              <CardTitle>Jurnal kesehatan AI</CardTitle>
              <CardDescription>
                Chat disimpan terenkripsi. Akhiri sesi untuk membuat ekstraksi Scope 2.
              </CardDescription>
            </CardHeader>
            <AiJournalClient
              initialSessionId={state.activeSessionId}
              initialMessages={state.messages}
              initialPatientMessageCount={state.activePatientMessageCount}
            />
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Scope 2</CardTitle>
            <CardDescription>
              Ringkasan muncul setelah sesi AI diakhiri dan ekstraksi selesai.
            </CardDescription>
          </CardHeader>
          {state.latestSummary ? (
            <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
              {state.latestSummary}
            </p>
          ) : (
            <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
              Belum ada ringkasan jurnal.
            </p>
          )}
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
