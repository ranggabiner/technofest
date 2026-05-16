import { canonicalJson, hmacSha256Hex, sha256Hex } from "../crypto/hashing";

export const DOCTOR_LOOKUP_GENERIC_ERROR = "Kode dokter tidak valid atau tidak tersedia";
export const ACTIVE_DOCTOR_ACCESS_SESSION_ERROR_CODE = "active_doctor_access_session_exists";
export const DOCTOR_LOOKUP_SHORT_WINDOW_LIMIT = 10;
export const DOCTOR_LOOKUP_DAILY_LIMIT = 20;
export const DOCTOR_LOOKUP_SHORT_WINDOW_MS = 15 * 60 * 1000;
export const DOCTOR_LOOKUP_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const ACTIVE_GRANT_INVARIANT_ERROR = "active grant invariant failed";
const ACTIVE_GRANT_REPLACEMENT_HASH_ERROR = "replacement consent_hash is required";

export class ActiveDoctorAccessSessionError extends Error {
  readonly code = ACTIVE_DOCTOR_ACCESS_SESSION_ERROR_CODE;

  constructor() {
    super(ACTIVE_DOCTOR_ACCESS_SESSION_ERROR_CODE);
    this.name = "ActiveDoctorAccessSessionError";
  }
}

export type DoctorLookupInput =
  | { kind: "doctor_access_code"; value: string }
  | { kind: "qr_token"; value: string };

export function parseDoctorLookupInput(rawValue: string): DoctorLookupInput {
  const trimmed = rawValue.trim();
  const code = trimmed.replace(/\s+/g, "");

  if (/^[0-9]{6}$/.test(code)) {
    return { kind: "doctor_access_code", value: code };
  }

  if (trimmed.startsWith("medproof://doctor/")) {
    const token = trimmed.slice("medproof://doctor/".length).trim();
    if (isSafeQrToken(token)) return { kind: "qr_token", value: token };
  }

  if (isSafeQrToken(trimmed)) {
    return { kind: "qr_token", value: trimmed };
  }

  throw new Error(DOCTOR_LOOKUP_GENERIC_ERROR);
}

export function getDoctorLookupLimitState(
  failedAttemptTimes: string[],
  now: Date = new Date(),
): {
  limited: boolean;
  reason: "short_window" | "daily_window" | null;
  failedInShortWindow: number;
  failedInDailyWindow: number;
} {
  const nowMs = now.getTime();
  const failedInDailyWindow = failedAttemptTimes.filter((attemptTime) => {
    const attemptMs = Date.parse(attemptTime);
    return Number.isFinite(attemptMs) && nowMs - attemptMs < DOCTOR_LOOKUP_DAILY_WINDOW_MS;
  }).length;
  const failedInShortWindow = failedAttemptTimes.filter((attemptTime) => {
    const attemptMs = Date.parse(attemptTime);
    return Number.isFinite(attemptMs) && nowMs - attemptMs < DOCTOR_LOOKUP_SHORT_WINDOW_MS;
  }).length;

  if (failedInShortWindow >= DOCTOR_LOOKUP_SHORT_WINDOW_LIMIT) {
    return {
      limited: true,
      reason: "short_window",
      failedInShortWindow,
      failedInDailyWindow,
    };
  }

  if (failedInDailyWindow >= DOCTOR_LOOKUP_DAILY_LIMIT) {
    return {
      limited: true,
      reason: "daily_window",
      failedInShortWindow,
      failedInDailyWindow,
    };
  }

  return {
    limited: false,
    reason: null,
    failedInShortWindow,
    failedInDailyWindow,
  };
}

export function isActiveDoctorAccessSessionError(error: unknown) {
  if (error instanceof ActiveDoctorAccessSessionError) return true;
  if (!error || typeof error !== "object") return false;

  return [readErrorField(error, "message"), readErrorField(error, "details")]
    .filter(Boolean)
    .some(
      (value) =>
        value.includes(ACTIVE_GRANT_INVARIANT_ERROR) ||
        value.includes(ACTIVE_GRANT_REPLACEMENT_HASH_ERROR),
    );
}

export function assertNoActiveDoctorAccessSession(activeGrant: unknown) {
  if (activeGrant) {
    throw new ActiveDoctorAccessSessionError();
  }
}

export type AccessGrantProofInput = {
  pepper: string;
  grantId: string;
  patientId: string;
  doctorId: string;
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
  grantedAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  replacedByGrantId: string | null;
  granularScopeHash?: string | null;
  createdAt: string;
};

export function buildAccessGrantProof(input: AccessGrantProofInput): {
  hash: string;
  canonicalPayload: string;
} {
  const payload = {
    proof_type: "access_grant_consent",
    schema_version: "v1",
    grant_ref_hash: hmacSha256Hex(input.pepper, input.grantId),
    patient_hash: hmacSha256Hex(input.pepper, input.patientId),
    doctor_hash: hmacSha256Hex(input.pepper, input.doctorId),
    can_view_scope1: input.canViewScope1,
    can_view_scope2_mental: input.canViewScope2Mental,
    can_view_scope2_physical: input.canViewScope2Physical,
    can_download_attachments: input.canDownloadAttachments,
    granted_at: input.grantedAt,
    expires_at: input.expiresAt,
    is_revoked: input.isRevoked,
    revoked_at: input.revokedAt,
    replaced_by_grant_ref_hash: input.replacedByGrantId
      ? hmacSha256Hex(input.pepper, input.replacedByGrantId)
      : null,
    granular_scope_hash: input.granularScopeHash ?? null,
    created_at: input.createdAt,
  };
  const canonicalPayload = canonicalJson(payload);

  return {
    hash: sha256Hex(canonicalPayload),
    canonicalPayload,
  };
}

function isSafeQrToken(value: string) {
  return /^[A-Za-z0-9_-]{12,128}$/.test(value);
}

function readErrorField(error: object, field: "message" | "details") {
  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}
