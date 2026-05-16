import "server-only";

import type { ModelMessage } from "ai";
import { after } from "next/server";

import { writeAuditLog } from "@/lib/audit/audit";
import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { decryptString, encryptString, type EncryptedValue } from "@/lib/crypto/server";
import { PATIENT_DASHBOARD_ITEM_LIMIT } from "@/lib/patient/dashboard-limits";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, TablesInsert } from "@/lib/supabase/database.types";

import { DEEPSEEK_MODEL, createDeepSeekJournalAiProvider } from "./deepseek";
import { buildScope2PersistencePayload, encryptedColumns } from "./extraction";
import { buildChatModelMessages } from "./prompts";
import type { JournalAiMessage, JournalAiProvider } from "./providers";
import { buildSessionTitleFromMessage, filterChatHistory } from "./chat-history";
import {
  attachPatientChatAttachmentToMessage,
  buildAttachmentContextForAi,
  preparePatientChatAttachment,
  type PreparedPatientChatAttachment,
} from "./patient-chat-attachments";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];
type AiSessionRow = Database["public"]["Tables"]["ai_sessions"]["Row"];
type AiMessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];
type AiMessageAttachmentRow = Database["public"]["Tables"]["ai_message_attachments"]["Row"];
type SecureFileRow = Pick<
  Database["public"]["Tables"]["secure_files"]["Row"],
  | "file_id"
  | "file_size_bytes"
  | "key_version"
  | "mime_type"
  | "original_filename_ciphertext"
  | "original_filename_iv"
  | "original_filename_tag"
>;
type AiMessageAttachmentWithFile = AiMessageAttachmentRow & {
  secure_files: SecureFileRow | SecureFileRow[] | null;
};
type JournalMessageAttachmentForModel = JournalMessageAttachmentView & {
  extractedText: string;
  extractedTextTruncated: boolean;
  extractionMethod: "pdf_text" | "image_ocr";
};
type AttachmentMaps = {
  viewByMessageId: Map<string, JournalMessageAttachmentView>;
  modelByMessageId: Map<string, JournalMessageAttachmentForModel>;
};
type PatientProfilePatch = Record<string, unknown>;

export type SummaryGenerationStatus = "pending" | "generating" | "completed" | "failed";

const AI_SESSION_COLUMNS =
  "session_id,patient_id,session_title_ciphertext,session_title_iv,session_title_tag,summary_text_ciphertext,summary_text_iv,summary_text_tag,ended_at,end_reason,summary_generated_at,summary_generation_status,key_version,created_at,updated_at";
const AI_MESSAGE_COLUMNS =
  "message_id,session_id,patient_id,sender_role,message_text_ciphertext,message_text_iv,message_text_tag,key_version,created_at";
const AI_MESSAGE_ATTACHMENT_COLUMNS =
  "attachment_id,message_id,session_id,patient_id,file_id,file_size_bytes,extracted_text_ciphertext,extracted_text_iv,extracted_text_tag,extracted_text_truncated,extraction_method,key_version,created_at,secure_files(file_id,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,file_size_bytes,key_version)";

export type JournalMessageAttachmentView = {
  id: string;
  fileName: string | null;
  fileType: string | null;
  fileSizeBytes: number | null;
};

export type JournalMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachment: JournalMessageAttachmentView | null;
};

export type JournalSummaryView = {
  id: string;
  title: string | null;
  summary: string;
  summaryGeneratedAt: string;
};

export type JournalSessionSummaryView = {
  general: string | null;
  mental: string | null;
  physical: string | null;
};

export type JournalSessionHistoryItem = {
  id: string;
  title: string | null;
  preview: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  isActive: boolean;
  isClosed: boolean;
  messageCount: number;
};

export type JournalSessionDetailView = {
  sessionId: string;
  title: string | null;
  messages: JournalMessageView[];
  patientMessageCount: number;
  latestSummary: JournalSessionSummaryView | null;
  summaryGenerationStatus: SummaryGenerationStatus;
  endedAt: string | null;
  isClosed: boolean;
};

