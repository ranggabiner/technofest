import Link from "next/link";
import { Download, FileText } from "lucide-react";

import { DashboardCard } from "@/app/_components/portal-layout";
import { requireApprovedDoctorPortalRole } from "@/app/doctor/_components/doctor-portal-role";
import { EmptyState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadDoctorMedicalRecordLibraryState,
  type Scope1RecordView,
} from "@/lib/doctor-records/service";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fillTemplate, formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import {
  proofLabel,
  proofTone,
  recordTypeLabel,
} from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorMedicalRecordLibraryPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireApprovedDoctorPortalRole();
  const state = await loadDoctorMedicalRecordLibraryState(role);

  return (
    <section className="grid gap-8" data-doctor-library-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
          {copy.doctor.dashboard.sidebarSection}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
          {copy.doctor.library.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.doctor.library.description}
        </p>
      </header>

      {state.groups.length > 0 ? (
        <div className="grid gap-5">
          {state.groups.map((group) => (
            <DashboardCard key={group.grant.grantId} className="p-6 md:p-8">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={proofTone(group.grant.blockchainStatus)}>
                    {copy.common.grant} {proofLabel(copy, group.grant.blockchainStatus)}
                  </StatusBadge>
                  <StatusBadge tone="neutral">
                    {copy.common.until} {formatDateTime(group.grant.expiresAt, locale)}
                  </StatusBadge>
                </div>
                <CardTitle>{group.grant.patientName}</CardTitle>
                <CardDescription>
                  {fillTemplate(copy.doctor.grant.activeScopes, {
                    scopes: describeGrantFlags(copy, group.grant).join(", "),
                  })}
                </CardDescription>
              </CardHeader>

              <div className="grid gap-3">
                {group.records.map((record) => (
                  <LibraryRecordCard
                    key={record.recordId}
                    grantId={group.grant.grantId}
                    record={record}
                    locale={locale}
                    copy={copy}
                  />
                ))}
              </div>
            </DashboardCard>
          ))}
        </div>
      ) : (
        <DashboardCard className="p-6 md:p-8">
          <EmptyState message={copy.doctor.library.noRecords} />
        </DashboardCard>
      )}
    </section>
  );
}

function LibraryRecordCard({
  grantId,
  record,
  locale,
  copy,
}: {
  grantId: string;
  record: Scope1RecordView;
  locale: Locale;
  copy: Dictionary;
}) {
  return (
    <article
      className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4"
      data-doctor-library-file
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs uppercase text-[var(--color-ash)]">
            <FileText size={14} aria-hidden="true" />
            {recordTypeLabel(copy, record.recordType)}
          </p>
          <h2 className="break-words font-semibold text-[var(--color-midnight)]">
            {record.attachmentFilename ?? copy.doctor.grant.attachmentFallback}
          </h2>
        </div>
        <StatusBadge tone={proofTone(record.blockchainStatus)}>
          {copy.common.proofPrefix} {proofLabel(copy, record.blockchainStatus)}
        </StatusBadge>
      </div>

      <p className="break-words text-sm leading-6 text-[var(--color-charcoal-primary)] [overflow-wrap:anywhere]">
        {record.title}
      </p>

      <p className="text-xs text-[var(--color-ash)]">
        {formatDateTime(record.createdAt, locale)}
        {record.amendsRecordId ? ` - ${copy.doctor.grant.amendmentFor} ${record.amendsRecordId}` : ""}
      </p>

      {record.attachmentFileId ? (
        <Button asChild variant="secondary" className="w-full rounded-[10px] sm:w-fit">
          <Link href={`/doctor/grants/${grantId}/attachments/${record.attachmentFileId}/download`}>
            <Download size={16} />
            {copy.doctor.grant.downloadAttachment.replace(
              "{name}",
              record.attachmentFilename ?? copy.doctor.grant.attachmentFallback,
            )}
          </Link>
        </Button>
      ) : null}
    </article>
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
