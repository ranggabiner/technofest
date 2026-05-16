"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowUp,
  BrainCircuit,
  ChevronLeft,
  FileText,
  Grid2X2,
  HeartPulse,
  History,
  Loader2,
  Paperclip,
  Plus,
  Search,
  Square,
  Stethoscope,
  X,
} from "lucide-react";

import { AssistantBubbleSkeleton } from "@/components/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  JournalMessageAttachmentView,
  JournalMessageView,
  JournalSessionDetailView,
  JournalSessionHistoryItem,
  JournalSessionSummaryView,
  SummaryGenerationStatus,
} from "@/lib/ai/journal-service";
import {
  CHAT_ATTACHMENT_ACCEPT,
  patientChatAttachmentErrorMessage,
  validatePatientChatAttachmentList,
  type PatientChatAttachmentErrorMessages,
} from "@/lib/ai/patient-chat-attachment-rules";
import { formatFileSize, getFileTypeLabel } from "@/lib/kyc/preview";
import { cn } from "@/lib/utils";
import { finishAiSessionAction, retryAiSessionSummaryAction } from "../actions";
import { AssistantMarkdown } from "./assistant-markdown";

type ChatMessage = JournalMessageView | {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachment: JournalMessageAttachmentView | null;
};

type SelectedAttachment = {
  file: File;
  name: string;
  type: string;
  size: number;
};

type ChatCopy = {
  aiAvatar: string;
  backToDashboardTitle: string;
  backNavigationTitle: string;
  backNavigationMenuLabel: string;
  newChat: string;
  newChatTitle: string;
  searchChat: string;
  searchChatTitle: string;
  chatHistoryLabel: string;
  searchPlaceholder: string;
  noChatHistory: string;
  noSearchResults: string;
  historyLoadFailed: string;
  sessionLoadFailed: string;
  newChatConfirmTitle: string;
  newChatConfirmDescription: string;
  newChatCancel: string;
  newChatConfirm: string;
  newChatFailed: string;
  closedSessionNotice: string;
  closedSessionPlaceholder: string;
  closedSessionReadonlyTitle: string;
  closedSessionReadonlyDescription: string;
  heroPrompt: string;
  emotionalGuidanceTitle: string;
  emotionalGuidanceDescription: string;
  bodyGuidanceTitle: string;
  bodyGuidanceDescription: string;
  attachTitle: string;
  attachmentDropTitle: string;
  attachmentDropDescription: string;
  attachmentSelectedTitle: string;
  attachmentRemove: string;
  attachmentProcessing: string;
  attachmentReady: string;
  attachmentOnlyMessage: string;
  attachmentFallbackName: string;
  attachmentErrors: PatientChatAttachmentErrorMessages;
  bottomDisclosure: string;
  clientTitle: string;
  finishTitle: string;
  finish: string;
  emptyChat: string;
  writing: string;
  messageLabel: string;
  messagePlaceholder: string;
  disclosure: string;
  sendTitle: string;
  send: string;
  aiContactFailed: string;
  latestSummaryTitle: string;
  generalSummaryTitle: string;
  mentalSummaryTitle: string;
  physicalSummaryTitle: string;
  summaryGenerating: string;
  summaryGeneratingDescription: string;
  summaryFailedTitle: string;
  summaryFailedDescription: string;
  retrySummary: string;
  summaryRetryFailed: string;
  generalSummaryFallback: string;
  mentalSummaryFallback: string;
  physicalSummaryFallback: string;
};

type ChatNavigationCopy = {
  dashboard: string;
  access: string;
  history: string;
};

