"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, Download, Eye, Send } from "lucide-react";

import { createScope1RecordFromDashboardAction } from "@/app/doctor/actions";
import { DoctorRagLazyPanel } from "@/app/doctor/_components/doctor-rag-lazy-panel";
import { ProofStatus } from "@/components/proof-status";
import { StatusBadge } from "@/components/status-badge";
import { LoadingActionButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import type { DoctorGrantPageState } from "@/lib/doctor-records/service";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fillTemplate, formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import {
  proofLabel,
  proofStatusMessages,
  proofTone,
  recordTypeLabel,
} from "@/lib/i18n/labels";

export type DoctorDashboardModalKind = "chat" | "records" | "create";
export type DoctorGrantModalSaveResult =
  | { ok: true }
  | { ok: false; error: string };

export function GrantModalContent({
  kind,
  state,
  locale,
  copy,
  onSaved,
  onClose,
}: {
  kind: DoctorDashboardModalKind;
  state: DoctorGrantPageState;
  locale: Locale;
  copy: Dictionary;
  onSaved: (grantId: string) => Promise<DoctorGrantModalSaveResult>;
  onClose: () => void;
}) {
  if (kind === "chat") {
    return <ChatModal state={state} copy={copy} />;
  }

  if (kind === "create") {
    return <CreateRecordModal state={state} copy={copy} onSaved={onSaved} onClose={onClose} />;
  }

  return <RecordsModal state={state} locale={locale} copy={copy} />;
}

function GrantSummary({ state, locale, copy }: { state: DoctorGrantPageState; locale: Locale; copy: Dictionary }) {
  return (
    <div className="mb-4 grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={proofTone(state.grant.blockchainStatus)}>
          {copy.common.grant} {proofLabel(copy, state.grant.blockchainStatus)}
        </StatusBadge>
        <StatusBadge tone="neutral">
          {copy.common.until} {formatDateTime(state.grant.expiresAt, locale)}
        </StatusBadge>
      </div>
      <p className="font-semibold text-[var(--color-midnight)]">{state.grant.patientName}</p>
      <p className="text-[var(--color-ash)]">
        {fillTemplate(copy.doctor.grant.activeScopes, {
          scopes: describeGrantFlags(copy, state.grant).join(", "),
        })}
      </p>
    </div>
  );
}

function ChatModal({ state, copy }: { state: DoctorGrantPageState; copy: Dictionary }) {
  if (!state.ragAvailable) {
    return <EmptyState message={copy.doctor.grant.ragUnavailableDescription} />;
  }

  return (
    <div className="grid gap-4">
      <AuthorizedScope2Preview state={state} copy={copy} />
      <DoctorRagLazyPanel grantId={state.grant.grantId} copy={copy.doctor.rag} />
    </div>
  );
}

function RecordsModal({
  state,
  locale,
  copy,
}: {
  state: DoctorGrantPageState;
  locale: Locale;
  copy: Dictionary;
}) {
  return (
    <div className="grid gap-4">
      <GrantSummary state={state} locale={locale} copy={copy} />
      {state.grant.canViewScope1 ? (
        <Scope1RecordList state={state} locale={locale} copy={copy} />
      ) : null}
      {state.grant.canViewScope2Mental || state.grant.canViewScope2Physical ? (
        <AuthorizedScope2Preview state={state} copy={copy} />
      ) : null}
    </div>
  );
}

function CreateRecordModal({
  state,
  copy,
  onSaved,
  onClose,
}: {
  state: DoctorGrantPageState;
  copy: Dictionary;
  onSaved: (grantId: string) => Promise<DoctorGrantModalSaveResult>;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);

  if (!state.grant.canViewScope1) {
    return <EmptyState message={copy.doctor.dashboard.unavailableNoScope1} />;
  }

  async function submit(formData: FormData) {
    if (savingRef.current) return;

    let shouldClose = false;
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const result = await createScope1RecordFromDashboardAction(formData);
      if (result.ok) {
        const refreshResult = await onSaved(state.grant.grantId);
        if (refreshResult.ok) {
          formRef.current?.reset();
          shouldClose = true;
        } else {
          setError(refreshResult.error);
        }
      } else {
        setError(result.error);
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
    if (shouldClose) onClose();
  }

  return (
    <form ref={formRef} action={(formData) => void submit(formData)} className="grid gap-4">
      <input type="hidden" name="grant_id" value={state.grant.grantId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor="dashboard_record_type">{copy.doctor.grant.recordType}</Label>
          <Select id="dashboard_record_type" name="record_type" required defaultValue="note">
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
          <Label htmlFor="dashboard_amends_record_id">{copy.doctor.grant.amendsRecord}</Label>
          <Select id="dashboard_amends_record_id" name="amends_record_id" defaultValue="">
            <option value="">{copy.doctor.grant.notAmendment}</option>
            {state.scope1Records.map((record) => (
              <option key={record.recordId} value={record.recordId}>
                {record.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor="dashboard_title">{copy.doctor.grant.titleLabel}</Label>
        <Input id="dashboard_title" name="title" maxLength={160} required />
      </Field>
      <Field>
        <Label htmlFor="dashboard_description">{copy.doctor.grant.descriptionLabel}</Label>
        <Textarea id="dashboard_description" name="description" maxLength={4000} />
      </Field>
      <Field>
        <Label htmlFor="dashboard_attachment">{copy.doctor.grant.attachmentLabel}</Label>
        <Input id="dashboard_attachment" name="attachment" type="file" accept="application/pdf,image/jpeg,image/png" />
      </Field>
      {error ? <ErrorState message={error} /> : null}
      <LoadingActionButton
        type="submit"
        className="w-full rounded-[10px] sm:w-fit"
        isLoading={isSaving}
        loadingLabel={copy.doctor.rag.processing}
        slotClassName="w-full sm:w-fit"
      >
        <Send size={16} />
        {copy.doctor.grant.createRecord}
      </LoadingActionButton>
    </form>
  );
}

function Scope1RecordList({
  state,
  locale,
  copy,
}: {
  state: DoctorGrantPageState;
  locale: Locale;
  copy: Dictionary;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="font-semibold text-[var(--color-midnight)]">{copy.doctor.grant.scope1Title}</h3>
      {state.scope1Records.length > 0 ? (
        state.scope1Records.map((record) => (
          <div
            key={record.recordId}
            className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase text-[var(--color-ash)]">{recordTypeLabel(copy, record.recordType)}</p>
                <h4 className="break-words font-semibold text-[var(--color-midnight)]">{record.title}</h4>
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
              {record.amendsRecordId ? ` - ${copy.doctor.grant.amendmentFor} ${record.amendsRecordId}` : ""}
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
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button asChild variant="ghost" className="w-full rounded-[10px] sm:w-auto">
                  <Link
                    href={`/doctor/grants/${state.grant.grantId}/attachments/${record.attachmentFileId}/preview`}
                    target="_blank"
                  >
                    <Eye size={16} />
                    {copy.doctor.grant.previewAttachment.replace(
                      "{name}",
                      record.attachmentFilename ?? copy.doctor.grant.attachmentFallback,
                    )}
                  </Link>
                </Button>
                {record.attachmentCanDownload ? (
                  <Button asChild variant="secondary" className="w-full rounded-[10px] sm:w-auto">
                    <Link href={`/doctor/grants/${state.grant.grantId}/attachments/${record.attachmentFileId}/download`}>
                      <Download size={16} />
                      {copy.doctor.grant.downloadAttachment.replace(
                        "{name}",
                        record.attachmentFilename ?? copy.doctor.grant.attachmentFallback,
                      )}
                    </Link>
                  </Button>
                ) : (
                  <StatusBadge tone="neutral">{copy.doctor.dashboard.downloadUnavailable}</StatusBadge>
                )}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <EmptyState message={copy.doctor.grant.noScope1} />
      )}
    </section>
  );
}

function AuthorizedScope2Preview({ state, copy }: { state: DoctorGrantPageState; copy: Dictionary }) {
  return (
    <div className="grid gap-3">
      {state.grant.canViewScope2Mental ? (
        <Scope2Section
          title={copy.doctor.grant.scope2MentalTitle}
          empty={copy.doctor.grant.noMental}
          rows={state.mentalRows.map((row) => ({
            id: row.logId,
            title: `${copy.common.scopeLabels.scope2Mental} - ${row.logDate}`,
            emergencyFlagged: row.emergencyFlagged,
            rawQuote: row.rawQuote,
            details: [
              [copy.doctor.grant.mood, row.moodScore],
              [copy.doctor.grant.anxiety, row.anxietyLevel],
              [copy.doctor.grant.sleep, row.sleepHours],
              [copy.doctor.grant.trigger, row.triggerNotes],
              [copy.doctor.grant.extractionConfidence, row.extractionConfidence],
              [copy.doctor.grant.model, row.aiModel],
              [copy.doctor.grant.session, row.sessionId],
            ],
          }))}
          warningLabel={copy.doctor.grant.dangerFlag}
        />
      ) : null}
      {state.grant.canViewScope2Physical ? (
        <Scope2Section
          title={copy.doctor.grant.scope2PhysicalTitle}
          empty={copy.doctor.grant.noPhysical}
          rows={state.physicalRows.map((row) => ({
            id: row.logId,
            title: `${copy.common.scopeLabels.scope2Physical} - ${row.logDate}`,
            emergencyFlagged: row.emergencyFlagged,
            rawQuote: row.rawQuote,
            details: [
              [copy.doctor.grant.symptom, row.symptomType],
              [copy.doctor.grant.severity, row.severity],
              [copy.doctor.grant.location, row.bodyLocation],
              [copy.doctor.grant.duration, row.durationNote],
              [copy.doctor.grant.extractionConfidence, row.extractionConfidence],
              [copy.doctor.grant.model, row.aiModel],
              [copy.doctor.grant.session, row.sessionId],
            ],
          }))}
          warningLabel={copy.doctor.grant.dangerFlag}
        />
      ) : null}
    </div>
  );
}

function Scope2Section({
  title,
  empty,
  rows,
  warningLabel,
}: {
  title: string;
  empty: string;
  rows: Array<{
    id: string;
    title: string;
    emergencyFlagged: boolean;
    rawQuote: string;
    details: Array<[string, string | null]>;
  }>;
  warningLabel: string;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="font-semibold text-[var(--color-midnight)]">{title}</h3>
      {rows.length > 0 ? (
        rows.map((row) => (
          <div key={row.id} className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-[var(--color-midnight)]">{row.title}</h4>
              {row.emergencyFlagged ? (
                <StatusBadge tone="failed">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle size={13} />
                    {warningLabel}
                  </span>
                </StatusBadge>
              ) : null}
            </div>
            <p className="break-words rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-sm leading-6 text-[var(--color-charcoal-primary)] [overflow-wrap:anywhere]">
              &quot;{row.rawQuote}&quot;
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {row.details
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[var(--color-ash)]">{label}</dt>
                    <dd className="font-medium text-[var(--color-charcoal-primary)]">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ))
      ) : (
        <EmptyState message={empty} />
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
      {message}
    </p>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] p-4 text-sm text-[var(--color-error-red)]">
      {message}
    </p>
  );
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
