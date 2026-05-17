"use client";

import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Badge,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";

import {
  KycDocumentCompactPreviewContent,
  kycDocumentCompactPreviewSurfaceClassName,
  type KycDocumentPreviewLabels,
} from "@/components/kyc-document-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { validateKycFile } from "@/lib/kyc/files";
import { getKycDocumentPreviewUrl } from "@/lib/kyc/preview";
import type { KycDocumentSummary } from "@/lib/kyc/summaries";
import type { KycDocumentType } from "@/lib/kyc/service";
import { kycUploadErrorMessage } from "@/lib/kyc/upload-errors";

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
    network: string;
    server: string;
    empty_file: string;
    file_too_large: string;
    unsupported_type: string;
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
  const uploadInFlightRef = useRef(false);
  const router = useRouter();

  const isUploading = uploadingDocumentType !== null;
  const hasError = Object.values(errors).some(Boolean);
  const allUploaded = documents.every((document) => document.uploaded);
  const canContinue = allUploaded && !isUploading && !isContinuing && !hasError;

  async function processSelectedFile(documentType: KycDocumentType, file: File) {
    if (uploadInFlightRef.current || isContinuing) return;

    const validation = validateKycFile(file);
    if (!validation.ok) {
      setErrors((current) => ({
        ...current,
        [documentType]: copy.uploadErrors[validation.reason],
      }));
      setContinueError(null);
      return;
    }

    await uploadDocument(documentType, file);
  }

  async function uploadDocument(documentType: KycDocumentType, file: File) {
    if (uploadInFlightRef.current || isContinuing) return;

    const formData = new FormData();
    formData.set("file", file);
    uploadInFlightRef.current = true;
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
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [documentType]: kycUploadErrorMessage(error, copy.uploadErrors, "client"),
      }));
    } finally {
      uploadInFlightRef.current = false;
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
              onUpload={processSelectedFile}
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
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const previewUrl = getKycDocumentPreviewUrl(document);
  const surfaceDisabled = disabled || isUploading;

  function processSelectedFile(file: File) {
    void onUpload(document.documentType, file);
  }

  const inputId = `${document.documentType}-file`;

  function handleSurfaceKeyDown(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    inputRef.current?.click();
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (surfaceDisabled) return;

    event.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (surfaceDisabled) return;

    event.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsDraggingOver(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (surfaceDisabled) return;

    const file = event.dataTransfer.files.item(0);
    if (file) void processSelectedFile(file);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <Label
          htmlFor={inputId}
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

      <label
        htmlFor={inputId}
        data-upload-surface="doctor-kyc-document"
        role="button"
        tabIndex={surfaceDisabled ? -1 : 0}
        aria-disabled={surfaceDisabled}
        aria-busy={isUploading}
        aria-live={isUploading || error ? "polite" : undefined}
        onKeyDown={handleSurfaceKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={cn(
          kycDocumentCompactPreviewSurfaceClassName,
          "cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-deep)] focus-visible:ring-offset-2",
          previewUrl ? "border-solid border-[var(--color-stone-surface)]" : "border-dashed border-[var(--color-stone-surface)]",
          error && "border-[var(--color-error-red)] bg-[var(--color-error-surface)]",
          isDraggingOver &&
            "border-[var(--color-teal-deep)] bg-[color-mix(in_srgb,var(--color-teal-deep)_10%,var(--color-warm-canvas))] ring-2 ring-[var(--color-teal-deep)]",
          surfaceDisabled && !isUploading && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={inputId}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          aria-label={uploadLabel}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-[0.01] disabled:cursor-not-allowed"
          disabled={surfaceDisabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) processSelectedFile(file);
          }}
        />
        {isUploading ? (
          <UploadLoadingState label={labels.uploading} />
        ) : previewUrl ? (
          <KycDocumentCompactPreviewContent
            key={previewUrl}
            document={document}
            title={title}
            previewUrl={previewUrl}
            labels={labels}
            error={error}
            actionLabel={error ? labels.retry : labels.replace}
          />
        ) : (
          <EmptyDocumentUploadState
            documentType={document.documentType}
            uploadLabel={uploadLabel}
            uploadHint={uploadHint}
            retryLabel={labels.retry}
            error={error}
          />
        )}
      </label>
    </div>
  );
}

function UploadLoadingState({ label }: { label: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-6 text-center">
      <Skeleton className="absolute inset-4 rounded-md opacity-70" />
      <span className="relative inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-4 py-2 text-[13px] font-medium leading-[1.47] tracking-[-0.16px] text-[var(--color-midnight)] shadow-sm">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

function EmptyDocumentUploadState({
  documentType,
  uploadLabel,
  uploadHint,
  retryLabel,
  error,
}: {
  documentType: KycDocumentType;
  uploadLabel: string;
  uploadHint: string;
  retryLabel: string;
  error?: string;
}) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-6 text-center transition group-hover:bg-[var(--color-parchment-card)]"
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-ash)] transition group-hover:scale-105",
          error && "bg-[var(--color-card)] text-[var(--color-error-red)]",
        )}
      >
        {error ? (
          <AlertCircle size={20} aria-hidden="true" />
        ) : documentType === "ktp" ? (
          <Badge size={22} aria-hidden="true" />
        ) : documentType === "sip" ? (
          <FileText size={22} aria-hidden="true" />
        ) : (
          <Upload size={22} aria-hidden="true" />
        )}
      </span>
      <span
        className={cn(
          "mt-2 max-w-full truncate text-[15px] font-medium leading-[1.47] tracking-[-0.2px] text-[var(--color-midnight)]",
          error && "text-[var(--color-error-red)]",
        )}
      >
        {error ?? uploadLabel}
      </span>
      <span className="mt-1 max-w-full truncate text-[11px] leading-[1.5] text-[var(--color-ash)]">
        {error ? retryLabel : uploadHint}
      </span>
    </div>
  );
}
