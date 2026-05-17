"use client";

import type { ClipboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { DoctorLookupSkeleton } from "@/components/loading-skeletons";
import { ProofStatus } from "@/components/proof-status";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatDateTime } from "@/lib/i18n/format";
import {
  proofLabel,
  proofStatusMessages,
  proofTone,
  localizedScopeList,
  patientAccessActionLabel,
  statusLabel,
  statusTone,
} from "@/lib/i18n/labels";
import type { Locale } from "@/lib/i18n/locales";
import type {
  DoctorLookupResult,
  PatientAccessPermissionOptions,
  PatientAccessPermissionRecord,
  PatientAccessState,
} from "@/lib/access/doctor-access";

import { grantDoctorAccessAction, revokeDoctorAccessAction } from "../actions";
import {
  DOCTOR_ACCESS_CODE_MAX_LENGTH,
  doctorAccessCodeDisplayValue,
  mergeDoctorAccessCodeInput,
  normalizeDoctorAccessCodeInput,
  preventNonNumericDoctorCodeInput,
} from "./doctor-code-input";
import { consumePendingDoctorLookupHandoff } from "./doctor-lookup-handoff";
import { DoctorQrScannerModal } from "./doctor-qr-scanner-modal";

type Scope2DateRangeState = {
  startDate: string;
  endDate: string;
};

