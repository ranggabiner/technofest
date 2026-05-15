export type DoctorGrantScope = "scope1" | "scope2_mental" | "scope2_physical" | "attachments";

export type GrantAccessInput = {
  isRevoked: boolean;
  expiresAt: string;
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
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
