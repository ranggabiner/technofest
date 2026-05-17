import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";

import { ProofStatus } from "@/components/proof-status";
import { EmptyState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import {
  proofLabel,
  proofStatusMessages,
  proofTone,
  recordTypeLabel,
} from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import {
  loadPatientHealthHistoryRecordsState,
  patientHealthHistoryRecordFilters,
  resolvePatientHealthHistoryRecordFilter,
  type PatientHealthHistoryRecord,
  type PatientHealthHistoryRecordFilter,
} from "@/lib/patient/health-history";

import { DashboardCard } from "../../../_components/patient-layout";
import { PatientTransitionLink } from "../../../_components/patient-navigation-transition";
import { AttachmentPreviewControl } from "./_components/attachment-preview-modal";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    type?: string | string[];
  }>;
};

export default async function PatientHealthHistoryRecordsPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return null;
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const params = await searchParams;
  const activeFilter = resolvePatientHealthHistoryRecordFilter(params?.type);
  const state = await loadPatientHealthHistoryRecordsState(role, activeFilter);
  const detailCopy = copy.patient.healthHistory.recordsDetail;

  return (
    <section className="grid gap-8" data-health-history-records-page="timeline">
      <header className="border-b border-[var(--color-stone-surface)] pb-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ash)]">
          <PatientTransitionLink
            href="/patient/health-history"
            className="inline-flex cursor-pointer items-center gap-2 font-semibold text-[var(--color-teal-deep)] transition hover:text-[var(--color-midnight)]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {detailCopy.back}
          </PatientTransitionLink>
          <span aria-hidden="true">/</span>
          <span>{copy.patient.healthHistory.title}</span>
          <span aria-hidden="true">/</span>
          <span>{detailCopy.title}</span>
        </div>
        <h1 className="font-serif text-[44px] font-semibold leading-none tracking-[-0.01em] text-[var(--color-midnight)] md:text-[56px]">
          {detailCopy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-graphite)]">
          {detailCopy.description}
        </p>
      </header>

      <nav className="flex flex-wrap gap-3" aria-label={detailCopy.filterLabel}>
        {patientHealthHistoryRecordFilters.map((filter) => (
          <Button
            key={filter}
            asChild
            variant={filter === state.activeFilter ? "secondary" : "ghost"}
            className="min-h-10 px-5"
          >
            <PatientTransitionLink
              href={recordFilterHref(filter)}
              aria-current={filter === state.activeFilter ? "page" : undefined}
              data-health-history-record-filter={filter}
            >
              {recordFilterLabel(copy.patient.healthHistory.recordFilters, filter)}
            </PatientTransitionLink>
          </Button>
        ))}
      </nav>

      {state.records.length > 0 ? (
        <div className="relative grid gap-8 pl-7 before:absolute before:bottom-0 before:left-[9px] before:top-2 before:border-l-2 before:border-[var(--color-stone-surface)]">
          {state.records.map((record, index) => (
            <TimelineRecord
              key={record.recordId}
              copy={copy}
              detailCopy={detailCopy}
              index={index}
              locale={locale}
              record={record}
            />
          ))}
        </div>
      ) : (
        <DashboardCard className="p-6">
          <EmptyState message={copy.patient.healthHistory.noRecords} />
        </DashboardCard>
      )}
    </section>
  );
}

