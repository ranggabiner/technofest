import { AlertCircle, CheckCircle2, FileWarning, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { KycDocumentSummary } from "@/lib/kyc/summaries";
import { formatFileSize, getFileTypeLabel, getKycPreviewKind } from "@/lib/kyc/preview";

export type KycDocumentPreviewLabels = {
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadStatus: string;
  uploadSuccess: string;
  previewUnavailable: string;
  pdfFallback: string;
};

export const kycDocumentCompactPreviewSurfaceClassName =
  "group relative block h-[140px] w-full overflow-hidden rounded-lg border bg-[var(--color-warm-canvas)]";

export function KycDocumentCompactPreview({
  document,
  title,
  previewUrl,
  labels,
  className,
}: {
  document: KycDocumentSummary;
  title: string;
  previewUrl: string;
  labels: KycDocumentPreviewLabels;
  className?: string;
}) {
  return (
    <div
      data-kyc-preview="compact"
      className={cn(
        kycDocumentCompactPreviewSurfaceClassName,
        "border-solid border-[var(--color-stone-surface)]",
        className,
      )}
    >
      <KycDocumentCompactPreviewContent
        document={document}
        title={title}
        previewUrl={previewUrl}
        labels={labels}
      />
    </div>
  );
}

export function KycDocumentCompactPreviewContent({
  document,
  title,
  previewUrl,
  labels,
  error,
  actionLabel,
}: {
  document: KycDocumentSummary;
  title: string;
  previewUrl: string;
  labels: KycDocumentPreviewLabels;
  error?: string;
  actionLabel?: string;
}) {
  const previewKind = getKycPreviewKind(document.mimeType);

  return (
    <div className="grid h-full w-full grid-cols-[minmax(88px,42%)_minmax(0,1fr)]">
      <div className="pointer-events-none flex min-w-0 items-center justify-center overflow-hidden bg-[var(--color-parchment-card)]">
        {previewKind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={previewUrl}
            src={previewUrl}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : null}
        {previewKind === "pdf" ? (
          <iframe
            key={previewUrl}
            src={previewUrl}
            title={title}
            tabIndex={-1}
            className="h-full w-full border-0"
          >
            {labels.pdfFallback}
          </iframe>
        ) : null}
        {previewKind === "fallback" ? (
          <FileWarning size={30} className="text-[var(--color-ash)]" aria-hidden="true" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-2 p-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[13px] font-medium leading-[1.35] tracking-[-0.16px] text-[var(--color-charcoal-primary)]">
            {document.filename ?? title}
          </p>
          <p className="truncate text-[11px] leading-[1.45] text-[var(--color-ash)]">
            {getFileTypeLabel(document.mimeType, document.filename)}
            {" · "}
            {formatFileSize(document.fileSizeBytes)}
          </p>
          <p
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 truncate text-[11px] font-semibold leading-[1.45]",
              error ? "text-[var(--color-error-red)]" : "text-[var(--color-valid-green)]",
            )}
          >
            {error ? (
              <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={13} className="shrink-0" fill="currentColor" aria-hidden="true" />
            )}
            <span className="truncate">{error ?? labels.uploadSuccess}</span>
          </p>
        </div>
        {actionLabel ? (
          <span className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-3 text-[11px] font-medium leading-[1.45] tracking-[-0.12px] text-[var(--color-midnight)] transition group-hover:bg-[var(--color-parchment-card)]">
            <RotateCcw size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{actionLabel}</span>
          </span>
        ) : (
          <span className="min-h-8" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export function KycDocumentPreview({
  document,
  title,
  previewUrl,
  labels,
  className,
}: {
  document: KycDocumentSummary;
  title: string;
  previewUrl: string;
  labels: KycDocumentPreviewLabels;
  className?: string;
}) {
  const previewKind = getKycPreviewKind(document.mimeType);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)]",
        className,
      )}
    >
      <div className="flex min-h-[240px] items-center justify-center bg-[var(--color-parchment-card)]">
        {previewKind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={previewUrl}
            src={previewUrl}
            alt={title}
            className="max-h-[420px] w-full object-contain"
          />
        ) : null}
        {previewKind === "pdf" ? (
          <iframe
            key={previewUrl}
            src={previewUrl}
            title={title}
            className="h-[420px] w-full border-0"
          >
            {labels.pdfFallback}
          </iframe>
        ) : null}
        {previewKind === "fallback" ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center text-[var(--color-ash)]">
            <FileWarning size={32} aria-hidden="true" />
            <p className="max-w-md text-[15px] leading-[1.47] tracking-[-0.2px]">
              {labels.previewUnavailable}
            </p>
          </div>
        ) : null}
      </div>
      <dl className="grid gap-3 border-t border-[var(--color-stone-surface)] p-4 text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-graphite)] md:grid-cols-2">
        <MetadataItem label={labels.fileName} value={document.filename ?? "-"} />
        <MetadataItem label={labels.fileType} value={getFileTypeLabel(document.mimeType, document.filename)} />
        <MetadataItem label={labels.fileSize} value={formatFileSize(document.fileSizeBytes)} />
        <div className="flex items-center justify-between gap-3">
          <dt className="font-semibold uppercase tracking-[0.5px] text-[var(--color-ash)]">
            {labels.uploadStatus}
          </dt>
          <dd className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-valid-green)]">
            <CheckCircle2 size={14} fill="currentColor" aria-hidden="true" />
            {labels.uploadSuccess}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-semibold uppercase tracking-[0.5px] text-[var(--color-ash)]">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-medium text-[var(--color-charcoal-primary)]">
        {value}
      </dd>
    </div>
  );
}
