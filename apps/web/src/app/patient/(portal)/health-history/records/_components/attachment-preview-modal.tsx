"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Eye } from "lucide-react";

import { motion } from "@/components/ui/motion";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

type AttachmentPreviewCopy = Dictionary["patient"]["healthHistory"]["recordsDetail"];

type AttachmentPreviewControlProps = {
  attachmentFileId: string | null;
  filename: string;
  meta: string;
  mimeType: string | null;
  recordId: string;
  copy: AttachmentPreviewCopy;
};

const AttachmentPreviewDialog = dynamic(
  () => import("./attachment-preview-dialog").then((module) => module.AttachmentPreviewDialog),
  {
    ssr: false,
    loading: () => <AttachmentPreviewDialogFallback />,
  },
);

export function AttachmentPreviewControl({
  attachmentFileId,
  filename,
  meta,
  mimeType,
  recordId,
  copy,
}: AttachmentPreviewControlProps) {
  const [open, setOpen] = useState(false);

  const { downloadUrl, previewUrl } = useMemo(() => {
    if (!attachmentFileId) {
      return {
        downloadUrl: null,
        previewUrl: null,
      };
    }

    const basePath = `/api/patient/health-history/records/${encodeURIComponent(recordId)}/attachments/${encodeURIComponent(attachmentFileId)}`;
    return {
      downloadUrl: `${basePath}/download`,
      previewUrl: `${basePath}/preview`,
    };
  }, [attachmentFileId, recordId]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[var(--color-teal-deep)] hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] sm:w-auto",
          motion.button,
        )}
        onClick={() => setOpen(true)}
      >
        <Eye size={16} aria-hidden="true" />
        {copy.attachmentPreview}
      </button>

      {open ? (
        <AttachmentPreviewDialog
          attachmentFileId={attachmentFileId}
          copy={copy}
          downloadUrl={downloadUrl}
          filename={filename}
          meta={meta}
          mimeType={mimeType}
          onClose={() => setOpen(false)}
          previewUrl={previewUrl}
        />
      ) : null}
    </>
  );
}

function AttachmentPreviewDialogFallback() {
  return (
    <ViewportModal className="bg-[color-mix(in_srgb,var(--color-ash)_32%,transparent)] p-3 backdrop-blur-sm sm:p-4">
      <ViewportModalPanel as="section" className="my-4 flex max-h-[calc(100dvh-2rem)] min-h-[min(520px,calc(100dvh-2rem))] w-full max-w-[920px] animate-pulse flex-col overflow-hidden rounded-[18px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[0_24px_80px_rgba(18,18,18,0.18),inset_0_0_0_1px_var(--color-stone-surface)]">
        <div className="border-b border-[var(--color-stone-surface)] px-5 py-4 sm:px-6">
          <div className="h-7 w-48 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
          <div className="mt-3 h-4 w-full max-w-sm rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
        </div>
        <div className="min-h-[320px] flex-1 bg-[var(--color-parchment-card)] p-3 sm:p-6">
          <div className="h-[min(60vh,calc(100dvh-14rem))] min-h-[320px] rounded-[14px] border border-[var(--color-stone-surface)] bg-[var(--color-card)]" />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-stone-surface)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <div className="h-11 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)] sm:w-28" />
          <div className="h-11 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)] sm:w-36" />
        </div>
      </ViewportModalPanel>
    </ViewportModal>
  );
}