function TimelineRecord({
  copy,
  detailCopy,
  index,
  locale,
  record,
}: {
  copy: Awaited<ReturnType<typeof getDictionary>>;
  detailCopy: Awaited<ReturnType<typeof getDictionary>>["patient"]["healthHistory"]["recordsDetail"];
  index: number;
  locale: Awaited<ReturnType<typeof getLocale>>;
  record: PatientHealthHistoryRecord;
}) {
  return (
    <article className="relative">
      <span
        aria-hidden="true"
        className={[
          "absolute -left-[27px] top-1 grid size-5 place-items-center rounded-full border-4 bg-[var(--color-card)]",
          index === 0
            ? "border-[var(--color-teal-primary)] text-[var(--color-teal-deep)] ring-2 ring-[var(--color-teal-primary)]"
            : "border-[var(--color-stone-surface)] text-[var(--color-ash)]",
        ].join(" ")}
      >
        <span className="size-1.5 rounded-full bg-current" />
      </span>

      <p className="mb-4 text-[16px] font-semibold text-[var(--color-midnight)]">
        {formatRecordDate(record.createdAt, locale)}
      </p>

      <DashboardCard className="grid gap-5 rounded-[14px] p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={index === 0 ? "approved" : "neutral"}>
            {recordTypeLabel(copy, record.recordType)}
          </StatusBadge>
          <StatusBadge tone={proofTone(record.blockchainStatus)}>
            {copy.common.proofPrefix} {proofLabel(copy, record.blockchainStatus)}
          </StatusBadge>
          {record.amendsRecordId ? (
            <StatusBadge tone="pending">{detailCopy.amendment}</StatusBadge>
          ) : null}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ash)]">
            <Clock3 size={14} aria-hidden="true" />
            {formatRecordTime(record.createdAt, locale)}
          </span>
        </div>

        <div>
          <h2 className="text-[24px] font-semibold leading-tight text-[var(--color-midnight)]">
            {record.title}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ash)]">
            <UserRound size={15} aria-hidden="true" />
            <span>
              {detailCopy.inputBy}: {record.doctorName ?? copy.common.noDoctor}
            </span>
            {record.doctorSpecialization ? <span>{record.doctorSpecialization}</span> : null}
          </p>
        </div>

        {record.description ? (
          <p className="text-[15px] leading-7 text-[var(--color-graphite)]">{record.description}</p>
        ) : null}

        <div className="rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-parchment-card)] p-4">
          {record.attachmentFilename ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-card)] text-[var(--color-teal-deep)]">
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-midnight)]">
                    {record.attachmentFilename}
                  </p>
                  <p className="text-xs text-[var(--color-ash)]">
                    {formatAttachmentMeta(record, copy.common.notAvailable, locale)}
                  </p>
                </div>
              </div>
              <AttachmentPreviewControl
                attachmentFileId={record.attachmentFileId}
                filename={record.attachmentFilename}
                meta={formatAttachmentMeta(record, copy.common.notAvailable, locale)}
                mimeType={record.attachmentMimeType}
                recordId={record.recordId}
                copy={detailCopy}
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ash)]">{detailCopy.noAttachment}</p>
          )}
        </div>

        <ProofStatus
          proofType="scope1_record"
          id={record.recordId}
          blockchainStatus={record.blockchainStatus}
          txHash={record.blockchainTxHash}
          lastError={record.blockchainLastError}
          messages={proofStatusMessages(copy)}
        />
      </DashboardCard>
    </article>
  );
}

function recordFilterHref(filter: PatientHealthHistoryRecordFilter) {
  if (filter === "all") return "/patient/health-history/records";
  return `/patient/health-history/records?type=${filter}`;
}

function recordFilterLabel(
  labels: Awaited<ReturnType<typeof getDictionary>>["patient"]["healthHistory"]["recordFilters"],
  filter: PatientHealthHistoryRecordFilter,
) {
  return labels[filter];
}

function formatRecordDate(value: string, locale: Awaited<ReturnType<typeof getLocale>>) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatRecordTime(value: string, locale: Awaited<ReturnType<typeof getLocale>>) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatAttachmentMeta(
  record: PatientHealthHistoryRecord,
  fallback: string,
  locale: Awaited<ReturnType<typeof getLocale>>,
) {
  const size = record.attachmentSizeBytes ? formatFileSize(record.attachmentSizeBytes, locale) : fallback;
  return record.attachmentMimeType ? `${record.attachmentMimeType} · ${size}` : size;
}

function formatFileSize(bytes: number, locale: Awaited<ReturnType<typeof getLocale>>) {
  const intlLocale = locale === "id" ? "id-ID" : "en-US";
  if (bytes < 1024) {
    return new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 0,
      style: "unit",
      unit: "byte",
      unitDisplay: "short",
    }).format(bytes);
  }
  if (bytes < 1024 * 1024) {
    return new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 0,
      style: "unit",
      unit: "kilobyte",
      unitDisplay: "short",
    }).format(bytes / 1024);
  }
  return new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 0,
    style: "unit",
    unit: "megabyte",
    unitDisplay: "short",
  }).format(bytes / (1024 * 1024));
}
