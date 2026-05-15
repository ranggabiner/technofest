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
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fillTemplate, formatDateTime } from "@/lib/i18n/format";
import {
  proofLabel,
  proofStatusMessages,
  proofTone,
  recordTypeLabel,
} from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";

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
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title={copy.doctor.grant.accessTitle} nav={[]}>
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
        <AppShell title={copy.doctor.grant.accessTitle} nav={[{ href: "/doctor", label: copy.doctor.nav.dashboard }]}>
          <StatePanel
            title={doctorAccessTitle(copy, error.reason)}
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
      title={copy.doctor.grant.title}
      nav={[
        { href: "/doctor", label: copy.doctor.nav.dashboard },
        { href: `/doctor/grants/${grantId}`, label: copy.doctor.grant.title },
      ]}
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={proofTone(state.grant.blockchainStatus)}>
                {copy.common.grant} {proofLabel(copy, state.grant.blockchainStatus)}
              </StatusBadge>
              <StatusBadge tone="neutral">{copy.common.until} {formatDateTime(state.grant.expiresAt, locale)}</StatusBadge>
            </div>
            <CardTitle>{state.grant.patientName}</CardTitle>
            <CardDescription>
              {fillTemplate(copy.doctor.grant.timerDescription, { email: state.grant.patientEmail })}
            </CardDescription>
          </CardHeader>
          <div className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm text-[var(--color-charcoal-primary)]">
            <p>{fillTemplate(copy.doctor.grant.activeScopes, { scopes: describeGrantFlags(copy, state.grant).join(", ") })}</p>
            <p>{copy.doctor.grant.grantId}: <span className="font-mono">{state.grant.grantId}</span></p>
          </div>
          <div className="mt-3">
            <ProofStatus
              proofType="access_grant"
              id={state.grant.grantId}
              blockchainStatus={state.grant.blockchainStatus}
              txHash={state.grant.blockchainTxHash}
              messages={proofStatusMessages(copy)}
            />
          </div>
        </Card>

        {query.scope1_error ? (
          <StatusMessage tone="failed" message={query.scope1_error} />
        ) : query.scope1_status === "saved" ? (
          <StatusMessage tone="approved" message={copy.doctor.grant.saved} />
        ) : null}

        {state.grant.canViewScope1 ? (
          <Card>
            <CardHeader>
              <CardTitle>{copy.doctor.grant.scope1Title}</CardTitle>
              <CardDescription>{copy.doctor.grant.scope1Description}</CardDescription>
            </CardHeader>
            <Scope1Form grantId={grantId} records={state.scope1Records} copy={copy} />
            <div className="mt-5 grid gap-3">
              {state.scope1Records.length > 0 ? (
                state.scope1Records.map((record) => (
                  <div
                    key={record.recordId}
                    className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-[var(--color-ash)]">{recordTypeLabel(copy, record.recordType)}</p>
                        <h3 className="font-semibold text-[var(--color-midnight)]">{record.title}</h3>
                      </div>
                      <StatusBadge tone={proofTone(record.blockchainStatus)}>
                        {copy.common.proofPrefix} {proofLabel(copy, record.blockchainStatus)}
                      </StatusBadge>
                    </div>
                    {record.description ? (
                      <p className="text-sm leading-6 text-[var(--color-charcoal-primary)]">{record.description}</p>
                    ) : null}
                    <p className="text-xs text-[var(--color-ash)]">
                      {formatDateTime(record.createdAt, locale)}
                      {record.amendsRecordId ? ` · ${copy.doctor.grant.amendmentFor} ${record.amendsRecordId}` : ""}
                    </p>
                    <ProofStatus
                      proofType="scope1_record"
                      id={record.recordId}
                      blockchainStatus={record.blockchainStatus}
                      txHash={record.blockchainTxHash}
                      lastError={record.blockchainLastError}
                      messages={proofStatusMessages(copy)}
                    />
                    {record.attachmentFileId ? (
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" className="rounded-[10px]">
                          <Link
                            href={`/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/preview`}
                            target="_blank"
                          >
                            <Eye size={16} />
                            {copy.doctor.grant.previewAttachment.replace("{name}", record.attachmentFilename ?? copy.doctor.grant.attachmentFallback)}
                          </Link>
                        </Button>
                        {record.attachmentCanDownload ? (
                          <Button asChild variant="secondary" className="rounded-[10px]">
                            <Link href={`/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/download`}>
                              <Download size={16} />
                              {copy.doctor.grant.downloadAttachment.replace("{name}", record.attachmentFilename ?? copy.doctor.grant.attachmentFallback)}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState message={copy.doctor.grant.noScope1} />
              )}
            </div>
          </Card>
        ) : null}

        {state.grant.canViewScope2Mental ? (
          <Card>
            <CardHeader>
              <CardTitle>{copy.doctor.grant.scope2MentalTitle}</CardTitle>
              <CardDescription>{copy.doctor.grant.scope2MentalDescription}</CardDescription>
            </CardHeader>
            <div className="grid gap-3">
              {state.mentalRows.length > 0 ? (
                state.mentalRows.map((row) => (
                  <Scope2Item
                    key={row.logId}
                    title={`${copy.common.scopeLabels.scope2Mental} - ${row.logDate}`}
                    emergencyFlagged={row.emergencyFlagged}
                    rawQuote={row.rawQuote}
                    details={[
                      [copy.doctor.grant.mood, row.moodScore],
                      [copy.doctor.grant.anxiety, row.anxietyLevel],
                      [copy.doctor.grant.sleep, row.sleepHours],
                      [copy.doctor.grant.trigger, row.triggerNotes],
                      [copy.doctor.grant.extractionConfidence, row.extractionConfidence],
                      [copy.doctor.grant.model, row.aiModel],
                      [copy.doctor.grant.session, row.sessionId],
                    ]}
                    warningLabel={copy.doctor.grant.dangerFlag}
                  />
                ))
              ) : (
                <EmptyState message={copy.doctor.grant.noMental} />
              )}
            </div>
          </Card>
        ) : null}

        {state.grant.canViewScope2Physical ? (
          <Card>
            <CardHeader>
              <CardTitle>{copy.doctor.grant.scope2PhysicalTitle}</CardTitle>
              <CardDescription>{copy.doctor.grant.scope2PhysicalDescription}</CardDescription>
            </CardHeader>
            <div className="grid gap-3">
              {state.physicalRows.length > 0 ? (
                state.physicalRows.map((row) => (
                  <Scope2Item
                    key={row.logId}
                    title={`${copy.common.scopeLabels.scope2Physical} - ${row.logDate}`}
                    emergencyFlagged={row.emergencyFlagged}
                    rawQuote={row.rawQuote}
                    details={[
                      [copy.doctor.grant.symptom, row.symptomType],
                      [copy.doctor.grant.severity, row.severity],
                      [copy.doctor.grant.location, row.bodyLocation],
                      [copy.doctor.grant.duration, row.durationNote],
                      [copy.doctor.grant.extractionConfidence, row.extractionConfidence],
                      [copy.doctor.grant.model, row.aiModel],
                      [copy.doctor.grant.session, row.sessionId],
                    ]}
                    warningLabel={copy.doctor.grant.dangerFlag}
                  />
                ))
              ) : (
                <EmptyState message={copy.doctor.grant.noPhysical} />
              )}
            </div>
          </Card>
        ) : null}

        {state.ragAvailable ? (
          <Card>
            <CardHeader>
              <CardTitle>{copy.doctor.grant.ragTitle}</CardTitle>
              <CardDescription>{copy.doctor.grant.ragDescription}</CardDescription>
            </CardHeader>
            <DoctorRagClient grantId={grantId} copy={copy.doctor.rag} />
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{copy.doctor.grant.ragUnavailableTitle}</CardTitle>
              <CardDescription>{copy.doctor.grant.ragUnavailableDescription}</CardDescription>
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
  copy,
}: {
  grantId: string;
  records: Array<{ recordId: string; title: string }>;
  copy: Dictionary;
}) {
  return (
    <form action={createScope1RecordAction} className="grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-4">
      <input type="hidden" name="grant_id" value={grantId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor="record_type">{copy.doctor.grant.recordType}</Label>
          <Select id="record_type" name="record_type" required defaultValue="note">
            <option value="lab">{copy.common.recordType.lab}</option>
            <option value="xray">{copy.common.recordType.xray}</option>
            <option value="diagnosis">{copy.common.recordType.diagnosis}</option>
            <option value="prescription">{copy.common.recordType.prescription}</option>
            <option value="vaccine">{copy.common.recordType.vaccine}</option>
            <option value="action">{copy.common.recordType.action}</option>
            <option value="note">{copy.common.recordType.note}</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="amends_record_id">{copy.doctor.grant.amendsRecord}</Label>
          <Select id="amends_record_id" name="amends_record_id" defaultValue="">
            <option value="">{copy.doctor.grant.notAmendment}</option>
            {records.map((record) => (
              <option key={record.recordId} value={record.recordId}>
                {record.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor="title">{copy.doctor.grant.titleLabel}</Label>
        <Input id="title" name="title" maxLength={160} required />
      </Field>
      <Field>
        <Label htmlFor="description">{copy.doctor.grant.descriptionLabel}</Label>
        <Textarea id="description" name="description" maxLength={4000} />
      </Field>
      <Field>
        <Label htmlFor="attachment">{copy.doctor.grant.attachmentLabel}</Label>
        <Input id="attachment" name="attachment" type="file" accept="application/pdf,image/jpeg,image/png" />
      </Field>
      <Button type="submit" className="w-fit rounded-[10px]">
        <PlusCircle size={16} />
        {copy.doctor.grant.createRecord}
      </Button>
    </form>
  );
}

function Scope2Item({
  title,
  emergencyFlagged,
  rawQuote,
  details,
  warningLabel,
}: {
  title: string;
  emergencyFlagged: boolean;
  rawQuote: string;
  details: Array<[string, string | null]>;
  warningLabel: string;
}) {
  return (
    <div className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-[var(--color-midnight)]">{title}</h3>
        {emergencyFlagged ? (
          <StatusBadge tone="failed">
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={13} />
              {warningLabel}
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
    <div className="rounded-[10px] bg-[var(--color-card)] p-4 shadow-[var(--shadow-subtle)]">
      <StatusBadge tone={tone}>{message}</StatusBadge>
    </div>
  );
}

function doctorAccessTitle(copy: Dictionary, reason: DoctorAccessError["reason"]) {
  if (reason === "expired") return copy.doctor.grant.accessReason.expired;
  if (reason === "revoked") return copy.doctor.grant.accessReason.revoked;
  if (reason === "missing_scope") return copy.doctor.grant.accessReason.missing_scope;
  if (reason === "not_found") return copy.doctor.grant.accessReason.not_found;
  return copy.doctor.grant.accessReason.default;
}

function describeGrantFlags(copy: Dictionary, grant: {
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
}) {
  const labels: string[] = [];
  if (grant.canViewScope1) labels.push(copy.common.scopeLabels.scope1);
  if (grant.canViewScope2Mental) labels.push(copy.common.scopeLabels.scope2Mental);
  if (grant.canViewScope2Physical) labels.push(copy.common.scopeLabels.scope2Physical);
  if (grant.canDownloadAttachments) labels.push(copy.common.scopeLabels.attachmentDownload);
  return labels;
}
