import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("role profile pages contract", () => {
  const route = (path: string) => new URL(`./${path}`, import.meta.url);
  const readRoute = (path: string) => readFileSync(route(path), "utf8");
  const migrationsSource = () => {
    const migrationsDir = new URL("../../../../apps/supabase/supabase/migrations/", import.meta.url);
    return readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .map((name) => readFileSync(new URL(name, migrationsDir), "utf8"))
      .join("\n");
  };

  it("adds profile routes as thin wrappers", () => {
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

  it("keeps profile-only sidebar structure with portal nav interaction styles", () => {
    const sharedPage = readRoute("_components/role-profile-page.tsx");
    const shell = readRoute("_components/profile-shell.tsx");

    expect(sharedPage).toContain("<ProfileShell");
    expect(sharedPage).not.toContain("PortalLayout");
    expect(sharedPage).not.toContain("PatientLayout");
    expect(sharedPage).not.toContain("AdminLayout");
    expect(sharedPage).not.toContain("DoctorDesktopNavigation");
    expect(sharedPage).not.toContain("DoctorStatusDesktopNavigation");

    expect(shell).toContain("export function ProfileShell");
    expect(shell).toContain('data-profile-shell="role-profile"');
    expect(shell).toContain("md:grid-cols-[260px_1fr]");
    expect(shell).toContain("ArrowLeft");
    expect(shell).toContain("backHref");
    expect(shell).not.toContain("hover:bg-[var(--color-error-red)]");
    expect(shell).toContain("hover:bg-[color-mix(in_srgb,var(--color-teal-primary)_5%,transparent)]");
    expect(shell).toContain("bg-[color-mix(in_srgb,var(--color-teal-primary)_10%,transparent)] text-[var(--color-teal-deep)]");
    expect(shell).toContain("motion.navItem");
    expect(shell).toContain("<SaveStatusToast messages={successToastMessages} />");
    expect(sharedPage).toContain("successToastMessages={copy.common.successToast}");
    expect(shell).toContain('data-profile-confirmation="dialog"');
    expect(shell).not.toContain("ProfileSavedToast");
    expect(shell).not.toContain("PROFILE_TOAST_AUTO_DISMISS_MS");
    expect(shell).not.toContain("removeProfileToastParams");
    expect(shell).toContain("export function ProfilePanel");
    expect(shell).toContain("export function ProfileFormPanel");
    expect(shell).toContain("export function ProfileIdentityPanel");
    expect(shell).toContain("export function ProfileFormControls");
    expect(shell).not.toContain("signOutAction");
    expect(shell).not.toContain("copy.confirm.logoutTitle");
    expect(shell).not.toContain("soft-red");
  });

  it("submits profile photos through the shared profile form instead of preview-only state", () => {
    const shell = readRoute("_components/profile-shell.tsx");
    const patient = readRoute("patient/profile/profile-client.tsx");
    const doctor = readRoute("doctor/profile/profile-client.tsx");
    const admin = readRoute("admin/profile/profile-client.tsx");
    const sharedPage = readRoute("_components/role-profile-page.tsx");

    expect(shell).toContain("inputName");
    expect(shell).toContain("form={formId}");
    expect(shell).toContain('accept="image/jpeg,image/png"');
    expect(shell).toContain('addEventListener("reset"');
    expect(patient).toContain('inputName="profile_photo"');
    expect(doctor).toContain('inputName="profile_photo"');
    expect(admin).toContain("ProfilePhotoPicker");
    expect(admin).toContain('inputName="profile_photo"');
    expect(sharedPage).toContain("avatarUrl={role.avatarUrl}");
  });

  it("optimizes selected profile photos before preview and submission", () => {
    const shell = readRoute("_components/profile-shell.tsx");
    const patient = readRoute("patient/profile/profile-client.tsx");
    const doctor = readRoute("doctor/profile/profile-client.tsx");
    const admin = readRoute("admin/profile/profile-client.tsx");

    expect(shell).toContain("optimizeProfilePhotoFile");
    expect(shell).toContain("new DataTransfer()");
    expect(shell).toContain("dataTransfer.items.add(optimized.file)");
    expect(shell).toContain("input.files = dataTransfer.files");
    expect(shell).toContain("setPreviewSrc(objectUrl)");
    expect(shell).toContain("setCompressionError");
    expect(shell).toContain("onBusyChange?.(true)");
    expect(shell).toContain("onBusyChange?.(false)");
    expect(patient).toContain("uploadErrors={copy.photo.uploadErrors}");
    expect(doctor).toContain("uploadErrors={copy.photo.uploadErrors}");
    expect(admin).toContain("uploadErrors={copy.photo.uploadErrors}");
  });

  it("keeps profile Save actions disabled until form data changes", () => {
    const shell = readRoute("_components/profile-shell.tsx");
    const patient = readRoute("patient/profile/profile-client.tsx");
    const doctor = readRoute("doctor/profile/profile-client.tsx");
    const admin = readRoute("admin/profile/profile-client.tsx");

    expect(shell).toContain("useProfileFormDirty");
    expect(shell).toContain("createProfileFormSnapshot");
    expect(shell).toContain("event.preventDefault()");
    expect(shell).toContain("onDirtyStateChange?.()");
    expect(shell).toContain("window.setTimeout(updateDirtyState, 0)");
    expect(patient).toContain("const profileFormDirty = useProfileFormDirty(formRef)");
    expect(patient).toContain("const profilingFormDirty = useProfileFormDirty(formRef)");
    expect(patient).toContain("disabled={!profileFormDirty.isDirty || isPhotoBusy}");
    expect(patient).toContain("disabled={!profilingFormDirty.isDirty}");
    expect(doctor).toContain("const profileFormDirty = useProfileFormDirty(profileFormRef)");
    expect(doctor).toContain("const lettersFormDirty = useProfileFormDirty(lettersFormRef)");
    expect(doctor).toContain("disabled={!profileFormDirty.isDirty || isPhotoBusy}");
    expect(doctor).toContain("disabled={!lettersFormDirty.isDirty}");
    expect(admin).toContain("const profileFormDirty = useProfileFormDirty(formRef)");
    expect(admin).toContain("disabled={!profileFormDirty.isDirty || isPhotoBusy}");
  });

  it("only includes profile photo payload after a valid optimized photo is selected", () => {
    const shell = readRoute("_components/profile-shell.tsx");

    expect(shell).toContain("const [hasSelectedPhoto, setHasSelectedPhoto] = useState(false)");
    expect(shell).toContain("name={hasSelectedPhoto ? inputName : undefined}");
    expect(shell).toContain('name={`${inputName}_selected`}');
    expect(shell).toContain("input.name = inputName");
    expect(shell).toContain("setHasSelectedPhoto(true)");
    expect(shell).toContain("setHasSelectedPhoto(false)");
    expect(shell).toContain('input.removeAttribute("name")');
    expect(readRoute("patient/profile/actions.ts")).toContain("readSelectedProfilePhotoFile(formData, \"profile_photo\")");
    expect(readRoute("doctor/profile/actions.ts")).toContain("readSelectedProfilePhotoFile(formData, \"profile_photo\")");
    expect(readRoute("admin/profile/actions.ts")).toContain("readSelectedProfilePhotoFile(formData, \"profile_photo\")");
  });

  it("keeps profile fields directly editable without edit buttons", () => {
    const patient = readRoute("patient/profile/profile-client.tsx");
    const doctor = readRoute("doctor/profile/profile-client.tsx");
    const admin = readRoute("admin/profile/profile-client.tsx");

    expect(patient).toContain("ProfileIdentityPanel");
    expect(patient).toContain("ProfileFormPanel");
    expect(doctor).toContain("ProfileIdentityPanel");
    expect(doctor).toContain("ProfileFormPanel");
    expect(admin).toContain("ProfileFormPanel");

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

  it("uses the profile-only layout shape for profile loading skeletons", () => {
    const skeletons = readFileSync(new URL("../components/loading-skeletons.tsx", import.meta.url), "utf8");
    const profileSkeleton = skeletons.slice(
      skeletons.indexOf("export function ProfilePageSkeleton"),
      skeletons.indexOf("export function SuperAdminDashboardSkeleton"),
    );

    expect(profileSkeleton).toContain("md:grid-cols-[260px_1fr]");
    expect(profileSkeleton).toContain("md:border-r");
    expect(profileSkeleton).toContain("max-w-[980px]");
    expect(profileSkeleton).not.toContain("HeaderSkeleton");
    expect(profileSkeleton).not.toContain("max-w-[1400px]");
    expect(profileSkeleton).not.toContain('data-portal-sidebar="navigation"');
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

  it("adds persisted profile photo columns and public profile photo storage", () => {
    const migrations = migrationsSource();
    const types = readFileSync(new URL("../lib/supabase/database.types.ts", import.meta.url), "utf8");

    expect(migrations).toContain("profile-photos");
    expect(migrations).toContain("alter table public.patients");
    expect(migrations).toContain("alter table public.medical_admins");
    expect(migrations).toContain("profile_photo_url text null");
    expect(migrations).toContain("authenticated users upload own profile photos");
    expect(types).toContain("profile_photo_url: string | null");
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
