import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";
import { resolveRoleFromRows, roleEntryPath, roleHomePath } from "@/lib/auth/roles";

const appDir = join(process.cwd(), "src", "app");
const repoRoot = join(process.cwd(), "..", "..");

function route(relativePath: string) {
  return readFileSync(join(appDir, relativePath), "utf8");
}

function migrationsSource() {
  const migrationsDir = join(repoRoot, "apps", "supabase", "supabase", "migrations");
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => readFileSync(join(migrationsDir, name), "utf8"))
    .join("\n");
}

describe("admin pages contract", () => {
  const adminPortalRouteFiles = [
    "admin/(portal)/dashboard/page.tsx",
    "admin/(portal)/approval/page.tsx",
    "admin/(portal)/add-admin/page.tsx",
    "admin/(portal)/doctors/[doctorId]/page.tsx",
  ];
  const adminPortalLoadingFiles = [
    "admin/(portal)/dashboard/loading.tsx",
    "admin/(portal)/approval/loading.tsx",
    "admin/(portal)/add-admin/loading.tsx",
    "admin/(portal)/doctors/[doctorId]/loading.tsx",
  ];

  it("routes admins to dashboard and keeps legacy doctor queue as approval alias", () => {
    const role = resolveRoleFromRows({
      authUserId: "admin-user",
      email: "admin@example.com",
      fullName: "Admin Demo",
      adminAllowlist: ["admin@example.com"],
      intent: null,
      patient: null,
      doctor: null,
      admin: {
        admin_id: "admin-1",
        email: "admin@example.com",
        full_name: "Admin Demo",
        admin_role: "superadmin",
        revoked_at: null,
      },
    });

    expect(role).not.toBeNull();
    expect(role).toMatchObject({ kind: "medical_admin", adminLevel: "superadmin" });
    expect(roleHomePath(role!)).toBe("/superadmin/dashboard");
    expect(roleEntryPath(role!)).toBe("/superadmin/dashboard");
    expect(route("admin/doctors/page.tsx")).toContain('redirect("/admin/approval")');
  });

  it("accepts invited admins after Google login without adding them to the env allowlist", () => {
    const role = resolveRoleFromRows({
      authUserId: "invited-user",
      email: "invited@example.com",
      fullName: "Invited Admin",
      adminAllowlist: [],
      intent: null,
      patient: null,
      doctor: null,
      admin: null,
      adminInvitation: {
        invitation_id: "invite-1",
        email: "invited@example.com",
        accepted_at: null,
        revoked_at: null,
      },
    } as Parameters<typeof resolveRoleFromRows>[0]);

    expect(role?.kind).toBe("medical_admin");
    expect(role).toMatchObject({ adminLevel: "admin" });
    expect(roleHomePath(role!)).toBe("/admin/dashboard");
  });

  it("mounts superadmin dashboard separately while reusing admin portal protections", () => {
    expect(existsSync(join(appDir, "superadmin/page.tsx"))).toBe(true);
    expect(existsSync(join(appDir, "superadmin/dashboard/page.tsx"))).toBe(true);
    expect(existsSync(join(appDir, "superadmin/profile/page.tsx"))).toBe(true);

    const superadminIndex = route("superadmin/page.tsx");
    const superadminDashboard = route("superadmin/dashboard/page.tsx");
    const superadminProfile = route("superadmin/profile/page.tsx");

    expect(superadminIndex).toContain('redirect("/superadmin/dashboard")');
    expect(superadminDashboard).toContain("requireSuperAdminRole");
    expect(superadminDashboard).toContain("AdminLayout");
    expect(superadminDashboard).toContain("loadAdminDashboardState");
    expect(superadminDashboard).toContain("AdminDashboardContent");
    expect(superadminDashboard).not.toContain("function StatCard");
    expect(superadminDashboard).not.toContain("function describeDashboardAudit");
    expect(superadminProfile).toContain('<RoleProfilePage routeRole="superadmin" />');
  });

  it("mounts the shared admin shell in a persistent portal layout", () => {
    const layout = route("admin/(portal)/layout.tsx");
    const adminLayout = route("admin/_components/admin-layout.tsx");
    const sharedLayout = route("_components/portal-layout.tsx");

    expect(layout).toContain("AdminLayout");
    expect(layout).toContain("children");
    expect(adminLayout).toContain("PortalLayout");
    expect(adminLayout).toContain("PortalForbiddenLayout");
    expect(adminLayout).toContain('role.adminLevel === "superadmin" ? "/superadmin/profile" : "/admin/profile"');
    expect(adminLayout).toContain("profileLabel={copy.profile.shell.profile}");
    expect(sharedLayout).toContain("data-portal-layout");
    expect(sharedLayout).toContain("data-portal-sidebar");
  });

  it.each(adminPortalRouteFiles)("%s keeps route UI content-only", (path) => {
    const source = route(path);

    expect(source).not.toContain("AppShell");
    expect(source).not.toContain("ForbiddenState");
    expect(source).not.toContain("requireRole");
    expect(source).not.toContain("adminNavItems");
  });

  it.each(adminPortalLoadingFiles)("%s keeps loading UI content-only", (path) => {
    const source = route(path);

    expect(source).not.toContain("AppShellSkeleton");
    expect(source).not.toContain("data-admin-sidebar");
    expect(source).not.toContain("HeaderSkeleton");
  });

  it("adds admin dashboard, approval, and add-admin pages with shared review modal", () => {
    for (const path of adminPortalRouteFiles) {
      expect(existsSync(join(appDir, path)), path).toBe(true);
    }

    const dashboard = route("admin/(portal)/dashboard/page.tsx");
    const approval = route("admin/(portal)/approval/page.tsx");
    const addAdminPage = route("admin/(portal)/add-admin/page.tsx");
    const dashboardContent = route("admin/_components/admin-dashboard-content.tsx");
    const addAdmin = route("admin/(portal)/add-admin/add-admin-form.tsx");
    const addAdminList = route("admin/(portal)/add-admin/admin-invitations-list.tsx");
    const addAdminActions = route("admin/(portal)/add-admin/actions.ts");
    const addAdminFormState = route("admin/(portal)/add-admin/form-state.ts");
    const modal = route("admin/_components/admin-review-modal.tsx");

    expect(dashboard).toContain("loadAdminDashboardState");
    expect(dashboard).toContain("AdminDashboardContent");
    expect(dashboard).not.toContain("function StatCard");
    expect(dashboard).not.toContain("function describeDashboardAudit");
    expect(dashboardContent).toContain("export function AdminDashboardContent");
    expect(dashboardContent).toContain("copy.admin.dashboard.priorityQueue");
    expect(dashboardContent).toContain("copy.admin.dashboard.auditTrail");
    expect(dashboardContent).toContain("successMessage=");
    expect(dashboardContent).toContain("copy.common.successToast.blockchainRetryCompleted");
    expect(dashboardContent).toContain("function describeDashboardAudit");
    expect(approval).toContain("loadAdminApprovalState");
    expect(approval).toContain("rowsPerPageOptions");
    expect(addAdminPage).toContain("loadAdminInvitationsState");
    expect(addAdminPage).toContain("AdminInvitationList");
    expect(addAdminPage).toContain("adminLevel");
    expect(addAdmin).toContain("inviteAdminAction");
    expect(addAdmin).toContain("AppToast");
    expect(addAdmin).toContain("triggerKey={state}");
    expect(addAdmin).toContain('state.status === "success" || state.status === "warning"');
    expect(addAdmin).toContain("color-warning-text");
    expect(addAdminList).toContain("useActionState");
    expect(addAdminList).toContain("revokeAdminInvitationAction");
    expect(addAdminList).toContain("AppToast");
    expect(addAdminList).toContain("toastMessage");
    expect(addAdminList).toContain('from "./form-state"');
    expect(addAdminActions).toContain("requireSuperAdminRole");
    expect(addAdminActions).toContain("sendAdminInvitationEmail");
    expect(addAdminActions).toContain("getLoginUrl");
    expect(addAdminActions).toContain("revokeAdminInvitationAction");
    expect(addAdminActions).not.toContain("export const initialRevokeAdminInvitationFormState");
    expect(addAdminFormState).toContain('"warning"');
    expect(addAdminFormState).toContain("export type RevokeAdminInvitationFormState");
    expect(addAdminFormState).toContain("export const initialRevokeAdminInvitationFormState");
    expect(modal).toContain("data-admin-review-modal");
    expect(modal).toContain("data-document-preview-lightbox");
    expect(modal).toContain("download");
  });

  it("uses mobile card lists and viewport-safe dialogs for admin review flows", () => {
    const table = route("admin/_components/admin-doctor-table.tsx");
    const modal = route("admin/_components/admin-review-modal.tsx");
    const skeleton = readFileSync(join(appDir, "../components/loading-skeletons.tsx"), "utf8");

    expect(table).toContain("data-admin-doctor-cards");
    expect(table).toContain("md:hidden");
    expect(table).toContain("hidden overflow-x-auto md:block");
    expect(table).toContain("w-full rounded-[10px]");
    expect(modal).toContain("max-h-[calc(100dvh-2rem)]");
    expect(modal).toContain("h-[calc(100dvh-2rem)]");
    expect(modal).toContain("grid gap-2 sm:flex sm:justify-end");
    expect(skeleton).toContain("data-skeleton-mobile-cards");
    expect(skeleton).toContain("data-skeleton-desktop-table");
  });

  it("keeps admin navigation path-driven like the patient portal", () => {
    const adminNavigation = route("admin/_components/admin-nav-model.ts");

    expect(adminNavigation).toContain("activePath");
    expect(adminNavigation).toContain("/admin/dashboard");
    expect(adminNavigation).toContain("/admin/approval");
    expect(adminNavigation).toContain("/admin/add-admin");
    expect(adminNavigation).toContain("adminLevel");
    expect(adminNavigation).toContain('"superadmin"');
    expect(adminNavigation).toContain("isActiveAdminPath");
    expect(adminNavigation).not.toContain("AdminNavKey");
  });

  it("stores admin invitations with superadmin-only soft revoke controls", () => {
    const source = migrationsSource();

    expect(source).toContain("create table if not exists public.admin_invitations");
    expect(source).toContain("admin_role text not null");
    expect(source).toContain("admin_role in ('superadmin', 'admin')");
    expect(source).toContain("email text not null");
    expect(source).toContain("lower(email) = email");
    expect(source).toContain("revoked_at timestamptz null");
    expect(source).toContain("revoked_by uuid null");
    expect(source).toContain("foreign key (revoked_by) references public.medical_admins(admin_id)");
    expect(source).toContain("create unique index if not exists admin_invitations_active_email_key");
    expect(source).toContain("where revoked_at is null");
    expect(source).toContain("create or replace function private.current_superadmin_id()");
    expect(source).toContain("alter table public.admin_invitations enable row level security");
    expect(source).toContain("grant select, insert on public.admin_invitations to authenticated");
    expect(source).toContain("grant select, insert, update on public.admin_invitations to service_role");
    expect(source).not.toContain("grant all on public.admin_invitations");
  });

  it("localizes admin dashboard, approval, modal, pagination, and invite copy", () => {
    for (const locale of ["id", "en"] as const) {
      expect(dictionary[locale].admin.nav.dashboard).toBeTruthy();
      expect(dictionary[locale].admin.nav.approvalManagement).toBeTruthy();
      expect(dictionary[locale].admin.nav.addAdmin).toBeTruthy();
      expect(dictionary[locale].admin.dashboard.pendingVerification).toBeTruthy();
      expect(dictionary[locale].admin.dashboard.priorityQueue).toBeTruthy();
      expect(dictionary[locale].admin.approval.rowsPerPage).toBeTruthy();
      expect(dictionary[locale].admin.review.acceptApproval).toBeTruthy();
      expect(dictionary[locale].admin.addAdmin.success).toBeTruthy();
      expect(dictionary[locale].admin.addAdmin.emailSendFailed).toBeTruthy();
      expect(dictionary[locale].admin.addAdmin.noAdmins).toBeTruthy();
      expect(dictionary[locale].admin.addAdmin.revoke).toBeTruthy();
      expect(dictionary[locale].common.successToast.adminInvitationCreated).toBeTruthy();
      expect(dictionary[locale].common.successToast.adminAccessRevoked).toBeTruthy();
      expect(dictionary[locale].admin.addAdmin.superadminRequired).toBeTruthy();
    }
  });
});
