"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Filter,
  Send,
  X,
} from "lucide-react";

import { DashboardCard } from "@/app/_components/dashboard-card";
import { ProofStatus } from "@/components/proof-status";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  createScope1RecordFromDashboardAction,
  loadDoctorGrantModalStateAction,
} from "@/app/doctor/actions";
import { DoctorRagClient } from "@/app/doctor/_components/doctor-rag-client";
import {
  deriveDoctorSessionStatus,
  filterDoctorDashboardSessions,
  type DoctorDashboardFilter,
  type DoctorDashboardSession,
} from "@/lib/doctor-records/dashboard-model";
import type { DoctorDashboardState, DoctorGrantPageState } from "@/lib/doctor-records/service";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fillTemplate, formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import {
  localizedScopeList,
  proofLabel,
  proofStatusMessages,
  proofTone,
  recordTypeLabel,
} from "@/lib/i18n/labels";

type ModalKind = "chat" | "records" | "create";

type ActiveModal = {
  kind: ModalKind;
  session: DoctorDashboardSession;
};

export function DoctorDashboardClient({
  state,
  qrData,
  locale,
  copy,
}: {
  state: DoctorDashboardState;
  qrData: string | null;
  locale: Locale;
  copy: Dictionary;
}) {
  const [filter, setFilter] = useState<DoctorDashboardFilter>("active");
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [modalState, setModalState] = useState<DoctorGrantPageState | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const now = new Date();
  const sessions = filterDoctorDashboardSessions(state.activeGrants, filter, now);

  function openQrModal() {
    setIsQrOpen(true);
  }

  function closeGrantModal() {
    setActiveModal(null);
    setModalState(null);
    setModalError(null);
    setIsModalLoading(false);
  }

  async function openGrantModal(kind: ModalKind, session: DoctorDashboardSession) {
    setActiveModal({ kind, session });
    setModalState(null);
    setModalError(null);
    setIsModalLoading(true);

    const result = await loadDoctorGrantModalStateAction(session.grantId);
    if (result.ok) {
      setModalState(result.state);
    } else {
      setModalError(result.error);
    }
    setIsModalLoading(false);
  }

  async function refreshGrantState(grantId: string) {
    const result = await loadDoctorGrantModalStateAction(grantId);
    if (result.ok) {
      setModalState(result.state);
      setModalError(null);
    } else {
      setModalError(result.error);
    }
  }

  return (
    <div className="grid gap-8">
      <DashboardCard className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CardHeader className="mb-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge tone="approved">{copy.doctor.dashboard.profileVerified}</StatusBadge>
              <StatusBadge tone="neutral">{state.doctor.specialization ?? copy.common.noSpecialization}</StatusBadge>
            </div>
            <CardTitle>{state.doctor.full_name}</CardTitle>
            <CardDescription>{copy.doctor.dashboard.qrDescription}</CardDescription>
          </CardHeader>
          {qrData ? (
            <button
              type="button"
              onClick={openQrModal}
              title={copy.doctor.dashboard.openQrLarge}
              className="cursor-pointer rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-2 transition hover:bg-[var(--color-stone-surface)]"
            >
              <Image
                src={qrData}
                alt={copy.doctor.dashboard.qrAlt}
                width={88}
                height={88}
                unoptimized
                className="size-22"
              />
            </button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-4">
            <p className="text-sm text-[var(--color-ash)]">{copy.doctor.dashboard.accessCode}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-normal text-[var(--color-midnight)]">
              {state.doctor.doctor_access_code}
            </p>
          </div>
          <Button asChild variant="secondary" className="rounded-[10px]">
            <Link href="/doctor/profile">
              <FileText size={16} />
              {copy.doctor.dashboard.editProfile}
            </Link>
          </Button>
        </div>
      </DashboardCard>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-[var(--color-midnight)]">
            {copy.doctor.dashboard.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">
            {copy.doctor.dashboard.activePatientsDescription}
          </p>
        </div>

        <DashboardCard className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <CardHeader className="mb-0">
              <CardTitle>{copy.doctor.dashboard.sessionTableTitle}</CardTitle>
              <CardDescription>{copy.doctor.dashboard.sessionTableDescription}</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2" aria-label={copy.doctor.dashboard.filterLabel}>
              <Filter size={18} className="mt-2 text-[var(--color-ash)]" aria-hidden="true" />
              <FilterButton
                active={filter === "all"}
                dataFilter="all"
                label={copy.doctor.dashboard.filterAll}
                onClick={() => setFilter("all")}
              />
              <FilterButton
                active={filter === "active"}
                dataFilter="active"
                label={copy.doctor.dashboard.filterActive}
                onClick={() => setFilter("active")}
              />
              <FilterButton
                active={filter === "finished"}
                dataFilter="finished"
                label={copy.doctor.dashboard.filterFinished}
                onClick={() => setFilter("finished")}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-ash)]">
                <tr>
                  <th className="px-3 py-2">{copy.doctor.dashboard.columnDate}</th>
                  <th className="px-3 py-2">{copy.doctor.dashboard.columnPatient}</th>
                  <th className="px-3 py-2">{copy.doctor.dashboard.columnStatus}</th>
                  <th className="px-3 py-2">{copy.doctor.dashboard.chatAi}</th>
                  <th className="px-3 py-2">{copy.doctor.dashboard.viewMedicalRecords}</th>
                  <th className="px-3 py-2">{copy.doctor.dashboard.createMedicalRecord}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <SessionRow
                      key={session.grantId}
                      session={session}
                      locale={locale}
                      copy={copy}
                      now={now}
                      onOpen={openGrantModal}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="rounded-[10px] bg-[var(--color-stone-surface)] px-4 py-6 text-center text-[var(--color-ash)]">
                      {copy.doctor.dashboard.noActivePatients}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </section>

      {isQrOpen && qrData ? (
        <DashboardDialog
          title={copy.doctor.dashboard.qrLargeTitle}
          closeLabel={copy.doctor.dashboard.closeModal}
          onClose={() => setIsQrOpen(false)}
        >
          <div className="grid place-items-center gap-4">
            <Image
              src={qrData}
              alt={copy.doctor.dashboard.qrAlt}
              width={320}
              height={320}
              unoptimized
              className="size-80"
            />
            <p className="font-mono text-2xl font-semibold text-[var(--color-midnight)]">
              {state.doctor.doctor_access_code}
            </p>
          </div>
        </DashboardDialog>
      ) : null}

      {activeModal ? (
        <DashboardDialog
          title={modalTitle(copy, activeModal.kind)}
          closeLabel={copy.doctor.dashboard.closeModal}
          onClose={closeGrantModal}
          wide
        >
          {isModalLoading ? (
            <EmptyState message={copy.doctor.dashboard.loadingModal} />
          ) : modalError ? (
            <ErrorState message={modalError} />
          ) : modalState ? (
            <GrantModalContent
              kind={activeModal.kind}
              state={modalState}
              locale={locale}
              copy={copy}
              onRefresh={refreshGrantState}
            />
          ) : null}
        </DashboardDialog>
      ) : null}
    </div>
  );
}

function SessionRow({
  session,
  locale,
  copy,
  now,
  onOpen,
}: {
  session: DoctorDashboardSession;
  locale: Locale;
  copy: Dictionary;
  now: Date;
  onOpen: (kind: ModalKind, session: DoctorDashboardSession) => void;
}) {
  const status = deriveDoctorSessionStatus(session, now);
  const isActive = status.kind === "active";
  const canChat = isActive && (session.canViewScope2Mental || session.canViewScope2Physical);
  const canViewRecords = isActive;
  const canCreateRecord = isActive && session.canViewScope1;

  return (
    <tr className="bg-[var(--color-card)] shadow-[var(--shadow-subtle)]">
      <td className="rounded-l-[10px] border-y border-l border-[var(--color-fog)] px-3 py-3 align-top">
        {formatDateTime(session.grantedAt, locale)}
      </td>
      <td className="border-y border-[var(--color-fog)] px-3 py-3 align-top">
        <p className="font-semibold text-[var(--color-midnight)]">{session.patientName}</p>
        <p className="text-xs text-[var(--color-ash)]">{localizedScopeList(copy, session.scopes).join(", ")}</p>
      </td>
      <td className="border-y border-[var(--color-fog)] px-3 py-3 align-top">
        <SessionStatusBadge session={session} status={status} locale={locale} copy={copy} />
      </td>
      <td className="border-y border-[var(--color-fog)] px-3 py-3 align-top">
        <ActionButton
          label={copy.doctor.dashboard.chatAi}
          title={canChat ? copy.doctor.dashboard.chatAi : copy.doctor.dashboard.unavailableNoScope2}
          disabled={!canChat}
          icon={<Bot size={15} />}
          onClick={() => onOpen("chat", session)}
        />
      </td>
      <td className="border-y border-[var(--color-fog)] px-3 py-3 align-top">
        <ActionButton
          label={copy.doctor.dashboard.viewData}
          title={canViewRecords ? copy.doctor.dashboard.viewMedicalRecords : copy.doctor.dashboard.statusFinished}
          disabled={!canViewRecords}
          icon={<Eye size={15} />}
          onClick={() => onOpen("records", session)}
        />
      </td>
      <td className="rounded-r-[10px] border-y border-r border-[var(--color-fog)] px-3 py-3 align-top">
        <ActionButton
          label={copy.doctor.dashboard.createRecordShort}
          title={canCreateRecord ? copy.doctor.dashboard.createMedicalRecord : copy.doctor.dashboard.unavailableNoScope1}
          disabled={!canCreateRecord}
          icon={<FilePlus2 size={15} />}
          onClick={() => onOpen("create", session)}
        />
      </td>
    </tr>
  );
}

function FilterButton({
  active,
  dataFilter,
  label,
  onClick,
}: {
  active: boolean;
  dataFilter: DoctorDashboardFilter;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-filter={dataFilter}
      onClick={onClick}
      className={[
        "min-h-10 cursor-pointer rounded-[10px] px-3 text-sm font-semibold transition",
        active
          ? "bg-[var(--color-teal-muted)] text-[var(--color-midnight)]"
          : "bg-[var(--color-stone-surface)] text-[var(--color-graphite)] hover:bg-[var(--color-parchment-card)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ActionButton({
  label,
  title,
  disabled,
  icon,
  onClick,
}: {
  label: string;
  title: string;
  disabled: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="rounded-[10px] px-3"
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

function SessionStatusBadge({
  session,
  status,
  locale,
  copy,
}: {
  session: DoctorDashboardSession;
  status: ReturnType<typeof deriveDoctorSessionStatus>;
  locale: Locale;
  copy: Dictionary;
}) {
  if (status.reason === "active") {
    return (
      <div className="grid gap-1">
        <StatusBadge tone="approved">{copy.doctor.dashboard.statusActive}</StatusBadge>
        <span className="text-xs text-[var(--color-ash)]">
          {fillTemplate(copy.doctor.dashboard.activeUntil, {
            time: formatDateTime(session.expiresAt, locale),
          })}
        </span>
      </div>
    );
  }

  return (
    <StatusBadge tone={status.reason === "revoked" ? "failed" : "neutral"}>
      {status.reason === "revoked"
        ? copy.doctor.dashboard.statusRevoked
        : copy.doctor.dashboard.statusExpired}
    </StatusBadge>
  );
}

function DashboardDialog({
  title,
  closeLabel,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-dashboard-modal-title"
        className={[
          "max-h-[88vh] w-full overflow-y-auto rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-elevated)]",
          wide ? "max-w-5xl" : "max-w-md",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="doctor-dashboard-modal-title" className="text-lg font-semibold text-[var(--color-midnight)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)] transition hover:bg-[var(--color-parchment-card)]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function GrantModalContent({
  kind,
  state,
  locale,
  copy,
  onRefresh,
}: {
  kind: ModalKind;
  state: DoctorGrantPageState;
  locale: Locale;
  copy: Dictionary;
  onRefresh: (grantId: string) => Promise<void>;
}) {
  if (kind === "chat") {
    return <ChatModal state={state} copy={copy} />;
  }

  if (kind === "create") {
    return <CreateRecordModal state={state} copy={copy} onRefresh={onRefresh} />;
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
      <DoctorRagClient grantId={state.grant.grantId} copy={copy.doctor.rag} />
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
  onRefresh,
}: {
  state: DoctorGrantPageState;
  copy: Dictionary;
  onRefresh: (grantId: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!state.grant.canViewScope1) {
    return <EmptyState message={copy.doctor.dashboard.unavailableNoScope1} />;
  }

  async function submit(formData: FormData) {
    setIsSaving(true);
    setError(null);
    setStatus(null);
    const result = await createScope1RecordFromDashboardAction(formData);
    if (result.ok) {
      setStatus(copy.doctor.dashboard.recordSaved);
      await onRefresh(state.grant.grantId);
    } else {
      setError(result.error);
    }
    setIsSaving(false);
  }

  return (
    <form action={(formData) => void submit(formData)} className="grid gap-4">
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
      {status ? <StatusBadge tone="pending">{status}</StatusBadge> : null}
      <Button type="submit" className="w-fit rounded-[10px]" disabled={isSaving}>
        <Send size={16} />
        {isSaving ? copy.doctor.rag.processing : copy.doctor.grant.createRecord}
      </Button>
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
              <div>
                <p className="text-xs uppercase text-[var(--color-ash)]">{recordTypeLabel(copy, record.recordType)}</p>
                <h4 className="font-semibold text-[var(--color-midnight)]">{record.title}</h4>
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
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost" className="rounded-[10px]">
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
                  <Button asChild variant="secondary" className="rounded-[10px]">
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
            <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-sm leading-6 text-[var(--color-charcoal-primary)]">
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

function modalTitle(copy: Dictionary, kind: ModalKind) {
  if (kind === "chat") return copy.doctor.dashboard.chatAi;
  if (kind === "create") return copy.doctor.dashboard.createMedicalRecord;
  return copy.doctor.dashboard.viewMedicalRecords;
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
