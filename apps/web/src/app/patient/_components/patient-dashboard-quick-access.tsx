"use client";

import type { ClipboardEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, QrCode } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";

import {
  DOCTOR_ACCESS_CODE_MAX_LENGTH,
  mergeDoctorAccessCodeInput,
  normalizeDoctorAccessCodeInput,
  preventNonNumericDoctorCodeInput,
} from "./doctor-code-input";
import { savePendingDoctorLookup } from "./doctor-lookup-handoff";
import { DoctorQrScannerModal } from "./doctor-qr-scanner-modal";
import { usePatientNavigationTransition } from "./patient-navigation-transition";

export function PatientDashboardQuickAccess({ copy }: { copy: Dictionary }) {
  const router = useRouter();
  const { beginPatientNavigation } = usePatientNavigationTransition();
  const [lookupValue, setLookupValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  const openScannerModal = useCallback(() => {
    setError(null);
    setScannerModalOpen(true);
  }, []);

  const closeScannerModal = useCallback(() => {
    setScannerModalOpen(false);
  }, []);

  function handleQrScan(rawValue: string) {
    savePendingDoctorLookup(rawValue, { source: "qr_modal" });
    setScannerModalOpen(false);
    beginPatientNavigation("/patient/access");
    router.push("/patient/access");
  }

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLookup = lookupValue.trim();
    if (!nextLookup) {
      setError(copy.patient.access.enterCode);
      return;
    }
    savePendingDoctorLookup(nextLookup);
    beginPatientNavigation("/patient/access");
    router.push("/patient/access");
  }

  function handleDoctorCodePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const insertedValue = event.clipboardData.getData("text");
    const input = event.currentTarget;
    setLookupValue((currentValue) =>
      mergeDoctorAccessCodeInput({
        currentValue,
        insertedValue,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
      }),
    );
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
        <div className="flex w-20 shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            aria-label={copy.patient.dashboard.scanQrDoctor}
            className="group grid size-20 cursor-pointer place-items-center rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] text-[var(--color-teal-deep)] shadow-[inset_0_0_0_1px_var(--color-stone-surface)] transition hover:border-[var(--color-teal-primary)] hover:bg-[var(--color-teal-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-teal-primary)]"
            onClick={openScannerModal}
          >
            <QrCode size={46} aria-hidden="true" className="transition group-hover:scale-[1.04]" />
          </button>
          <span className="text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--color-teal-deep)]">
            {copy.patient.dashboard.scanQrDoctor}
          </span>
        </div>
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
            onBeforeInput={preventNonNumericDoctorCodeInput}
            onChange={(event) => setLookupValue(normalizeDoctorAccessCodeInput(event.target.value))}
            onPaste={handleDoctorCodePaste}
            className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-warm-canvas)] px-4 text-sm text-[var(--color-midnight)] outline-none transition focus:border-[var(--color-teal-primary)] focus:shadow-[inset_0_0_0_1px_var(--color-teal-primary)]"
            placeholder={copy.patient.dashboard.doctorCodePlaceholder}
            maxLength={DOCTOR_ACCESS_CODE_MAX_LENGTH}
            inputMode="numeric"
            pattern="[0-9]*"
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

      <DoctorQrScannerModal
        copy={copy}
        onClose={closeScannerModal}
        onScan={handleQrScan}
        open={scannerModalOpen}
      />
    </div>
  );
}