function hasFileDrag(event: DragEvent | React.DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function selectedAttachmentFromFile(file: File): SelectedAttachment {
  return {
    file,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

function formatAttachmentOnlyMessage(template: string, fileName: string, fallbackName: string) {
  return template.replace("{name}", fileName.trim() || fallbackName);
}

export function AiJournalClient({
  initialSessionId,
  initialHistory,
  initialMessages,
  initialSessionClosed,
  latestSummary,
  initialSummaryGenerationStatus,
  copy,
  navigationCopy,
}: {
  initialSessionId: string | null;
  initialHistory: JournalSessionHistoryItem[];
  initialMessages: JournalMessageView[];
  initialSessionClosed: boolean;
  latestSummary: JournalSessionSummaryView | null;
  initialSummaryGenerationStatus: SummaryGenerationStatus;
  copy: ChatCopy;
  navigationCopy: ChatNavigationCopy;
}) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [history, setHistory] = useState<JournalSessionHistoryItem[]>(initialHistory);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [confirmNewChatOpen, setConfirmNewChatOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<SelectedAttachment | null>(null);
  const [isAttachmentDragOver, setIsAttachmentDragOver] = useState(false);
  const [isAttachmentProcessing, setIsAttachmentProcessing] = useState(false);
  const [selectedSessionIsClosed, setSelectedSessionIsClosed] = useState(initialSessionClosed);
  const [sessionSummary, setSessionSummary] = useState(latestSummary);
  const [summaryStatus, setSummaryStatus] = useState<SummaryGenerationStatus>(initialSummaryGenerationStatus);
  const [isFinishing, startFinishTransition] = useTransition();
  const [isRetryingSummary, startSummaryRetryTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasMessages = messages.length > 0;
  const showFinishAction = hasMessages && !selectedSessionIsClosed && !isSessionLoading;
  const attachmentDisabled = selectedSessionIsClosed || isStreaming || isSessionLoading || isAttachmentProcessing;

  const canSend = useMemo(
    () =>
      (input.trim().length > 0 || Boolean(selectedAttachment)) &&
      !isStreaming &&
      !selectedSessionIsClosed &&
      !isAttachmentProcessing,
    [input, isAttachmentProcessing, isStreaming, selectedAttachment, selectedSessionIsClosed],
  );

  const loadHistory = useCallback(async (nextQuery: string) => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch("/api/patient/ai/sessions?query=" + encodeURIComponent(nextQuery), {
        cache: "no-store",
      });
      const body = await response.json().catch(() => null) as
        | { sessions?: JournalSessionHistoryItem[]; error?: string }
        | null;
      if (!response.ok) throw new Error(body?.error ?? copy.historyLoadFailed);
      setHistory(body?.sessions ?? []);
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : copy.historyLoadFailed);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [copy.historyLoadFailed]);

  const openSearchOverlay = useCallback(() => {
    setSearchQuery("");
    setIsSearchOpen(true);
    void loadHistory("");
  }, [loadHistory]);

  const closeSearchOverlay = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    void loadHistory("");
  }, [loadHistory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory(searchQuery);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadHistory, searchQuery]);

  useEffect(() => {
    if (!isSearchOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearchOverlay();
    }

    document.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSearchOverlay, isSearchOpen]);

  useEffect(() => {
    function preventBrowserFileOpen(event: DragEvent) {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
    }

    window.addEventListener("dragover", preventBrowserFileOpen);
    window.addEventListener("drop", preventBrowserFileOpen);

    return () => {
      window.removeEventListener("dragover", preventBrowserFileOpen);
      window.removeEventListener("drop", preventBrowserFileOpen);
    };
  }, []);

  const handleAttachmentFiles = useCallback((files: FileList | File[]) => {
    if (selectedSessionIsClosed) return;

    const validation = validatePatientChatAttachmentList(files);
    if (!validation.ok) {
      setError(patientChatAttachmentErrorMessage(validation.reason, copy.attachmentErrors));
      setSelectedAttachment(null);
      return;
    }

    setError(null);
    setSelectedAttachment(selectedAttachmentFromFile(validation.file));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [copy.attachmentErrors, selectedSessionIsClosed]);

  function openAttachmentPicker() {
    if (attachmentDisabled) return;
    attachmentInputRef.current?.click();
  }

  function removeSelectedAttachment() {
    if (isAttachmentProcessing) return;
    setSelectedAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  }

  function handleConversationDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFileDrag(event)) return;
    event.preventDefault();
    if (attachmentDisabled) return;
    dragDepthRef.current += 1;
    setIsAttachmentDragOver(true);
  }

  function handleConversationDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFileDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = attachmentDisabled ? "none" : "copy";
  }

  function handleConversationDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsAttachmentDragOver(false);
  }

  function handleConversationDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsAttachmentDragOver(false);
    if (attachmentDisabled) return;
    handleAttachmentFiles(event.dataTransfer.files);
  }

  async function sendMessage() {
    const text = input.trim();
    const attachment = selectedAttachment;
    if ((!text && !attachment) || isStreaming || selectedSessionIsClosed || isAttachmentProcessing) return;

    setError(null);
    if (attachment) setIsAttachmentProcessing(true);
    setIsStreaming(true);
    setSessionSummary(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: text || formatAttachmentOnlyMessage(
        copy.attachmentOnlyMessage,
        attachment?.name ?? "",
        copy.attachmentFallbackName,
      ),
      createdAt: new Date().toISOString(),
      attachment: attachment
        ? {
          id: `local-attachment-${Date.now()}`,
          fileName: attachment.name,
          fileType: attachment.type,
          fileSizeBytes: attachment.size,
        }
        : null,
    };
    const assistantMessage: ChatMessage = {
      id: `local-ai-${Date.now()}`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      attachment: null,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);

    try {
      const body = attachment ? new FormData() : JSON.stringify({ message: text, sessionId });
      const headers = attachment ? undefined : { "Content-Type": "application/json" };

      if (attachment && body instanceof FormData) {
        body.set("message", text);
        if (sessionId) body.set("sessionId", sessionId);
        body.set("attachment", attachment.file);
      }

      const response = await fetch("/api/patient/ai/chat", {
        method: "POST",
        headers,
        body,
      });

      const responseSessionId = response.headers.get("X-MedProof-Session-Id");
      if (responseSessionId) setSessionId(responseSessionId);

      if (!response.ok || !response.body) {
        const message = await response.text();
        throw new Error(message || copy.aiContactFailed);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: message.content + chunk }
              : message,
          ),
        );
      }
      setSelectedAttachment(null);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    } catch (err) {
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      setError(err instanceof Error ? err.message : copy.aiContactFailed);
    } finally {
      setIsStreaming(false);
      setIsAttachmentProcessing(false);
      void loadHistory(searchQuery);
    }
  }

  const loadSelectedSession = useCallback(async (nextSessionId: string, options: { silent?: boolean } = {}) => {
    if (nextSessionId === sessionId && !selectedSessionIsClosed) return;

    if (!options.silent) setError(null);
    if (!options.silent) setIsSessionLoading(true);

    try {
      const response = await fetch(`/api/patient/ai/sessions/${nextSessionId}`, {
        cache: "no-store",
      });
      const body = await response.json().catch(() => null) as
        | (JournalSessionDetailView & { error?: string })
        | null;
      if (!response.ok || !body) throw new Error(body?.error ?? copy.sessionLoadFailed);
      applySessionDetail(body);
    } catch (sessionError) {
      if (!options.silent) {
        setError(sessionError instanceof Error ? sessionError.message : copy.sessionLoadFailed);
      }
    } finally {
      if (!options.silent) setIsSessionLoading(false);
    }
  }, [copy.sessionLoadFailed, selectedSessionIsClosed, sessionId]);

  useEffect(() => {
    if (!sessionId || !selectedSessionIsClosed || summaryStatus !== "generating") return;

    const timer = window.setInterval(() => {
      void loadSelectedSession(sessionId, { silent: true });
    }, 3500);

    return () => window.clearInterval(timer);
  }, [loadSelectedSession, selectedSessionIsClosed, sessionId, summaryStatus]);

  async function createNewChat() {
    setConfirmNewChatOpen(false);
    setError(null);
    setIsCreatingNewChat(true);

    try {
      const response = await fetch("/api/patient/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new" }),
      });
      const body = await response.json().catch(() => null) as
        | (JournalSessionDetailView & { error?: string })
        | null;
      if (!response.ok || !body) throw new Error(body?.error ?? copy.newChatFailed);
      applySessionDetail(body);
      setInput("");
      setSelectedAttachment(null);
      void loadHistory(searchQuery);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (newChatError) {
      setError(newChatError instanceof Error ? newChatError.message : copy.newChatFailed);
    } finally {
      setIsCreatingNewChat(false);
    }
  }

  function requestNewChat() {
    if (isStreaming || isCreatingNewChat) return;
    if (hasMessages && !selectedSessionIsClosed) {
      setConfirmNewChatOpen(true);
      return;
    }

    void createNewChat();
  }

  function applySessionDetail(detail: JournalSessionDetailView) {
    setSessionId(detail.sessionId);
    setMessages(detail.messages);
    setSelectedSessionIsClosed(detail.isClosed);
    setSessionSummary(detail.latestSummary);
    setSummaryStatus(detail.summaryGenerationStatus);
    setSelectedAttachment(null);
    setIsAttachmentDragOver(false);
    dragDepthRef.current = 0;
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  }

  function retrySummaryGeneration() {
    if (!sessionId || isRetryingSummary) return;

    startSummaryRetryTransition(async () => {
      setError(null);
      try {
        const detail = await retryAiSessionSummaryAction(sessionId);
        applySessionDetail(detail);
        void loadHistory(searchQuery);
      } catch {
        setError(copy.summaryRetryFailed);
      }
    });
  }

  const historyEmptyMessage = searchQuery.trim() ? copy.noSearchResults : copy.noChatHistory;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[var(--color-warm-canvas)] lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1">
      <aside
        data-chat-sidebar="actions"
        className="flex min-h-0 shrink-0 flex-col gap-6 overflow-hidden max-h-[min(420px,48vh)] border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-stone-surface)_55%,var(--color-warm-canvas))] p-4 lg:h-full lg:max-h-none lg:border-b-0 lg:border-r lg:p-6"
      >
        <div data-chat-header="navigation-group" className="flex items-center gap-3">
          <BackNavigationMenu copy={copy} navigationCopy={navigationCopy} />
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] text-sm font-bold text-[var(--color-midnight)]">
            {copy.aiAvatar}
          </div>
        </div>

        <div className="grid gap-1">
          <ActionRailButton
            icon={<Plus size={18} />}
            label={copy.newChat}
            title={copy.newChatTitle}
            disabled={isStreaming || isCreatingNewChat}
            onClick={requestNewChat}
          />
          <ActionRailButton
            icon={<Search size={18} />}
            label={copy.searchChat}
            title={copy.searchChatTitle}
            onClick={openSearchOverlay}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <RailHeading>{copy.chatHistoryLabel}</RailHeading>
          <div data-chat-history="items" className="min-h-0 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {isHistoryLoading ? (
              <HistorySkeleton />
            ) : history.length === 0 ? (
              <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] px-3 py-3 text-xs leading-5 text-[var(--color-ash)]">
                {historyEmptyMessage}
              </p>
            ) : (
              <div className="grid gap-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={item.id === sessionId ? "true" : undefined}
                    onClick={() => void loadSelectedSession(item.id)}
                    className={cn(
                      "grid min-h-12 cursor-pointer gap-0.5 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] disabled:cursor-wait disabled:opacity-70",
                      item.id === sessionId
                        ? "bg-[var(--color-card)] text-[var(--color-midnight)] shadow-[var(--shadow-subtle)]"
                        : "text-[var(--color-graphite)]",
                    )}
                    disabled={isSessionLoading}
                  >
                    <span className="truncate font-semibold">{item.title ?? copy.clientTitle}</span>
                    <span className="truncate text-[11px] text-[var(--color-ash)]">
                      {item.preview ?? copy.emptyChat}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <section
        data-chat-canvas="conversation"
        className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-warm-canvas)]"
      >
        {showFinishAction ? (
          <div data-chat-actions="main-session" className="shrink-0 px-5 pt-5 md:px-10 md:pt-8">
            <div className="flex w-full justify-start">
              <button
                type="button"
                disabled={isStreaming || isFinishing}
                title={copy.finishTitle}
                onClick={() => {
                  startFinishTransition(async () => {
                    await finishAiSessionAction();
                  });
                }}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--color-error-red)] bg-[var(--color-card)] px-4 text-sm font-medium text-[var(--color-error-red)] shadow-[var(--shadow-subtle)] transition hover:bg-[var(--color-error-surface)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Square size={18} aria-hidden="true" />
                <span>{copy.finish}</span>
              </button>
            </div>
          </div>
        ) : null}

        <div
          data-chat-dropzone="conversation"
          onDragEnter={handleConversationDragEnter}
          onDragOver={handleConversationDragOver}
          onDragLeave={handleConversationDragLeave}
          onDrop={handleConversationDrop}
          className={cn(
            "relative min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-10",
            hasMessages ? "custom-scrollbar" : "grid place-items-center",
          )}
        >
          {isAttachmentDragOver ? <AttachmentDropOverlay copy={copy} /> : null}
          {isSessionLoading ? (
            <div className="mx-auto grid w-full max-w-[760px] gap-3 pb-3">
              <AssistantBubbleSkeleton />
              <Skeleton className="ml-auto h-14 w-[62%] rounded-[22px]" />
              <AssistantBubbleSkeleton />
            </div>
          ) : !hasMessages ? (
            <div className="mx-auto grid w-full max-w-[760px] gap-12 text-center md:gap-14">
              <div className="grid gap-3">
                <h2 className="font-serif text-[32px] font-medium leading-[1.15] text-[var(--color-charcoal-primary)] md:text-[44px]">
                  {copy.heroPrompt}
                </h2>
              </div>
              <div
                data-chat-empty-guidance="cards"
                className="grid gap-5 md:grid-cols-2 md:gap-6"
              >
                <EmptyGuidanceCard
                  kind="emotional"
                  icon={<BrainCircuit size={24} aria-hidden="true" />}
                  title={copy.emotionalGuidanceTitle}
                  description={copy.emotionalGuidanceDescription}
                />
                <EmptyGuidanceCard
                  kind="body"
                  icon={<HeartPulse size={24} aria-hidden="true" />}
                  title={copy.bodyGuidanceTitle}
                  description={copy.bodyGuidanceDescription}
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-[760px] gap-3 pb-3">
              {messages.map((message) => {
                const isPendingAssistant = message.role === "assistant" && !message.content && isStreaming;

                if (isPendingAssistant) {
                  return <AssistantBubbleSkeleton key={message.id} />;
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[82%] px-4 py-3 text-sm leading-6",
                      message.role === "user" && "whitespace-pre-wrap break-words",
                      message.role === "user"
                        ? "ml-auto rounded-[22px] rounded-br-lg bg-[var(--color-midnight)] text-[var(--color-inverted)]"
                        : "mr-auto rounded-[22px] rounded-bl-lg border border-[var(--color-stone-surface)] bg-[var(--color-card)] text-[var(--color-charcoal-primary)] shadow-[var(--shadow-subtle)]",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <AssistantMarkdown content={message.content || copy.writing} />
                    ) : message.attachment ? (
                      <div className="grid gap-3">
                        {message.content ? <span>{message.content}</span> : null}
                        <SentAttachmentChip
                          attachment={message.attachment}
                          fallbackName={copy.attachmentFallbackName}
                        />
                      </div>
                    ) : (
                      message.content || copy.writing
                    )}
                  </div>
                );
              })}
              {selectedSessionIsClosed ? (
                <SessionSummaryPanel
                  summary={sessionSummary}
                  summaryStatus={summaryStatus}
                  isRetryingSummary={isRetryingSummary}
                  onRetrySummary={retrySummaryGeneration}
                  copy={copy}
                />
              ) : null}
            </div>
          )}
        </div>

        {error ? (
          <p className="mx-5 mb-3 rounded-xl border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-4 py-3 text-sm text-[var(--color-error-red)] md:mx-10">
            {error}
          </p>
        ) : null}

        {selectedSessionIsClosed ? (
          <ReadonlyClosedSessionComposer copy={copy} />
        ) : (
          <form
            data-chat-composer="bottom-input"
            className="shrink-0 bg-[var(--color-warm-canvas)] px-2.5 pb-5 md:px-5 md:pb-8"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <label htmlFor="ai-message" className="sr-only">
              {copy.messageLabel}
            </label>
            <div className="mx-auto w-full max-w-[800px]">
              <input
                ref={attachmentInputRef}
                type="file"
                accept={CHAT_ATTACHMENT_ACCEPT}
                className="sr-only"
                disabled={attachmentDisabled}
                onChange={(event) => {
                  handleAttachmentFiles(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                }}
              />
              {selectedAttachment ? (
                <AttachmentPreview
                  attachment={selectedAttachment}
                  isProcessing={isAttachmentProcessing}
                  copy={copy}
                  onRemove={removeSelectedAttachment}
                />
              ) : null}
              <div className="flex items-center gap-1 rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-subtle)] transition focus-within:border-[var(--color-midnight)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-midnight)_5%,transparent)]">
                <button
                  type="button"
                  title={copy.attachTitle}
                  aria-label={copy.attachTitle}
                  onClick={openAttachmentPicker}
                  disabled={attachmentDisabled}
                  className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-graphite)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Paperclip size={20} aria-hidden="true" />
                </button>
                <input
                  ref={inputRef}
                  id="ai-message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  maxLength={2000}
                  disabled={isStreaming || isAttachmentProcessing}
                  className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--color-charcoal-primary)] outline-none placeholder:text-[var(--color-ash)] disabled:text-[var(--color-ash)]"
                  placeholder={copy.messagePlaceholder}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  title={copy.sendTitle}
                  aria-label={copy.sendTitle}
                  className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--color-midnight)] text-[var(--color-inverted)] shadow-[var(--shadow-subtle)] transition hover:bg-[var(--color-charcoal-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUp size={20} aria-hidden="true" />
                </button>
              </div>
              <p className="mx-auto mt-4 max-w-[640px] text-center text-[11px] leading-5 text-[var(--color-ash)]">
                {copy.bottomDisclosure}
              </p>
            </div>
          </form>
        )}
      </section>

      {confirmNewChatOpen ? (
        <ConfirmNewChatDialog
          copy={copy}
          isCreating={isCreatingNewChat}
          onCancel={() => setConfirmNewChatOpen(false)}
          onConfirm={() => void createNewChat()}
        />
      ) : null}

      {isSearchOpen ? (
        <div
          data-chat-search-overlay="global"
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-8 backdrop-blur-[2px]"
          onClick={closeSearchOverlay}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-search-overlay-title"
            data-chat-search-panel="global"
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-14 items-center gap-3 border-b border-[var(--color-stone-surface)] px-4">
              <Search size={18} aria-hidden="true" className="shrink-0 text-[var(--color-ash)]" />
              <label id="chat-search-overlay-title" htmlFor="chat-search-overlay-input" className="sr-only">
                {copy.searchChat}
              </label>
              <input
                ref={searchInputRef}
                id="chat-search-overlay-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-[var(--color-charcoal-primary)] outline-none placeholder:text-[var(--color-ash)]"
                placeholder={copy.searchPlaceholder}
              />
            </div>
            <div className="max-h-[min(420px,55vh)] overflow-y-auto p-3">
              {isHistoryLoading ? (
                <HistorySkeleton />
              ) : history.length === 0 ? (
                <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] px-3 py-3 text-sm leading-6 text-[var(--color-ash)]">
                  {historyEmptyMessage}
                </p>
              ) : (
                <div className="grid gap-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={item.id === sessionId ? "true" : undefined}
                      onClick={async () => {
                        await loadSelectedSession(item.id);
                        closeSearchOverlay();
                      }}
                      className={cn(
                        "grid min-h-14 cursor-pointer gap-1 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)] disabled:cursor-wait disabled:opacity-70",
                        item.id === sessionId
                          ? "bg-[var(--color-stone-surface)] text-[var(--color-midnight)]"
                          : "text-[var(--color-graphite)]",
                      )}
                      disabled={isSessionLoading}
                    >
                      <span className="truncate font-semibold">{item.title ?? copy.clientTitle}</span>
                      <span className="truncate text-xs text-[var(--color-ash)]">
                        {item.preview ?? copy.emptyChat}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyGuidanceCard({
  kind,
  icon,
  title,
  description,
}: {
  kind: "emotional" | "body";
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article
      data-chat-empty-guidance-card={kind}
      className="grid min-h-[190px] content-center justify-items-center gap-4 rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-7 py-8 shadow-[var(--shadow-subtle)]"
    >
      <div className="grid size-16 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-stone-surface)_78%,var(--color-card))] text-[var(--color-midnight)]">
        {icon}
      </div>
      <div className="grid gap-3">
        <h3 className="text-xl font-bold leading-tight text-[var(--color-midnight)]">
          {title}
        </h3>
        <p className="mx-auto max-w-[260px] text-sm leading-6 text-[var(--color-graphite)]">
          {description}
        </p>
      </div>
    </article>
  );
}

function AttachmentDropOverlay({
  copy,
}: {
  copy: Pick<ChatCopy, "attachmentDropTitle" | "attachmentDropDescription">;
}) {
  return (
    <div
      data-chat-drop-overlay="attachment"
      className="pointer-events-none absolute inset-4 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-[var(--color-teal-primary)] bg-[color-mix(in_srgb,var(--color-card)_88%,var(--color-teal-surface))] text-center shadow-[var(--shadow-elevated)]"
    >
      <div className="grid max-w-xs justify-items-center gap-3 px-5">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--color-teal-primary)] text-[var(--color-inverted)]">
          <Paperclip size={22} aria-hidden="true" />
        </span>
        <span className="grid gap-1">
          <span className="text-base font-semibold text-[var(--color-midnight)]">
            {copy.attachmentDropTitle}
          </span>
          <span className="text-sm leading-6 text-[var(--color-graphite)]">
            {copy.attachmentDropDescription}
          </span>
        </span>
      </div>
    </div>
  );
}

function AttachmentPreview({
  attachment,
  isProcessing,
  copy,
  onRemove,
}: {
  attachment: SelectedAttachment;
  isProcessing: boolean;
  copy: Pick<
    ChatCopy,
    "attachmentSelectedTitle" | "attachmentProcessing" | "attachmentReady" | "attachmentRemove"
  >;
  onRemove: () => void;
}) {
  return (
    <div
      data-chat-attachment-preview="selected"
      className="mb-2 flex items-center gap-3 rounded-2xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-4 py-3 text-left shadow-[var(--shadow-subtle)]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)]">
        {isProcessing ? (
          <Loader2 size={18} aria-hidden="true" className="animate-spin" />
        ) : (
          <FileText size={18} aria-hidden="true" />
        )}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--color-ash)]">
          {copy.attachmentSelectedTitle}
        </span>
        <span className="truncate text-sm font-semibold text-[var(--color-midnight)]">
          {attachment.name}
        </span>
        <span className="text-xs leading-5 text-[var(--color-graphite)]">
          {getFileTypeLabel(attachment.type, attachment.name)} · {formatFileSize(attachment.size)}
        </span>
        <span className="text-xs leading-5 text-[var(--color-ash)]">
          {isProcessing ? copy.attachmentProcessing : copy.attachmentReady}
        </span>
      </span>
      <button
        type="button"
        data-chat-attachment-remove="selected"
        title={copy.attachmentRemove}
        aria-label={copy.attachmentRemove}
        onClick={onRemove}
        disabled={isProcessing}
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-graphite)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function SentAttachmentChip({
  attachment,
  fallbackName,
}: {
  attachment: JournalMessageAttachmentView;
  fallbackName: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs leading-5 text-[var(--color-inverted)]">
      <FileText size={16} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {attachment.fileName ?? fallbackName}
      </span>
      <span className="shrink-0 opacity-80">
        {getFileTypeLabel(attachment.fileType, attachment.fileName)}
        {" · "}
        {formatFileSize(attachment.fileSizeBytes)}
      </span>
    </div>
  );
}