export function DoctorAccessClient({
  copy,
  permissionOptions,
}: {
  copy: Dictionary;
  permissionOptions: PatientAccessPermissionOptions;
}) {
  const [lookupValue, setLookupValue] = useState("");
  const [permissionDoctor, setPermissionDoctor] = useState<DoctorLookupResult | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scannerAutoStart, setScannerAutoStart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const [expiresAt, setExpiresAt] = useState(() => expiryValueFromMinutes(30));
  const [timePreset, setTimePreset] = useState<"15" | "30" | "60" | "custom">("30");
  const [canViewScope1, setCanViewScope1] = useState(true);
  const [canViewScope2Mental, setCanViewScope2Mental] = useState(true);
  const [canViewScope2Physical, setCanViewScope2Physical] = useState(false);
  const [scope2MentalRange, setScope2MentalRange] = useState<Scope2DateRangeState>(() =>
    defaultScope2DateRange(),
  );
  const [scope2PhysicalRange, setScope2PhysicalRange] = useState<Scope2DateRangeState>(() =>
    defaultScope2DateRange(),
  );
  const [longExpiryConfirmed, setLongExpiryConfirmed] = useState(false);
  const lookupRequestRef = useRef(0);
  const scannerModalOpenRef = useRef(false);

  const longExpiryRequired = useMemo(() => {
    const expiresMs = new Date(expiresAt).getTime();
    return Number.isFinite(expiresMs) && expiresMs - nowMs > 30 * 24 * 60 * 60 * 1000;
  }, [expiresAt, nowMs]);
  const scope2MentalRangeInvalid = canViewScope2Mental && !dateRangeIsValid(scope2MentalRange);
  const scope2PhysicalRangeInvalid = canViewScope2Physical && !dateRangeIsValid(scope2PhysicalRange);

  const lookupDoctor = useCallback(
    async (value = lookupValue, options: { requireScannerOpen?: boolean } = {}) => {
      const nextValue = value.trim();
      if (!nextValue) {
        setError(copy.patient.access.enterCode);
        return;
      }

      const requestId = lookupRequestRef.current + 1;
      lookupRequestRef.current = requestId;
      setIsLookingUp(true);
      setError(null);
      setPermissionDoctor(null);
      setPermissionModalOpen(false);

      try {
        const response = await fetch("/api/patient/doctor-access/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: nextValue }),
        });
        const body = (await response.json()) as {
          doctor?: DoctorLookupResult;
          error?: string;
        };
        if (!response.ok || !body.doctor) {
          throw new Error(body.error ?? copy.patient.access.doctorNotFound);
        }
        if (
          options.requireScannerOpen &&
          (!scannerModalOpenRef.current || requestId !== lookupRequestRef.current)
        ) {
          return;
        }
        setCanViewScope1(true);
        setCanViewScope2Mental(true);
        setCanViewScope2Physical(false);
        setScope2MentalRange(defaultScope2DateRange());
        setScope2PhysicalRange(defaultScope2DateRange());
        setTimePreset("30");
        setExpiresAt(expiryValueFromMinutes(30));
        setLongExpiryConfirmed(false);
        scannerModalOpenRef.current = false;
        setScannerModalOpen(false);
        setPermissionDoctor(body.doctor);
        setPermissionModalOpen(true);
      } catch (lookupError) {
        if (requestId !== lookupRequestRef.current) return;
        setError(lookupError instanceof Error ? lookupError.message : copy.patient.access.lookupFailed);
      } finally {
        if (requestId === lookupRequestRef.current) setIsLookingUp(false);
      }
    },
    [copy, lookupValue],
  );

  const openScannerModal = useCallback((autoStart = true) => {
    scannerModalOpenRef.current = true;
    setScannerAutoStart(autoStart);
    setPermissionDoctor(null);
    setPermissionModalOpen(false);
    setError(null);
    setScannerModalOpen(true);
  }, []);

  const closeScannerModal = useCallback(() => {
    scannerModalOpenRef.current = false;
    lookupRequestRef.current += 1;
    setIsLookingUp(false);
    setScannerModalOpen(false);
    setError(null);
  }, []);

  useEffect(() => {
    const pendingLookup = consumePendingDoctorLookupHandoff();
    if (!pendingLookup) return;
    queueMicrotask(() => {
      const displayValue = doctorAccessCodeDisplayValue(pendingLookup.value);
      if (displayValue) setLookupValue(displayValue);
      if (pendingLookup.source === "qr_modal") {
        openScannerModal(false);
        void lookupDoctor(pendingLookup.value, { requireScannerOpen: true });
        return;
      }
      void lookupDoctor(pendingLookup.value);
    });
  }, [lookupDoctor, openScannerModal]);

  const visibleError = scannerModalOpen ? null : error;

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
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <article
          className="grid gap-4 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] p-5"
          data-doctor-access-method="code"
        >
          <div>
            <h3 className="text-[19px] font-semibold leading-tight text-[var(--color-midnight)]">
              {copy.patient.access.codeMethodTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
              {copy.patient.access.codeMethodDescription}
            </p>
          </div>
          <Field>
            <Label
              htmlFor="doctor_lookup"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ash)]"
            >
              {copy.patient.access.codeInputLabel}
            </Label>
            <Input
              id="doctor_lookup"
              value={lookupValue}
              onBeforeInput={preventNonNumericDoctorCodeInput}
              onChange={(event) => setLookupValue(normalizeDoctorAccessCodeInput(event.target.value))}
              onPaste={handleDoctorCodePaste}
              placeholder={copy.patient.access.codeInputPlaceholder}
              maxLength={DOCTOR_ACCESS_CODE_MAX_LENGTH}
              inputMode="numeric"
              pattern="[0-9]*"
              className="text-center text-base font-semibold tracking-[0.28em]"
            />
          </Field>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full"
            onClick={() => void lookupDoctor()}
            disabled={isLookingUp}
          >
            <Search size={16} />
            {copy.patient.access.verifyCode}
          </Button>
        </article>

        <article
          className="grid gap-4 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5"
          data-doctor-access-method="qr"
        >
          <div>
            <h3 className="text-[19px] font-semibold leading-tight text-[var(--color-midnight)]">
              {copy.patient.access.qrMethodTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
              {copy.patient.access.qrMethodDescription}
            </p>
          </div>
          <button
            type="button"
            className="grid min-h-[178px] cursor-pointer place-items-center gap-4 rounded-xl border border-dashed border-[var(--color-fog)] bg-[var(--color-warm-canvas)] p-6 text-center transition hover:border-[var(--color-teal-primary)] hover:bg-[var(--color-teal-surface)]"
            onClick={() => openScannerModal()}
          >
            <span className="grid size-16 place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)]">
              <QrCode size={28} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--color-midnight)]">
                {copy.patient.access.clickToScan}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-ash)]">
                {copy.patient.access.qrScanHint}
              </span>
            </span>
          </button>
        </article>
      </div>

      {visibleError ? (
        <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-3 py-2 text-sm text-[var(--color-error-red)]">
          {visibleError}
        </p>
      ) : null}

      {!scannerModalOpen && isLookingUp ? (
        <DoctorLookupSkeleton />
      ) : null}

      <DoctorQrScannerModal
        autoStart={scannerAutoStart}
        copy={copy}
        error={error}
        isBusy={isLookingUp}
        onClose={closeScannerModal}
        onScan={(rawValue) => {
          void lookupDoctor(rawValue, { requireScannerOpen: true });
        }}
        open={scannerModalOpen}
      />

      {permissionDoctor && permissionModalOpen ? (
        <PermissionAccessModal
          copy={copy}
          doctor={permissionDoctor}
          permissionOptions={permissionOptions}
          expiresAt={expiresAt}
          timePreset={timePreset}
          canViewScope1={canViewScope1}
          canViewScope2Mental={canViewScope2Mental}
          canViewScope2Physical={canViewScope2Physical}
          scope2MentalRange={scope2MentalRange}
          scope2PhysicalRange={scope2PhysicalRange}
          scope2MentalRangeInvalid={scope2MentalRangeInvalid}
          scope2PhysicalRangeInvalid={scope2PhysicalRangeInvalid}
          longExpiryRequired={longExpiryRequired}
          longExpiryConfirmed={longExpiryConfirmed}
          onCanViewScope1Change={setCanViewScope1}
          onCanViewScope2MentalChange={setCanViewScope2Mental}
          onCanViewScope2PhysicalChange={setCanViewScope2Physical}
          onScope2MentalRangeChange={setScope2MentalRange}
          onScope2PhysicalRangeChange={setScope2PhysicalRange}
          onExpiryChange={(value) => {
            setExpiresAt(value);
            setTimePreset("custom");
            setLongExpiryConfirmed(false);
          }}
          onTimePresetChange={(preset, minutes) => {
            setTimePreset(preset);
            setExpiresAt(expiryValueFromMinutes(minutes));
            setLongExpiryConfirmed(false);
          }}
          onLongExpiryConfirmedChange={setLongExpiryConfirmed}
          onCancel={() => {
            setPermissionModalOpen(false);
            setPermissionDoctor(null);
          }}
        />
      ) : null}
    </div>
  );
}

