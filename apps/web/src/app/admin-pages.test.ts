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
  it("routes admins to dashboard and keeps legacy doctor queue as approval alias", () => {
    const role = resolveRoleFromRows({
      authUserId: "admin-user",
      email: "admin@example.com",
      fullName: "Admin Demo",
      adminAllowlist: ["admin@example.com"],
      intent: null,
      patient: null,
      doctor: null,
      admin: { admin_id: "admin-1", email: "admin@example.com", full_name: "Admin Demo" },
    });

    expect(role).not.toBeNull();
    expect(roleHomePath(role!)).toBe("/admin/dashboard");
    expect(roleEntryPath(role!)).toBe("/admin/dashboard");
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
      },
    } as Parameters<typeof resolveRoleFromRows>[0]);

    expect(role?.kind).toBe("medical_admin");
    expect(roleHomePath(role!)).toBe("/admin/dashboard");
  });

  it("adds admin dashboard, approval, and add-admin pages with shared review modal", () => {
    for (const path of [
      "admin/dashboard/page.tsx",
      "admin/approval/page.tsx",
      "admin/add-admin/page.tsx",
    ]) {
      expect(existsSync(join(appDir, path)), path).toBe(true);
      expect(route(path), path).toContain("adminNavItems");
    }

    const dashboard = route("admin/dashboard/page.tsx");
    const approval = route("admin/approval/page.tsx");
    const addAdmin = route("admin/add-admin/add-admin-form.tsx");
    const modal = route("admin/_components/admin-review-modal.tsx");

    expect(dashboard).toContain("loadAdminDashboardState");
    expect(dashboard).toContain("copy.admin.dashboard.priorityQueue");
    expect(dashboard).toContain("copy.admin.dashboard.auditTrail");
    expect(approval).toContain("loadAdminApprovalState");
    expect(approval).toContain("rowsPerPageOptions");
    expect(addAdmin).toContain("inviteAdminAction");
    expect(modal).toContain("data-admin-review-modal");
    expect(modal).toContain("data-document-preview-lightbox");
    expect(modal).toContain("download");
  });

  it("stores admin invitations with RLS, explicit grants, and lowercase unique email", () => {
    const source = migrationsSource();

    expect(source).toContain("create table if not exists public.admin_invitations");
    expect(source).toContain("email text not null");
    expect(source).toContain("lower(email) = email");
    expect(source).toContain("create unique index if not exists admin_invitations_email_key");
    expect(source).toContain("alter table public.admin_invitations enable row level security");
    expect(source).toContain("grant select, insert on public.admin_invitations to authenticated");
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
    }
  });
});
