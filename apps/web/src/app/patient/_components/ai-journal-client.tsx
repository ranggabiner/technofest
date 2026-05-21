"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowUp,
  BrainCircuit,
  ChevronLeft,
  ClipboardList,
  Grid2X2,
  HeartPulse,
  Plus,
  Search,
  Square,
  Stethoscope,
} from "lucide-react";

import { AssistantBubbleSkeleton } from "@/components/loading-skeletons";
import { AppToast } from "@/components/ui/app-toast";
import { LoadingActionButton } from "@/components/ui/async-action-button";
import { motion } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import type {
  JournalMessageView,
  JournalSessionDetailView,
  JournalSessionHistoryItem,
  JournalSessionSummaryView,
  SummaryGenerationStatus,
} from "@/lib/ai/journal-service";
import { cn } from "@/lib/utils";
import { finishAiSessionAction, retryAiSessionSummaryAction } from "../actions";

const AssistantMarkdown = dynamic(
  () => import("@/components/assistant-markdown").then((module) => module.AssistantMarkdown),
  {
    ssr: false,
    loading: () => <AssistantMarkdownFallback />,
  },
);

type ChatMessage = JournalMessageView | {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ChatCopy = {
  aiAvatar: string;
  backToDashboardTitle: string;
  backNavigationTitle: string;
  backNavigationMenuLabel: string;
  finalizeFailed: string;
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
  sendDisabledTitle: string;
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
  healthHistory: string;
};

type ChatSuccessToastCopy = {
  aiSessionCreated: string;
  aiSessionFinished: string;
  summaryRetryStarted: string;
};

export function AiJournalClient({
  initialSessionId,
  initialHistory,
  initialMessages,
  initialSessionClosed,
  latestSummary,
  initialSummaryGenerationStatus,
  copy,
  navigationCopy,
  successToast,
}: {
  initialSessionId: string | null;
  initialHistory: JournalSessionHistoryItem[];
  initialMessages: JournalMessageView[];
  initialSessionClosed: boolean;
  latestSummary: JournalSessionSummaryView | null;
  initialSummaryGenerationStatus: SummaryGenerationStatus;
  copy: ChatCopy;
  navigationCopy: ChatNavigationCopy;
  successToast: ChatSuccessToastCopy;
}) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [history, setHistory] = useState<JournalSessionHistoryItem[]>(initialHistory);
  const [searchResults, setSearchResults] = useState<JournalSessionHistoryItem[]>(initialHistory);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSearchHistoryLoading, setIsSearchHistoryLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [confirmNewChatOpen, setConfirmNewChatOpen] = useState(false);
  const [selectedSessionIsClosed, setSelectedSessionIsClosed] = useState(initialSessionClosed);
  const [sessionSummary, setSessionSummary] = useState(latestSummary);
  const [summaryStatus, setSummaryStatus] = useState<SummaryGenerationStatus>(initialSummaryGenerationStatus);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [isFinishing, startFinishTransition] = useTransition();
  const [isRetryingSummary, startSummaryRetryTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingAssistantContentRef = useRef<Record<string, string>>({});
  const streamFlushFrameRef = useRef<number | null>(null);
  const hasMessages = messages.length > 0;
  const showFinishAction = hasMessages && !selectedSessionIsClosed && !isSessionLoading;

  const canSend = useMemo(
    () =>
      input.trim().length > 0 &&
      !isStreaming &&
      !selectedSessionIsClosed,
    [input, isStreaming, selectedSessionIsClosed],
  );

  function showSuccessToast(message: string) {
    setToastMessage(message);
    setToastKey((key) => key + 1);
  }

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch("/api/patient/ai/sessions", {
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

  const loadSearchResults = useCallback(async (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) {
      setSearchResults(history);
      setIsSearchHistoryLoading(false);
      return;
    }

    setIsSearchHistoryLoading(true);
    try {
      const response = await fetch("/api/patient/ai/sessions?query=" + encodeURIComponent(trimmedQuery), {
        cache: "no-store",
      });
      const body = await response.json().catch(() => null) as
        | { sessions?: JournalSessionHistoryItem[]; error?: string }
        | null;
      if (!response.ok) throw new Error(body?.error ?? copy.historyLoadFailed);
      setSearchResults(body?.sessions ?? []);
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : copy.historyLoadFailed);
    } finally {
      setIsSearchHistoryLoading(false);
    }
  }, [copy.historyLoadFailed, history]);

  const openSearchOverlay = useCallback(() => {
    setSearchQuery("");
    setSearchResults(history);
    setIsSearchOpen(true);
  }, [history]);

  const closeSearchOverlay = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(history);
  }, [history]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const timer = window.setTimeout(() => {
      void loadSearchResults(searchQuery);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isSearchOpen, loadSearchResults, searchQuery]);

  useEffect(() => {
    if (!isSearchOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearchOverlay();
    }

    document.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSearchOverlay, isSearchOpen]);

  const flushAssistantContent = useCallback((messageId: string) => {
    const nextContent = pendingAssistantContentRef.current[messageId];
    delete pendingAssistantContentRef.current[messageId];
    streamFlushFrameRef.current = null;

    if (!nextContent) return;

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, content: message.content + nextContent }
          : message,
      ),
    );
  }, []);

  const appendAssistantContent = useCallback((messageId: string, chunk: string) => {
    pendingAssistantContentRef.current[messageId] =
      (pendingAssistantContentRef.current[messageId] ?? "") + chunk;

    if (streamFlushFrameRef.current !== null) return;

    streamFlushFrameRef.current = window.requestAnimationFrame(() => {
      flushAssistantContent(messageId);
    });
  }, [flushAssistantContent]);

  useEffect(() => {
    return () => {
      if (streamFlushFrameRef.current !== null) {
        window.cancelAnimationFrame(streamFlushFrameRef.current);
      }
    };
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming || selectedSessionIsClosed) return;

    setError(null);
    setIsStreaming(true);
    setSessionSummary(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: ChatMessage = {
      id: `local-ai-${Date.now()}`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);

    try {
      const response = await fetch("/api/patient/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
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
        appendAssistantContent(assistantMessage.id, chunk);
      }
    } catch (err) {
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      setError(err instanceof Error ? err.message : copy.aiContactFailed);
    } finally {
      if (streamFlushFrameRef.current !== null) {
        window.cancelAnimationFrame(streamFlushFrameRef.current);
      }
      flushAssistantContent(assistantMessage.id);
      setIsStreaming(false);
      void loadHistory();
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
      showSuccessToast(successToast.aiSessionCreated);
      void loadHistory();
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
  }

  function finishCurrentSession() {
    if (!sessionId || isStreaming || selectedSessionIsClosed) return;

    startFinishTransition(async () => {
      setError(null);
      try {
        const detail = await finishAiSessionAction(sessionId);
        applySessionDetail(detail);
        showSuccessToast(successToast.aiSessionFinished);
        void loadHistory();
      } catch {
        setError(copy.finalizeFailed);
      }
    });
  }

  function retrySummaryGeneration() {
    if (!sessionId || isRetryingSummary) return;

    startSummaryRetryTransition(async () => {
      setError(null);
      try {
        const detail = await retryAiSessionSummaryAction(sessionId);
        applySessionDetail(detail);
        showSuccessToast(successToast.summaryRetryStarted);
        void loadHistory();
      } catch {
        setError(copy.summaryRetryFailed);
      }
    });
  }

  const sidebarHistoryEmptyMessage = copy.noChatHistory;
  const searchResultsEmptyMessage = searchQuery.trim() ? copy.noSearchResults : copy.noChatHistory;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[var(--color-warm-canvas)] lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1">
      <AppToast message={toastMessage} triggerKey={toastKey} />
      <aside
        data-chat-sidebar="actions"
        className="grid min-h-0 max-h-[min(220px,34dvh)] shrink-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-stone-surface)_55%,var(--color-warm-canvas))] p-3 sm:p-4 lg:flex lg:h-full lg:max-h-none lg:flex-col lg:gap-6 lg:border-b-0 lg:border-r lg:p-6"
      >
        <div data-chat-header="navigation-group" className="flex items-center gap-3">
          <BackNavigationMenu copy={copy} navigationCopy={navigationCopy} />
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] text-sm font-bold text-[var(--color-midnight)]">
            {copy.aiAvatar}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1">
          <ActionRailButton
            icon={<Plus size={18} />}
            isLoading={isCreatingNewChat}
            label={copy.newChat}
            loadingLabel={copy.newChatConfirm}
            title={copy.newChatTitle}
            disabled={isStreaming}
            onClick={requestNewChat}
          />
          <ActionRailButton
            icon={<Search size={18} />}
            label={copy.searchChat}
            title={copy.searchChatTitle}
            onClick={openSearchOverlay}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-2 overflow-hidden lg:flex-1 lg:gap-3">
          <RailHeading>{copy.chatHistoryLabel}</RailHeading>
          <div data-chat-history="items" className="min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-1 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1">
            {isHistoryLoading ? (
              <HistorySkeleton />
            ) : history.length === 0 ? (
              <p className="whitespace-nowrap rounded-xl bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] px-3 py-3 text-xs leading-5 text-[var(--color-ash)] lg:whitespace-normal">
                {sidebarHistoryEmptyMessage}
              </p>
            ) : (
              <div className="flex min-w-0 gap-2 lg:grid lg:gap-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={item.id === sessionId ? "true" : undefined}
                    onClick={() => void loadSelectedSession(item.id)}
                    className={cn(
                      "grid min-h-12 w-[min(220px,70vw)] shrink-0 cursor-pointer gap-0.5 rounded-xl px-3 py-2 text-left text-xs hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] disabled:cursor-wait disabled:opacity-70 lg:w-auto lg:shrink",
                      motion.navItem,
                      item.id === sessionId
                        ? "bg-[var(--color-card)] text-[var(--color-midnight)] shadow-[var(--shadow-subtle)]"
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
      </aside>

      <section
        data-chat-canvas="conversation"
        className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-warm-canvas)]"
      >
        {showFinishAction ? (
          <div data-chat-actions="main-session" className="shrink-0 px-3 pt-3 sm:px-5 md:px-10 md:pt-8">
            <div className="flex w-full justify-start">
              <LoadingActionButton
                type="button"
                disabled={isStreaming}
                isLoading={isFinishing}
                loadingLabel={copy.finish}
                title={copy.finishTitle}
                onClick={() => void finishCurrentSession()}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--color-error-red)] bg-[var(--color-card)] px-4 text-sm font-medium text-[var(--color-error-red)] shadow-[var(--shadow-subtle)] hover:bg-[var(--color-error-surface)] disabled:cursor-not-allowed"
              >
                <Square size={18} aria-hidden="true" />
                <span>{copy.finish}</span>
              </LoadingActionButton>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "relative min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5 sm:py-7 md:px-10 md:py-8",
            hasMessages ? "custom-scrollbar" : "grid place-items-center",
          )}
        >
          {isSessionLoading ? (
            <div className="mx-auto grid w-full max-w-[760px] gap-3 pb-3">
              <AssistantBubbleSkeleton />
              <Skeleton className="ml-auto h-14 w-[62%] rounded-[22px]" />
              <AssistantBubbleSkeleton />
            </div>
          ) : !hasMessages ? (
            <div className="mx-auto grid w-full max-w-[760px] gap-6 text-center sm:gap-8 md:gap-14">
              <div className="grid gap-3">
                <h2 className="text-2xl font-medium leading-tight text-[var(--color-charcoal-primary)] sm:text-3xl md:text-5xl">
                  {copy.heroPrompt}
                </h2>
              </div>
              <div
                data-chat-empty-guidance="cards"
                className="grid gap-3 sm:gap-5 md:grid-cols-2 md:gap-6"
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
            <div className="mx-auto grid w-full max-w-[760px] gap-3 pb-2 sm:pb-3">
              {messages.map((message) => {
                const isPendingAssistant = message.role === "assistant" && !message.content && isStreaming;

                if (isPendingAssistant) {
                  return <AssistantBubbleSkeleton key={message.id} />;
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[92%] px-3.5 py-3 text-sm leading-6 sm:max-w-[82%] sm:px-4",
                      message.role === "user" && "whitespace-pre-wrap break-words",
                      message.role === "user"
                        ? "ml-auto rounded-[22px] rounded-br-lg bg-[var(--color-midnight)] text-[var(--color-inverted)]"
                        : "mr-auto rounded-[22px] rounded-bl-lg border border-[var(--color-stone-surface)] bg-[var(--color-card)] text-[var(--color-charcoal-primary)] shadow-[var(--shadow-subtle)]",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <AssistantMarkdown content={message.content || copy.writing} />
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
          <p className="mx-3 mb-3 rounded-xl border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-4 py-3 text-sm text-[var(--color-error-red)] sm:mx-5 md:mx-10">
            {error}
          </p>
        ) : null}

        {selectedSessionIsClosed ? (
          <ReadonlyClosedSessionComposer copy={copy} />
        ) : (
          <form
            data-chat-composer="bottom-input"
            className="shrink-0 bg-[var(--color-warm-canvas)] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 md:px-5 md:pb-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSend) return;
              void sendMessage();
            }}
          >
            <label htmlFor="ai-message" className="sr-only">
              {copy.messageLabel}
            </label>
            <div className="mx-auto w-full max-w-[800px]">
              <div className={cn("flex items-center gap-1 rounded-[28px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-subtle)] focus-within:border-[var(--color-midnight)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-midnight)_5%,transparent)] sm:rounded-full", motion.input)}>
                <input
                  ref={inputRef}
                  id="ai-message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (canSend) void sendMessage();
                    }
                  }}
                  maxLength={2000}
                  className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-base sm:text-sm text-[var(--color-charcoal-primary)] outline-none placeholder:text-[var(--color-ash)] disabled:text-[var(--color-ash)]"
                  placeholder={copy.messagePlaceholder}
                />
                <LoadingActionButton
                  type="submit"
                  disabled={!canSend}
                  isLoading={isStreaming}
                  loadingLabel={copy.sendDisabledTitle}
                  title={isStreaming ? copy.sendDisabledTitle : copy.sendTitle}
                  aria-label={isStreaming ? copy.sendDisabledTitle : copy.sendTitle}
                  className="inline-flex size-11 min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--color-midnight)] px-0 text-[var(--color-inverted)] shadow-[var(--shadow-subtle)] hover:bg-[var(--color-charcoal-primary)] disabled:cursor-not-allowed"
                  slotClassName="size-11 shrink-0"
                >
                  <ArrowUp size={20} aria-hidden="true" />
                </LoadingActionButton>
              </div>
              <p className="mx-auto mt-3 max-w-[640px] px-1 text-center text-xs leading-5 text-[var(--color-ash)] sm:mt-4 sm:px-0">
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
        <ViewportModal
          data-chat-search-overlay="global"
          className="bg-black/45 px-3 py-5 backdrop-blur-[2px] sm:px-4 sm:py-8"
          onClick={closeSearchOverlay}
        >
          <ViewportModalPanel
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-search-overlay-title"
            data-chat-search-panel="global"
            className="max-h-[calc(100dvh-2.5rem)] w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)]"
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
              {isSearchHistoryLoading ? (
                <HistorySkeleton />
              ) : searchResults.length === 0 ? (
                <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] px-3 py-3 text-sm leading-6 text-[var(--color-ash)]">
                  {searchResultsEmptyMessage}
                </p>
              ) : (
                <div className="grid gap-1">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={item.id === sessionId ? "true" : undefined}
                      onClick={async () => {
                        await loadSelectedSession(item.id);
                        closeSearchOverlay();
                      }}
                      className={cn(
                        "grid min-h-14 cursor-pointer gap-1 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)] disabled:cursor-wait disabled:opacity-70",
                        motion.navItem,
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
          </ViewportModalPanel>
        </ViewportModal>
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
      className="grid min-h-[128px] content-center justify-items-center gap-3 rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-4 py-5 shadow-[var(--shadow-subtle)] sm:min-h-[160px] sm:px-6 sm:py-6 md:min-h-[190px] md:gap-4 md:px-7 md:py-8"
    >
      <div className="grid size-12 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-stone-surface)_78%,var(--color-card))] text-[var(--color-midnight)] sm:size-14 md:size-16">
        {icon}
      </div>
      <div className="grid gap-3">
        <h3 className="text-base font-bold leading-tight text-[var(--color-midnight)] sm:text-lg md:text-xl">
          {title}
        </h3>
        <p className="mx-auto max-w-[260px] text-xs leading-5 text-[var(--color-graphite)] sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>
    </article>
  );
}

function AssistantMarkdownFallback() {
  return (
    <div className="grid min-w-0 gap-2" aria-hidden="true">
      <span className="h-4 w-44 max-w-full animate-pulse rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
      <span className="h-4 w-64 max-w-full animate-pulse rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
      <span className="h-4 w-36 max-w-full animate-pulse rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
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
          <p className="text-xs font-semibold uppercase tracking-widest">
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
          <LoadingActionButton
            type="button"
            onClick={onRetrySummary}
            isLoading={isRetryingSummary}
            loadingLabel={copy.retrySummary}
            className="mt-1 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--color-error-red)] bg-[var(--color-card)] px-3 text-sm font-medium text-[var(--color-error-red)] hover:bg-[var(--color-error-surface)] disabled:cursor-not-allowed sm:w-fit"
            slotClassName="mt-1 w-full sm:w-fit"
          >
            {copy.retrySummary}
          </LoadingActionButton>
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
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
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
      className="shrink-0 bg-[var(--color-warm-canvas)] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 md:px-5 md:pb-8"
    >
      <div className="mx-auto w-full max-w-[800px]">
        <div className="flex cursor-not-allowed items-start gap-3 rounded-[28px] border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-card)_78%,var(--color-stone-surface))] p-3 text-[var(--color-ash)] shadow-[var(--shadow-subtle)] sm:items-center">
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
        <p className="mx-auto mt-3 max-w-[640px] px-1 text-center text-xs leading-5 text-[var(--color-ash)] sm:mt-4 sm:px-0">
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
          "inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-[var(--color-graphite)] hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-teal-primary)] lg:size-9",
          motion.iconButton,
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
            data-menu-panel=""
            className={cn("absolute left-0 top-11 z-40 w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-elevated)]", motion.menuPanel)}
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
              href="/patient/health-history"
              icon={<ClipboardList size={18} aria-hidden="true" />}
              label={navigationCopy.healthHistory}
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
      className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)] focus-visible:bg-[var(--color-stone-surface)] focus-visible:text-[var(--color-midnight)] focus-visible:outline-none", motion.navItem)}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function RailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="hidden px-2 text-xs font-semibold uppercase leading-5 tracking-widest text-[var(--color-ash)] lg:block">
      {children}
    </h3>
  );
}

function ActionRailButton({
  icon,
  isLoading = false,
  label,
  loadingLabel,
  title,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  isLoading?: boolean;
  label: string;
  loadingLabel?: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <LoadingActionButton
      type="button"
      title={title}
      disabled={disabled}
      isLoading={isLoading}
      loadingLabel={loadingLabel ?? label}
      onClick={onClick}
      variant="ghost"
      className="flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-transparent px-2 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-card)] hover:text-[var(--color-midnight)] disabled:cursor-not-allowed lg:justify-start lg:gap-3 lg:px-3"
      slotClassName="w-full"
    >
      {icon}
      <span className="truncate">{label}</span>
    </LoadingActionButton>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex min-w-0 gap-2 lg:grid lg:gap-1" aria-hidden="true">
      <Skeleton className="h-12 w-[min(220px,70vw)] shrink-0 rounded-xl lg:w-auto lg:shrink" />
      <Skeleton className="h-12 w-[min(220px,70vw)] shrink-0 rounded-xl lg:w-auto lg:shrink" />
      <Skeleton className="h-12 w-[min(220px,70vw)] shrink-0 rounded-xl lg:w-auto lg:shrink" />
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
    <ViewportModal className="bg-black/30">
      <ViewportModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-confirm-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
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
        <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCreating}
            className={cn(
              "min-h-11 cursor-pointer rounded-full border border-[var(--color-stone-surface)] px-4 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-stone-surface)] disabled:cursor-not-allowed disabled:opacity-60",
              motion.button,
            )}
          >
            {copy.newChatCancel}
          </button>
          <LoadingActionButton
            type="button"
            onClick={onConfirm}
            isLoading={isCreating}
            loadingLabel={copy.newChatConfirm}
            className="min-h-11 cursor-pointer rounded-full bg-[var(--color-midnight)] px-4 text-sm font-medium text-[var(--color-inverted)] hover:bg-[var(--color-charcoal-primary)] disabled:cursor-not-allowed"
          >
            {copy.newChatConfirm}
          </LoadingActionButton>
        </div>
      </ViewportModalPanel>
    </ViewportModal>
  );
}
