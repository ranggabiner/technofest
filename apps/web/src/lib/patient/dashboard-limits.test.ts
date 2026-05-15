import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PATIENT_DASHBOARD_ITEM_LIMIT } from "./dashboard-limits";

describe("patient dashboard preview limits", () => {
  it("keeps every dashboard preview section capped to three items with selengkapnya links", () => {
    expect(PATIENT_DASHBOARD_ITEM_LIMIT).toBe(3);

    const dashboardSource = readFileSync(new URL("./dashboard.ts", import.meta.url), "utf8");
    expect(dashboardSource).toContain(".limit(PATIENT_DASHBOARD_ITEM_LIMIT)");

    const accessSource = readFileSync(new URL("../access/doctor-access.ts", import.meta.url), "utf8");
    expect(accessSource).toContain("const accessLogLimit = options.accessLogLimit ?? PATIENT_DASHBOARD_ITEM_LIMIT");
    expect(accessSource).toContain(".limit(accessLogLimit)");

    const journalSource = readFileSync(new URL("../ai/journal-service.ts", import.meta.url), "utf8");
    expect(journalSource).toContain("recentSummaries");
    expect(journalSource).toContain(".limit(PATIENT_DASHBOARD_ITEM_LIMIT)");

    const pageSource = readFileSync(new URL("../../app/patient/(portal)/page.tsx", import.meta.url), "utf8");
    expect(pageSource).toContain("journalState.recentSummaries.map");
    expect(pageSource).toContain("copy.patient.dashboard.moreDetails");
    expect(pageSource).not.toContain("copy.patient.dashboard.viewAllHistory");
    expect(pageSource).not.toContain("copy.patient.dashboard.openAiJournal");
  });

  it("uses a simple circle marker for medical record history", () => {
    const pageSource = readFileSync(new URL("../../app/patient/(portal)/page.tsx", import.meta.url), "utf8");

    expect(pageSource).not.toContain("CalendarDays");
    expect(pageSource).toContain("data-scope1-record-marker");
  });

  it("seeds enough dashboard history data to prove previews truncate to three items", () => {
    const seedSource = readFileSync(
      new URL("../../../../supabase/supabase/seed.sql", import.meta.url),
      "utf8",
    );

    expect(seedSource).toContain("seed_patient_dashboard_scope1");
    expect(seedSource).toContain("seed_patient_dashboard_ai_summary");
    expect(seedSource).toContain("seed_patient_dashboard_access_log");
  });

  it("seeds four dashboard examples for developer@binerlabs.com", () => {
    const seedSource = readFileSync(
      new URL("../../../../supabase/supabase/seed.sql", import.meta.url),
      "utf8",
    );

    expect(seedSource).toContain("developer@binerlabs.com");
    expect(seedSource).toContain("seed_developer_dashboard_access_log");
    expect(seedSource).toContain("seed_developer_dashboard_scope1");
    expect(seedSource).toContain("seed_developer_dashboard_ai_summary");

    expectSeedIds(seedSource, [
      "00000000-0000-0000-0000-000000000411",
      "00000000-0000-0000-0000-000000000412",
      "00000000-0000-0000-0000-000000000413",
      "00000000-0000-0000-0000-000000000414",
    ]);
    expectSeedIds(seedSource, [
      "00000000-0000-0000-0000-000000000511",
      "00000000-0000-0000-0000-000000000512",
      "00000000-0000-0000-0000-000000000513",
      "00000000-0000-0000-0000-000000000514",
    ]);
    expectSeedIds(seedSource, [
      "00000000-0000-0000-0000-000000000611",
      "00000000-0000-0000-0000-000000000612",
      "00000000-0000-0000-0000-000000000613",
      "00000000-0000-0000-0000-000000000614",
    ]);
  });
});

function expectSeedIds(seedSource: string, ids: string[]) {
  expect(ids).toHaveLength(4);
  for (const id of ids) {
    expect(seedSource).toContain(id);
  }
}
