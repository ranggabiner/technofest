import Link from "next/link";

import { DashboardCard } from "@/app/_components/portal-layout";
import { approveDoctorAction, rejectDoctorAction } from "@/app/admin/doctors/actions";
import { ProofStatus } from "@/components/proof-status";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Label, Textarea } from "@/components/ui/form";
import { loadAdminDoctorDetailState } from "@/lib/admin/service";
import { formatDateTime } from "@/lib/i18n/format";
import { proofLabel, proofStatusMessages, proofTone, statusLabel, statusTone } from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const { doctorId } = await params;
  const { doctor, documents, audits } = await loadAdminDoctorDetailState(doctorId);
  const doctorStatusTone =
    doctor.account_status === "pending" ||
    doctor.account_status === "approved" ||
    doctor.account_status === "rejected"
      ? doctor.account_status
      : "neutral";

  return (
    <section className="grid gap-8" data-admin-doctor-detail-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]">
          {copy.admin.nav.doctorVerification}
        </p>
        <h1 className="text-[36px] font-semibold leading-[1.1] text-[var(--color-midnight)] md:text-[44px]">
          {copy.admin.detail.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.admin.detail.kycDescription}
        </p>
      </header>

      <DashboardCard className="p-6 md:p-8">
        <div className="mb-2">
          <StatusBadge tone={doctorStatusTone}>
            {doctor.account_status === "pending"
              ? copy.admin.doctors.pending
              : doctor.account_status === "approved"
                ? copy.admin.doctors.approved
                : copy.admin.doctors.rejected}
          </StatusBadge>
        </div>
        <h2 className="text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">{doctor.full_name}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">
          {doctor.specialization ?? copy.common.noSpecializationShort} · {doctor.email} · {doctor.phone_number ?? copy.common.noPhone}
        </p>
        <div className="mt-5 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6">
          {copy.admin.detail.manualCheck}
        </div>
      </DashboardCard>

      <DashboardCard className="p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.admin.detail.kycDocuments}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">{copy.admin.detail.kycDescription}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {documents.map((document) => (
            <Link
              key={document.document_id}
              href={`/admin/doctors/${doctorId}/documents/${document.document_id}`}
              className="cursor-pointer rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm font-semibold uppercase text-[var(--color-midnight)] transition hover:bg-[var(--color-teal-surface)]"
            >
              {document.document_type}
            </Link>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.admin.detail.decisionTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">{copy.admin.detail.decisionDescription}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={approveDoctorAction}>
            <input type="hidden" name="doctor_id" value={doctorId} />
            <Button type="submit" className="w-full">
              {copy.admin.detail.approve}
            </Button>
          </form>
          <form action={rejectDoctorAction} className="grid gap-3">
            <input type="hidden" name="doctor_id" value={doctorId} />
            <Field>
              <Label htmlFor="rejection_reason">{copy.admin.detail.rejectionReason}</Label>
              <Textarea id="rejection_reason" name="rejection_reason" required />
            </Field>
            <Button type="submit" variant="destructive">
              {copy.admin.detail.reject}
            </Button>
          </form>
        </div>
      </DashboardCard>

      <DashboardCard className="p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.admin.detail.auditTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">{copy.admin.detail.auditDescription}</p>
        </div>
        <div className="grid gap-3">
          {audits.length > 0 ? (
            audits.map((audit) => (
              <div
                key={audit.log_id}
                className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={statusTone(audit.access_status)}>{statusLabel(copy, audit.access_status)}</StatusBadge>
                  <StatusBadge tone={proofTone(audit.blockchain_status)}>
                    {copy.common.proofPrefix} {proofLabel(copy, audit.blockchain_status)}
                  </StatusBadge>
                </div>
                <p className="font-semibold text-[var(--color-midnight)]">{describeAuditAction(copy, audit.action)}</p>
                <p className="text-sm text-[var(--color-ash)]">
                  {formatDateTime(audit.created_at, locale)}
                  {audit.reason ? ` · ${audit.reason}` : ""}
                </p>
                <ProofStatus
                  proofType="audit_log"
                  id={audit.log_id}
                  blockchainStatus={audit.blockchain_status}
                  txHash={audit.blockchain_tx_hash}
                  lastError={audit.blockchain_last_error}
                  messages={proofStatusMessages(copy)}
                />
              </div>
            ))
          ) : (
            <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
              {copy.admin.detail.noAudit}
            </p>
          )}
        </div>
      </DashboardCard>
    </section>
  );
}

function describeAuditAction(copy: Awaited<ReturnType<typeof getDictionary>>, action: string) {
  if (action === "admin_doctor_approved") return copy.admin.detail.auditAction.admin_doctor_approved;
  if (action === "admin_doctor_rejected") return copy.admin.detail.auditAction.admin_doctor_rejected;
  if (action === "doctor_kyc_email_notification_failed") return copy.admin.detail.auditAction.doctor_kyc_email_notification_failed;
  return action;
}
