import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("patient AI async summary lifecycle contract", () => {
  const serviceSource = () => readFileSync(new URL("./journal-service.ts", import.meta.url), "utf8");
  const migrationSource = () => {
    const migration = new URL(
      "../../../../supabase/supabase/migrations/20260516000100_ai_session_summary_status.sql",
      import.meta.url,
    );
    expect(existsSync(migration)).toBe(true);
    return readFileSync(migration, "utf8");
  };

  it("stores summary generation status as a durable ai_sessions field", () => {
    const source = serviceSource();
    const migration = migrationSource();

    expect(source).toContain('export type SummaryGenerationStatus = "pending" | "generating" | "completed" | "failed"');
    expect(source).toContain("summary_generation_status");
    expect(migration).toContain("add column if not exists summary_generation_status text not null default 'pending'");
    expect(migration).toContain("summary_generation_status in ('pending', 'generating', 'completed', 'failed')");
  });

  it("marks finish immediately and moves extraction into the async worker path", () => {
    const source = serviceSource();
    const finishStart = source.indexOf("export async function finishActiveAiSession");
    const retryStart = source.indexOf("export async function retryAiSessionSummaryGeneration");
    const finishBlock = source.slice(finishStart, retryStart);

    expect(finishStart).toBeGreaterThan(-1);
    expect(retryStart).toBeGreaterThan(finishStart);
    expect(source).toContain("scheduleAiSessionSummaryGeneration");
    expect(source).toContain("async function runAiSessionSummaryGeneration");
    expect(finishBlock).toContain("markAiSessionFinished");
    expect(finishBlock).toContain("scheduleAiSessionSummaryGeneration");
    expect(finishBlock).not.toContain("extractSession");
  });

  it("keeps failed summaries closed and retryable without reopening sessions", () => {
    const source = serviceSource();

    expect(source).toContain("summary_generation_status: \"failed\"");
    expect(source).toContain(".not(\"ended_at\", \"is\", null)");
    expect(source).toContain("retryAiSessionSummaryGeneration");
    expect(source).not.toContain("ended_at: null");
  });
});
