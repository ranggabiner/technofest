"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Loader2, QrCode, RefreshCw, X } from "lucide-react";

import { LoadingActionButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { motion } from "@/components/ui/motion";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

import { useDoctorQrScanner } from "./use-doctor-qr-scanner";

export function DoctorQrScannerModal({
  autoStart = true,
  copy,
  error,
  isBusy = false,
  onClose,
  onScan,
  open,
}: {
  autoStart?: boolean;
  copy: Dictionary;
  error?: string | null;
  isBusy?: boolean;
  onClose: () => void;
  onScan: (rawValue: string) => void;
  open: boolean;
}) {
  const scannerMessages = useMemo(
    () => ({
      scannerUnavailable: copy.patient.access.scannerUnavailable,
      qrUnreadable: copy.patient.access.qrUnreadable,
      cameraFailed: copy.patient.access.cameraFailed,
      cameraPermissionDenied: copy.patient.access.cameraPermissionDenied,
    }),
    [copy],
  );

  const {
    cameraSupported,
    error: scannerError,
    isScanning,
    setError: setScannerError,
    startCamera,
    stopCamera,
    videoRef,
  } = useDoctorQrScanner({
    messages: scannerMessages,
    onScan,
  });

  const visibleError = error ?? scannerError;

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  const handleRetry = useCallback(() => {
    setScannerError(null);
    void startCamera();
  }, [setScannerError, startCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    if (!autoStart) {
      stopCamera();
      return;
    }
    setScannerError(null);
    void startCamera();
    return () => stopCamera();
  }, [autoStart, open, setScannerError, startCamera, stopCamera]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, open]);

  if (!open) return null;

  return (
    <ViewportModal
      className="bg-[color-mix(in_srgb,var(--color-ash)_28%,transparent)] p-3 backdrop-blur-sm sm:p-4"
      data-doctor-qr-scanner-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-qr-scanner-title"
      aria-describedby="doctor-qr-scanner-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <ViewportModalPanel as="section" className="my-4 grid max-h-[calc(100dvh-2rem)] w-full max-w-[560px] overflow-y-auto rounded-[18px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[0_24px_80px_rgba(18,18,18,0.18),inset_0_0_0_1px_var(--color-stone-surface)] sm:my-6">
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="doctor-qr-scanner-title"
              className="text-2xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-2xl"
            >
              {copy.patient.access.scannerModalTitle}
            </h2>
            <p
              id="doctor-qr-scanner-description"
              className="mt-2 text-sm leading-6 text-[var(--color-ash)]"
            >
              {copy.patient.access.scannerModalDescription}
            </p>
          </div>
          <button
            type="button"
            className={cn(
              "grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--color-ash)] hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)]",
              motion.iconButton,
            )}
            aria-label={copy.patient.access.scannerModalClose}
            onClick={handleClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-4 px-5 pb-5 sm:px-6">
          <div className="relative overflow-hidden rounded-[14px] border border-[var(--color-fog)] bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className={isScanning ? "aspect-video w-full bg-black object-cover" : "hidden"}
            />
            {!isScanning ? (
              <div className="grid aspect-video place-items-center bg-[var(--color-midnight)] p-6 text-center text-[var(--color-inverted)]">
                <div className="grid justify-items-center gap-3">
                  <span className="grid size-14 place-items-center rounded-full bg-white/10">
                    {isBusy ? (
                      <Loader2 size={26} aria-hidden="true" className="animate-spin" />
                    ) : (
                      <QrCode size={28} aria-hidden="true" />
                    )}
                  </span>
                  <p className="text-sm font-semibold">
                    {isBusy ? copy.patient.access.scannerModalVerifying : copy.patient.access.qrScanHint}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {visibleError ? (
            <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-3 py-2 text-sm text-[var(--color-error-red)]">
              {visibleError}
            </p>
          ) : null}

          <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" className="w-full rounded-[10px] sm:w-auto" onClick={handleClose}>
              {copy.patient.access.scannerModalClose}
            </Button>
            <LoadingActionButton
              type="button"
              variant="secondary"
              className="w-full rounded-[10px] sm:w-auto"
              onClick={handleRetry}
              disabled={!cameraSupported}
              isLoading={isBusy}
              loadingLabel={copy.patient.access.scannerModalVerifying}
              slotClassName="w-full sm:w-auto"
            >
              <RefreshCw size={16} aria-hidden="true" />
              {copy.patient.access.scannerModalRetry}
            </LoadingActionButton>
          </footer>
        </div>
      </ViewportModalPanel>
    </ViewportModal>
  );
}
