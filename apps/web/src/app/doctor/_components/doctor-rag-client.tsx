"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import { RagAnswerSkeleton } from "@/components/loading-skeletons";
import { LoadingActionButton } from "@/components/ui/async-action-button";
import { Field, Label, Textarea } from "@/components/ui/form";
import { DOCTOR_RAG_DISCLAIMER } from "@/lib/doctor-records/rag";
import {
  getDoctorRagScrollIntent,
  getDoctorRagScrollStateAfterPanelScroll,
  getPanelScrollTopToRevealChildStart,
  isScrollContainerNearBottom,
} from "./doctor-rag-scroll";

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
  const answerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollResetRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasRenderedAnswerRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const lastObservedScrollHeightRef = useRef(0);
  const loadingRef = useRef(false);
  const shouldRevealAnswerStartRef = useRef(true);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const panel = containerRef.current?.closest("[data-viewport-modal-panel]") as HTMLElement | null;
    if (!panel) return;

    const syncStickyState = () => {
      const nextScrollHeight = panel.scrollHeight;
      const update = getDoctorRagScrollStateAfterPanelScroll({
        isAutoScrolling: isAutoScrollingRef.current,
        isNearBottom: isScrollContainerNearBottom(panel),
        nextScrollHeight,
        previousScrollHeight: lastObservedScrollHeightRef.current,
        shouldRevealAnswerStart: shouldRevealAnswerStartRef.current,
      });

      lastObservedScrollHeightRef.current = nextScrollHeight;

      if (!update) return;

      shouldRevealAnswerStartRef.current = update.shouldRevealAnswerStart;
      shouldStickToBottomRef.current = update.shouldStickToBottom;
    };

    lastObservedScrollHeightRef.current = panel.scrollHeight;
    shouldStickToBottomRef.current = isScrollContainerNearBottom(panel);
    panel.addEventListener("scroll", syncStickyState, { passive: true });

    return () => panel.removeEventListener("scroll", syncStickyState);
  }, []);

  useEffect(() => {
    return () => {
      if (autoScrollResetRef.current !== null) {
        window.clearTimeout(autoScrollResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hasAnswer = Boolean(answer);
    const isFirstAnswer = hasAnswer && !hasRenderedAnswerRef.current;
    const intent = getDoctorRagScrollIntent({
      hasAnswer,
      isFirstAnswer,
      isLoading,
      shouldRevealAnswerStart: shouldRevealAnswerStartRef.current,
      shouldStickToBottom: shouldStickToBottomRef.current,
    });

    if (hasAnswer) hasRenderedAnswerRef.current = true;
    if (intent === "none") return;

    const panel = containerRef.current?.closest("[data-viewport-modal-panel]") as HTMLElement | null;
    if (!panel) return;

    if (autoScrollResetRef.current !== null) {
      window.clearTimeout(autoScrollResetRef.current);
      autoScrollResetRef.current = null;
    }

    const frameId = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior = prefersReducedMotion ? "auto" : "smooth";

      isAutoScrollingRef.current = true;
      autoScrollResetRef.current = window.setTimeout(() => {
        isAutoScrollingRef.current = false;
        lastObservedScrollHeightRef.current = panel.scrollHeight;
        shouldStickToBottomRef.current = isScrollContainerNearBottom(panel);
      }, prefersReducedMotion ? 0 : 320);

      if (intent === "reveal-answer-start") {
        const answerNode = answerRef.current;
        if (!answerNode) return;

        const panelRect = panel.getBoundingClientRect();
        const answerRect = answerNode.getBoundingClientRect();
        const nextScrollTop = getPanelScrollTopToRevealChildStart({
          childTop: answerRect.top,
          panelBottom: panelRect.bottom,
          panelScrollTop: panel.scrollTop,
          panelTop: panelRect.top,
        });

        shouldStickToBottomRef.current = false;
        if (nextScrollTop === null) return;

        panel.scrollTo({
          top: nextScrollTop,
          behavior,
        });
        return;
      }

      panel.scrollTo({
        top: panel.scrollHeight,
        behavior,
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [answer, isLoading]);

  async function askQuestion() {
    if (loadingRef.current) return;

    const nextQuestion = question.trim();
    if (!nextQuestion) {
      setError(copy.questionRequired);
      return;
    }

    loadingRef.current = true;
    hasRenderedAnswerRef.current = false;
    shouldRevealAnswerStartRef.current = true;
    shouldStickToBottomRef.current = true;
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
    <div ref={containerRef} className="grid gap-4">
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
        <div
          ref={answerRef}
          className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]"
        >
          <AssistantMarkdown content={answer} />
        </div>
      ) : null}
    </div>
  );
}