function SessionSummaryPanel({
  summary,
  summaryStatus,
  isRetryingSummary,
  onRetrySummary,
  copy,
}: {
  summary: JournalSessionSummaryView | null;
  summaryStatus: SummaryGenerationStatus;
  isRetryingSummary: boolean;
  onRetrySummary: () => void;
  copy: Pick<
    ChatCopy,
    | "latestSummaryTitle"
    | "generalSummaryTitle"
    | "mentalSummaryTitle"
    | "physicalSummaryTitle"
    | "summaryGenerating"
    | "summaryGeneratingDescription"
    | "summaryFailedTitle"
    | "summaryFailedDescription"
    | "retrySummary"
    | "generalSummaryFallback"
    | "mentalSummaryFallback"
    | "physicalSummaryFallback"
  >;
}) {
  if (summaryStatus === "generating" || (summaryStatus === "pending" && !summary)) {
    return (
      <div data-chat-summary="completed-session" className="mt-5 grid gap-5">
        <div
          data-chat-summary-divider="completed-session"
          className="h-px w-full bg-[var(--color-stone-surface)]"
        />
        <div
          data-chat-summary-status="generating"
          className="grid gap-3 rounded-xl border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-card)_76%,transparent)] p-5 text-sm leading-6 text-[var(--color-charcoal-primary)] shadow-[var(--shadow-subtle)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ash)]">
            {copy.latestSummaryTitle}
          </p>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-[72%] rounded-full" />
          </div>
          <div className="grid gap-1 rounded-[10px] bg-[color-mix(in_srgb,var(--color-card)_72%,transparent)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-midnight)]">
              {copy.summaryGenerating}
            </h3>
            <p className="text-sm leading-6 text-[var(--color-graphite)]">
              {copy.summaryGeneratingDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (summaryStatus === "failed") {
    return (
      <div data-chat-summary="completed-session" className="mt-5 grid gap-5">
        <div
          data-chat-summary-divider="completed-session"
          className="h-px w-full bg-[var(--color-stone-surface)]"
        />
        <div
          data-chat-summary-status="failed"
          className="grid gap-3 rounded-xl border border-[var(--color-error-red)] bg-[var(--color-error-surface)] p-5 text-sm leading-6 text-[var(--color-error-red)] shadow-[var(--shadow-subtle)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            {copy.latestSummaryTitle}
          </p>
          <div className="grid gap-1">
            <h3 className="text-sm font-semibold">
              {copy.summaryFailedTitle}
            </h3>
            <p className="text-sm leading-6">
              {copy.summaryFailedDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetrySummary}
            disabled={isRetryingSummary}
            className="mt-1 inline-flex min-h-9 w-fit cursor-pointer items-center rounded-full border border-[var(--color-error-red)] bg-[var(--color-card)] px-3 text-sm font-medium text-[var(--color-error-red)] transition hover:bg-[var(--color-error-surface)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copy.retrySummary}
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: copy.generalSummaryTitle,
      body: summary?.general ?? copy.generalSummaryFallback,
    },
    {
      title: copy.mentalSummaryTitle,
      body: summary?.mental ?? copy.mentalSummaryFallback,
    },
    {
      title: copy.physicalSummaryTitle,
      body: summary?.physical ?? copy.physicalSummaryFallback,
    },
  ];

  return (
    <div data-chat-summary="completed-session" className="mt-5 grid gap-5">
      <div
        data-chat-summary-divider="completed-session"
        className="h-px w-full bg-[var(--color-stone-surface)]"
      />
      <div className="grid gap-4 rounded-xl border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-card)_76%,transparent)] p-5 text-sm leading-6 text-[var(--color-charcoal-primary)] shadow-[var(--shadow-subtle)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ash)]">
          {copy.latestSummaryTitle}
        </p>
        {sections.map((section) => (
          <section
            key={section.title}
            className="grid gap-1 rounded-[10px] bg-[color-mix(in_srgb,var(--color-card)_72%,transparent)] p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--color-midnight)]">
              {section.title}
            </h3>
            <p className="text-sm leading-6 text-[var(--color-graphite)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

function ReadonlyClosedSessionComposer({
  copy,
}: {
  copy: Pick<
    ChatCopy,
    "closedSessionReadonlyTitle" | "closedSessionReadonlyDescription" | "bottomDisclosure"
  >;
}) {
  return (
    <div
      data-chat-composer="readonly-bottom"
      className="shrink-0 bg-[var(--color-warm-canvas)] px-2.5 pb-5 md:px-5 md:pb-8"
    >
      <div className="mx-auto w-full max-w-[800px]">
        <div className="flex cursor-not-allowed items-center gap-3 rounded-[28px] border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-card)_78%,var(--color-stone-surface))] p-3 text-[var(--color-ash)] shadow-[var(--shadow-subtle)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-graphite)]">
            <Square size={18} aria-hidden="true" />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm font-semibold text-[var(--color-graphite)]">
              {copy.closedSessionReadonlyTitle}
            </span>
            <span className="text-xs leading-5 text-[var(--color-ash)]">
              {copy.closedSessionReadonlyDescription}
            </span>
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-[640px] text-center text-[11px] leading-5 text-[var(--color-ash)]">
          {copy.bottomDisclosure}
        </p>
      </div>
    </div>
  );
}

function BackNavigationMenu({
  copy,
  navigationCopy,
}: {
  copy: Pick<ChatCopy, "backNavigationTitle" | "backNavigationMenuLabel">;
  navigationCopy: ChatNavigationCopy;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title={copy.backNavigationTitle}
        aria-label={copy.backNavigationTitle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-[var(--color-graphite)] transition hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-teal-primary)]",
          isOpen && "bg-[var(--color-card)] text-[var(--color-midnight)] shadow-[var(--shadow-subtle)]",
        )}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            data-chat-backdrop="patient-navigation"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          />
          <div
            role="menu"
            aria-label={copy.backNavigationMenuLabel}
            data-chat-back-menu="patient-navigation"
            className="absolute left-0 top-11 z-40 w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-elevated)]"
          >
            <BackNavigationMenuItem
              href="/patient"
              icon={<Grid2X2 size={18} aria-hidden="true" />}
              label={navigationCopy.dashboard}
              onSelect={() => setIsOpen(false)}
            />
            <BackNavigationMenuItem
              href="/patient/access"
              icon={<Stethoscope size={18} aria-hidden="true" />}
              label={navigationCopy.access}
              onSelect={() => setIsOpen(false)}
            />
            <BackNavigationMenuItem
              href="/patient/access-history"
              icon={<History size={18} aria-hidden="true" />}
              label={navigationCopy.history}
              onSelect={() => setIsOpen(false)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function BackNavigationMenuItem({
  href,
  icon,
  label,
  onSelect,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-[var(--color-graphite)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)] focus-visible:bg-[var(--color-stone-surface)] focus-visible:text-[var(--color-midnight)] focus-visible:outline-none active:scale-[0.99]"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function RailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-2 text-[11px] font-semibold uppercase leading-5 tracking-[0.12em] text-[var(--color-ash)]">
      {children}
    </h3>
  );
}

function ActionRailButton({
  icon,
  label,
  title,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--color-graphite)] transition hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function HistorySkeleton() {
  return (
    <div className="grid gap-2" aria-hidden="true">
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}

function ConfirmNewChatDialog({
  copy,
  isCreating,
  onCancel,
  onConfirm,
}: {
  copy: Pick<
    ChatCopy,
    "newChatConfirmTitle" | "newChatConfirmDescription" | "newChatCancel" | "newChatConfirm"
  >;
  isCreating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-confirm-title"
        className="w-full max-w-md rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-elevated)]"
      >
        <h2
          id="new-chat-confirm-title"
          className="text-lg font-semibold text-[var(--color-midnight)]"
        >
          {copy.newChatConfirmTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">
          {copy.newChatConfirmDescription}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCreating}
            className="min-h-10 cursor-pointer rounded-full border border-[var(--color-stone-surface)] px-4 text-sm font-medium text-[var(--color-graphite)] transition hover:bg-[var(--color-stone-surface)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copy.newChatCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCreating}
            className="min-h-10 cursor-pointer rounded-full bg-[var(--color-midnight)] px-4 text-sm font-medium text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copy.newChatConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
