import type { Scope2GrantFilter } from "@/lib/access/granular-grants";

export type DoctorGrantScope = "scope1" | "scope2_mental" | "scope2_physical" | "attachments";

export type GrantAccessInput = {
  isRevoked: boolean;
  expiresAt: string;
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
  attachmentRecordIds?: string[];
  scope2MentalFilter?: Scope2GrantFilter | null;
  scope2PhysicalFilter?: Scope2GrantFilter | null;
};

export type GrantAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "expired" | "revoked" | "missing_scope" };

export function evaluateGrantAccess(
  grant: GrantAccessInput,
  requiredScope: DoctorGrantScope | null,
  now = new Date(),
): GrantAccessResult {
  if (grant.isRevoked) return { allowed: false, reason: "revoked" };

  const expiresAtMs = Date.parse(grant.expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now.getTime()) {
    return { allowed: false, reason: "expired" };
  }

  if (requiredScope && !grantHasScope(grant, requiredScope)) {
    return { allowed: false, reason: "missing_scope" };
  }

  return { allowed: true };
}

export function grantHasScope(grant: GrantAccessInput, scope: DoctorGrantScope) {
  if (scope === "scope1") return grant.canViewScope1;
  if (scope === "scope2_mental") return grant.canViewScope2Mental;
  if (scope === "scope2_physical") return grant.canViewScope2Physical;
  return grant.canViewScope1 && grant.canDownloadAttachments;
}

export function describeDoctorGrantScopes(grant: GrantAccessInput) {
  const scopes: string[] = [];
  if (grant.canViewScope1) scopes.push("Scope 1");
  if (grant.canViewScope2Mental) scopes.push("Mental");
  if (grant.canViewScope2Physical) scopes.push("Fisik");
  if (grant.canDownloadAttachments) scopes.push("Unduh lampiran");
  return scopes;
}

export function canDownloadAttachmentRecord(
  grant: Pick<GrantAccessInput, "canViewScope1" | "canDownloadAttachments" | "attachmentRecordIds">,
  recordId: string,
) {
  if (!grant.canViewScope1 || !grant.canDownloadAttachments) return false;
  if (!grant.attachmentRecordIds) return true;
  return grant.attachmentRecordIds.includes(recordId);
}

export function scope2RowMatchesFilter(
  row: { logDate: string; sessionId: string },
  filter: Scope2GrantFilter | null | undefined,
  now = new Date(),
) {
  if (!filter) return true;
  if (filter.mode === "selected_session") return row.sessionId === filter.sessionId;
  if (filter.mode === "date_range") {
    return row.logDate >= filter.startDate && row.logDate <= filter.endDate;
  }

  const rowMs = Date.parse(`${row.logDate}T00:00:00.000Z`);
  if (!Number.isFinite(rowMs)) return false;

  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - filter.windowDays);
  cutoff.setUTCHours(0, 0, 0, 0);
  return rowMs >= cutoff.getTime();
}