export type PatientJournalState = {
  consentAccepted: boolean;
  consentBlockchainStatus: string | null;
  profilingComplete: boolean;
  activeSessionId: string | null;
  activeSessionClosed: boolean;
  activePatientMessageCount: number;
  messages: JournalMessageView[];
  latestSummary: JournalSessionSummaryView | null;
  recentSummaries: JournalSummaryView[];
  chatHistory: JournalSessionHistoryItem[];
  latestSummaryStatus: SummaryGenerationStatus;
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
      .select(AI_SESSION_COLUMNS)
      .eq("patient_id", patientId)
      .is("ended_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("ai_sessions")
      .select(
        "session_id,session_title_ciphertext,session_title_iv,session_title_tag,summary_text_ciphertext,summary_text_iv,summary_text_tag,key_version,summary_generated_at,summary_generation_status",
      )
      .eq("patient_id", patientId)
      .not("summary_generated_at", "is", null)
      .order("summary_generated_at", { ascending: false })
      .limit(PATIENT_DASHBOARD_ITEM_LIMIT),
  ]);

  if (patientResult.error) throw patientResult.error;
  if (consentResult.error) throw consentResult.error;
  if (sessionResult.error) throw sessionResult.error;
  if (summaryResult.error) throw summaryResult.error;

  const recentSummaries = (summaryResult.data ?? []).flatMap((row) => {
    const summary = parseJournalSessionSummary(decryptFromColumns(row, "summary_text"));
    const summaryText = sessionSummaryPreview(summary);
    if (!summaryText || !row.summary_generated_at) return [];

    return [{
      id: row.session_id,
      title: decryptFromColumns(row, "session_title"),
      summary: summaryText,
      summaryGeneratedAt: row.summary_generated_at,
    }];
  });
  const chatHistory = await loadPatientChatHistory(role);
  const activeSession = sessionResult.data;
  const selectedSession =
    activeSession ?? (chatHistory[0] ? await loadPatientSessionRow(patientId, chatHistory[0].id) : null);
  const messages = selectedSession
    ? await loadDecryptedMessages(selectedSession.session_id, patientId)
    : [];
  const selectedSummary = selectedSession
    ? parseJournalSessionSummary(decryptFromColumns(selectedSession, "summary_text"))
    : null;
  const selectedSummaryStatus = selectedSession
    ? resolveSummaryGenerationStatus(selectedSession, selectedSummary)
    : recentSummaries.length > 0
      ? "completed"
      : "pending";

  return {
    consentAccepted: Boolean(consentResult.data),
    consentBlockchainStatus: consentResult.data?.blockchain_status ?? null,
    profilingComplete: hasEncryptedProfile(patientResult.data),
    activeSessionId: selectedSession?.session_id ?? null,
    activeSessionClosed: Boolean(selectedSession?.ended_at),
    activePatientMessageCount: messages.filter((message) => message.role === "user").length,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      attachment: message.attachment,
    })),
    latestSummary: selectedSession
      ? selectedSummary
      : recentSummaries[0]
        ? { general: recentSummaries[0].summary, mental: null, physical: null }
        : null,
    recentSummaries,
    chatHistory,
    latestSummaryStatus: selectedSummaryStatus,
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

  await saveEncryptedPatientProfile(patientId, normalized, {
    updated_at: new Date().toISOString(),
  });
}

export async function savePatientBasicOnboarding(
  role: ResolvedRole,
  input: {
    fullName: string;
    ageYears: number;
    gender: string;
  },
) {
  const patientId = requirePatientId(role);
  const fullName = input.fullName.trim();
  const gender = input.gender.trim();

  if (!fullName) throw new Error("Nama lengkap wajib diisi");
  if (!Number.isInteger(input.ageYears) || input.ageYears < 1 || input.ageYears > 120) {
    throw new Error("Usia wajib diisi dengan benar");
  }
  if (!gender) throw new Error("Gender wajib diisi");

  await saveEncryptedPatientProfile(
    patientId,
    {
      onboarding_basic: {
        age_years: input.ageYears,
        gender,
      },
    },
    {
      full_name: fullName,
      onboarding_step: "health",
      onboarding_completed_at: null,
      updated_at: new Date().toISOString(),
    },
  );
}

