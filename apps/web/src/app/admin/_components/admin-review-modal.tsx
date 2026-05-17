"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Eye, X } from "lucide-react";

import { approveDoctorAction, rejectDoctorAction } from "@/app/admin/doctors/actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { AdminDoctorReview } from "@/lib/admin/service";

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
  const actionLabels = useMemo(() => doctorActionLabels(doctor.accountStatus, copy.admin), [copy, doctor.accountStatus]);
  const previewDocument = doctor.documents.find((document) => document.documentId === previewDocumentId);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6" data-admin-review-modal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-review-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-elevated)]"
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
            className="grid size-10 cursor-pointer place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)] transition hover:bg-[var(--color-parchment-card)]"
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--color-stone-surface)] p-4"
              >
                <p className="font-semibold text-[var(--color-midnight)]">
                  {index + 1}. {copy.admin.review.documentTitles[document.documentType]}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-[10px]"
                    disabled={!document.documentId}
                    onClick={() => setPreviewDocumentId(document.documentId)}
                  >
                    <Eye size={16} aria-hidden="true" />
                    {copy.admin.review.viewDocument}
                  </Button>
                  {document.documentId ? (
                    <Button asChild variant="secondary" className="rounded-[10px]">
                      <a href={downloadHref} download>
                        <Download size={16} aria-hidden="true" />
                        {copy.admin.review.downloadDocument}
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" className="rounded-[10px]" disabled>
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

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[var(--color-stone-surface)] pt-5">
          <Button type="button" variant="destructive" className="rounded-[10px]" onClick={() => setConfirmation("reject")}>
            {actionLabels.reject}
          </Button>
          <Button type="button" className="rounded-[10px]" onClick={() => setConfirmation("approve")}>
            {actionLabels.approve}
          </Button>
        </div>
      </div>

      {previewDocument && previewDocument.documentId ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4 py-6" data-document-preview-lightbox>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-preview-title"
            className="grid h-[88vh] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)] rounded-[10px] bg-[var(--color-card)] shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-surface)] p-4">
              <h3 id="admin-preview-title" className="font-semibold text-[var(--color-midnight)]">
              {copy.admin.review.documentTitles[previewDocument.documentType]}
              </h3>
              <button
                type="button"
                className="grid size-9 cursor-pointer place-items-center rounded-full bg-[var(--color-stone-surface)]"
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
          </div>
        </div>
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
            const form = confirmation === "approve" ? approveFormRef.current : rejectFormRef.current;
            setConfirmation(null);
            form?.requestSubmit();
          }}
        />
      ) : null}
    </div>
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
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md rounded-[10px] bg-[var(--color-card)] p-5 shadow-[var(--shadow-elevated)]"
      >
        <h3 id="admin-confirm-title" className="text-lg font-semibold text-[var(--color-midnight)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" className="rounded-[10px]" onClick={onCancel}>
            {cancel}
          </Button>
          <Button type="button" variant={tone === "reject" ? "destructive" : "primary"} className="rounded-[10px]" onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </div>
    </div>
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
