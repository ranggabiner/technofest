import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("role profile pages contract", () => {
  const route = (path: string) => new URL(`./${path}`, import.meta.url);
  const readRoute = (path: string) => readFileSync(route(path), "utf8");

  it("adds profile-only routes without the active shared topbar", () => {
    for (const path of [
      "patient/profile/page.tsx",
      "patient/profile/profiling/page.tsx",
      "doctor/profile/page.tsx",
      "admin/profile/page.tsx",
    ]) {
      expect(existsSync(route(path)), path).toBe(true);
      expect(readRoute(path), path).not.toContain("SharedHeader");
    }
  });

  it("uses a shared profile shell with sidebar logout and confirmations", () => {
    const shell = readRoute("_components/profile-shell.tsx");

    expect(shell).toContain('data-profile-shell="role-profile"');
    expect(shell).toContain('data-profile-confirmation="dialog"');
    expect(shell).toContain("signOutAction");
    expect(shell).toContain("soft-red");
  });

  it("localizes every new profile page copy in Indonesian and English", () => {
    for (const locale of ["id", "en"] as const) {
      expect(dictionary[locale].profile.patient.title).toBeTruthy();
      expect(dictionary[locale].profile.patient.profilingTitle).toBeTruthy();
      expect(dictionary[locale].profile.doctor.title).toBeTruthy();
      expect(dictionary[locale].profile.admin.title).toBeTruthy();
      expect(dictionary[locale].profile.confirm.saveTitle).toBeTruthy();
      expect(dictionary[locale].profile.confirm.cancelTitle).toBeTruthy();
      expect(dictionary[locale].profile.confirm.logoutTitle).toBeTruthy();
      expect(dictionary[locale].profile.confirm.doctorApprovalTitle).toBeTruthy();
    }
  });

  it("adds admin phone storage and keeps grants explicit", () => {
    const migration = readFileSync(
      new URL("../../../../apps/supabase/supabase/migrations/20260516093000_admin_profile_phone.sql", import.meta.url),
      "utf8",
    );
    const types = readFileSync(new URL("../lib/supabase/database.types.ts", import.meta.url), "utf8");

    expect(migration).toContain("add column if not exists phone_number text null");
    expect(migration).toContain("grant select on public.medical_admins to authenticated");
    expect(migration).not.toContain("grant all");
    expect(types).toContain("phone_number: string | null");
  });

  it("resets doctor verification when profile or KYC letters are saved", () => {
    const actions = readRoute("doctor/profile/actions.ts");
    const service = readFileSync(new URL("../lib/profile/service.ts", import.meta.url), "utf8");

    expect(service).toContain('account_status: "pending"');
    expect(service).toContain("qr_code_token: null");
    expect(service).toContain("doctor_access_code: null");
    expect(service).toContain("storeEncryptedKycFile");
    expect(actions).toContain("updateDoctorProfile");
    expect(actions).toContain("updateDoctorLetters");
  });
});
