import "server-only";

import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { decryptString } from "@/lib/crypto/server";
import {
  loadPatientChatHistory,
  type JournalSessionHistoryItem,
  type JournalSessionSummaryView,
  type SummaryGenerationStatus,
} from "@/lib/ai/journal-service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export const patientHealthJournalFilters = ["all", "physical", "mental"] as const;

export type PatientHealthJournalFilter = (typeof patientHealthJournalFilters)[number];

export type PatientHealthJournalCategory = "general" | "mental" | "physical" | "mixed";

export type PatientHealthJournalMetric = {
  key:
    | "mood"
    | "anxiety"
    | "sleep"
    | "trigger"
    | "symptom"
    | "severity"
    | "bodyLocation"
    | "duration";
  unit?: "score10" | "hour";
  value: string;
};

export type PatientHealthJournalItem = {
  sessionId: string;
  title: string | null;
  description: string | null;
  category: PatientHealthJournalCategory;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  isActive: boolean;
  isClosed: boolean;
  isEmergencyFlagged: boolean;
  messageCount: number;
  metrics: PatientHealthJournalMetric[];
  summaryGenerationStatus: SummaryGenerationStatus;
};

export type PatientHealthJournalState = {
  activeFilter: PatientHealthJournalFilter;
  consentAccepted: boolean;
  items: PatientHealthJournalItem[];
};

type AiSessionSummaryRow = Pick<
  Database["public"]["Tables"]["ai_sessions"]["Row"],
  | "session_id"
  | "summary_text_ciphertext"
  | "summary_text_iv"
  | "summary_text_tag"
  | "summary_generated_at"
  | "summary_generation_status"
  | "ended_at"
  | "key_version"
>;

type Scope2MentalRow = Pick<
  Database["public"]["Tables"]["scope_2_mental"]["Row"],
  | "session_id"
  | "mood_score_ciphertext"
  | "mood_score_iv"
  | "mood_score_tag"
  | "anxiety_level_ciphertext"
  | "anxiety_level_iv"
  | "anxiety_level_tag"
  | "sleep_hours_ciphertext"
  | "sleep_hours_iv"
  | "sleep_hours_tag"
  | "trigger_notes_ciphertext"
  | "trigger_notes_iv"
  | "trigger_notes_tag"
  | "raw_quote_ciphertext"
  | "raw_quote_iv"
  | "raw_quote_tag"
  | "is_emergency_flagged_ciphertext"
  | "is_emergency_flagged_iv"
  | "is_emergency_flagged_tag"
  | "key_version"
>;

type Scope2PhysicalRow = Pick<
  Database["public"]["Tables"]["scope_2_physical"]["Row"],
  | "session_id"
  | "symptom_type_ciphertext"
  | "symptom_type_iv"
  | "symptom_type_tag"
  | "severity_ciphertext"
  | "severity_iv"
  | "severity_tag"
  | "body_location_ciphertext"
  | "body_location_iv"
  | "body_location_tag"
  | "duration_note_ciphertext"
  | "duration_note_iv"
  | "duration_note_tag"
  | "raw_quote_ciphertext"
  | "raw_quote_iv"
  | "raw_quote_tag"
  | "is_emergency_flagged_ciphertext"
  | "is_emergency_flagged_iv"
  | "is_emergency_flagged_tag"
  | "key_version"
>;

export function resolvePatientHealthJournalFilter(
  value: string | string[] | undefined,
): PatientHealthJournalFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && patientHealthJournalFilters.includes(candidate as PatientHealthJournalFilter)
    ? (candidate as PatientHealthJournalFilter)
    : "all";
}

