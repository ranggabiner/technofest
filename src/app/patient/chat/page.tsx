import { redirect } from "next/navigation";
import { AlertTriangle, Bot, CheckCircle2, LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";
import { loadPatientJournalState } from "@/lib/ai/journal-service";

import { AiJournalClient } from "../_components/ai-journal-client";
import { patientNav } from "../_components/nav";
import { acceptAiConsentAction, saveProfilingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PatientChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ ai_error?: string; ai_status?: string }>;
}) {
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title="Jurnal AI" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.patientId) redirect(roleHomePath(role));

  const params = (await searchParams) ?? {};
  const state = await loadPatientJournalState(role);

  return (
    <AppShell title="Jurnal AI Pasien" nav={patientNav("/patient/chat")}>
      <div className="grid gap-5">
        {params.ai_error === "finalize_failed" ? (
          <StatusMessage
            tone="failed"
            message="Sesi gagal diringkas. Coba akhiri sesi lagi setelah koneksi AI stabil."
          />
        ) : null}

        {params.ai_status === "finalized" ? (
          <StatusMessage tone="approved" message="Sesi selesai. Ringkasan dan ekstraksi Scope 2 sudah diproses." />
        ) : null}

        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap gap-2">
              <StatusBadge tone={state.consentAccepted ? "approved" : "pending"}>
                {state.consentAccepted ? "Persetujuan AI diterima" : "Persetujuan AI belum ada"}
              </StatusBadge>
              <StatusBadge tone={state.profilingComplete ? "approved" : "pending"}>
                {state.profilingComplete ? "Profil awal lengkap" : "Profil awal belum lengkap"}
              </StatusBadge>
            </div>
            <CardTitle>Jurnal kesehatan AI</CardTitle>
            <CardDescription>
              DeepSeek memproses teks demo/test untuk percakapan, ringkasan, ekstraksi Scope 2, dan RAG dokter yang diotorisasi.
            </CardDescription>
          </CardHeader>
          <div className="grid gap-3 rounded-[10px] bg-[var(--color-teal-muted)] p-4 text-sm text-[var(--color-charcoal-primary)] sm:grid-cols-3">
            <StatusLine icon={<LockKeyhole size={16} />} label="Penyimpanan" value="Pesan terenkripsi" />
            <StatusLine icon={<Bot size={16} />} label="Model AI" value="DeepSeek" />
            <StatusLine
              icon={<CheckCircle2 size={16} />}
              label="Proof consent"
              value={state.consentBlockchainStatus ? proofLabel(state.consentBlockchainStatus) : "Belum ada"}
            />
          </div>
        </Card>

        {!state.consentAccepted ? (
          <Card>
            <CardHeader>
              <CardTitle>Persetujuan pemrosesan AI</CardTitle>
              <CardDescription>
                AI hanya untuk demo/test, bukan diagnosis, asesmen medis, atau rekomendasi pengobatan.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-3 text-sm leading-6 text-[var(--color-charcoal-primary)]">
              <p>
                Jangan masukkan data klinis produksi, identitas pasien asli, diagnosis, resep,
                atau dokumen medis nyata.
              </p>
              <p>
                Untuk kondisi darurat atau tanda bahaya, cari bantuan medis darurat setempat.
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
              <CardDescription>Jawaban disimpan terenkripsi untuk konteks percakapan AI.</CardDescription>
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
              <CardTitle>Ruang chat jurnal</CardTitle>
              <CardDescription>Chat disimpan terenkripsi. Akhiri sesi untuk membuat ekstraksi Scope 2.</CardDescription>
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
            <CardTitle>Ringkasan terbaru</CardTitle>
            <CardDescription>Ringkasan tersimpan terenkripsi setelah sesi selesai.</CardDescription>
          </CardHeader>
          {state.latestSummary ? (
            <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
              {state.latestSummary}
            </p>
          ) : (
            <EmptyState message="Belum ada ringkasan jurnal." />
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

function proofLabel(status: string) {
  if (status === "confirmed") return "terkonfirmasi";
  if (status === "failed") return "gagal";
  if (status === "pending") return "pending";
  return "belum tersedia";
}
