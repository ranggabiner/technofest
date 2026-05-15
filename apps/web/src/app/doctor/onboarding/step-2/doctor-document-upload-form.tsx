"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Badge, FileText, RotateCcw, Upload } from "lucide-react";

import { KycDocumentPreview, type KycDocumentPreviewLabels } from "@/components/kyc-document-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KycDocumentSummary } from "@/lib/kyc/summaries";
import type { KycDocumentType } from "@/lib/kyc/service";

import {
  continueDoctorDocumentsStepAction,
  uploadDoctorKycDocumentAction,
} from "../actions";

type DoctorDocumentUploadCopy = {
  next: string;
  requiredLabel: string;
  step2: {
    documentTitles: Record<KycDocumentType, string>;
    documentDescriptions: Record<KycDocumentType, string>;
    uploadLabels: Record<KycDocumentType, string>;
    uploadHint: string;
  };
  uploadPreview: KycDocumentPreviewLabels & {
    uploading: string;
    replace: string;
    retry: string;
    continueBlocked: string;
    continueError: string;
  };
  uploadErrors: {
    unknown: string;
  };
};

export function DoctorDocumentUploadForm({
  initialDocuments,
  copy,
}: {
  initialDocuments: KycDocumentSummary[];
  copy: DoctorDocumentUploadCopy;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploadingDocumentType, setUploadingDocumentType] = useState<KycDocumentType | null>(null);
  const [errors, setErrors] = useState<Partial<Record<KycDocumentType, string>>>({});
  const [continueError, setContinueError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const router = useRouter();

  const isUploading = uploadingDocumentType !== null;
  const hasError = Object.values(errors).some(Boolean);
  const allUploaded = documents.every((document) => document.uploaded);
  const canContinue = allUploaded && !isUploading && !isContinuing && !hasError;

  async function uploadDocument(documentType: KycDocumentType, file: File) {
    if (uploadingDocumentType || isContinuing) return;

    const formData = new FormData();
    formData.set("file", file);
    setUploadingDocumentType(documentType);
    setErrors((current) => ({ ...current, [documentType]: undefined }));
    setContinueError(null);

    try {
      const result = await uploadDoctorKycDocumentAction(documentType, formData);
      if (result.ok) {
        setDocuments((current) =>
          current.map((document) =>
            document.documentType === result.document.documentType ? result.document : document,
          ),
        );
      } else {
        setErrors((current) => ({ ...current, [documentType]: result.message }));
      }
    } catch {
      setErrors((current) => ({ ...current, [documentType]: copy.uploadErrors.unknown }));
    } finally {
      setUploadingDocumentType(null);
    }
  }

  async function continueToReview() {
    if (!canContinue) return;

    setIsContinuing(true);
    setContinueError(null);

    try {
      const result = await continueDoctorDocumentsStepAction();
      if (result.ok) {
        router.push("/doctor/onboarding/step-3");
      } else {
        setContinueError(result.message);
        setIsContinuing(false);
      }
    } catch {
      setContinueError(copy.uploadPreview.continueError);
      setIsContinuing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-elevated)] md:p-12">
      <div className="space-y-6">
        {documents.map((document, index) => (
          <div key={document.documentType}>
            {index > 0 ? <div className="mb-6 h-px w-full bg-[var(--color-stone-surface)]" /> : null}
            <DocumentUploadField
              document={document}
              title={copy.step2.documentTitles[document.documentType]}
              description={copy.step2.documentDescriptions[document.documentType]}
              requiredLabel={copy.requiredLabel}
              uploadLabel={copy.step2.uploadLabels[document.documentType]}
              uploadHint={copy.step2.uploadHint}
              labels={copy.uploadPreview}
              disabled={isUploading || isContinuing}
              isUploading={uploadingDocumentType === document.documentType}
              error={errors[document.documentType]}
              onUpload={uploadDocument}
            />
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-[var(--color-stone-surface)] pt-6">
        {!allUploaded ? (
          <p className="mb-3 text-center text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-ash)]">
            {copy.uploadPreview.continueBlocked}
          </p>
        ) : null}
        {continueError ? (
          <p className="mb-3 text-center text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-error-red)]">
            {continueError}
          </p>
        ) : null}
        <Button
          type="button"
          disabled={!canContinue}
          onClick={continueToReview}
          className="min-h-12 w-full rounded-full bg-[var(--color-midnight)] px-12 py-3 text-[15px] font-medium leading-[1.47] tracking-[-0.2px] text-[var(--color-inverted)] hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)]"
        >
          {isContinuing ? (
            <Skeleton className="h-4 w-32 bg-[color-mix(in_srgb,var(--color-inverted)_34%,transparent)]" />
          ) : (
            <>
              {copy.next}
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function DocumentUploadField({
  document,
  title,
  description,
  requiredLabel,
  uploadLabel,
  uploadHint,
  labels,
  disabled,
  isUploading,
  error,
  onUpload,
}: {
  document: KycDocumentSummary;
  title: string;
  description: string;
  requiredLabel: string;
  uploadLabel: string;
  uploadHint: string;
  labels: DoctorDocumentUploadCopy["uploadPreview"];
  disabled: boolean;
  isUploading: boolean;
  error?: string;
  onUpload: (documentType: KycDocumentType, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = document.documentId
    ? `/doctor/onboarding/documents/${document.documentId}`
    : null;

  function chooseFile() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <Label
          htmlFor={`${document.documentType}-file`}
          className="text-[19px] font-medium leading-[1.38] tracking-[-0.25px] text-[var(--color-charcoal-primary)]"
        >
          {title}
        </Label>
        <span className="text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-ash)]">
          {requiredLabel}
        </span>
      </div>
      <p className="mb-3 text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-ash)]">
        {description}
      </p>

      {isUploading ? (
        <div className={cn(previewUrl ? "mt-4" : "")}>
          <Skeleton className="min-h-[140px] w-full rounded-lg" />
        </div>
      ) : previewUrl ? (
        <KycDocumentPreview
          document={document}
          title={title}
          previewUrl={previewUrl}
          labels={labels}
        />
      ) : null}

      {!isUploading ? (
        <div className={cn(previewUrl ? "mt-4" : "")}>
          <input
            ref={inputRef}
            id={`${document.documentType}-file`}
            name={`${document.documentType}-file`}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) onUpload(document.documentType, file);
            }}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={chooseFile}
            className={cn(
              "group flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-6 text-center transition hover:bg-[var(--color-parchment-card)] disabled:cursor-not-allowed disabled:opacity-60",
              previewUrl && "min-h-12 flex-row gap-3 border-solid py-3",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-ash)] transition group-hover:scale-105">
              {document.uploaded ? (
                <RotateCcw size={20} aria-hidden="true" />
              ) : document.documentType === "ktp" ? (
                <Badge size={22} aria-hidden="true" />
              ) : document.documentType === "sip" ? (
                <FileText size={22} aria-hidden="true" />
              ) : (
                <Upload size={22} aria-hidden="true" />
              )}
            </span>
            <span className="text-[15px] font-medium leading-[1.47] tracking-[-0.2px] text-[var(--color-midnight)]">
              {document.uploaded ? labels.replace : uploadLabel}
            </span>
            {!previewUrl ? (
              <span className="mt-1 text-[11px] leading-[1.5] text-[var(--color-ash)]">
                {uploadHint}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-[var(--color-error-red)] bg-[var(--color-error-surface)] p-3 text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-error-red)] sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={chooseFile}
            className="min-h-9 shrink-0 px-4 text-[12px]"
          >
            <RotateCcw size={14} aria-hidden="true" />
            {labels.retry}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
