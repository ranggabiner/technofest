import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "../i18n/dictionary";
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

  it("keeps access history and doctor data-view logs off the patient dashboard", () => {
    const pageSource = readFileSync(new URL("../../app/patient/(portal)/page.tsx", import.meta.url), "utf8");

    expect(pageSource).not.toContain("loadPatientAccessState");
    expect(pageSource).not.toContain("DoctorAccessStatusLog");
    expect(pageSource).not.toContain("AccessHistoryList");
    expect(pageSource).not.toContain("/patient/access-history");
    expect(pageSource).not.toContain("copy.patient.dashboard.accessLogTitle");
  });

  it("uses a simple circle marker for medical record history", () => {
    const pageSource = readFileSync(new URL("../../app/patient/(portal)/page.tsx", import.meta.url), "utf8");

    expect(pageSource).not.toContain("CalendarDays");
    expect(pageSource).toContain("data-scope1-record-marker");
  });

  it("groups medical records and complaints under a localized health history heading", () => {
    const pageSource = readFileSync(new URL("../../app/patient/(portal)/page.tsx", import.meta.url), "utf8");
    const idDashboard = dictionary.id.patient.dashboard as Record<string, string>;
    const enDashboard = dictionary.en.patient.dashboard as Record<string, string>;

    expect(idDashboard.healthHistoryTitle).toBe("Riwayat Kesehatan");
    expect(enDashboard.healthHistoryTitle).toBe("Health History");
    expect(pageSource).toContain("copy.patient.dashboard.healthHistoryTitle");
    expect(pageSource).not.toContain("Riwayat Kesehatan");
    expect(pageSource).not.toContain("Health History");
    expect(pageSource.indexOf("copy.patient.dashboard.healthHistoryTitle")).toBeLessThan(
      pageSource.indexOf("copy.patient.dashboard.scope1TimelineTitle"),
    );
    expect(pageSource.indexOf("copy.patient.dashboard.scope1TimelineTitle")).toBeLessThan(
      pageSource.indexOf("copy.patient.dashboard.aiSummaryTitle"),
    );
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

  it("seeds developer@binerlabs.com access history and proof examples", () => {
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
      "00000000-0000-0000-0000-000000000415",
    ]);
    expect(seedSource).toContain(
      "'00000000-0000-0000-0000-000000000415'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, false, true, true, false, now() - interval '8 days', now() + interval '7 days'",
    );
    expectSeedIds(seedSource, [
      "00000000-0000-0000-0000-000000000711",
      "00000000-0000-0000-0000-000000000712",
      "00000000-0000-0000-0000-000000000713",
      "00000000-0000-0000-0000-000000000714",
      "00000000-0000-0000-0000-000000000715",
    ]);
    expectSeedIds(seedSource, [
      "00000000-0000-0000-0000-000000000511",
      "00000000-0000-0000-0000-000000000512",
      "00000000-0000-0000-0000-000000000513",
      "00000000-0000-0000-0000-000000000514",
      "00000000-0000-0000-0000-000000000515",
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
  for (const id of ids) {
    expect(seedSource).toContain(id);
  }
}
