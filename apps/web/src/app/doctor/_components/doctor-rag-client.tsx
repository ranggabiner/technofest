"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

import { RagAnswerSkeleton } from "@/components/loading-skeletons";
import { LoadingActionButton } from "@/components/ui/async-action-button";
import { Field, Label, Textarea } from "@/components/ui/form";
import { DOCTOR_RAG_DISCLAIMER } from "@/lib/doctor-records/rag";

export function DoctorRagClient({
  grantId,
  copy,
}: {
  grantId: string;
  copy: {
    questionRequired: string;
    answerFailed: string;
    questionLabel: string;
    placeholder: string;
    processing: string;
    ask: string;
  };
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  async function askQuestion() {
    if (loadingRef.current) return;

    const nextQuestion = question.trim();
    if (!nextQuestion) {
      setError(copy.questionRequired);
      return;
    }

    loadingRef.current = true;
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
      if (!response.ok || !body.answer) throw new Error(body.error ?? copy.answerFailed);
      setAnswer(body.answer);
    } catch (ragError) {
      setError(ragError instanceof Error ? ragError.message : copy.answerFailed);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[10px] bg-[var(--color-teal-surface)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
        {DOCTOR_RAG_DISCLAIMER}
      </div>
      <Field>
        <Label htmlFor="doctor_rag_question">{copy.questionLabel}</Label>
        <Textarea
          id="doctor_rag_question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={1000}
          placeholder={copy.placeholder}
        />
      </Field>
      {error ? (
        <p className="rounded-[10px] border border-[var(--color-error-red)] bg-[var(--color-error-surface)] px-3 py-2 text-sm text-[var(--color-error-red)]">
          {error}
        </p>
      ) : null}
      <LoadingActionButton
        type="button"
        className="w-full rounded-[10px] sm:w-fit"
        isLoading={isLoading}
        loadingLabel={copy.processing}
        onClick={() => void askQuestion()}
        slotClassName="w-full sm:w-fit"
      >
        <Send size={16} />
        {copy.ask}
      </LoadingActionButton>
      {isLoading ? (
        <RagAnswerSkeleton />
      ) : answer ? (
        <div className="whitespace-pre-wrap break-words rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)] [overflow-wrap:anywhere]">
          {answer}
        </div>
      ) : null}
    </div>
  );
}
