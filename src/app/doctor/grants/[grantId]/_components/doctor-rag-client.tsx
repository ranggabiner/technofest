"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Label, Textarea } from "@/components/ui/form";
import { DOCTOR_RAG_DISCLAIMER } from "@/lib/doctor-records/rag";

export function DoctorRagClient({ grantId }: { grantId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function askQuestion() {
    const nextQuestion = question.trim();
    if (!nextQuestion) {
      setError("Pertanyaan wajib diisi");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch(`/api/doctor/grants/${grantId}/rag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });
      const body = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !body.answer) throw new Error(body.error ?? "AI gagal menjawab");
      setAnswer(body.answer);
    } catch (ragError) {
      setError(ragError instanceof Error ? ragError.message : "AI gagal menjawab");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[10px] bg-[var(--color-teal-surface)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
        {DOCTOR_RAG_DISCLAIMER}
      </div>
      <Field>
        <Label htmlFor="doctor_rag_question">Pertanyaan dokter</Label>
        <Textarea
          id="doctor_rag_question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={1000}
          placeholder="Contoh: Apa pola keluhan pasien dalam beberapa sesi terakhir?"
        />
      </Field>
      {error ? (
        <p className="rounded-[10px] border border-[var(--color-error-red)] bg-red-50 px-3 py-2 text-sm text-[var(--color-error-red)]">
          {error}
        </p>
      ) : null}
      <Button type="button" className="w-fit rounded-[10px]" onClick={() => void askQuestion()} disabled={isLoading}>
        {isLoading ? <Bot size={16} /> : <Send size={16} />}
        {isLoading ? "Memproses" : "Tanya AI"}
      </Button>
      {answer ? (
        <div className="whitespace-pre-wrap rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
          {answer}
        </div>
      ) : null}
    </div>
  );
}
