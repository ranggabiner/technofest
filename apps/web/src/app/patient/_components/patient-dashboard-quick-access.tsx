"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, QrCode, StopCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { savePendingDoctorLookup } from "./doctor-lookup-handoff";
import { useDoctorQrScanner } from "./use-doctor-qr-scanner";

export function PatientDashboardQuickAccess({ copy }: { copy: Dictionary }) {
  const router = useRouter();
  const [lookupValue, setLookupValue] = useState("");
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
    error,
    isScanning,
    setError,
    startCamera,
    stopCamera,
    videoRef,
  } = useDoctorQrScanner({
    messages: scannerMessages,
    onScan: (rawValue) => {
      savePendingDoctorLookup(rawValue);
      router.push("/patient/access");
    },
  });

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLookup = lookupValue.trim();
    if (!nextLookup) {
      setError(copy.patient.access.enterCode);
      return;
    }
    savePendingDoctorLookup(nextLookup);
    router.push("/patient/access");
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]">
            {copy.patient.dashboard.quickIdentityLabel}
          </p>
          <h2 className="text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.patient.dashboard.qrTitle}
          </h2>
        </div>
        {isScanning ? (
          <Button type="button" variant="ghost" className="min-h-9 px-3" onClick={stopCamera}>
            <StopCircle size={16} />
            {copy.patient.access.scanStop}
          </Button>
        ) : (
          <div className="flex w-20 shrink-0 flex-col items-center gap-2">
            <button
              type="button"
              aria-label={copy.patient.dashboard.scanQrDoctor}
              className="group grid size-20 cursor-pointer place-items-center rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] text-[var(--color-teal-deep)] shadow-[inset_0_0_0_1px_var(--color-stone-surface)] transition hover:border-[var(--color-teal-primary)] hover:bg-[var(--color-teal-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-teal-primary)]"
              onClick={() => {
                setError(null);
                void startCamera();
              }}
            >
              <QrCode size={46} aria-hidden="true" className="transition group-hover:scale-[1.04]" />
            </button>
            <span className="text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--color-teal-deep)]">
              {copy.patient.dashboard.scanQrDoctor}
            </span>
          </div>
        )}
      </div>

      <div className={isScanning ? "grid gap-3" : "hidden"}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-video w-full rounded-[10px] border border-[var(--color-fog)] bg-black object-cover"
        />
        <p className="text-sm text-[var(--color-ash)]">{copy.patient.dashboard.scannerActive}</p>
      </div>

      {error ? (
        <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-3 py-2 text-sm text-[var(--color-error-red)]">
          {error}
        </p>
      ) : null}

      <form className="mt-auto grid gap-3 border-t border-[var(--color-stone-surface)] pt-6" onSubmit={submitLookup}>
        <label
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]"
          htmlFor="dashboard_doctor_lookup"
        >
          {copy.patient.dashboard.doctorCodeLabel}
        </label>
        <div className="flex gap-3">
          <input
            id="dashboard_doctor_lookup"
            value={lookupValue}
            onChange={(event) => setLookupValue(event.target.value)}
            className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-warm-canvas)] px-4 text-sm text-[var(--color-midnight)] outline-none transition focus:border-[var(--color-teal-primary)] focus:shadow-[inset_0_0_0_1px_var(--color-teal-primary)]"
            placeholder={copy.patient.dashboard.doctorCodePlaceholder}
            inputMode="text"
          />
          <button
            type="submit"
            aria-label={copy.patient.dashboard.submitDoctorCode}
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-[var(--color-teal-primary)] text-[var(--color-inverted)] transition hover:bg-[var(--color-teal-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-teal-primary)]"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
