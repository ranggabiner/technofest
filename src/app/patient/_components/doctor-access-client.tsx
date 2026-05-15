"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Search, ShieldCheck, StopCircle, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import type {
  DoctorLookupResult,
  PatientAccessState,
} from "@/lib/access/doctor-access";

import { grantDoctorAccessAction, revokeDoctorAccessAction } from "../actions";

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

export function DoctorAccessClient({ state }: { state: PatientAccessState }) {
  const [lookupValue, setLookupValue] = useState("");
  const [doctor, setDoctor] = useState<DoctorLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const [expiresAt, setExpiresAt] = useState(defaultExpiryValue);
  const [canViewScope1, setCanViewScope1] = useState(true);
  const [longExpiryConfirmed, setLongExpiryConfirmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const longExpiryRequired = useMemo(() => {
    const expiresMs = new Date(expiresAt).getTime();
    return Number.isFinite(expiresMs) && expiresMs - nowMs > 30 * 24 * 60 * 60 * 1000;
  }, [expiresAt, nowMs]);
  const cameraSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    Boolean(
      (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector,
    );

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function lookupDoctor(value = lookupValue) {
    const nextValue = value.trim();
    if (!nextValue) {
      setError("Masukkan kode dokter atau pindai QR");
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
        throw new Error(body.error ?? "Dokter tidak ditemukan");
      }
      setDoctor(body.doctor);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Pencarian dokter gagal");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function startCamera() {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
    if (!Detector) {
      setError("Pemindai QR tidak tersedia di browser ini");
      return;
    }

    setError(null);
    setDoctor(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsScanning(true);

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes[0]?.rawValue?.trim();
          if (rawValue) {
            stopCamera();
            setLookupValue(rawValue);
            void lookupDoctor(rawValue);
            return;
          }
        } catch {
          setError("QR belum terbaca");
        }
        scanTimerRef.current = window.setTimeout(scan, 500);
      };

      await scan();
    } catch {
      stopCamera();
      setError("Kamera tidak dapat dibuka");
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field>
            <Label htmlFor="doctor_lookup">Kode dokter atau QR token</Label>
            <Input
              id="doctor_lookup"
              value={lookupValue}
              onChange={(event) => setLookupValue(event.target.value)}
              placeholder="Contoh: 123456"
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
            Cari
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="self-end rounded-[10px]"
            onClick={isScanning ? stopCamera : () => void startCamera()}
            disabled={!cameraSupported && !isScanning}
          >
            {isScanning ? <StopCircle size={16} /> : <Camera size={16} />}
            {isScanning ? "Stop" : "Scan"}
          </Button>
        </div>

        <video
          ref={videoRef}
          muted
          playsInline
          className={isScanning ? "aspect-video w-full rounded-[10px] bg-black" : "hidden"}
        />

        {error ? (
          <p className="rounded-[10px] border border-[var(--color-error-red)] bg-red-50 px-3 py-2 text-sm text-[var(--color-error-red)]">
            {error}
          </p>
        ) : null}

        {doctor ? (
          <form action={grantDoctorAccessAction} className="grid gap-4 rounded-[10px] bg-white p-4">
            <input type="hidden" name="doctor_id" value={doctor.doctorId} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--color-ash)]">Dokter ditemukan</p>
                <h3 className="text-lg font-semibold text-[var(--color-midnight)]">
                  {doctor.fullName}
                </h3>
                <p className="text-sm text-[var(--color-ash)]">
                  {doctor.specialization ?? "Spesialisasi belum diisi"}
                </p>
              </div>
              <StatusBadge tone="approved">Disetujui admin</StatusBadge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxField
                name="can_view_scope1"
                label="Scope 1"
                defaultChecked
                checked={canViewScope1}
                onChange={setCanViewScope1}
              />
              <CheckboxField name="can_view_scope2_mental" label="Scope 2 mental" />
              <CheckboxField name="can_view_scope2_physical" label="Scope 2 fisik" defaultChecked />
              <CheckboxField
                name="can_download_attachments"
                label="Unduh lampiran"
                disabled={!canViewScope1}
              />
            </div>

            <Field>
              <Label htmlFor="expires_at">Batas waktu akses</Label>
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
                label="Saya paham akses ini lebih dari 30 hari"
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
              Berikan akses
            </Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-3">
        <h3 className="text-base font-semibold text-[var(--color-midnight)]">Akses aktif</h3>
        {state.activeGrants.length > 0 ? (
          state.activeGrants.map((grant) => (
            <div
              key={grant.grantId}
              className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-white p-4 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-[var(--color-midnight)]">
                    {grant.doctorName}
                  </h4>
                  <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                    Proof {grant.blockchainStatus}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-ash)]">
                  {grant.specialization ?? "Spesialisasi belum diisi"} · sampai{" "}
                  {formatDateTime(grant.expiresAt)}
                </p>
                <p className="mt-2 text-sm text-[var(--color-charcoal-primary)]">
                  {grant.scopes.join(", ")}
                  {grant.canDownloadAttachments ? " · lampiran dapat diunduh" : ""}
                </p>
              </div>
              <form action={revokeDoctorAccessAction} className="self-start">
                <input type="hidden" name="grant_id" value={grant.grantId} />
                <Button type="submit" variant="destructive" className="rounded-[10px]">
                  <Trash2 size={16} />
                  Cabut
                </Button>
              </form>
            </div>
          ))
        ) : (
          <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
            Belum ada akses dokter aktif.
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <h3 className="text-base font-semibold text-[var(--color-midnight)]">Riwayat akses</h3>
        {state.history.length > 0 ? (
          <div className="grid gap-2">
            {state.history.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-sm sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold text-[var(--color-charcoal-primary)]">
                    {item.label}
                  </p>
                  <p className="text-[var(--color-ash)]">
                    {item.doctorName ?? "Tanpa dokter"} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                  <StatusBadge tone={proofTone(item.blockchainStatus)}>
                    {item.blockchainStatus}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
            Riwayat akses belum tersedia.
          </p>
        )}
      </div>
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
    <label className="flex min-h-11 items-center gap-3 rounded-[10px] border border-[var(--color-fog)] bg-white px-3 text-sm text-[var(--color-charcoal-primary)]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="size-4"
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function proofTone(status: string): "approved" | "failed" | "pending" | "neutral" {
  if (status === "confirmed") return "approved";
  if (status === "failed") return "failed";
  if (status === "pending") return "pending";
  return "neutral";
}

function statusTone(status: string): "approved" | "failed" | "pending" | "neutral" {
  if (["created", "replaced", "revoked", "allowed", "accepted", "approved"].includes(status)) {
    return "approved";
  }
  if (["failed", "denied", "rejected", "mismatch"].includes(status)) return "failed";
  return "neutral";
}
