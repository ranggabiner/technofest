import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

const route = (path: string) => readFileSync(new URL(`./${path}`, import.meta.url), "utf8");
const lib = (path: string) =>
  readFileSync(new URL(`../lib/${path}`, import.meta.url), "utf8");

describe("doctor dashboard contract", () => {
  it("renders dashboard through a client modal table instead of grant-page table links", () => {
    const page = route("doctor/page.tsx");

    expect(page).toContain("DoctorDashboardClient");
    expect(page).toContain("/doctor/medical-record-library");
    expect(page).not.toContain("href={`/doctor/grants/${grant.grantId}`");
  });

  it("has dashboard modal actions, QR modal, and clickable filter controls", () => {
    const client = route("doctor/_components/doctor-dashboard-client.tsx");

    expect(client).toContain('role="dialog"');
    expect(client).toContain("openQrModal");
    expect(client).toContain("loadDoctorGrantModalStateAction");
    expect(client).toContain("createScope1RecordFromDashboardAction");
    expect(client).toContain('dataFilter="active"');
    expect(client).toContain('dataFilter="finished"');
  });

  it("loads dashboard sessions newest grant first with explicit columns and scope flags", () => {
    const service = lib("doctor-records/service.ts");

    expect(service).toContain(
      "grant_id,patient_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,blockchain_status,blockchain_tx_hash,patients(patient_id,full_name,email)",
    );
    expect(service).toContain('.order("granted_at", { ascending: false })');
  });

  it("adds Indonesian and English copy for new dashboard UI", () => {
    for (const locale of ["id", "en"] as const) {
      expect(dictionary[locale].doctor.nav.medicalRecordLibrary).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.sessionTableTitle).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.chatAi).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.viewMedicalRecords).toBeTruthy();
      expect(dictionary[locale].doctor.dashboard.createMedicalRecord).toBeTruthy();
    }
  });
});