export async function loadPatientHealthJournalState(
  role: ResolvedRole,
  activeFilter: PatientHealthJournalFilter = "all",
): Promise<PatientHealthJournalState> {
  if (role.kind !== "patient" || !role.patientId) {
    throw new Error("Peran pasien wajib untuk jurnal kesehatan");
  }

  const admin = createAdminClient();
  const [consentResult, chatHistory] = await Promise.all([
    admin
      .from("audit_logs")
      .select("log_id")
      .eq("actor_auth_user_id", role.authUserId)
      .eq("patient_id", role.patientId)
      .eq("action", "ai_processing_consent_accepted")
      .eq("access_status", "accepted")
      .limit(1)
      .maybeSingle(),
    loadPatientChatHistory(role),
  ]);

  if (consentResult.error) throw consentResult.error;

  const sessionIds = chatHistory.map((session) => session.id);
  if (sessionIds.length === 0) {
    return {
      activeFilter,
      consentAccepted: Boolean(consentResult.data),
      items: [],
    };
  }

  const [sessionResult, mentalResult, physicalResult] = await Promise.all([
    admin
      .from("ai_sessions")
      .select(
        "session_id,summary_text_ciphertext,summary_text_iv,summary_text_tag,summary_generated_at,summary_generation_status,ended_at,key_version",
      )
      .eq("patient_id", role.patientId)
      .in("session_id", sessionIds),
    admin
      .from("scope_2_mental")
      .select(
        "session_id,mood_score_ciphertext,mood_score_iv,mood_score_tag,anxiety_level_ciphertext,anxiety_level_iv,anxiety_level_tag,sleep_hours_ciphertext,sleep_hours_iv,sleep_hours_tag,trigger_notes_ciphertext,trigger_notes_iv,trigger_notes_tag,raw_quote_ciphertext,raw_quote_iv,raw_quote_tag,is_emergency_flagged_ciphertext,is_emergency_flagged_iv,is_emergency_flagged_tag,key_version",
      )
      .eq("patient_id", role.patientId)
      .in("session_id", sessionIds),
    admin
      .from("scope_2_physical")
      .select(
        "session_id,symptom_type_ciphertext,symptom_type_iv,symptom_type_tag,severity_ciphertext,severity_iv,severity_tag,body_location_ciphertext,body_location_iv,body_location_tag,duration_note_ciphertext,duration_note_iv,duration_note_tag,raw_quote_ciphertext,raw_quote_iv,raw_quote_tag,is_emergency_flagged_ciphertext,is_emergency_flagged_iv,is_emergency_flagged_tag,key_version",
      )
      .eq("patient_id", role.patientId)
      .in("session_id", sessionIds),
  ]);

  if (sessionResult.error) throw sessionResult.error;
  if (mentalResult.error) throw mentalResult.error;
  if (physicalResult.error) throw physicalResult.error;

  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  const sessionsById = new Map((sessionResult.data ?? []).map((session) => [session.session_id, session as AiSessionSummaryRow]));
  const mentalBySession = new Map(
    ((mentalResult.data ?? []) as Scope2MentalRow[]).map((row) => [row.session_id, row]),
  );
  const physicalBySession = groupBySession((physicalResult.data ?? []) as Scope2PhysicalRow[]);

  const allItems = chatHistory.map((session) =>
    buildJournalItem({
      encryptionKey,
      mental: mentalBySession.get(session.id) ?? null,
      physical: physicalBySession.get(session.id) ?? [],
      session,
      summarySession: sessionsById.get(session.id) ?? null,
    }),
  );

  return {
    activeFilter,
    consentAccepted: Boolean(consentResult.data),
    items: filterJournalItems(allItems, activeFilter),
  };
}

function buildJournalItem(input: {
  encryptionKey: string;
  mental: Scope2MentalRow | null;
  physical: Scope2PhysicalRow[];
  session: JournalSessionHistoryItem;
  summarySession: AiSessionSummaryRow | null;
}): PatientHealthJournalItem {
  const summary = parseJournalSessionSummary(
    input.summarySession ? decryptOptional(input.summarySession, "summary_text", input.encryptionKey) : null,
  );
  const category = resolveCategory(input.mental, input.physical);
  const summaryGenerationStatus = resolveSummaryGenerationStatus(input.summarySession, summary);

  return {
    sessionId: input.session.id,
    title: input.session.title,
    description: sessionSummaryPreview(summary) ?? input.session.preview,
    category,
    createdAt: input.session.createdAt,
    updatedAt: input.session.updatedAt,
    endedAt: input.session.endedAt,
    isActive: input.session.isActive,
    isClosed: input.session.isClosed,
    isEmergencyFlagged: isEmergencyFlagged(input.mental, input.physical, input.encryptionKey),
    messageCount: input.session.messageCount,
    metrics: buildMetrics(input.mental, input.physical, input.encryptionKey),
    summaryGenerationStatus,
  };
}

