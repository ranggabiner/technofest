"use client";

export const DOCTOR_LOOKUP_HANDOFF_KEY = "medproof:pendingDoctorLookup";

export function savePendingDoctorLookup(value: string) {
  if (typeof window === "undefined") return;
  const normalized = value.trim();
  if (!normalized) return;
  window.sessionStorage.setItem(DOCTOR_LOOKUP_HANDOFF_KEY, normalized);
}

export function consumePendingDoctorLookup() {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(DOCTOR_LOOKUP_HANDOFF_KEY);
  window.sessionStorage.removeItem(DOCTOR_LOOKUP_HANDOFF_KEY);
  return value?.trim() || null;
}
