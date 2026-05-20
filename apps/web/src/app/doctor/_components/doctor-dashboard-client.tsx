"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Bot,
  Eye,
  FilePlus2,
  Filter,
  Loader2,
  X,
} from "lucide-react";

import { DashboardCard } from "@/app/_components/dashboard-card";
import { SaveStatusToast } from "@/app/_components/save-status-toast";
import { EmptyState } from "@/components/state-messages";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/components/ui/motion";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import { loadDoctorGrantModalStateAction } from "@/app/doctor/actions";
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
import { localizedScopeList } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import type {
  DoctorDashboardModalKind,
  DoctorGrantModalSaveResult,
} from "./doctor-grant-modal-content";

type ModalKind = DoctorDashboardModalKind;

const GrantModalContent = dynamic(
  () => import("./doctor-grant-modal-content").then((module) => module.GrantModalContent),
  {
    ssr: false,
    loading: () => <GrantModalContentFallback />,
  },
);

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
  const [saveToastKey, setSaveToastKey] = useState(0);
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

  async function handleRecordSaved(grantId: string): Promise<DoctorGrantModalSaveResult> {
    const result = await loadDoctorGrantModalStateAction(grantId);
    if (result.ok) {
      setModalState(result.state);
      setModalError(null);
      setSaveToastKey((key) => key + 1);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }

  return (
    <div className="grid gap-8">
      <SaveStatusToast message={copy.common.successToast.medicalRecordSaved} triggerKey={saveToastKey} />
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
              className={cn(
                "cursor-pointer rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-2 hover:bg-[var(--color-stone-surface)]",
                motion.iconButton,
              )}
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

          <div data-doctor-session-cards className="grid gap-3 md:hidden">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <SessionCard
                  key={session.grantId}
                  session={session}
                  locale={locale}
                  copy={copy}
                  now={now}
                  onOpen={openGrantModal}
                />
              ))
            ) : (
              <EmptyState icon={false} className="block" message={copy.doctor.dashboard.noActivePatients} />
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
              className="size-[min(18rem,70vw)] sm:size-80"
            />
            <p className="break-all text-center font-mono text-2xl font-semibold text-[var(--color-midnight)]">
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
            <ModalLoadingState message={copy.doctor.dashboard.loadingModal} />
          ) : modalError ? (
            <ErrorState message={modalError} />
          ) : modalState ? (
            <GrantModalContent
              kind={activeModal.kind}
              state={modalState}
              locale={locale}
              copy={copy}
              onSaved={handleRecordSaved}
              onClose={closeGrantModal}
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
  const actionState = getSessionActionState(session, status);

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
          title={actionState.canChat ? copy.doctor.dashboard.chatAi : copy.doctor.dashboard.unavailableNoScope2}
          disabled={!actionState.canChat}
          icon={<Bot size={15} />}
          onClick={() => onOpen("chat", session)}
        />
      </td>
      <td className="border-y border-[var(--color-fog)] px-3 py-3 align-top">
        <ActionButton
          label={copy.doctor.dashboard.viewData}
          title={actionState.canViewRecords ? copy.doctor.dashboard.viewMedicalRecords : copy.doctor.dashboard.statusFinished}
          disabled={!actionState.canViewRecords}
          icon={<Eye size={15} />}
          onClick={() => onOpen("records", session)}
        />
      </td>
      <td className="rounded-r-[10px] border-y border-r border-[var(--color-fog)] px-3 py-3 align-top">
        <ActionButton
          label={copy.doctor.dashboard.createRecordShort}
          title={actionState.canCreateRecord ? copy.doctor.dashboard.createMedicalRecord : copy.doctor.dashboard.unavailableNoScope1}
          disabled={!actionState.canCreateRecord}
          icon={<FilePlus2 size={15} />}
          onClick={() => onOpen("create", session)}
        />
      </td>
    </tr>
  );
}

function SessionCard({
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
  const actionState = getSessionActionState(session, status);

  return (
    <article className="grid gap-4 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-subtle)]">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-ash)]">
            {formatDateTime(session.grantedAt, locale)}
          </p>
          <h3 className="mt-1 break-words font-semibold text-[var(--color-midnight)]">{session.patientName}</h3>
          <p className="mt-1 break-words text-xs leading-5 text-[var(--color-ash)]">
            {localizedScopeList(copy, session.scopes).join(", ")}
          </p>
        </div>
        <SessionStatusBadge session={session} status={status} locale={locale} copy={copy} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <ActionButton
          label={copy.doctor.dashboard.chatAi}
          title={actionState.canChat ? copy.doctor.dashboard.chatAi : copy.doctor.dashboard.unavailableNoScope2}
          disabled={!actionState.canChat}
          icon={<Bot size={15} />}
          className="w-full"
          onClick={() => onOpen("chat", session)}
        />
        <ActionButton
          label={copy.doctor.dashboard.viewData}
          title={actionState.canViewRecords ? copy.doctor.dashboard.viewMedicalRecords : copy.doctor.dashboard.statusFinished}
          disabled={!actionState.canViewRecords}
          icon={<Eye size={15} />}
          className="w-full"
          onClick={() => onOpen("records", session)}
        />
        <ActionButton
          label={copy.doctor.dashboard.createRecordShort}
          title={actionState.canCreateRecord ? copy.doctor.dashboard.createMedicalRecord : copy.doctor.dashboard.unavailableNoScope1}
          disabled={!actionState.canCreateRecord}
          icon={<FilePlus2 size={15} />}
          className="w-full"
          onClick={() => onOpen("create", session)}
        />
      </div>
    </article>
  );
}

function getSessionActionState(
  session: DoctorDashboardSession,
  status: ReturnType<typeof deriveDoctorSessionStatus>,
) {
  const isActive = status.kind === "active";

  return {
    canChat: isActive && (session.canViewScope2Mental || session.canViewScope2Physical),
    canViewRecords: isActive,
    canCreateRecord: isActive && session.canViewScope1,
  };
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
        "min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold transition",
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
  className,
  onClick,
}: {
  label: string;
  title: string;
  disabled: boolean;
  icon: React.ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("rounded-[10px] px-3", className)}
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
    <ViewportModal className="bg-black/35 sm:py-6">
      <ViewportModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-dashboard-modal-title"
        className={cn(
          "max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:p-5",
          wide ? "max-w-5xl" : "max-w-md",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="doctor-dashboard-modal-title" className="text-lg font-semibold text-[var(--color-midnight)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={cn(
              "inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-parchment-card)]",
              motion.iconButton,
            )}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </ViewportModalPanel>
    </ViewportModal>
  );
}

function GrantModalContentFallback() {
  return (
    <div className="grid min-h-[360px] animate-pulse gap-4">
      <div className="h-24 rounded-[10px] bg-[var(--color-stone-surface)]" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-[10px] bg-[var(--color-stone-surface)]" />
        <div className="h-28 rounded-[10px] bg-[var(--color-stone-surface)]" />
      </div>
      <div className="h-32 rounded-[10px] bg-[var(--color-stone-surface)]" />
    </div>
  );
}

function ModalLoadingState({ message }: { message: string }) {
  return (
    <div
      aria-live="polite"
      className="flex items-center gap-3 rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]"
      role="status"
    >
      <Loader2 size={18} className="shrink-0 animate-spin text-[var(--color-midnight)]" aria-hidden="true" />
      <span>{message}</span>
    </div>
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
