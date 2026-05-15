"use client";

import { useMemo, useState, useTransition } from "react";
import { Send, Square } from "lucide-react";

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
}: {
  initialSessionId: string | null;
  initialMessages: JournalMessageView[];
  initialPatientMessageCount: number;
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
        throw new Error(message || "Gagal menghubungi AI");
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
      setError(err instanceof Error ? err.message : "Gagal menghubungi AI");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-surface)] pb-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-midnight)]">Jurnal AI</p>
          <p className="text-xs text-[var(--color-ash)]">
            Sesi uji DeepSeek: {patientMessageCount}/{MAX_PATIENT_MESSAGES_PER_SESSION} pesan pasien.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={isStreaming || isFinishing || messages.length === 0}
          title="Akhiri sesi dan buat ekstraksi Scope 2"
          onClick={() => {
            startFinishTransition(async () => {
              await finishAiSessionAction();
            });
          }}
        >
          <Square size={16} />
          Selesai
        </Button>
      </div>

      <div className="min-h-[360px] rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4">
        {messages.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-center text-sm text-[var(--color-ash)]">
            Mulai dengan cerita kondisi hari ini. AI akan membantu membuat jurnal, bukan diagnosis.
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[78%] rounded-[10px] bg-[var(--color-teal-primary)] px-4 py-3 text-sm leading-6 text-[var(--color-midnight)]"
                    : "mr-auto max-w-[78%] rounded-[10px] bg-white px-4 py-3 text-sm leading-6 text-[var(--color-charcoal-primary)] shadow-[var(--shadow-subtle)]"
                }
              >
                {message.content || "Menulis..."}
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-[10px] border border-[var(--color-error-red)] bg-red-50 px-3 py-2 text-sm text-[var(--color-error-red)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="ai-message" className="text-sm font-semibold text-[var(--color-midnight)]">
          Pesan jurnal
        </label>
        <textarea
          id="ai-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          maxLength={2000}
          disabled={isStreaming || remainingMessages === 0}
          className="min-h-24 resize-y rounded-[10px] border border-[var(--color-stone-surface)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-teal-primary)]"
          placeholder={
            remainingMessages === 0
              ? "Batas 5 pesan pasien untuk sesi uji sudah tercapai."
              : "Ceritakan gejala, perasaan, tidur, atau aktivitas hari ini..."
          }
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-ash)]">
            Data diproses oleh DeepSeek untuk demo/test. Jangan masukkan data klinis produksi.
          </p>
          <Button type="button" onClick={sendMessage} disabled={!canSend} title="Kirim pesan">
            <Send size={16} />
            Kirim
          </Button>
        </div>
      </div>
    </div>
  );
}
