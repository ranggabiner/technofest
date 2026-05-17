import type { FormEvent } from "react";

export const DOCTOR_ACCESS_CODE_MAX_LENGTH = 6;

export function normalizeDoctorAccessCodeInput(value: string) {
  return value.replace(/\D/g, "").slice(0, DOCTOR_ACCESS_CODE_MAX_LENGTH);
}

export function mergeDoctorAccessCodeInput({
  currentValue,
  insertedValue,
  selectionStart,
  selectionEnd,
}: {
  currentValue: string;
  insertedValue: string;
  selectionStart: number | null;
  selectionEnd: number | null;
}) {
  const start = selectionStart ?? currentValue.length;
  const end = selectionEnd ?? currentValue.length;
  return normalizeDoctorAccessCodeInput(
    currentValue.slice(0, start) + insertedValue + currentValue.slice(end),
  );
}

export function doctorAccessCodeDisplayValue(value: string) {
  const trimmedDigits = value.trim().replace(/\s+/g, "");
  const normalized = normalizeDoctorAccessCodeInput(value);
  return trimmedDigits === normalized ? normalized : "";
}

export function preventNonNumericDoctorCodeInput(event: FormEvent<HTMLInputElement>) {
  const data = (event.nativeEvent as InputEvent).data;
  if (data && /\D/.test(data)) event.preventDefault();
}
