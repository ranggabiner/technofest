"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Eye, X } from "lucide-react";

import { approveDoctorAction, rejectDoctorAction } from "@/app/admin/doctors/actions";
import { LoadingActionButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { motion } from "@/components/ui/motion";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { AdminDoctorReview } from "@/lib/admin/service";
import { cn } from "@/lib/utils";

type ConfirmationKind = "approve" | "reject";

export function AdminReviewModal({
  doctor,
  copy,
  returnPath,
  onClose,
}: {
  doctor: AdminDoctorReview;
  copy: Dictionary;
  returnPath: string;
  onClose: () => void;
}) {
  const approveFormRef = useRef<HTMLFormElement>(null);
  const rejectFormRef = useRef<HTMLFormElement>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationKind | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState<ConfirmationKind | null>(null);
  const actionLabels = useMemo(() => doctorActionLabels(doctor.accountStatus, copy.admin), [copy, doctor.accountStatus]);
  const previewDocument = doctor.documents.find((document) => document.documentId === previewDocumentId);

  return (
    <ViewportModal className="bg-black/35 sm:py-6" data-admin-review-modal>
      <ViewportModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-review-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-review-title" className="text-2xl font-semibold text-[var(--color-midnight)]">
              {copy.admin.review.title}
            </h2>
            <p className="mt-1 text-lg font-semibold text-[var(--color-charcoal-primary)]">{doctor.fullName}</p>
          </div>
          <button
            type="button"
            className={cn(
              "grid size-10 cursor-pointer place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-parchment-card)]",
              motion.iconButton,
            )}
            aria-label={copy.admin.review.close}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <SectionTitle>{copy.admin.review.profileTitle}</SectionTitle>
        <dl className="grid gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm md:grid-cols-3">
          <ProfileItem label={copy.admin.review.specialization} value={doctor.specialization ?? copy.common.noSpecializationShort} />
          <ProfileItem label={copy.admin.review.phoneNumber} value={doctor.phoneNumber ?? copy.common.noPhone} />
          <ProfileItem label={copy.admin.review.age} value={doctor.ageYears ? String(doctor.ageYears) : copy.common.notAvailable} />
        </dl>

        <SectionTitle className="mt-6">{copy.admin.review.documentsTitle}</SectionTitle>
        <p className="mb-4 text-sm text-[var(--color-ash)]">{copy.admin.review.documentsDescription}</p>
        <div className="grid gap-3">
          {doctor.documents.map((document, index) => {
            const href = document.documentId
              ? `/admin/doctors/${doctor.doctorId}/documents/${document.documentId}`
              : "";
            const downloadHref = document.documentId
              ? `/admin/doctors/${doctor.doctorId}/documents/${document.documentId}/download`
              : "";

            return (
              <div
                key={document.documentType}
                className="flex flex-col items-stretch gap-3 rounded-[10px] border border-[var(--color-stone-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="min-w-0 break-words font-semibold text-[var(--color-midnight)]">
                  {index + 1}. {copy.admin.review.documentTitles[document.documentType]}
                </p>
                <div className="grid gap-2 sm:flex sm:w-auto sm:flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-[10px] sm:w-auto"
                    disabled={!document.documentId}
                    onClick={() => setPreviewDocumentId(document.documentId)}
                  >
                    <Eye size={16} aria-hidden="true" />
                    {copy.admin.review.viewDocument}
                  </Button>
                  {document.documentId ? (
                    <Button asChild variant="secondary" className="w-full rounded-[10px] sm:w-auto">
                      <a href={downloadHref} download>
                        <Download size={16} aria-hidden="true" />
                        {copy.admin.review.downloadDocument}
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" className="w-full rounded-[10px] sm:w-auto" disabled>
                      <Download size={16} aria-hidden="true" />
                      {copy.admin.review.downloadDocument}
                    </Button>
                  )}
                </div>
                {href ? <span className="sr-only">{href}</span> : null}
              </div>
            );
          })}
        </div>

        <form ref={rejectFormRef} action={rejectDoctorAction} className="hidden">
          <input type="hidden" name="doctor_id" value={doctor.doctorId} />
          <input type="hidden" name="rejection_reason" value="manual_rejection" />
          <input type="hidden" name="redirect_to" value={returnPath} />
        </form>
        <form ref={approveFormRef} action={approveDoctorAction} className="hidden">
          <input type="hidden" name="doctor_id" value={doctor.doctorId} />
          <input type="hidden" name="redirect_to" value={returnPath} />
        </form>

        <div className="mt-6 grid gap-2 border-t border-[var(--color-stone-surface)] pt-5 sm:flex sm:flex-wrap sm:justify-end sm:gap-3">
          <LoadingActionButton
            type="button"
            variant="destructive"
            className="w-full rounded-[10px] sm:w-auto"
            disabled={submittingDecision !== null}
            isLoading={submittingDecision === "reject"}
            loadingLabel={copy.admin.detail.submitting}
            onClick={() => setConfirmation("reject")}
            slotClassName="w-full sm:w-auto"
          >
            {actionLabels.reject}
          </LoadingActionButton>
          <LoadingActionButton
            type="button"
            className="w-full rounded-[10px] sm:w-auto"
            disabled={submittingDecision !== null}
            isLoading={submittingDecision === "approve"}
            loadingLabel={copy.admin.detail.submitting}
            onClick={() => setConfirmation("approve")}
            slotClassName="w-full sm:w-auto"
          >
            {actionLabels.approve}
          </LoadingActionButton>
        </div>
      </ViewportModalPanel>

      {previewDocument && previewDocument.documentId ? (
        <ViewportModal className="z-[60] bg-black/50 sm:py-6" data-document-preview-lightbox>
          <ViewportModalPanel
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-preview-title"
            className="grid h-[calc(100dvh-2rem)] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)] rounded-[10px] bg-[var(--color-card)] shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-surface)] p-4">
              <h3 id="admin-preview-title" className="font-semibold text-[var(--color-midnight)]">
              {copy.admin.review.documentTitles[previewDocument.documentType]}
              </h3>
              <button
                type="button"
                className={cn(
                  "grid size-10 cursor-pointer place-items-center rounded-full bg-[var(--color-stone-surface)] hover:bg-[var(--color-parchment-card)]",
                  motion.iconButton,
                )}
                aria-label={copy.admin.review.closePreview}
                onClick={() => setPreviewDocumentId(null)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <iframe
              src={`/admin/doctors/${doctor.doctorId}/documents/${previewDocument.documentId}`}
              title={copy.admin.review.documentTitles[previewDocument.documentType]}
              className="h-full w-full border-0"
            />
          </ViewportModalPanel>
        </ViewportModal>
      ) : null}

      {confirmation ? (
        <ConfirmationDialog
          title={confirmation === "approve" ? copy.admin.review.approveConfirmTitle : copy.admin.review.rejectConfirmTitle}
          message={confirmation === "approve" ? copy.admin.review.approveConfirmMessage : copy.admin.review.rejectConfirmMessage}
          cancel={copy.admin.review.cancel}
          confirm={confirmation === "approve" ? copy.admin.review.confirmApprove : copy.admin.review.confirmReject}
          tone={confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const nextDecision = confirmation;
            const form = nextDecision === "approve" ? approveFormRef.current : rejectFormRef.current;
            if (!form) return;
            setSubmittingDecision(nextDecision);
            setConfirmation(null);
            form.requestSubmit();
          }}
        />
      ) : null}
    </ViewportModal>
  );
}

function ConfirmationDialog({
  title,
  message,
  cancel,
  confirm,
  tone,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  cancel: string;
  confirm: string;
  tone: ConfirmationKind;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ViewportModal className="z-[70] bg-black/45">
      <ViewportModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[10px] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
      >
        <h3 id="admin-confirm-title" className="text-lg font-semibold text-[var(--color-midnight)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">{message}</p>
        <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
          <Button type="button" variant="ghost" className="w-full rounded-[10px] sm:w-auto" onClick={onCancel}>
            {cancel}
          </Button>
          <Button type="button" variant={tone === "reject" ? "destructive" : "primary"} className="w-full rounded-[10px] sm:w-auto" onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </ViewportModalPanel>
    </ViewportModal>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[var(--color-ash)]">{label}</dt>
      <dd className="mt-1 font-semibold text-[var(--color-midnight)]">{value}</dd>
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-3 border-y border-[var(--color-stone-surface)] py-3 font-semibold text-[var(--color-midnight)] ${className}`}>
      {children}
    </div>
  );
}

function doctorActionLabels(status: AdminDoctorReview["accountStatus"], copy: Dictionary["admin"]) {
  if (status === "approved") {
    return {
      reject: copy.review.rejectAfterApproved,
      approve: copy.review.reapprove,
    };
  }

  if (status === "rejected") {
    return {
      reject: copy.review.keepRejected,
      approve: copy.review.approveAfterRejected,
    };
  }

  return {
    reject: copy.review.rejectApproval,
    approve: copy.review.acceptApproval,
  };
}
