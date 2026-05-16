import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Textarea } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/i18n/format";
import { proofLabel, proofStatusMessages, proofTone, statusLabel, statusTone } from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { approveDoctorAction, rejectDoctorAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "medical_admin") {
    return (
      <AppShell title={copy.admin.detail.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const { doctorId } = await params;
  const admin = createAdminClient();
  const doctorResult = await admin
    .from("doctors")
    .select(
      "doctor_id,full_name,email,phone_number,specialization,account_status,rejection_reason,created_at,doctor_access_code,qr_code_token",
    )
    .eq("doctor_id", doctorId)
    .single();

  if (doctorResult.error) throw doctorResult.error;

  const documents = await admin
    .from("doctor_kyc_documents")
    .select("document_id,document_type,created_at")
    .eq("doctor_id", doctorId)
    .order("document_type", { ascending: true });

  if (documents.error) throw documents.error;

  const audits = await admin
    .from("audit_logs")
    .select("log_id,action,access_status,reason,blockchain_status,blockchain_tx_hash,blockchain_last_error,created_at")
    .eq("doctor_id", doctorId)
    .is("patient_id", null)
    .in("action", [
      "admin_doctor_approved",
      "admin_doctor_rejected",
      "doctor_kyc_email_notification_failed",
    ])
    .order("created_at", { ascending: false })
    .limit(10);

  if (audits.error) throw audits.error;

  const doctor = doctorResult.data;
  const doctorStatusTone =
    doctor.account_status === "pending" ||
    doctor.account_status === "approved" ||
    doctor.account_status === "rejected"
      ? doctor.account_status
      : "neutral";

  return (
    <AppShell title={copy.admin.detail.title} nav={[{ href: "/admin/doctors", label: copy.admin.nav.doctorVerification }]}>
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="mb-2">
              <StatusBadge tone={doctorStatusTone}>
                {doctor.account_status === "pending"
                  ? copy.admin.doctors.pending
                  : doctor.account_status === "approved"
                    ? copy.admin.doctors.approved
                    : copy.admin.doctors.rejected}
              </StatusBadge>
            </div>
            <CardTitle>{doctor.full_name}</CardTitle>
            <CardDescription>
              {doctor.specialization ?? copy.common.noSpecializationShort} · {doctor.email} · {doctor.phone_number ?? copy.common.noPhone}
            </CardDescription>
          </CardHeader>
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6">
            {copy.admin.detail.manualCheck}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.admin.detail.kycDocuments}</CardTitle>
            <CardDescription>{copy.admin.detail.kycDescription}</CardDescription>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            {documents.data.map((document) => (
              <Link
                key={document.document_id}
                href={`/admin/doctors/${doctorId}/documents/${document.document_id}`}
                className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm font-semibold uppercase text-[var(--color-midnight)]"
              >
                {document.document_type}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.admin.detail.decisionTitle}</CardTitle>
            <CardDescription>{copy.admin.detail.decisionDescription}</CardDescription>
          </CardHeader>
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.admin.detail.auditTitle}</CardTitle>
            <CardDescription>{copy.admin.detail.auditDescription}</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            {audits.data.length > 0 ? (
              audits.data.map((audit) => (
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
        </Card>
      </div>
    </AppShell>
  );
}

function describeAuditAction(copy: Awaited<ReturnType<typeof getDictionary>>, action: string) {
  if (action === "admin_doctor_approved") return copy.admin.detail.auditAction.admin_doctor_approved;
  if (action === "admin_doctor_rejected") return copy.admin.detail.auditAction.admin_doctor_rejected;
  if (action === "doctor_kyc_email_notification_failed") return copy.admin.detail.auditAction.doctor_kyc_email_notification_failed;
  return action;
}