function buildMetrics(
  mental: Scope2MentalRow | null,
  physical: Scope2PhysicalRow[],
  encryptionKey: string,
): PatientHealthJournalMetric[] {
  const metrics: PatientHealthJournalMetric[] = [];

  if (mental) {
    appendMetric(metrics, "mood", decryptOptional(mental, "mood_score", encryptionKey), "score10");
    appendMetric(metrics, "anxiety", decryptOptional(mental, "anxiety_level", encryptionKey), "score10");
    appendMetric(metrics, "sleep", decryptOptional(mental, "sleep_hours", encryptionKey), "hour");
    appendMetric(metrics, "trigger", decryptOptional(mental, "trigger_notes", encryptionKey));
  }

  for (const row of physical.slice(0, 2)) {
    appendMetric(metrics, "symptom", decryptOptional(row, "symptom_type", encryptionKey));
    appendMetric(metrics, "severity", decryptOptional(row, "severity", encryptionKey), "score10");
    appendMetric(metrics, "bodyLocation", decryptOptional(row, "body_location", encryptionKey));
    appendMetric(metrics, "duration", decryptOptional(row, "duration_note", encryptionKey));
  }

  return metrics.slice(0, 6);
}

function appendMetric(
  metrics: PatientHealthJournalMetric[],
  key: PatientHealthJournalMetric["key"],
  value: string | null,
  unit?: PatientHealthJournalMetric["unit"],
) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  metrics.push({ key, unit, value: trimmed });
}

function resolveCategory(
  mental: Scope2MentalRow | null,
  physical: Scope2PhysicalRow[],
): PatientHealthJournalCategory {
  if (mental && physical.length > 0) return "mixed";
  if (mental) return "mental";
  if (physical.length > 0) return "physical";
  return "general";
}

function isEmergencyFlagged(
  mental: Scope2MentalRow | null,
  physical: Scope2PhysicalRow[],
  encryptionKey: string,
) {
  const mentalFlag = mental ? decryptOptional(mental, "is_emergency_flagged", encryptionKey) : null;
  if (mentalFlag === "true") return true;
  return physical.some((row) => decryptOptional(row, "is_emergency_flagged", encryptionKey) === "true");
}

function filterJournalItems(
  items: PatientHealthJournalItem[],
  activeFilter: PatientHealthJournalFilter,
) {
  if (activeFilter === "all") return items;
  if (activeFilter === "mental") {
    return items.filter((item) => item.category === "mental" || item.category === "mixed");
  }
  return items.filter((item) => item.category === "physical" || item.category === "mixed");
}

function groupBySession(rows: Scope2PhysicalRow[]) {
  return rows.reduce((groups, row) => {
    const current = groups.get(row.session_id) ?? [];
    current.push(row);
    groups.set(row.session_id, current);
    return groups;
  }, new Map<string, Scope2PhysicalRow[]>());
}

function resolveSummaryGenerationStatus(
  session: Pick<AiSessionSummaryRow, "ended_at" | "summary_generation_status" | "summary_generated_at"> | null,
  summary: JournalSessionSummaryView | null,
): SummaryGenerationStatus {
  if (summary || session?.summary_generated_at) return "completed";
  if (session?.ended_at && session.summary_generation_status === "pending") return "generating";
  return (session?.summary_generation_status as SummaryGenerationStatus | null) ?? "pending";
}

function parseJournalSessionSummary(value: string | null): JournalSessionSummaryView | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const summary = parsed as Record<string, unknown>;
      return {
        general: readSummarySection(summary.general),
        mental: readSummarySection(summary.mental),
        physical: readSummarySection(summary.physical),
      };
    }
  } catch {
    return { general: trimmed, mental: null, physical: null };
  }

  return { general: trimmed, mental: null, physical: null };
}

function readSummarySection(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function sessionSummaryPreview(summary: JournalSessionSummaryView | null) {
  return summary?.general ?? summary?.mental ?? summary?.physical ?? null;
}

function decryptOptional(
  row: Record<string, string | null>,
  field: string,
  encryptionKey: string,
) {
  const ciphertext = row[`${field}_ciphertext`];
  const iv = row[`${field}_iv`];
  const tag = row[`${field}_tag`];
  if (!ciphertext || !iv || !tag) return null;

  return decryptString(
    {
      ciphertext,
      iv,
      tag,
      keyVersion: row.key_version ?? "v1",
    },
    encryptionKey,
  );
}
