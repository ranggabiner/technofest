"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Search, ShieldCheck, StopCircle, Trash2, UserRound } from "lucide-react";

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
  PatientAccessState,
} from "@/lib/access/doctor-access";

import { grantDoctorAccessAction, revokeDoctorAccessAction } from "../actions";
import { consumePendingDoctorLookup } from "./doctor-lookup-handoff";
import { useDoctorQrScanner } from "./use-doctor-qr-scanner";

export function DoctorAccessClient({
  state,
  locale,
  copy,
  showHistory = false,
}: {
  state: PatientAccessState;
  locale: Locale;
  copy: Dictionary;
  showHistory?: boolean;
}) {
  const [lookupValue, setLookupValue] = useState("");
  const [doctor, setDoctor] = useState<DoctorLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const [expiresAt, setExpiresAt] = useState(defaultExpiryValue);
  const [canViewScope1, setCanViewScope1] = useState(true);
  const [longExpiryConfirmed, setLongExpiryConfirmed] = useState(false);

  const longExpiryRequired = useMemo(() => {
    const expiresMs = new Date(expiresAt).getTime();
    return Number.isFinite(expiresMs) && expiresMs - nowMs > 30 * 24 * 60 * 60 * 1000;
  }, [expiresAt, nowMs]);

  const lookupDoctor = useCallback(
    async (value = lookupValue) => {
      const nextValue = value.trim();
      if (!nextValue) {
        setError(copy.patient.access.enterCode);
        return;
      }

      setIsLookingUp(true);
      setError(null);
      setDoctor(null);

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
        setDoctor(body.doctor);
      } catch (lookupError) {
        setError(lookupError instanceof Error ? lookupError.message : copy.patient.access.lookupFailed);
      } finally {
        setIsLookingUp(false);
      }
    },
    [copy, lookupValue],
  );

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
    error: scannerError,
    isScanning,
    setError: setScannerError,
    startCamera,
    stopCamera,
    videoRef,
  } = useDoctorQrScanner({
    messages: scannerMessages,
    onScan: (rawValue) => {
      setLookupValue(rawValue);
      void lookupDoctor(rawValue);
    },
  });

  useEffect(() => {
    const pendingLookup = consumePendingDoctorLookup();
    if (!pendingLookup) return;
    queueMicrotask(() => {
      setLookupValue(pendingLookup);
      void lookupDoctor(pendingLookup);
    });
  }, [lookupDoctor]);

  const visibleError = error ?? scannerError;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field>
            <Label htmlFor="doctor_lookup">{copy.patient.access.lookupLabel}</Label>
            <Input
              id="doctor_lookup"
              value={lookupValue}
              onChange={(event) => setLookupValue(event.target.value)}
              placeholder={copy.patient.access.lookupPlaceholder}
              inputMode="text"
            />
          </Field>
          <Button
            type="button"
            variant="secondary"
            className="self-end rounded-[10px]"
            onClick={() => void lookupDoctor()}
            disabled={isLookingUp}
          >
            <Search size={16} />
            {copy.patient.access.search}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="self-end rounded-[10px]"
            onClick={isScanning ? stopCamera : () => {
              setDoctor(null);
              setError(null);
              setScannerError(null);
              void startCamera();
            }}
          >
            {isScanning ? <StopCircle size={16} /> : <Camera size={16} />}
            {isScanning ? copy.patient.access.scanStop : copy.patient.access.scanStart}
          </Button>
        </div>

        <video
          ref={videoRef}
          muted
          playsInline
          className={isScanning ? "aspect-video w-full rounded-[10px] bg-black" : "hidden"}
        />

        {visibleError ? (
          <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-3 py-2 text-sm text-[var(--color-error-red)]">
            {visibleError}
          </p>
        ) : null}

        {isLookingUp ? (
          <DoctorLookupSkeleton />
        ) : doctor ? (
          <form action={grantDoctorAccessAction} className="grid gap-4 rounded-[10px] bg-[var(--color-card)] p-4">
            <input type="hidden" name="doctor_id" value={doctor.doctorId} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--color-ash)]">{copy.patient.access.doctorFound}</p>
                <h3 className="text-lg font-semibold text-[var(--color-midnight)]">
                  {doctor.fullName}
                </h3>
                <p className="text-sm text-[var(--color-ash)]">
                  {doctor.specialization ?? copy.common.noSpecialization}
                </p>
              </div>
              <StatusBadge tone="approved">{copy.patient.access.approvedByAdmin}</StatusBadge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxField
                name="can_view_scope1"
                label={copy.common.scopeLabels.scope1}
                defaultChecked
                checked={canViewScope1}
                onChange={setCanViewScope1}
              />
              <CheckboxField name="can_view_scope2_mental" label={copy.common.scopeLabels.scope2Mental} />
              <CheckboxField name="can_view_scope2_physical" label={copy.common.scopeLabels.scope2Physical} defaultChecked />
              <CheckboxField
                name="can_download_attachments"
                label={copy.common.scopeLabels.attachmentDownload}
                disabled={!canViewScope1}
              />
            </div>

            <Field>
              <Label htmlFor="expires_at">{copy.patient.access.expiryLabel}</Label>
              <Input
                id="expires_at"
                name="expires_at"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => {
                  setExpiresAt(event.target.value);
                  setLongExpiryConfirmed(false);
                }}
                required
              />
            </Field>

            {longExpiryRequired ? (
              <CheckboxField
                name="confirm_long_expiry"
                label={copy.patient.access.longExpiryConfirm}
                checked={longExpiryConfirmed}
                onChange={setLongExpiryConfirmed}
              />
            ) : null}

            <Button
              type="submit"
              className="rounded-[10px]"
              disabled={longExpiryRequired && !longExpiryConfirmed}
            >
              <ShieldCheck size={16} />
              {copy.patient.access.grantAccess}
            </Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-3">
        <h3 className="text-base font-semibold text-[var(--color-midnight)]">{copy.patient.access.activeAccess}</h3>
        {state.activeGrants.length > 0 ? (
          state.activeGrants.map((grant) => (
            <div
              key={grant.grantId}
              className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-[var(--color-midnight)]">
                    {grant.doctorName}
                  </h4>
                  <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                    {copy.common.proofPrefix} {proofLabel(copy, grant.blockchainStatus)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-ash)]">
                  {grant.specialization ?? copy.common.noSpecialization} · {copy.common.until}{" "}
                  {formatDateTime(grant.expiresAt, locale)}
                </p>
                <p className="mt-2 text-sm text-[var(--color-charcoal-primary)]">
                  {localizedScopeList(copy, grant.scopes).join(", ")}
                  {grant.canDownloadAttachments ? ` · ${copy.patient.access.attachmentsDownloadable}` : ""}
                </p>
                <div className="mt-3">
                  <ProofStatus
                    proofType="access_grant"
                    id={grant.grantId}
                    blockchainStatus={grant.blockchainStatus}
                    txHash={grant.blockchainTxHash}
                    messages={proofStatusMessages(copy)}
                  />
                </div>
              </div>
              <form action={revokeDoctorAccessAction} className="self-start">
                <input type="hidden" name="grant_id" value={grant.grantId} />
                <Button type="submit" variant="destructive" className="rounded-[10px]">
                  <Trash2 size={16} />
                  {copy.patient.access.revoke}
                </Button>
              </form>
            </div>
          ))
        ) : (
          <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
            {copy.patient.dashboard.noActiveAccess}
          </p>
        )}
      </div>

      {showHistory ? <AccessHistoryList history={state.history} locale={locale} copy={copy} /> : null}
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

function defaultExpiryValue() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
