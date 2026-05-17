"use client";

export const DOCTOR_LOOKUP_HANDOFF_KEY = "medproof:pendingDoctorLookup";
export const DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY = "medproof:pendingDoctorLookupSource";

export type DoctorLookupHandoffSource = "manual" | "qr_modal";

export type DoctorLookupHandoff = {
  value: string;
  source: DoctorLookupHandoffSource | null;
};

export function savePendingDoctorLookup(
  value: string,
  options: { source?: DoctorLookupHandoffSource } = {},
) {
  if (typeof window === "undefined") return;
  const normalized = value.trim();
  if (!normalized) return;
  window.sessionStorage.setItem(DOCTOR_LOOKUP_HANDOFF_KEY, normalized);
  if (options.source) {
    window.sessionStorage.setItem(DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY, options.source);
  } else {
    window.sessionStorage.removeItem(DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY);
  }
}

export function consumePendingDoctorLookup() {
  return consumePendingDoctorLookupHandoff()?.value ?? null;
}

export function consumePendingDoctorLookupHandoff(): DoctorLookupHandoff | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(DOCTOR_LOOKUP_HANDOFF_KEY);
  const source = window.sessionStorage.getItem(DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY);
  window.sessionStorage.removeItem(DOCTOR_LOOKUP_HANDOFF_KEY);
  window.sessionStorage.removeItem(DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY);
  const normalized = value?.trim();
  if (!normalized) return null;
  return {
    value: normalized,
    source: source === "manual" || source === "qr_modal" ? source : null,
  };
}
