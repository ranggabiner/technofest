import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Download, Eye, PlusCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { ForbiddenState, StatePanel } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";
import { DoctorAccessError, loadDoctorGrantPageState } from "@/lib/doctor-records/service";

import { DoctorRagClient } from "./_components/doctor-rag-client";
import { createScope1RecordAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DoctorGrantPage({
  params,
  searchParams,
}: {
  params: Promise<{ grantId: string }>;
  searchParams: Promise<{ scope1_error?: string; scope1_status?: string }>;
}) {
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title="Akses Pasien" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.canAccessDoctorFeatures) redirect("/doctor/status");

  const { grantId } = await params;
  const query = await searchParams;

  let state;
  try {
    state = await loadDoctorGrantPageState(role, grantId);
  } catch (error) {
    if (error instanceof DoctorAccessError) {
      return (
        <AppShell title="Akses Pasien" nav={[{ href: "/doctor", label: "Dashboard" }]}>
          <StatePanel
            title={doctorAccessTitle(error.reason)}
            description={error.message}
            tone="danger"
          />
        </AppShell>
      );
    }
    throw error;
  }

  return (
    <AppShell
      title="Data Pasien"
      nav={[
        { href: "/doctor", label: "Dashboard" },
        { href: `/doctor/grants/${grantId}`, label: "Data Pasien" },
      ]}
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={proofTone(state.grant.blockchainStatus)}>
                Grant {proofLabel(state.grant.blockchainStatus)}
              </StatusBadge>
              <StatusBadge tone="neutral">Sampai {formatDateTime(state.grant.expiresAt)}</StatusBadge>
            </div>
            <CardTitle>{state.grant.patientName}</CardTitle>
            <CardDescription>
              {state.grant.patientEmail}. Timer di layar hanya informasi; server memeriksa akses di setiap request.
            </CardDescription>
          </CardHeader>
          <div className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm text-[var(--color-charcoal-primary)]">
            <p>Cakupan aktif: {describeGrantFlags(state.grant).join(", ")}</p>
            <p>Grant ID: <span className="font-mono">{state.grant.grantId}</span></p>
          </div>
          <div className="mt-3">
            <ProofStatus
              proofType="access_grant"
              id={state.grant.grantId}
              blockchainStatus={state.grant.blockchainStatus}
              txHash={state.grant.blockchainTxHash}
            />
          </div>
        </Card>

        {query.scope1_error ? (
          <StatusMessage tone="failed" message={query.scope1_error} />
        ) : query.scope1_status === "saved" ? (
          <StatusMessage tone="approved" message="Rekam medis tersimpan dengan proof pending." />
        ) : null}

        {state.grant.canViewScope1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Scope 1</CardTitle>
              <CardDescription>Rekam medis append-only. Koreksi dibuat sebagai amendemen baru.</CardDescription>
            </CardHeader>
            <Scope1Form grantId={grantId} records={state.scope1Records} />
            <div className="mt-5 grid gap-3">
              {state.scope1Records.length > 0 ? (
                state.scope1Records.map((record) => (
                  <div
                    key={record.recordId}
                    className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-[var(--color-ash)]">{record.recordType}</p>
                        <h3 className="font-semibold text-[var(--color-midnight)]">{record.title}</h3>
                      </div>
                      <StatusBadge tone={proofTone(record.blockchainStatus)}>
                        Proof {proofLabel(record.blockchainStatus)}
                      </StatusBadge>
                    </div>
                    {record.description ? (
                      <p className="text-sm leading-6 text-[var(--color-charcoal-primary)]">{record.description}</p>
                    ) : null}
                    <p className="text-xs text-[var(--color-ash)]">
                      Dibuat {formatDateTime(record.createdAt)}
                      {record.amendsRecordId ? ` · amendemen untuk ${record.amendsRecordId}` : ""}
                    </p>
                    <ProofStatus
                      proofType="scope1_record"
                      id={record.recordId}
                      blockchainStatus={record.blockchainStatus}
                      txHash={record.blockchainTxHash}
                      lastError={record.blockchainLastError}
                    />
                    {record.attachmentFileId ? (
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" className="rounded-[10px]">
                          <Link
                            href={`/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/preview`}
                            target="_blank"
                          >
                            <Eye size={16} />
                            Pratinjau {record.attachmentFilename ?? "lampiran"}
                          </Link>
                        </Button>
                        {record.attachmentCanDownload ? (
                          <Button asChild variant="secondary" className="rounded-[10px]">
                            <Link href={`/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/download`}>
                              <Download size={16} />
                              Unduh
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState message="Belum ada rekam medis Scope 1." />
              )}
            </div>
          </Card>
        ) : null}

        {state.grant.canViewScope2Mental ? (
          <Card>
            <CardHeader>
              <CardTitle>Scope 2 Mental</CardTitle>
              <CardDescription>Data hasil ekstraksi AI pasien, tidak dapat diedit dokter.</CardDescription>
            </CardHeader>
            <div className="grid gap-3">
              {state.mentalRows.length > 0 ? (
                state.mentalRows.map((row) => (
                  <Scope2Item
                    key={row.logId}
                    title={`Mental - ${row.logDate}`}
                    emergencyFlagged={row.emergencyFlagged}
                    rawQuote={row.rawQuote}
                    details={[
                      ["Mood", row.moodScore],
                      ["Kecemasan", row.anxietyLevel],
                      ["Tidur", row.sleepHours],
                      ["Trigger", row.triggerNotes],
                      ["Kepercayaan ekstraksi", row.extractionConfidence],
                      ["Model", row.aiModel],
                      ["Sesi", row.sessionId],
                    ]}
                  />
                ))
              ) : (
                <EmptyState message="Belum ada data mental terotorisasi." />
              )}
            </div>
          </Card>
        ) : null}

        {state.grant.canViewScope2Physical ? (
          <Card>
            <CardHeader>
              <CardTitle>Scope 2 Fisik</CardTitle>
              <CardDescription>Data fisik berasal dari sesi AI pasien dan kutipan asli.</CardDescription>
            </CardHeader>
            <div className="grid gap-3">
              {state.physicalRows.length > 0 ? (
                state.physicalRows.map((row) => (
                  <Scope2Item
                    key={row.logId}
                    title={`Fisik - ${row.logDate}`}
                    emergencyFlagged={row.emergencyFlagged}
                    rawQuote={row.rawQuote}
                    details={[
                      ["Keluhan", row.symptomType],
                      ["Tingkat keluhan", row.severity],
                      ["Lokasi", row.bodyLocation],
                      ["Durasi", row.durationNote],
                      ["Kepercayaan ekstraksi", row.extractionConfidence],
                      ["Model", row.aiModel],
                      ["Sesi", row.sessionId],
                    ]}
                  />
                ))
              ) : (
                <EmptyState message="Belum ada data fisik terotorisasi." />
              )}
            </div>
          </Card>
        ) : null}

        {state.ragAvailable ? (
          <Card>
            <CardHeader>
              <CardTitle>Tanya AI untuk Dokter</CardTitle>
              <CardDescription>AI hanya memakai Scope 2 yang diotorisasi pasien.</CardDescription>
            </CardHeader>
            <DoctorRagClient grantId={grantId} />
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>RAG dokter tidak tersedia</CardTitle>
              <CardDescription>
                Grant ini tidak mencakup Scope 2 mental atau Scope 2 fisik, jadi panel tanya AI disembunyikan.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Scope1Form({
  grantId,
  records,
}: {
  grantId: string;
  records: Array<{ recordId: string; title: string }>;
}) {
  return (
    <form action={createScope1RecordAction} className="grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-4">
      <input type="hidden" name="grant_id" value={grantId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor="record_type">Jenis rekam medis</Label>
          <Select id="record_type" name="record_type" required defaultValue="note">
            <option value="lab">Lab</option>
            <option value="xray">X-Ray</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="prescription">Resep</option>
            <option value="vaccine">Vaksin</option>
            <option value="action">Tindakan</option>
            <option value="note">Catatan</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="amends_record_id">Amendemen untuk</Label>
          <Select id="amends_record_id" name="amends_record_id" defaultValue="">
            <option value="">Bukan amendemen</option>
            {records.map((record) => (
              <option key={record.recordId} value={record.recordId}>
                {record.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" maxLength={160} required />
      </Field>
      <Field>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" name="description" maxLength={4000} />
      </Field>
      <Field>
        <Label htmlFor="attachment">Lampiran PDF/JPG/PNG</Label>
        <Input id="attachment" name="attachment" type="file" accept="application/pdf,image/jpeg,image/png" />
      </Field>
      <Button type="submit" className="w-fit rounded-[10px]">
        <PlusCircle size={16} />
        Simpan rekam medis
      </Button>
    </form>
  );
}

function Scope2Item({
  title,
  emergencyFlagged,
  rawQuote,
  details,
}: {
  title: string;
  emergencyFlagged: boolean;
  rawQuote: string;
  details: Array<[string, string | null]>;
}) {
  return (
    <div className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-[var(--color-midnight)]">{title}</h3>
        {emergencyFlagged ? (
          <StatusBadge tone="failed">
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={13} />
              Tanda bahaya
            </span>
          </StatusBadge>
        ) : null}
      </div>
      <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-sm leading-6 text-[var(--color-charcoal-primary)]">
        &quot;{rawQuote}&quot;
      </p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[var(--color-ash)]">{label}</dt>
              <dd className="font-medium text-[var(--color-charcoal-primary)]">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
      {message}
    </p>
  );
}

function StatusMessage({
  tone,
  message,
}: {
  tone: "approved" | "failed";
  message: string;
}) {
  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[var(--shadow-subtle)]">
      <StatusBadge tone={tone}>{message}</StatusBadge>
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

function doctorAccessTitle(reason: DoctorAccessError["reason"]) {
  if (reason === "expired") return "Akses sudah kedaluwarsa";
  if (reason === "revoked") return "Akses sudah dicabut";
  if (reason === "missing_scope") return "Cakupan akses tidak cukup";
  if (reason === "not_found") return "Grant tidak ditemukan";
  return "Akses tidak diizinkan";
}

function describeGrantFlags(grant: {
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
}) {
  const labels: string[] = [];
  if (grant.canViewScope1) labels.push("Scope 1");
  if (grant.canViewScope2Mental) labels.push("Scope 2 mental");
  if (grant.canViewScope2Physical) labels.push("Scope 2 fisik");
  if (grant.canDownloadAttachments) labels.push("unduh lampiran");
  return labels;
}
