"use client";

import { useMemo, useState, useTransition } from "react";
import { Send, Square } from "lucide-react";

import { AssistantBubbleSkeleton } from "@/components/loading-skeletons";
import { Button } from "@/components/ui/button";
import type { JournalMessageView } from "@/lib/ai/journal-service";
import { MAX_PATIENT_MESSAGES_PER_SESSION } from "@/lib/ai/session-limits";
import { finishAiSessionAction } from "../actions";

type ChatMessage = JournalMessageView | {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export function AiJournalClient({
  initialSessionId,
  initialMessages,
  initialPatientMessageCount,
  copy,
}: {
  initialSessionId: string | null;
  initialMessages: JournalMessageView[];
  initialPatientMessageCount: number;
  copy: {
    clientTitle: string;
    sessionCount: string;
    finishTitle: string;
    finish: string;
    emptyChat: string;
    writing: string;
    messageLabel: string;
    limitReached: string;
    messagePlaceholder: string;
    disclosure: string;
    sendTitle: string;
    send: string;
    aiContactFailed: string;
  };
}) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [patientMessageCount, setPatientMessageCount] = useState(initialPatientMessageCount);
  const [isFinishing, startFinishTransition] = useTransition();
  const remainingMessages = Math.max(0, MAX_PATIENT_MESSAGES_PER_SESSION - patientMessageCount);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isStreaming && remainingMessages > 0,
    [input, isStreaming, remainingMessages],
  );

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");
    setIsStreaming(true);

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

      setPatientMessageCount((count) => count + 1);
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
    } catch (err) {
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      setError(err instanceof Error ? err.message : copy.aiContactFailed);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-surface)] pb-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-midnight)]">{copy.clientTitle}</p>
          <p className="text-xs text-[var(--color-ash)]">
            {copy.sessionCount
              .replace("{count}", String(patientMessageCount))
              .replace("{max}", String(MAX_PATIENT_MESSAGES_PER_SESSION))}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={isStreaming || isFinishing || messages.length === 0}
          title={copy.finishTitle}
          onClick={() => {
            startFinishTransition(async () => {
              await finishAiSessionAction();
            });
          }}
        >
          <Square size={16} />
          {copy.finish}
        </Button>
      </div>

      <div className="min-h-[360px] rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4">
        {messages.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-center text-sm text-[var(--color-ash)]">
            {copy.emptyChat}
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => {
              const isPendingAssistant = message.role === "assistant" && !message.content && isStreaming;

              if (isPendingAssistant) {
                return <AssistantBubbleSkeleton key={message.id} />;
              }

              return (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[78%] rounded-[10px] bg-[var(--color-teal-primary)] px-4 py-3 text-sm leading-6 text-[var(--color-inverted)]"
                      : "mr-auto max-w-[78%] rounded-[10px] bg-[var(--color-card)] px-4 py-3 text-sm leading-6 text-[var(--color-charcoal-primary)] shadow-[var(--shadow-subtle)]"
                  }
                >
                  {message.content || copy.writing}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-3 py-2 text-sm text-[var(--color-error-red)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="ai-message" className="text-sm font-semibold text-[var(--color-midnight)]">
          {copy.messageLabel}
        </label>
        <textarea
          id="ai-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          maxLength={2000}
          disabled={isStreaming || remainingMessages === 0}
          className="min-h-24 resize-y rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-graphite)] outline-none placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-primary)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]"
          placeholder={
            remainingMessages === 0
              ? copy.limitReached
              : copy.messagePlaceholder
          }
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-ash)]">
            {copy.disclosure}
          </p>
          <Button type="button" onClick={sendMessage} disabled={!canSend} title={copy.sendTitle}>
            <Send size={16} />
            {copy.send}
          </Button>
        </div>
      </div>
    </div>
  );
}
