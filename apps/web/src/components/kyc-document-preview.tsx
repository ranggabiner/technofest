import { CheckCircle2, FileWarning } from "lucide-react";

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
            src={previewUrl}
            alt={title}
            className="max-h-[420px] w-full object-contain"
          />
        ) : null}
        {previewKind === "pdf" ? (
          <iframe
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
