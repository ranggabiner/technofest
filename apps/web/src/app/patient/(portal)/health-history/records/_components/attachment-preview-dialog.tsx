"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Download, FileText, FileWarning, ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

type AttachmentPreviewCopy = Dictionary["patient"]["healthHistory"]["recordsDetail"];

export type AttachmentPreviewDialogProps = {
  attachmentFileId: string | null;
  copy: AttachmentPreviewCopy;
  downloadUrl: string | null;
  filename: string;
  meta: string;
  mimeType: string | null;
  onClose: () => void;
  previewUrl: string | null;
};

export function AttachmentPreviewDialog({
  attachmentFileId,
  copy,
  downloadUrl,
  filename,
  meta,
  mimeType,
  onClose,
  previewUrl,
}: AttachmentPreviewDialogProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType === "image/jpeg" || mimeType === "image/png";
  const canPreview = Boolean(previewUrl && (isPdf || isImage));

  const handleClose = useCallback(() => {
    setPreviewFailed(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[color-mix(in_srgb,var(--color-ash)_32%,transparent)] p-3 backdrop-blur-sm sm:p-4"
      data-health-history-attachment-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-history-attachment-title"
      aria-describedby="health-history-attachment-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section className="my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-[920px] flex-col overflow-hidden rounded-[18px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[0_24px_80px_rgba(18,18,18,0.18),inset_0_0_0_1px_var(--color-stone-surface)]">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-stone-surface)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="health-history-attachment-title"
              className="text-xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-2xl"
            >
              {copy.attachmentModalTitle}
            </h2>
            <div
              id="health-history-attachment-description"
              className="mt-3 flex min-w-0 items-center gap-3"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-teal-deep)]">
                {isImage ? <ImageIcon size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className="break-words font-semibold text-[var(--color-midnight)]">{filename}</p>
                <p className="break-words text-xs text-[var(--color-ash)]">{meta}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--color-ash)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)]"
            aria-label={copy.attachmentModalClose}
            onClick={handleClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-[320px] flex-1 overflow-y-auto bg-[var(--color-parchment-card)] p-3 sm:p-6">
          <div className="mx-auto grid min-h-[320px] w-full place-items-center rounded-[14px] border border-[var(--color-stone-surface)] bg-[var(--color-card)]">
            {!attachmentFileId ? (
              <PreviewMessage message={copy.attachmentMissing} />
            ) : !canPreview ? (
              <PreviewMessage message={copy.attachmentPreviewUnavailable} />
            ) : previewFailed ? (
              <PreviewMessage message={copy.attachmentPreviewFailed} />
            ) : isPdf && previewUrl ? (
              <iframe
                src={previewUrl}
                title={filename}
                className="h-[min(60vh,calc(100dvh-14rem))] min-h-[320px] w-full rounded-[14px] bg-white"
                onError={() => setPreviewFailed(true)}
              />
            ) : previewUrl ? (
              <div className="relative h-[min(70vh,calc(100dvh-14rem))] min-h-[320px] w-full">
                <Image
                  src={previewUrl}
                  alt={filename}
                  fill
                  sizes="(max-width: 768px) 100vw, 860px"
                  unoptimized
                  className="rounded-[12px] object-contain"
                  onError={() => setPreviewFailed(true)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[var(--color-stone-surface)] bg-[var(--color-card)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="ghost" className="w-full rounded-[10px] sm:w-auto" onClick={handleClose}>
            {copy.attachmentModalCloseAction}
          </Button>
          {downloadUrl ? (
            <Button asChild variant="secondary" className="w-full rounded-[10px] sm:w-auto">
              <a href={downloadUrl}>
                <Download size={16} aria-hidden="true" />
                {copy.attachmentModalDownload}
              </a>
            </Button>
          ) : (
            <Button type="button" variant="secondary" className="w-full rounded-[10px] sm:w-auto" disabled>
              <Download size={16} aria-hidden="true" />
              {copy.attachmentModalDownload}
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}

function PreviewMessage({ message }: { message: string }) {
  return (
    <div className="grid justify-items-center gap-3 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[var(--color-warning-surface)] text-[var(--color-warning-text)]">
        <FileWarning size={20} aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm leading-6 text-[var(--color-ash)]">{message}</p>
    </div>
  );
}
