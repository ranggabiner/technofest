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
      "superadmin/profile/page.tsx",
    ]) {
      expect(existsSync(route(path)), path).toBe(true);
      expect(readRoute(path), path).not.toContain("SharedHeader");
    }
  });

  it("routes every role profile page through the shared role profile page", () => {
    const sharedPage = readRoute("_components/role-profile-page.tsx");

    expect(sharedPage).toContain("export async function RoleProfilePage");
    expect(sharedPage).toContain('routeRole: "patient" | "doctor" | "admin" | "superadmin"');
    expect(sharedPage).toContain("loadPatientProfileState");
    expect(sharedPage).toContain("loadDoctorProfileState");
    expect(sharedPage).toContain("loadAdminProfileState");
    expect(sharedPage).toContain('redirect("/superadmin/profile")');
    expect(sharedPage).toContain('redirect("/admin/profile")');

    expect(readRoute("patient/profile/page.tsx")).toContain('<RoleProfilePage routeRole="patient" />');
    expect(readRoute("patient/profile/profiling/page.tsx")).toContain('<RoleProfilePage routeRole="patient" active="profiling" />');
    expect(readRoute("doctor/profile/page.tsx")).toContain('<RoleProfilePage routeRole="doctor" />');
    expect(readRoute("admin/profile/page.tsx")).toContain('<RoleProfilePage routeRole="admin" />');
    expect(readRoute("superadmin/profile/page.tsx")).toContain('<RoleProfilePage routeRole="superadmin" />');
  });

  it("keeps profile pages confirmation-only while logout stays outside the profile page", () => {
    const shell = readRoute("_components/profile-shell.tsx");

    expect(shell).toContain('data-profile-shell="role-profile"');
    expect(shell).toContain('data-profile-confirmation="dialog"');
    expect(shell).toContain("<SaveStatusToast message={copy.toast.saved} />");
    expect(shell).not.toContain("ProfileSavedToast");
    expect(shell).not.toContain("PROFILE_TOAST_AUTO_DISMISS_MS");
    expect(shell).not.toContain("removeProfileToastParams");
    expect(shell).toContain("profileHref");
    expect(shell).toContain("backHref");
    expect(shell).toContain("ArrowLeft");
    expect(shell).toContain("export function ProfileFormControls");
    expect(shell).not.toContain("signOutAction");
    expect(shell).not.toContain("copy.confirm.logoutTitle");
    expect(shell).not.toContain("soft-red");
  });

  it("keeps profile fields directly editable without edit buttons", () => {
    const patient = readRoute("patient/profile/profile-client.tsx");
    const doctor = readRoute("doctor/profile/profile-client.tsx");
    const admin = readRoute("admin/profile/profile-client.tsx");

    for (const source of [patient, doctor, admin]) {
      expect(source).not.toContain("isEditing");
      expect(source).not.toContain("isProfileEditing");
      expect(source).not.toContain("setIsEditing");
      expect(source).not.toContain("setIsProfileEditing");
      expect(source).not.toContain("disabled={!isEditing}");
      expect(source).not.toContain("readOnly={!isEditing}");
      expect(source).not.toContain("disabled={!isProfileEditing}");
      expect(source).not.toContain("readOnly={!isProfileEditing}");
    }
  });

  it("localizes every new profile page copy in Indonesian and English", () => {
    for (const locale of ["id", "en"] as const) {
      expect(dictionary[locale].profile.patient.title).toBeTruthy();
      expect(dictionary[locale].profile.patient.profilingTitle).toBeTruthy();
      expect(dictionary[locale].profile.doctor.title).toBeTruthy();
      expect(dictionary[locale].profile.admin.title).toBeTruthy();
      expect(dictionary[locale].profile.confirm.saveTitle).toBeTruthy();
      expect(dictionary[locale].profile.confirm.cancelTitle).toBeTruthy();
      expect(dictionary[locale].profile.confirm.doctorApprovalTitle).toBeTruthy();
      expect(dictionary[locale].profile.toast.saved).toBeTruthy();
      expect(dictionary[locale].common.saveSuccess).toBeTruthy();
    }
  });

  it("uses Profile wording for role profile card buttons", () => {
    const dictionarySource = readFileSync(new URL("../lib/i18n/dictionary.ts", import.meta.url), "utf8");

    expect(dictionary.id.patient.dashboard.editProfile).toBe("Profil");
    expect(dictionary.en.patient.dashboard.editProfile).toBe("Profile");
    expect(dictionary.id.doctor.dashboard.editProfile).toBe("Profil");
    expect(dictionary.en.doctor.dashboard.editProfile).toBe("Profile");
    expect(dictionarySource).not.toContain('"Edit Profile"');
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
