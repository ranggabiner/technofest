import { canonicalJson, hmacSha256Hex, sha256Hex } from "@/lib/crypto/hashing";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Scope2GrantFilter =
  | {
      mode: "last_n_days";
      windowDays: number;
      sessionId: null;
      startDate?: null;
      endDate?: null;
    }
  | {
      mode: "selected_session";
      windowDays: null;
      sessionId: string;
      startDate?: null;
      endDate?: null;
    }
  | {
      mode: "date_range";
      windowDays: null;
      sessionId: null;
      startDate: string;
      endDate: string;
    };

export type GranularGrantInput = {
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  attachmentRecordIds: string[];
  scope2MentalFilter: Scope2GrantFilter | null;
  scope2PhysicalFilter: Scope2GrantFilter | null;
};

export type NormalizedGranularGrantInput = GranularGrantInput & {
  canDownloadAttachments: boolean;
};

export function parseScope2FilterValue(value: string | null | undefined): Scope2GrantFilter | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  const [kind, rawDetail] = normalized.split(":", 2);
  if (kind === "last_n_days") {
    const windowDays = Number.parseInt(rawDetail ?? "", 10);
    if (!Number.isInteger(windowDays) || windowDays <= 0) return null;
    return {
      mode: "last_n_days",
      windowDays,
      sessionId: null,
    };
  }

  if (kind === "selected_session" && isUuid(rawDetail)) {
    return {
      mode: "selected_session",
      windowDays: null,
      sessionId: rawDetail.toLowerCase(),
    };
  }

  return null;
}

export function parseScope2DateRangeFilter(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): Scope2GrantFilter | null {
  const normalizedStart = normalizeDateInput(startDate);
  const normalizedEnd = normalizeDateInput(endDate);
  if (!normalizedStart || !normalizedEnd || normalizedEnd < normalizedStart) return null;

  return {
    mode: "date_range",
    windowDays: null,
    sessionId: null,
    startDate: normalizedStart,
    endDate: normalizedEnd,
  };
}

export function normalizeGranularGrantInput(
  input: GranularGrantInput,
): NormalizedGranularGrantInput {
  const attachmentRecordIds = input.canViewScope1
    ? normalizeUuidList(input.attachmentRecordIds)
    : [];

  return {
    canViewScope1: input.canViewScope1,
    canViewScope2Mental: input.canViewScope2Mental,
    canViewScope2Physical: input.canViewScope2Physical,
    canDownloadAttachments: attachmentRecordIds.length > 0,
    attachmentRecordIds,
    scope2MentalFilter: input.canViewScope2Mental ? input.scope2MentalFilter : null,
    scope2PhysicalFilter: input.canViewScope2Physical ? input.scope2PhysicalFilter : null,
  };
}

export function buildGranularScopeHash(input: {
  pepper: string;
  attachmentRecordIds: string[];
  scope2MentalFilter: Scope2GrantFilter | null;
  scope2PhysicalFilter: Scope2GrantFilter | null;
}): { hash: string; canonicalPayload: string } {
  const payload = {
    proof_type: "access_grant_granular_scope",
    schema_version: "v1",
    attachment_record_hashes: normalizeUuidList(input.attachmentRecordIds).map((recordId) =>
      hmacSha256Hex(input.pepper, recordId),
    ),
    scope2_mental_filter: proofFilter(input.scope2MentalFilter, input.pepper),
    scope2_physical_filter: proofFilter(input.scope2PhysicalFilter, input.pepper),
  };
  const canonicalPayload = canonicalJson(payload);

  return {
    hash: sha256Hex(canonicalPayload),
    canonicalPayload,
  };
}

export function scope2FiltersToRpcJson(input: {
  scope2MentalFilter: Scope2GrantFilter | null;
  scope2PhysicalFilter: Scope2GrantFilter | null;
}) {
  const filters: Record<string, ReturnType<typeof scope2FilterToRpcJson>> = {};
  const mental = scope2FilterToRpcJson(input.scope2MentalFilter);
  const physical = scope2FilterToRpcJson(input.scope2PhysicalFilter);

  if (mental) filters.mental = mental;
  if (physical) filters.physical = physical;

  return filters;
}

export function scope2FilterToRpcJson(filter: Scope2GrantFilter | null) {
  if (!filter) return null;
  if (filter.mode === "last_n_days") {
    return {
      mode: filter.mode,
      window_days: filter.windowDays,
      session_id: null,
      start_date: null,
      end_date: null,
    };
  }
  if (filter.mode === "selected_session") {
    return {
      mode: filter.mode,
      window_days: null,
      session_id: filter.sessionId,
      start_date: null,
      end_date: null,
    };
  }
  return {
    mode: filter.mode,
    window_days: null,
    session_id: null,
    start_date: filter.startDate,
    end_date: filter.endDate,
  };
}

export function normalizeUuidList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter(isUuid),
    ),
  ).sort();
}

function proofFilter(filter: Scope2GrantFilter | null, pepper: string) {
  if (!filter) return null;
  if (filter.mode === "last_n_days") {
    return {
      mode: filter.mode,
      window_days: filter.windowDays,
      session_hash: null,
      start_date: null,
      end_date: null,
    };
  }
  if (filter.mode === "selected_session") {
    return {
      mode: filter.mode,
      window_days: null,
      session_hash: hmacSha256Hex(pepper, filter.sessionId),
      start_date: null,
      end_date: null,
    };
  }
  return {
    mode: filter.mode,
    window_days: null,
    session_hash: null,
    start_date: filter.startDate,
    end_date: filter.endDate,
  };
}

function isUuid(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function normalizeDateInput(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;

  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === normalized ? normalized : null;
}
