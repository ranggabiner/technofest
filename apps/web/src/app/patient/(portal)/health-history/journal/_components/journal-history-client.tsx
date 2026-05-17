"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  MessageCircle,
  X,
} from "lucide-react";

import { AssistantBubbleSkeleton } from "@/components/loading-skeletons";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { JournalSessionDetailView } from "@/lib/ai/journal-service";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";
import {
  type PatientHealthJournalItem,
  type PatientHealthJournalFilter,
  type PatientHealthJournalMetric,
} from "@/lib/patient/health-journal";
import { cn } from "@/lib/utils";

import { AssistantMarkdown } from "../../../../_components/assistant-markdown";

type JournalDetailCopy = Dictionary["patient"]["healthHistory"]["journalDetail"];

export function JournalHistoryClient({
  copy,
  filter,
  items,
  locale,
}: {
  copy: JournalDetailCopy;
  filter: PatientHealthJournalFilter;
  items: PatientHealthJournalItem[];
  locale: Locale;
}) {
  const [activeItem, setActiveItem] = useState<PatientHealthJournalItem | null>(null);
  const [selectedSession, setSelectedSession] = useState<JournalSessionDetailView | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    setActiveItem(null);
    setSelectedSession(null);
    setChatError(null);
    setIsLoadingChat(false);
  }, []);

  useEffect(() => {
    if (!activeItem) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeItem, closeDialog]);

  async function openChatDialog(session: PatientHealthJournalItem) {
    setActiveItem(session);
    setSelectedSession(null);
    setChatError(null);
    setIsLoadingChat(true);

    try {
      const response = await fetch(`/api/patient/ai/sessions/${session.sessionId}`, {
        cache: "no-store",
      });
      const body = await response.json().catch(() => null) as
        | (JournalSessionDetailView & { error?: string })
        | null;
      if (!response.ok || !body) throw new Error(body?.error ?? copy.chatLoadFailed);
      setSelectedSession(body);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : copy.chatLoadFailed);
    } finally {
      setIsLoadingChat(false);
    }
  }

  return (
    <>
      <div
        className="relative grid gap-8 pl-7 before:absolute before:bottom-0 before:left-[9px] before:top-2 before:border-l-2 before:border-[var(--color-stone-surface)]"
        data-journal-filter={filter}
        data-journal-history="items"
      >
        {items.map((item, index) => (
          <JournalHistoryItem
            copy={copy}
            index={index}
            item={item}
            key={item.sessionId}
            locale={locale}
            onViewChat={() => openChatDialog(item)}
          />
        ))}
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-[rgba(29,27,25,0.24)] p-4 backdrop-blur-[2px] md:p-8"
          data-journal-chat-dialog="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            aria-labelledby="journal-chat-dialog-title"
            aria-modal="true"
            className="flex max-h-[min(720px,calc(100dvh-48px))] w-full max-w-[520px] flex-col overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--color-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--color-card)_86%,transparent)] shadow-[0_24px_70px_-32px_rgba(0,107,94,0.72)] backdrop-blur-md"
            data-journal-chat-dialog="box"
            role="dialog"
          >
            <header className="flex items-center justify-between gap-4 border-b border-[color-mix(in_srgb,var(--color-stone-surface)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-card)_58%,transparent)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]">
                  <BrainCircuit size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="journal-chat-dialog-title"
                    className="truncate text-sm font-semibold text-[var(--color-midnight)]"
                  >
                    {copy.chatPopupTitle}
                  </h2>
                  <p className="truncate text-xs text-[var(--color-ash)]">
                    {activeItem.title ?? copy.journalFallbackTitle}
                  </p>
                </div>
              </div>
              <button
                aria-label={copy.closeChatPopup}
                className="grid size-9 cursor-pointer place-items-center rounded-full text-[var(--color-ash)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)]"
                onClick={closeDialog}
                type="button"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {isLoadingChat ? (
                <div className="grid gap-4">
                  <p className="text-sm text-[var(--color-ash)]">{copy.chatLoading}</p>
                  <AssistantBubbleSkeleton />
                  <AssistantBubbleSkeleton />
                </div>
              ) : chatError ? (
                <PopupStateMessage message={chatError} />
              ) : selectedSession?.messages.length ? (
                <div className="grid gap-4">
                  {selectedSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                          message.role === "user"
                            ? "rounded-tr-sm border border-[color-mix(in_srgb,var(--color-teal-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-teal-surface)_72%,var(--color-card))] text-[var(--color-midnight)]"
                            : "rounded-tl-sm border border-[color-mix(in_srgb,var(--color-stone-surface)_72%,transparent)] bg-[color-mix(in_srgb,var(--color-card)_78%,transparent)] text-[var(--color-graphite)]",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <AssistantMarkdown content={message.content} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <PopupStateMessage message={copy.noChatMessages} />
              )}
            </div>

            <footer className="border-t border-[color-mix(in_srgb,var(--color-stone-surface)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-card)_58%,transparent)] px-5 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ash)]">
                {formatChatFooter(activeItem, copy, locale)}
              </p>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function JournalHistoryItem({
  copy,
  index,
  item,
  locale,
  onViewChat,
}: {
  copy: JournalDetailCopy;
  index: number;
  item: PatientHealthJournalItem;
  locale: Locale;
  onViewChat: () => void;
}) {
  return (
    <article className="relative">
      <span
        aria-hidden="true"
        className={cn(
          "absolute -left-[27px] top-1 grid size-5 place-items-center rounded-full border-4 bg-[var(--color-card)]",
          index === 0
            ? "border-[var(--color-teal-primary)] text-[var(--color-teal-deep)] ring-2 ring-[var(--color-teal-primary)]"
            : "border-[var(--color-stone-surface)] text-[var(--color-ash)]",
        )}
      >
        <span className="size-1.5 rounded-full bg-current" />
      </span>

      <p className="mb-4 flex flex-wrap items-center gap-2 text-[16px] font-semibold text-[var(--color-midnight)]">
        <CalendarDays size={16} aria-hidden="true" />
        {formatJournalDate(item.createdAt, locale)}
      </p>

      <Card
        className={cn(
          "grid gap-5 rounded-[14px] border border-[var(--color-stone-surface)] p-6 shadow-[inset_0_0_0_1px_var(--color-stone-surface)] md:grid-cols-[minmax(0,1fr)_auto] md:p-7",
          item.isEmergencyFlagged ? "border-l-4 border-l-[var(--color-error-red)]" : "",
        )}
      >
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone={item.category === "general" ? "neutral" : "approved"}>
              {copy.categoryLabel[item.category]}
            </StatusBadge>
            <StatusBadge tone={summaryStatusTone(item.summaryGenerationStatus)}>
              {copy.summaryStatus[item.summaryGenerationStatus]}
            </StatusBadge>
            {item.isEmergencyFlagged ? (
              <StatusBadge tone="failed">
                <AlertTriangle size={13} aria-hidden="true" />
                {copy.emergencyBadge}
              </StatusBadge>
            ) : null}
          </div>

          <h3 className="text-[24px] font-semibold leading-tight text-[var(--color-midnight)]">
            {item.title ?? copy.journalFallbackTitle}
          </h3>
          <p className="mt-3 text-[15px] leading-7 text-[var(--color-graphite)]">
            {item.description ?? copy.noSummary}
          </p>

          {item.metrics.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {item.metrics.map((metric, metricIndex) => (
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-[var(--color-stone-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-midnight)]"
                  key={`${metric.key}-${metricIndex}`}
                >
                  <span className="text-[var(--color-ash)]">{copy.metricLabels[metric.key]}:</span>
                  <span className="truncate">{formatMetricValue(metric, copy)}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-start md:justify-end">
          <Button
            className="min-h-10 border border-[var(--color-teal-primary)] bg-transparent px-5 text-[var(--color-teal-deep)] hover:bg-[var(--color-teal-surface)] hover:text-[var(--color-teal-deep)]"
            onClick={onViewChat}
            type="button"
            variant="ghost"
          >
            <MessageCircle size={17} aria-hidden="true" />
            {copy.viewChat}
          </Button>
        </div>
      </Card>
    </article>
  );
}

function summaryStatusTone(status: PatientHealthJournalItem["summaryGenerationStatus"]) {
  if (status === "completed") return "approved";
  if (status === "failed") return "failed";
  return "pending";
}

function formatMetricValue(metric: PatientHealthJournalMetric, copy: JournalDetailCopy) {
  if (metric.unit === "score10") return `${metric.value}/10`;
  if (metric.unit === "hour") return `${metric.value} ${copy.hourUnit}`;
  return metric.value;
}

function formatJournalDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatChatFooter(item: PatientHealthJournalItem, copy: JournalDetailCopy, locale: Locale) {
  if (!item.endedAt) return copy.activeSessionFooter;
  return `${copy.sessionEndedPrefix} - ${formatJournalDate(item.endedAt, locale)}`;
}

function PopupStateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] bg-[var(--color-stone-surface)] p-4 text-sm leading-6 text-[var(--color-ash)]">
      {message}
    </div>
  );
}