function PermissionAccessModal({
  copy,
  doctor,
  permissionOptions,
  expiresAt,
  timePreset,
  canViewScope1,
  canViewScope2Mental,
  canViewScope2Physical,
  scope2MentalRange,
  scope2PhysicalRange,
  scope2MentalRangeInvalid,
  scope2PhysicalRangeInvalid,
  longExpiryRequired,
  longExpiryConfirmed,
  onCanViewScope1Change,
  onCanViewScope2MentalChange,
  onCanViewScope2PhysicalChange,
  onScope2MentalRangeChange,
  onScope2PhysicalRangeChange,
  onExpiryChange,
  onTimePresetChange,
  onLongExpiryConfirmedChange,
  onCancel,
}: {
  copy: Dictionary;
  doctor: DoctorLookupResult;
  permissionOptions: PatientAccessPermissionOptions;
  expiresAt: string;
  timePreset: "15" | "30" | "60" | "custom";
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  scope2MentalRange: Scope2DateRangeState;
  scope2PhysicalRange: Scope2DateRangeState;
  scope2MentalRangeInvalid: boolean;
  scope2PhysicalRangeInvalid: boolean;
  longExpiryRequired: boolean;
  longExpiryConfirmed: boolean;
  onCanViewScope1Change: (checked: boolean) => void;
  onCanViewScope2MentalChange: (checked: boolean) => void;
  onCanViewScope2PhysicalChange: (checked: boolean) => void;
  onScope2MentalRangeChange: (range: Scope2DateRangeState) => void;
  onScope2PhysicalRangeChange: (range: Scope2DateRangeState) => void;
  onExpiryChange: (value: string) => void;
  onTimePresetChange: (preset: "15" | "30" | "60", minutes: number) => void;
  onLongExpiryConfirmedChange: (checked: boolean) => void;
  onCancel: () => void;
}) {
  const submitDisabled =
    (longExpiryRequired && !longExpiryConfirmed) ||
    scope2MentalRangeInvalid ||
    scope2PhysicalRangeInvalid;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[color-mix(in_srgb,var(--color-ash)_28%,transparent)] p-4 backdrop-blur-sm"
      data-permission-access-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-access-permission-title"
    >
      <form
        action={grantDoctorAccessAction}
        className="my-6 grid w-full max-w-[640px] overflow-hidden rounded-[18px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[0_24px_80px_rgba(18,18,18,0.18),inset_0_0_0_1px_var(--color-stone-surface)]"
      >
        <input type="hidden" name="doctor_id" value={doctor.doctorId} />
        <input type="hidden" name="expires_at" value={expiresAt} />
        <header className="flex items-center justify-between gap-4 px-6 pb-4 pt-5">
          <h2
            id="doctor-access-permission-title"
            className="text-[28px] font-semibold leading-tight text-[var(--color-midnight)]"
          >
            {copy.patient.access.permissionModalTitle}
          </h2>
          <button
            type="button"
            className="grid size-10 cursor-pointer place-items-center rounded-full text-[var(--color-ash)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)]"
            aria-label={copy.patient.access.permissionModalClose}
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid max-h-[72vh] gap-6 overflow-y-auto px-6 pb-6">
          <div className="flex items-start gap-4 border-t border-[var(--color-stone-surface)] pt-5">
            <DoctorAvatar doctor={doctor} />
            <div className="min-w-0">
              <h3 className="truncate text-[20px] font-semibold leading-tight text-[var(--color-midnight)]">
                {doctor.fullName}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">
                {doctor.specialization ?? copy.common.noSpecialization}
              </p>
              <div className="mt-2">
                <StatusBadge tone="approved">{copy.patient.access.approvedByAdmin}</StatusBadge>
              </div>
            </div>
          </div>

          <p className="rounded-[12px] bg-[var(--color-stone-surface)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
            {copy.patient.access.permissionModalDescription}
          </p>

          <section className="grid gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ash)]">
              {copy.patient.access.permissionModalScopeTitle}
            </h3>
            <div className="grid gap-3">
              <PermissionScopeCard
                name="can_view_scope1"
                title={copy.patient.access.permissionMedicalRecordsTitle}
                description={copy.patient.access.permissionModalScope1Description}
                checked={canViewScope1}
                onChange={onCanViewScope1Change}
                dataScope="scope1"
              >
                <div className="mt-4 grid gap-3">
                  {permissionOptions.scope1Records.length > 0 ? (
                    permissionOptions.scope1Records.map((record) => (
                      <MedicalRecordPermissionRow
                        key={record.recordId}
                        record={record}
                        disabled={!canViewScope1 || !record.attachmentFileId}
                        copy={copy}
                      />
                    ))
                  ) : (
                    <p className="rounded-[10px] bg-[var(--color-warm-canvas)] px-3 py-2 text-xs leading-5 text-[var(--color-ash)]">
                      {copy.patient.access.permissionNoMedicalRecords}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-fit cursor-not-allowed items-center gap-2 text-sm font-semibold text-[var(--color-ash)] opacity-70"
                  >
                    <Plus size={15} aria-hidden="true" />
                    {copy.patient.access.permissionAddMedicalRecord}
                  </button>
                </div>
              </PermissionScopeCard>

              <PermissionScopeCard
                name="can_view_scope2_mental"
                title={copy.patient.access.permissionMentalTitle}
                description={copy.patient.access.permissionModalScope2MentalDescription}
                checked={canViewScope2Mental}
                onChange={onCanViewScope2MentalChange}
                dataScope="scope2_mental"
              >
                <Scope2DateRangeFields
                  startName="scope2_mental_start_date"
                  endName="scope2_mental_end_date"
                  disabled={!canViewScope2Mental}
                  range={scope2MentalRange}
                  invalid={scope2MentalRangeInvalid}
                  hasData={permissionOptions.scope2MentalOptions.length > 0}
                  onChange={onScope2MentalRangeChange}
                  copy={copy}
                  dataScope="scope2_mental"
                />
                <button
                  type="button"
                  disabled
                  className="mt-3 inline-flex w-fit cursor-not-allowed items-center gap-2 text-sm font-semibold text-[var(--color-ash)] opacity-70"
                >
                  <Plus size={15} aria-hidden="true" />
                  {copy.patient.access.permissionAddMentalConcern}
                </button>
              </PermissionScopeCard>

              <PermissionScopeCard
                name="can_view_scope2_physical"
                title={copy.patient.access.permissionPhysicalTitle}
                description={copy.patient.access.permissionModalScope2PhysicalDescription}
                checked={canViewScope2Physical}
                onChange={onCanViewScope2PhysicalChange}
                dataScope="scope2_physical"
              >
                <Scope2DateRangeFields
                  startName="scope2_physical_start_date"
                  endName="scope2_physical_end_date"
                  disabled={!canViewScope2Physical}
                  range={scope2PhysicalRange}
                  invalid={scope2PhysicalRangeInvalid}
                  hasData={permissionOptions.scope2PhysicalOptions.length > 0}
                  onChange={onScope2PhysicalRangeChange}
                  copy={copy}
                  dataScope="scope2_physical"
                />
                <button
                  type="button"
                  disabled
                  className="mt-3 inline-flex w-fit cursor-not-allowed items-center gap-2 text-sm font-semibold text-[var(--color-ash)] opacity-70"
                >
                  <Plus size={15} aria-hidden="true" />
                  {copy.patient.access.permissionAddPhysicalConcern}
                </button>
              </PermissionScopeCard>
            </div>
          </section>

          <section className="grid gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ash)]">
              {copy.patient.access.permissionModalTimeTitle}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TimePresetButton
                label={copy.patient.access.permissionTime15Minutes}
                selected={timePreset === "15"}
                dataValue="15"
                onClick={() => onTimePresetChange("15", 15)}
              />
              <TimePresetButton
                label={copy.patient.access.permissionTime30Minutes}
                selected={timePreset === "30"}
                dataValue="30"
                onClick={() => onTimePresetChange("30", 30)}
              />
              <TimePresetButton
                label={copy.patient.access.permissionTime1Hour}
                selected={timePreset === "60"}
                dataValue="60"
                onClick={() => onTimePresetChange("60", 60)}
              />
              <button
                type="button"
                className={[
                  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border px-3 text-sm font-semibold transition",
                  timePreset === "custom"
                    ? "border-[var(--color-teal-primary)] bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]"
                    : "border-[var(--color-stone-surface)] bg-[var(--color-card)] text-[var(--color-charcoal-primary)] hover:border-[var(--color-teal-primary)]",
                ].join(" ")}
                data-permission-time-option="custom"
                onClick={() => onExpiryChange(expiresAt)}
              >
                <Pencil size={15} aria-hidden="true" />
                {copy.patient.access.permissionTimeCustom}
              </button>
            </div>
            {timePreset === "custom" ? (
              <Field>
                <Label htmlFor="permission_expires_at">{copy.patient.access.expiryLabel}</Label>
                <Input
                  id="permission_expires_at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => onExpiryChange(event.target.value)}
                  required
                />
              </Field>
            ) : null}
          </section>

          {longExpiryRequired ? (
            <CheckboxField
              name="confirm_long_expiry"
              label={copy.patient.access.longExpiryConfirm}
              checked={longExpiryConfirmed}
              onChange={onLongExpiryConfirmedChange}
            />
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="rounded-[10px]"
            data-permission-action="cancel"
            onClick={onCancel}
          >
            {copy.patient.access.permissionModalCancel}
          </Button>
          <Button
            type="submit"
            className="rounded-[10px]"
            data-permission-action="allow"
            disabled={submitDisabled}
          >
            <ShieldCheck size={16} aria-hidden="true" />
            {copy.patient.access.permissionModalAllow}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function DoctorAvatar({ doctor }: { doctor: DoctorLookupResult }) {
  if (doctor.profilePhotoUrl) {
    return (
      <span
        aria-hidden="true"
        className="size-16 shrink-0 rounded-full border border-[var(--color-stone-surface)] bg-cover bg-center"
        style={{ backgroundImage: `url(${doctor.profilePhotoUrl})` }}
      />
    );
  }

  return (
    <span className="grid size-16 shrink-0 place-items-center rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] text-base font-semibold text-[var(--color-midnight)]">
      {getInitials(doctor.fullName)}
    </span>
  );
}

function PermissionScopeCard({
  name,
  title,
  description,
  checked,
  dataScope,
  onChange,
  children,
}: {
  name: string;
  title: string;
  description: string;
  checked: boolean;
  dataScope: string;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <section
      className="rounded-[12px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[inset_0_0_0_1px_var(--color-stone-surface)]"
      data-permission-scope-card={dataScope}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-5 cursor-pointer accent-[var(--color-teal-primary)]"
        />
        <span className="min-w-0">
          <span className="block text-[16px] font-semibold leading-5 text-[var(--color-midnight)]">
            {title}
          </span>
          <span className="mt-1 block text-xs leading-5 text-[var(--color-ash)]">
            {description}
          </span>
        </span>
      </label>
      {children}
    </section>
  );
}

function MedicalRecordPermissionRow({
  record,
  disabled,
  copy,
}: {
  record: PatientAccessPermissionRecord;
  disabled: boolean;
  copy: Dictionary;
}) {
  return (
    <div
      className="grid gap-3 rounded-[10px] bg-[var(--color-warm-canvas)] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
      data-permission-record-row
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--color-midnight)]">{record.title}</p>
        <p className="mt-1 truncate text-xs text-[var(--color-ash)]">
          {record.recordType}
          {record.attachmentFilename ? ` · ${record.attachmentFilename}` : ""}
        </p>
      </div>
      <label
        className={[
          "inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-charcoal-primary)]",
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        ].join(" ")}
      >
        <input
          type="checkbox"
          name="attachment_record_ids"
          value={record.recordId}
          defaultChecked={!disabled}
          disabled={disabled}
          className="size-4 cursor-pointer accent-[var(--color-teal-primary)] disabled:cursor-not-allowed"
        />
        {copy.patient.access.permissionDownloadLabel}
      </label>
    </div>
  );
}

function Scope2DateRangeFields({
  startName,
  endName,
  disabled,
  range,
  invalid,
  hasData,
  onChange,
  copy,
  dataScope,
}: {
  startName: string;
  endName: string;
  disabled: boolean;
  range: Scope2DateRangeState;
  invalid: boolean;
  hasData: boolean;
  onChange: (range: Scope2DateRangeState) => void;
  copy: Dictionary;
  dataScope: string;
}) {
  return (
    <div className="mt-4 grid gap-3" data-permission-date-range={dataScope}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor={startName}>{copy.patient.access.permissionStartDateLabel}</Label>
          <Input
            id={startName}
            name={startName}
            type="date"
            value={range.startDate}
            max={range.endDate}
            disabled={disabled}
            required={!disabled}
            className="cursor-pointer disabled:cursor-not-allowed"
            onChange={(event) => onChange({ ...range, startDate: event.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor={endName}>{copy.patient.access.permissionEndDateLabel}</Label>
          <Input
            id={endName}
            name={endName}
            type="date"
            value={range.endDate}
            min={range.startDate}
            disabled={disabled}
            required={!disabled}
            className="cursor-pointer disabled:cursor-not-allowed"
            onChange={(event) => onChange({ ...range, endDate: event.target.value })}
          />
        </Field>
      </div>
      <p className="rounded-[10px] bg-[var(--color-warm-canvas)] px-3 py-2 text-xs leading-5 text-[var(--color-ash)]">
        {copy.patient.access.permissionDateRangeSelected} {range.startDate} - {range.endDate}
      </p>
      {invalid ? (
        <p className="text-xs font-semibold leading-5 text-[var(--color-error-red)]">
          {copy.patient.access.permissionDateRangeInvalid}
        </p>
      ) : null}
      {!hasData ? (
        <p className="text-xs leading-5 text-[var(--color-ash)]">
          {copy.patient.access.permissionNoScope2Data}
        </p>
      ) : null}
    </div>
  );
}

function TimePresetButton({
  label,
  selected,
  dataValue,
  onClick,
}: {
  label: string;
  selected: boolean;
  dataValue: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "min-h-12 cursor-pointer rounded-[10px] border px-3 text-sm font-semibold transition",
        selected
          ? "border-[var(--color-teal-primary)] bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]"
          : "border-[var(--color-stone-surface)] bg-[var(--color-card)] text-[var(--color-charcoal-primary)] hover:border-[var(--color-teal-primary)]",
      ].join(" ")}
      data-permission-time-option={dataValue}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function DoctorAccessActivity({
  state,
  locale,
  copy,
}: {
  state: PatientAccessState;
  locale: Locale;
  copy: Dictionary;
}) {
  return (
    <div className="grid gap-4">
      {state.activeGrants.length > 0 ? (
        state.activeGrants.map((grant) => (
          <div
            key={grant.grantId}
            className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[inset_0_0_0_1px_var(--color-stone-surface)]"
            data-doctor-access-active-card
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--color-stone-surface)] text-sm font-semibold text-[var(--color-midnight)]">
                  {getInitials(grant.doctorName)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[19px] font-semibold leading-tight text-[var(--color-midnight)]">
                      {grant.doctorName}
                    </h3>
                    <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                      {copy.common.proofPrefix} {proofLabel(copy, grant.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">
                    {grant.specialization ?? copy.common.noSpecialization} · {copy.common.until}{" "}
                    {formatDateTime(grant.expiresAt, locale)}
                  </p>
                </div>
              </div>
              <form action={revokeDoctorAccessAction} className="shrink-0">
                <input type="hidden" name="grant_id" value={grant.grantId} />
                <Button type="submit" variant="destructive" className="rounded-full">
                  <Trash2 size={16} />
                  {copy.patient.access.revoke}
                </Button>
              </form>
            </div>

            <div className="mt-5 grid gap-4 border-t border-[var(--color-stone-surface)] pt-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="grid gap-2 text-sm text-[var(--color-charcoal-primary)]">
                <p>{localizedScopeList(copy, grant.scopes).join(", ")}</p>
                {grant.canDownloadAttachments ? (
                  <p className="inline-flex items-center gap-2 text-[var(--color-teal-deep)]">
                    <Download size={15} aria-hidden="true" />
                    {copy.patient.access.attachmentsDownloadable}
                  </p>
                ) : null}
              </div>
              <ProofStatus
                proofType="access_grant"
                id={grant.grantId}
                blockchainStatus={grant.blockchainStatus}
                txHash={grant.blockchainTxHash}
                messages={proofStatusMessages(copy)}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
          {copy.patient.dashboard.noActiveAccess}
        </p>
      )}

    </div>
  );
}

export function AccessHistoryList({
  history,
  locale,
  copy,
}: {
  history: PatientAccessState["history"];
  locale: Locale;
  copy: Dictionary;
}) {
  return (
    <div className="grid gap-3">
      {history.length > 0 ? (
        <div className="grid gap-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-sm sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-semibold text-[var(--color-charcoal-primary)]">
                  {patientAccessActionLabel(copy, item.action, item.label)}
                </p>
                <p className="text-[var(--color-ash)]">
                  {item.doctorName ?? copy.common.noDoctor} · {formatDateTime(item.createdAt, locale)}
                </p>
                {item.reason ? <p className="mt-1 text-xs text-[var(--color-ash)]">{item.reason}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <StatusBadge tone={statusTone(item.status)}>{statusLabel(copy, item.status)}</StatusBadge>
                <StatusBadge tone={proofTone(item.blockchainStatus)}>
                  {copy.common.proofPrefix} {proofLabel(copy, item.blockchainStatus)}
                </StatusBadge>
              </div>
              <div className="sm:col-span-2">
                <ProofStatus
                  proofType="audit_log"
                  id={item.id}
                  blockchainStatus={item.blockchainStatus}
                  txHash={item.blockchainTxHash}
                  messages={proofStatusMessages(copy)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
          {copy.patient.dashboard.noHistory}
        </p>
      )}
    </div>
  );
}

export function DoctorAccessStatusLog({
  items,
  locale,
  copy,
}: {
  items: PatientAccessState["accessLog"];
  locale: Locale;
  copy: Dictionary;
}) {
  return (
    <div className="grid gap-0">
      {items.length > 0 ? (
        <div className="border-t border-[var(--color-stone-surface)] pt-2">
          {items.map((item) => (
            <div
              key={item.grantId}
              className="flex items-center justify-between gap-4 border-b border-[var(--color-stone-surface)] py-4 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-ash)]">
                  <UserRound size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold leading-5 text-[var(--color-midnight)]">
                    {item.doctorName}
                  </span>
                  <span className="block truncate text-xs leading-5 text-[var(--color-ash)]">
                    {item.specialization ?? copy.common.noSpecialization}
                  </span>
                </span>
              </div>
              <div className="shrink-0 text-right">
                <p className="mb-2 text-xs leading-5 text-[var(--color-ash)]">
                  {formatDateTime(item.grantedAt, locale)}
                </p>
                <span
                  className={[
                    "inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold leading-4",
                    item.displayStatus === "ongoing"
                      ? "bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]"
                      : "bg-[var(--color-stone-surface)] text-[var(--color-graphite)]",
                  ].join(" ")}
                >
                  {item.displayStatus === "ongoing"
                    ? copy.patient.dashboard.accessStatusOngoing
                    : copy.patient.dashboard.accessStatusCompleted}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
          {copy.patient.dashboard.noHistory}
        </p>
      )}
    </div>
  );
}

function CheckboxField({
  name,
  label,
  defaultChecked,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex min-h-11 items-center gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-charcoal-primary)]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="size-4 disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}

function expiryValueFromMinutes(minutes: number) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function defaultScope2DateRange(): Scope2DateRangeState {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 90);

  return {
    startDate: dateInputValue(start),
    endDate: dateInputValue(end),
  };
}

function dateRangeIsValid(range: Scope2DateRangeState) {
  return isDateInputValue(range.startDate) && isDateInputValue(range.endDate) && range.endDate >= range.startDate;
}

function dateInputValue(date: Date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function isDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DR";
}
