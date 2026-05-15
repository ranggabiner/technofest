import "server-only";

import type { ModelMessage } from "ai";

import { writeAuditLog } from "@/lib/audit/audit";
import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { decryptString, encryptString, type EncryptedValue } from "@/lib/crypto/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, TablesInsert } from "@/lib/supabase/database.types";

import { DEEPSEEK_MODEL, createDeepSeekJournalAiProvider } from "./deepseek";
import { buildScope2PersistencePayload, encryptedColumns } from "./extraction";
import { buildChatModelMessages } from "./prompts";
import type { JournalAiMessage, JournalAiProvider } from "./providers";
import { assertCanSendPatientMessage } from "./session-limits";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type AiMessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];

export type JournalMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type PatientJournalState = {
  consentAccepted: boolean;
  consentBlockchainStatus: string | null;
  profilingComplete: boolean;
  activeSessionId: string | null;
  activePatientMessageCount: number;
  messages: JournalMessageView[];
  latestSummary: string | null;
  latestSummaryStatus: "none" | "pending" | "generated";
};

export async function loadPatientJournalState(role: ResolvedRole): Promise<PatientJournalState> {
  const patientId = requirePatientId(role);
  const admin = createAdminClient();
  await closeInactiveSessions(patientId);

  const [patientResult, consentResult, sessionResult, summaryResult] = await Promise.all([
    admin
      .from("patients")
      .select(
        "patient_id,profiling_data_ciphertext,profiling_data_iv,profiling_data_tag,key_version",
      )
      .eq("patient_id", patientId)
      .single(),
    admin
      .from("audit_logs")
      .select("blockchain_status")
      .eq("actor_auth_user_id", role.authUserId)
      .eq("patient_id", patientId)
      .eq("action", "ai_processing_consent_accepted")
      .eq("access_status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("ai_sessions")
      .select("*")
      .eq("patient_id", patientId)
      .is("ended_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("ai_sessions")
      .select("summary_text_ciphertext,summary_text_iv,summary_text_tag,key_version,summary_generated_at")
      .eq("patient_id", patientId)
      .not("summary_generated_at", "is", null)
      .order("summary_generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (patientResult.error) throw patientResult.error;
  if (consentResult.error) throw consentResult.error;
  if (sessionResult.error) throw sessionResult.error;
  if (summaryResult.error) throw summaryResult.error;

  const activeSession = sessionResult.data;
  const messages = activeSession ? await loadDecryptedMessages(activeSession.session_id) : [];

  return {
    consentAccepted: Boolean(consentResult.data),
    consentBlockchainStatus: consentResult.data?.blockchain_status ?? null,
    profilingComplete: hasEncryptedProfile(patientResult.data),
    activeSessionId: activeSession?.session_id ?? null,
    activePatientMessageCount: messages.filter((message) => message.role === "user").length,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
    latestSummary: summaryResult.data
      ? decryptFromColumns(summaryResult.data, "summary_text")
      : null,
    latestSummaryStatus: summaryResult.data ? "generated" : activeSession ? "pending" : "none",
  };
}

export async function acceptAiConsent(role: ResolvedRole) {
  const patientId = requirePatientId(role);
  if (await hasAcceptedAiConsent(role.authUserId, patientId)) return;

  await writeAuditLog({
    actorAuthUserId: role.authUserId,
    actorRole: "patient",
    action: "ai_processing_consent_accepted",
    accessStatus: "accepted",
    targetType: "patient",
    targetId: patientId,
    patientId,
  });
}

export async function savePatientProfiling(
  role: ResolvedRole,
  input: {
    ageOrBirthDate: string;
    currentCondition: string;
    dailyActivity: string;
    lifestyleContext: string;
    knownHistory: string;
    discoveredFrom: string;
  },
) {
  const patientId = requirePatientId(role);
  await assertConsentAndProfileAccess(role.authUserId, patientId, { requireProfile: false });

  const normalized = {
    age_or_birth_date: input.ageOrBirthDate.trim(),
    current_condition: input.currentCondition.trim(),
    daily_activity: input.dailyActivity.trim(),
    lifestyle_context: input.lifestyleContext.trim(),
    known_history: input.knownHistory.trim(),
    discovered_from: input.discoveredFrom.trim(),
  };

  if (!normalized.current_condition) {
    throw new Error("Kondisi saat ini wajib diisi");
  }

  const env = requireEnv(["core"]);
  const encrypted = encryptString(JSON.stringify(normalized), env.data.ENCRYPTION_MASTER_KEY);
  const admin = createAdminClient();
  const { error } = await admin
    .from("patients")
    .update({
      profiling_data_ciphertext: encrypted.ciphertext,
      profiling_data_iv: encrypted.iv,
      profiling_data_tag: encrypted.tag,
      key_version: encrypted.keyVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("patient_id", patientId);

  if (error) throw error;
}

export async function preparePatientChatTurn(input: {
  role: ResolvedRole;
  message: string;
  requestedSessionId?: string | null;
}): Promise<{
  patientId: string;
  sessionId: string;
  modelMessages: ModelMessage[];
}> {
  const patientId = requirePatientId(input.role);
  const latestMessage = input.message.trim();
  if (!latestMessage) throw new Error("Pesan wajib diisi");
  if (latestMessage.length > 2000) throw new Error("Pesan terlalu panjang");

  await assertConsentAndProfileAccess(input.role.authUserId, patientId, { requireProfile: true });
  await closeInactiveSessions(patientId);

  const session = await getOrCreateActiveSession(patientId, input.requestedSessionId);
  const patientMessageCount = await countPatientMessages(session.session_id);
  assertCanSendPatientMessage(patientMessageCount);

  const conversationBeforeInsert = await loadConversation(session.session_id);
  await insertEncryptedMessage({
    patientId,
    sessionId: session.session_id,
    role: "patient",
    content: latestMessage,
  });

  return {
    patientId,
    sessionId: session.session_id,
    modelMessages: buildChatModelMessages({
      profilingContext: await loadProfilingContext(patientId),
      conversation: conversationBeforeInsert,
      latestMessage,
    }),
  };
}

export async function storeAiAssistantMessage(input: {
  patientId: string;
  sessionId: string;
  content: string;
}) {
  const content = input.content.trim();
  if (!content) return;

  await insertEncryptedMessage({
    patientId: input.patientId,
    sessionId: input.sessionId,
    role: "ai",
    content,
  });
}

export async function finalizeActiveAiSession(
  role: ResolvedRole,
  endReason: "manual_end" | "new_session_started" | "inactivity_timeout" = "manual_end",
) {
  const patientId = requirePatientId(role);
  await assertConsentAndProfileAccess(role.authUserId, patientId, { requireProfile: true });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_sessions")
    .select("*")
    .eq("patient_id", patientId)
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  await finalizeAiSession({
    patientId,
    sessionId: data.session_id,
    endReason,
    provider: createDeepSeekJournalAiProvider(),
  });
}

async function finalizeAiSession(input: {
  patientId: string;
  sessionId: string;
  endReason: "manual_end" | "new_session_started" | "inactivity_timeout";
  provider: JournalAiProvider;
}) {
  const messages = await loadConversation(input.sessionId);
  const admin = createAdminClient();
  const now = new Date();

  if (messages.length === 0) {
    const { error } = await admin
      .from("ai_sessions")
      .update({
        ended_at: now.toISOString(),
        end_reason: input.endReason,
        updated_at: now.toISOString(),
      })
      .eq("session_id", input.sessionId)
      .eq("patient_id", input.patientId);
    if (error) throw error;
    return;
  }

  const extraction = await input.provider.extractSession(messages);
  const env = requireEnv(["core"]);
  const payload = buildScope2PersistencePayload({
    extraction,
    patientId: input.patientId,
    sessionId: input.sessionId,
    encryptionKey: env.data.ENCRYPTION_MASTER_KEY,
    model: DEEPSEEK_MODEL,
    now,
  });

  const { error: sessionError } = await admin
    .from("ai_sessions")
    .update({
      ended_at: now.toISOString(),
      end_reason: input.endReason,
      summary_text_ciphertext: payload.sessionSummary.summary_text_ciphertext,
      summary_text_iv: payload.sessionSummary.summary_text_iv,
      summary_text_tag: payload.sessionSummary.summary_text_tag,
      summary_generated_at: now.toISOString(),
      key_version: payload.sessionSummary.keyVersion,
      updated_at: now.toISOString(),
    })
    .eq("session_id", input.sessionId)
    .eq("patient_id", input.patientId);
  if (sessionError) throw sessionError;

  if (payload.mentalRow) {
    const { error } = await admin
      .from("scope_2_mental")
      .upsert(payload.mentalRow as TablesInsert<"scope_2_mental">, {
        onConflict: "session_id",
      });
    if (error) throw error;
  }

  if (payload.physicalRows.length > 0) {
    const { error } = await admin
      .from("scope_2_physical")
      .upsert(payload.physicalRows as TablesInsert<"scope_2_physical">[], {
        onConflict: "session_id,raw_quote_hash",
      });
    if (error) throw error;
  }
}

async function assertConsentAndProfileAccess(
  authUserId: string,
  patientId: string,
  options: { requireProfile: boolean },
) {
  if (!(await hasAcceptedAiConsent(authUserId, patientId))) {
    throw new Error("Persetujuan pemrosesan AI wajib diterima");
  }

  if (!options.requireProfile) return;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patients")
    .select("profiling_data_ciphertext,profiling_data_iv,profiling_data_tag,key_version")
    .eq("patient_id", patientId)
    .single();

  if (error) throw error;
  if (!hasEncryptedProfile(data)) throw new Error("Profil awal wajib dilengkapi");
}

async function hasAcceptedAiConsent(authUserId: string, patientId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("log_id")
    .eq("actor_auth_user_id", authUserId)
    .eq("patient_id", patientId)
    .eq("action", "ai_processing_consent_accepted")
    .eq("access_status", "accepted")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function getOrCreateActiveSession(patientId: string, requestedSessionId?: string | null) {
  const admin = createAdminClient();

  if (requestedSessionId) {
    const { data, error } = await admin
      .from("ai_sessions")
      .select("*")
      .eq("session_id", requestedSessionId)
      .eq("patient_id", patientId)
      .is("ended_at", null)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  const { data: existing, error: existingError } = await admin
    .from("ai_sessions")
    .select("*")
    .eq("patient_id", patientId)
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const now = new Date().toISOString();
  const title = encryptedColumns("session_title", "Jurnal AI", requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY);
  const { data, error } = await admin
    .from("ai_sessions")
    .insert({
      patient_id: patientId,
      session_title_ciphertext: title.session_title_ciphertext,
      session_title_iv: title.session_title_iv,
      session_title_tag: title.session_title_tag,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function countPatientMessages(sessionId: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("ai_messages")
    .select("message_id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("sender_role", "patient");

  if (error) throw error;
  return count ?? 0;
}

async function insertEncryptedMessage(input: {
  patientId: string;
  sessionId: string;
  role: "patient" | "ai";
  content: string;
}) {
  const env = requireEnv(["core"]);
  const encrypted = encryptString(input.content, env.data.ENCRYPTION_MASTER_KEY);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("ai_messages").insert({
    patient_id: input.patientId,
    session_id: input.sessionId,
    sender_role: input.role,
    message_text_ciphertext: encrypted.ciphertext,
    message_text_iv: encrypted.iv,
    message_text_tag: encrypted.tag,
    key_version: encrypted.keyVersion,
    created_at: now,
  });
  if (error) throw error;

  const { error: sessionError } = await admin
    .from("ai_sessions")
    .update({ updated_at: now })
    .eq("session_id", input.sessionId)
    .eq("patient_id", input.patientId);
  if (sessionError) throw sessionError;
}

async function loadDecryptedMessages(sessionId: string): Promise<JournalMessageView[]> {
  const rows = await loadMessageRows(sessionId);
  return rows.map((row) => ({
    id: row.message_id,
    role: row.sender_role === "ai" ? "assistant" : "user",
    content: decryptFromColumns(row, "message_text") ?? "",
    createdAt: row.created_at,
  }));
}

async function loadConversation(sessionId: string): Promise<JournalAiMessage[]> {
  const messages = await loadDecryptedMessages(sessionId);
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function loadMessageRows(sessionId: string): Promise<AiMessageRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function loadProfilingContext(patientId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patients")
    .select("profiling_data_ciphertext,profiling_data_iv,profiling_data_tag,key_version")
    .eq("patient_id", patientId)
    .single();
  if (error) throw error;
  return decryptPatientProfile(data);
}

async function closeInactiveSessions(patientId: string) {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("ai_sessions")
    .select("session_id,updated_at,created_at")
    .eq("patient_id", patientId)
    .is("ended_at", null);

  if (error) throw error;

  const staleIds =
    data
      ?.filter((session) => (session.updated_at ?? session.created_at) < cutoff)
      .map((session) => session.session_id) ?? [];

  if (staleIds.length === 0) return;

  for (const sessionId of staleIds) {
    await finalizeAiSession({
      patientId,
      sessionId,
      endReason: "inactivity_timeout",
      provider: createDeepSeekJournalAiProvider(),
    });
  }
}

function requirePatientId(role: ResolvedRole) {
  if (role.kind !== "patient" || !role.patientId) {
    throw new Error("Akses pasien wajib digunakan");
  }
  return role.patientId;
}

function hasEncryptedProfile(
  patient: Pick<
    PatientRow,
    "profiling_data_ciphertext" | "profiling_data_iv" | "profiling_data_tag"
  >,
) {
  return Boolean(
    patient.profiling_data_ciphertext && patient.profiling_data_iv && patient.profiling_data_tag,
  );
}

function decryptPatientProfile(
  patient: Pick<
    PatientRow,
    "profiling_data_ciphertext" | "profiling_data_iv" | "profiling_data_tag" | "key_version"
  >,
) {
  if (!hasEncryptedProfile(patient)) return null;
  return decryptFromColumns(patient, "profiling_data");
}

function decryptFromColumns(row: Record<string, unknown>, prefix: string) {
  const ciphertext = row[`${prefix}_ciphertext`];
  const iv = row[`${prefix}_iv`];
  const tag = row[`${prefix}_tag`];
  if (typeof ciphertext !== "string" || typeof iv !== "string" || typeof tag !== "string") {
    return null;
  }

  const env = requireEnv(["core"]);
  return decryptString(
    {
      ciphertext,
      iv,
      tag,
      keyVersion: typeof row.key_version === "string" ? row.key_version : "v1",
    } satisfies EncryptedValue,
    env.data.ENCRYPTION_MASTER_KEY,
  );
}