export async function savePatientHealthOnboarding(
  role: ResolvedRole,
  input: {
    activityLevel: string;
    sleepHours: number;
    currentFeeling: string;
    livingEnvironment: string;
    allergies: string;
  },
) {
  const patientId = requirePatientId(role);
  const activityLevel = input.activityLevel.trim();
  const currentFeeling = input.currentFeeling.trim();

  if (!activityLevel) throw new Error("Aktivitas harian wajib diisi");
  if (!Number.isFinite(input.sleepHours) || input.sleepHours < 0 || input.sleepHours > 24) {
    throw new Error("Jam tidur wajib diisi dengan benar");
  }
  if (!currentFeeling) throw new Error("Kondisi saat ini wajib diisi");

  await saveEncryptedPatientProfile(
    patientId,
    {
      onboarding_health: {
        activity_level: activityLevel,
        sleep_hours: input.sleepHours,
        current_feeling: currentFeeling,
        living_environment: input.livingEnvironment.trim(),
        allergies: input.allergies.trim(),
      },
    },
    {
      onboarding_step: "ai_consent",
      onboarding_completed_at: null,
      updated_at: new Date().toISOString(),
    },
  );
}

export async function completePatientOnboarding(role: ResolvedRole) {
  const patientId = requirePatientId(role);
  await acceptAiConsent(role);

  const admin = createAdminClient();
  const { error } = await admin
    .from("patients")
    .update({
      onboarding_step: "complete",
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("patient_id", patientId);

  if (error) throw error;
}

export async function preparePatientChatTurn(input: {
  role: ResolvedRole;
  message: string;
  requestedSessionId?: string | null;
  attachment?: File | null;
}): Promise<{
  patientId: string;
  sessionId: string;
  modelMessages: ModelMessage[];
}> {
  const patientId = requirePatientId(input.role);
  const latestMessage = input.message.trim();
  if (!latestMessage && !input.attachment) throw new Error("Pesan wajib diisi");
  if (latestMessage.length > 2000) throw new Error("Pesan terlalu panjang");

  await assertConsentAndProfileAccess(input.role.authUserId, patientId, { requireProfile: true });
  await closeInactiveSessions(patientId);

  const session = await getOrCreateActiveSession(patientId, input.requestedSessionId);
  const conversationBeforeInsert = await loadConversation(session.session_id, patientId);
  const preparedAttachment = input.attachment
    ? await preparePatientChatAttachment({
      authUserId: input.role.authUserId,
      patientId,
      file: input.attachment,
    })
    : null;
  const storedMessage = latestMessage || buildAttachmentOnlyMessage(preparedAttachment);
  const insertedMessage = await insertEncryptedMessage({
    patientId,
    sessionId: session.session_id,
    role: "patient",
    content: storedMessage,
  });

  if (preparedAttachment) {
    await attachPatientChatAttachmentToMessage({
      patientId,
      sessionId: session.session_id,
      messageId: insertedMessage.message_id,
      attachment: preparedAttachment,
    });
  }

  if (!conversationBeforeInsert.some((message) => message.role === "user")) {
    await updateSessionTitle({
      patientId,
      sessionId: session.session_id,
      title: buildSessionTitleFromMessage(storedMessage),
    });
  }

  return {
    patientId,
    sessionId: session.session_id,
    modelMessages: buildChatModelMessages({
      profilingContext: await loadProfilingContext(patientId),
      conversation: conversationBeforeInsert,
      latestMessage: buildLatestMessageForModel(storedMessage, preparedAttachment),
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

function buildAttachmentOnlyMessage(attachment: PreparedPatientChatAttachment | null) {
  return attachment ? `Saya mengunggah lampiran ${attachment.filename}.` : "";
}

function buildLatestMessageForModel(
  content: string,
  attachment: PreparedPatientChatAttachment | null,
) {
  if (!attachment) return content;

  return [
    content,
    buildAttachmentContextForAi({
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      extractedText: attachment.extractedText,
      extractedTextTruncated: attachment.extractedTextTruncated,
    }),
  ].filter(Boolean).join("\n\n");
}

export async function finishActiveAiSession(
  role: ResolvedRole,
  endReason: "manual_end" | "new_session_started" | "inactivity_timeout" = "manual_end",
) {
  const patientId = requirePatientId(role);
  await assertConsentAndProfileAccess(role.authUserId, patientId, { requireProfile: true });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_sessions")
    .select("session_id")
    .eq("patient_id", patientId)
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const session = await markAiSessionFinished({
    patientId,
    sessionId: data.session_id,
    endReason,
  });

  scheduleAiSessionSummaryGeneration(session);
}

export async function loadPatientChatHistory(
  role: ResolvedRole,
  query = "",
): Promise<JournalSessionHistoryItem[]> {
  const patientId = requirePatientId(role);
  await closeInactiveSessions(patientId);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_sessions")
    .select(AI_SESSION_COLUMNS)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const sessions = data ?? [];
  const messagesBySession = await loadMessagesBySession(patientId, sessions.map((session) => session.session_id));
  const searchableHistory = sessions
    .map((session) => {
      const messages = messagesBySession.get(session.session_id) ?? [];
      const item = buildHistoryItem(session, messages);
      return {
        ...item,
        messages: messages.map((message) => message.content),
      };
    })
    .filter((item) => item.messageCount > 0);

  return filterChatHistory(searchableHistory, query).map((item) => ({
    id: item.id,
    title: item.title,
    preview: item.preview,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    endedAt: item.endedAt,
    isActive: item.isActive,
    isClosed: item.isClosed,
    messageCount: item.messageCount,
  }));
}

export async function loadPatientChatSession(
  role: ResolvedRole,
  sessionId: string,
): Promise<JournalSessionDetailView> {
  const patientId = requirePatientId(role);
  await closeInactiveSessions(patientId);

  const session = await loadPatientSessionRow(patientId, sessionId);
  if (!session) throw new Error("Sesi chat tidak ditemukan");

  return buildSessionDetail(session, await loadDecryptedMessages(session.session_id, patientId));
}

export async function startNewPatientChatSession(role: ResolvedRole): Promise<JournalSessionDetailView> {
  const patientId = requirePatientId(role);
  await assertConsentAndProfileAccess(role.authUserId, patientId, { requireProfile: true });
  await closeInactiveSessions(patientId);

  const activeSession = await loadActiveSessionRow(patientId);
  if (activeSession) {
    const finishedSession = await markAiSessionFinished({
      patientId,
      sessionId: activeSession.session_id,
      endReason: "new_session_started",
    });
    scheduleAiSessionSummaryGeneration(finishedSession);
  }

  const session = await createPatientChatSession(patientId);
  return buildSessionDetail(session, []);
}

export async function retryAiSessionSummaryGeneration(role: ResolvedRole, sessionId: string) {
  const patientId = requirePatientId(role);
  await assertConsentAndProfileAccess(role.authUserId, patientId, { requireProfile: true });

  const { data, error } = await createAdminClient()
    .from("ai_sessions")
    .update({
      summary_generation_status: "generating",
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .eq("patient_id", patientId)
    .eq("summary_generation_status", "failed")
    .not("ended_at", "is", null)
    .select(AI_SESSION_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Ringkasan sesi belum bisa dicoba ulang");

  scheduleAiSessionSummaryGeneration(data);
  return buildSessionDetail(data, await loadDecryptedMessages(data.session_id, patientId));
}

async function markAiSessionFinished(input: {
  patientId: string;
  sessionId: string;
  endReason: "manual_end" | "new_session_started" | "inactivity_timeout";
}): Promise<AiSessionRow> {
  const admin = createAdminClient();
  const now = new Date();
  const messageCount = await countSessionMessages(input.sessionId, input.patientId);
  const summaryGenerationStatus: SummaryGenerationStatus = messageCount > 0 ? "generating" : "completed";

  const { data, error } = await admin
    .from("ai_sessions")
    .update({
      ended_at: now.toISOString(),
      end_reason: input.endReason,
      summary_generation_status: summaryGenerationStatus,
      updated_at: now.toISOString(),
    })
    .eq("session_id", input.sessionId)
    .eq("patient_id", input.patientId)
    .is("ended_at", null)
    .select(AI_SESSION_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const existing = await loadPatientSessionRow(input.patientId, input.sessionId);
    if (existing) return existing;
    throw new Error("Sesi chat tidak ditemukan");
  }

  return data;
}

function scheduleAiSessionSummaryGeneration(session: Pick<AiSessionRow, "patient_id" | "session_id" | "summary_generation_status">) {
  if (session.summary_generation_status !== "generating") return;

  after(() =>
    runAiSessionSummaryGeneration({
      patientId: session.patient_id,
      sessionId: session.session_id,
      provider: createDeepSeekJournalAiProvider(),
    }),
  );
}

async function runAiSessionSummaryGeneration(input: {
  patientId: string;
  sessionId: string;
  provider: JournalAiProvider;
}) {
  const admin = createAdminClient();

  try {
    const session = await loadPatientSessionRow(input.patientId, input.sessionId);
    if (!session?.ended_at || session.summary_generation_status === "completed") return;

    const messages = await loadConversation(input.sessionId, input.patientId);
    if (messages.length === 0) {
      const { error } = await admin
        .from("ai_sessions")
        .update({
          summary_generation_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", input.sessionId)
        .eq("patient_id", input.patientId);
      if (error) throw error;
      return;
    }

    const now = new Date();
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

    const { error: sessionError } = await admin
      .from("ai_sessions")
      .update({
        summary_text_ciphertext: payload.sessionSummary.summary_text_ciphertext,
        summary_text_iv: payload.sessionSummary.summary_text_iv,
        summary_text_tag: payload.sessionSummary.summary_text_tag,
        summary_generated_at: now.toISOString(),
        summary_generation_status: "completed",
        key_version: payload.sessionSummary.keyVersion,
        updated_at: now.toISOString(),
      })
      .eq("session_id", input.sessionId)
      .eq("patient_id", input.patientId);
    if (sessionError) throw sessionError;
  } catch {
    const { error } = await admin
      .from("ai_sessions")
      .update({
        summary_generation_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", input.sessionId)
      .eq("patient_id", input.patientId);
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

async function getOrCreateActiveSession(
  patientId: string,
  requestedSessionId?: string | null,
): Promise<AiSessionRow> {
  if (requestedSessionId) {
    const session = await loadPatientSessionRow(patientId, requestedSessionId);
    if (!session) throw new Error("Sesi chat tidak ditemukan");
    if (session.ended_at) throw new Error("Sesi chat sudah ditutup");
    return session;
  }

  const existing = await loadActiveSessionRow(patientId);
  if (existing) return existing;

  return createPatientChatSession(patientId);
}

async function createPatientChatSession(patientId: string): Promise<AiSessionRow> {
  const now = new Date().toISOString();
  const title = encryptedColumns("session_title", "Jurnal AI", requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_sessions")
    .insert({
      patient_id: patientId,
      session_title_ciphertext: title.session_title_ciphertext,
      session_title_iv: title.session_title_iv,
      session_title_tag: title.session_title_tag,
      summary_generation_status: "pending",
      created_at: now,
      updated_at: now,
    })
    .select(AI_SESSION_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

async function insertEncryptedMessage(input: {
  patientId: string;
  sessionId: string;
  role: "patient" | "ai";
  content: string;
}): Promise<AiMessageRow> {
  const env = requireEnv(["core"]);
  const encrypted = encryptString(input.content, env.data.ENCRYPTION_MASTER_KEY);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("ai_messages")
    .insert({
      patient_id: input.patientId,
      session_id: input.sessionId,
      sender_role: input.role,
      message_text_ciphertext: encrypted.ciphertext,
      message_text_iv: encrypted.iv,
      message_text_tag: encrypted.tag,
      key_version: encrypted.keyVersion,
      created_at: now,
    })
    .select(AI_MESSAGE_COLUMNS)
    .single();
  if (error) throw error;

  const { error: sessionError } = await admin
    .from("ai_sessions")
    .update({ updated_at: now })
    .eq("session_id", input.sessionId)
    .eq("patient_id", input.patientId);
  if (sessionError) throw sessionError;

  return data;
}

async function updateSessionTitle(input: {
  patientId: string;
  sessionId: string;
  title: string;
}) {
  const env = requireEnv(["core"]);
  const title = encryptedColumns("session_title", input.title, env.data.ENCRYPTION_MASTER_KEY);
  const { error } = await createAdminClient()
    .from("ai_sessions")
    .update({
      session_title_ciphertext: title.session_title_ciphertext,
      session_title_iv: title.session_title_iv,
      session_title_tag: title.session_title_tag,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", input.sessionId)
    .eq("patient_id", input.patientId);

  if (error) throw error;
}

async function loadActiveSessionRow(patientId: string): Promise<AiSessionRow | null> {
  const { data, error } = await createAdminClient()
    .from("ai_sessions")
    .select(AI_SESSION_COLUMNS)
    .eq("patient_id", patientId)
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function loadPatientSessionRow(patientId: string, sessionId: string): Promise<AiSessionRow | null> {
  const { data, error } = await createAdminClient()
    .from("ai_sessions")
    .select(AI_SESSION_COLUMNS)
    .eq("session_id", sessionId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function loadMessagesBySession(
  patientId: string,
  sessionIds: string[],
): Promise<Map<string, JournalMessageView[]>> {
  if (sessionIds.length === 0) return new Map();

  const { data, error } = await createAdminClient()
    .from("ai_messages")
    .select(AI_MESSAGE_COLUMNS)
    .eq("patient_id", patientId)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  const attachmentMaps = await loadAttachmentMaps(rows.map((row) => row.message_id));

  return rows.reduce((groups, row) => {
    const current = groups.get(row.session_id) ?? [];
    current.push(toJournalMessageView(row, attachmentMaps.viewByMessageId.get(row.message_id) ?? null));
    groups.set(row.session_id, current);
    return groups;
  }, new Map<string, JournalMessageView[]>());
}

async function loadDecryptedMessages(
  sessionId: string,
  patientId?: string,
): Promise<JournalMessageView[]> {
  const rows = await loadMessageRows(sessionId, patientId);
  const attachmentMaps = await loadAttachmentMaps(rows.map((row) => row.message_id));
  return rows.map((row) => toJournalMessageView(row, attachmentMaps.viewByMessageId.get(row.message_id) ?? null));
}

function toJournalMessageView(
  row: AiMessageRow,
  attachment: JournalMessageAttachmentView | null,
): JournalMessageView {
  return {
    id: row.message_id,
    role: row.sender_role === "ai" ? "assistant" : "user",
    content: decryptFromColumns(row, "message_text") ?? "",
    createdAt: row.created_at,
    attachment,
  };
}

async function loadConversation(sessionId: string, patientId?: string): Promise<JournalAiMessage[]> {
  const rows = await loadMessageRows(sessionId, patientId);
  const attachmentMaps = await loadAttachmentMaps(rows.map((row) => row.message_id));

  return rows.map((row) => ({
    role: row.sender_role === "ai" ? "assistant" : "user",
    content: buildStoredMessageForModel(
      decryptFromColumns(row, "message_text") ?? "",
      row.sender_role === "patient" ? attachmentMaps.modelByMessageId.get(row.message_id) ?? null : null,
    ),
  }));
}

async function loadAttachmentMaps(messageIds: string[]): Promise<AttachmentMaps> {
  if (messageIds.length === 0) {
    return {
      viewByMessageId: new Map(),
      modelByMessageId: new Map(),
    };
  }

  const { data, error } = await createAdminClient()
    .from("ai_message_attachments")
    .select(AI_MESSAGE_ATTACHMENT_COLUMNS)
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const viewByMessageId = new Map<string, JournalMessageAttachmentView>();
  const modelByMessageId = new Map<string, JournalMessageAttachmentForModel>();

  for (const row of (data ?? []) as unknown as AiMessageAttachmentWithFile[]) {
    const secureFile = firstSecureFile(row.secure_files);
    const fileName = secureFile ? decryptFromColumns(secureFile, "original_filename") : null;
    const viewAttachment: JournalMessageAttachmentView = {
      id: row.attachment_id,
      fileName,
      fileType: secureFile?.mime_type ?? null,
      fileSizeBytes: row.file_size_bytes,
    };

    viewByMessageId.set(row.message_id, viewAttachment);
    modelByMessageId.set(row.message_id, {
      ...viewAttachment,
      extractedText: decryptFromColumns(row, "extracted_text") ?? "",
      extractedTextTruncated: row.extracted_text_truncated,
      extractionMethod: row.extraction_method,
    });
  }

  return { viewByMessageId, modelByMessageId };
}

function firstSecureFile(value: SecureFileRow | SecureFileRow[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function buildStoredMessageForModel(
  content: string,
  attachment: JournalMessageAttachmentForModel | null,
) {
  if (!attachment) return content;

  return [
    content,
    buildAttachmentContextForAi({
      filename: attachment.fileName ?? "lampiran",
      mimeType: attachment.fileType ?? "application/octet-stream",
      sizeBytes: attachment.fileSizeBytes ?? 0,
      extractedText: attachment.extractedText,
      extractedTextTruncated: attachment.extractedTextTruncated,
    }),
  ].filter(Boolean).join("\n\n");
}

async function loadMessageRows(sessionId: string, patientId?: string): Promise<AiMessageRow[]> {
  let query = createAdminClient()
    .from("ai_messages")
    .select(AI_MESSAGE_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (patientId) query = query.eq("patient_id", patientId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function countSessionMessages(sessionId: string, patientId: string) {
  const { count, error } = await createAdminClient()
    .from("ai_messages")
    .select("message_id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("patient_id", patientId);

  if (error) throw error;
  return count ?? 0;
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
    const session = await markAiSessionFinished({
      patientId,
      sessionId,
      endReason: "inactivity_timeout",
    });
    scheduleAiSessionSummaryGeneration(session);
  }
}

function buildHistoryItem(
  session: AiSessionRow,
  messages: JournalMessageView[],
): JournalSessionHistoryItem {
  const title =
    decryptFromColumns(session, "session_title") ??
    buildSessionTitleFromMessage(messages.find((message) => message.role === "user")?.content ?? "");
  const latestMessage = messages.at(-1)?.content ?? null;

  return {
    id: session.session_id,
    title,
    preview: latestMessage ? buildPreview(latestMessage) : null,
    createdAt: session.created_at,
    updatedAt: session.updated_at ?? session.created_at,
    endedAt: session.ended_at,
    isActive: !session.ended_at,
    isClosed: Boolean(session.ended_at),
    messageCount: messages.filter((message) => message.role === "user").length,
  };
}

function buildSessionDetail(
  session: AiSessionRow,
  messages: JournalMessageView[],
): JournalSessionDetailView {
  const latestSummary = parseJournalSessionSummary(decryptFromColumns(session, "summary_text"));
  const summaryGenerationStatus = resolveSummaryGenerationStatus(session, latestSummary);

  return {
    sessionId: session.session_id,
    title: decryptFromColumns(session, "session_title"),
    messages,
    patientMessageCount: messages.filter((message) => message.role === "user").length,
    latestSummary,
    summaryGenerationStatus,
    endedAt: session.ended_at,
    isClosed: Boolean(session.ended_at),
  };
}

function resolveSummaryGenerationStatus(
  session: Pick<AiSessionRow, "ended_at" | "summary_generation_status" | "summary_generated_at">,
  summary: JournalSessionSummaryView | null,
): SummaryGenerationStatus {
  if (summary || session.summary_generated_at) return "completed";
  if (session.ended_at && session.summary_generation_status === "pending") return "generating";
  return session.summary_generation_status;
}

function buildPreview(value: string) {
  const preview = value.replace(/\s+/g, " ").trim();
  if (preview.length <= 96) return preview;
  return `${preview.slice(0, 93).trim()}...`;
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

async function saveEncryptedPatientProfile(
  patientId: string,
  patch: PatientProfilePatch,
  patientUpdate: PatientUpdate = {},
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patients")
    .select("profiling_data_ciphertext,profiling_data_iv,profiling_data_tag,key_version")
    .eq("patient_id", patientId)
    .single();

  if (error) throw error;

  const current = parsePatientProfile(decryptPatientProfile(data));
  const env = requireEnv(["core"]);
  const encrypted = encryptString(JSON.stringify({ ...current, ...patch }), env.data.ENCRYPTION_MASTER_KEY);
  const update = await admin
    .from("patients")
    .update({
      ...patientUpdate,
      profiling_data_ciphertext: encrypted.ciphertext,
      profiling_data_iv: encrypted.iv,
      profiling_data_tag: encrypted.tag,
      key_version: encrypted.keyVersion,
    })
    .eq("patient_id", patientId);

  if (update.error) throw update.error;
}

function parsePatientProfile(value: string | null) {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
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
