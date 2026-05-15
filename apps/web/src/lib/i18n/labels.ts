import type { Dictionary } from "./dictionary";

type Tone = "approved" | "failed" | "pending" | "neutral";

export function proofTone(status: string): Tone {
  if (status === "confirmed") return "approved";
  if (status === "failed") return "failed";
  if (status === "pending") return "pending";
  return "neutral";
}

export function proofLabel(copy: Dictionary, status: string) {
  if (status === "confirmed") return copy.common.proofLabel.confirmed;
  if (status === "failed") return copy.common.proofLabel.failed;
  if (status === "pending") return copy.common.proofLabel.pending;
  return copy.common.proofLabel.unavailable;
}

export function statusTone(status: string): Tone {
  if (["created", "replaced", "revoked", "allowed", "accepted", "approved", "amended"].includes(status)) {
    return "approved";
  }
  if (["failed", "denied", "rejected", "mismatch"].includes(status)) return "failed";
  if (status === "pending") return "pending";
  return "neutral";
}

export function statusLabel(copy: Dictionary, status: string) {
  return copy.common.statusLabel[status as keyof typeof copy.common.statusLabel] ?? status;
}

export function recordTypeLabel(copy: Dictionary, recordType: string) {
  return copy.common.recordType[recordType as keyof typeof copy.common.recordType] ?? recordType;
}

export function patientAccessActionLabel(copy: Dictionary, action: string, fallback: string) {
  return copy.patient.access.actionLabel[action as keyof typeof copy.patient.access.actionLabel] ?? fallback;
}

export function scopeLabel(copy: Dictionary, key: keyof Dictionary["common"]["scopeLabels"]) {
  return copy.common.scopeLabels[key];
}

export function localizedScopeList(copy: Dictionary, scopes: string[]) {
  return scopes.map((scope) => {
    if (scope === "Scope 1") return copy.common.scopeLabels.scope1;
    if (scope === "Mental" || scope === "Scope 2 mental") return copy.common.scopeLabels.scope2Mental;
    if (scope === "Fisik" || scope === "Scope 2 fisik") return copy.common.scopeLabels.scope2Physical;
    return scope;
  });
}

export function proofStatusMessages(copy: Dictionary) {
  return {
    txPrefix: copy.common.txPrefix,
    verify: copy.proofStatus.verify,
    verifying: copy.proofStatus.verifying,
    verifyFailed: copy.proofStatus.verifyFailed,
    confirmed: copy.proofStatus.confirmed,
    pending: copy.proofStatus.pending,
    unavailable: copy.proofStatus.unavailable,
    failedPrefix: copy.proofStatus.failedPrefix,
  };
}
