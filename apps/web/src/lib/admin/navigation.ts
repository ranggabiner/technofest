import type { Dictionary } from "@/lib/i18n/dictionary";

export type AdminNavKey = "dashboard" | "approval" | "addAdmin";

export function adminNavItems(copy: Dictionary, active: AdminNavKey) {
  return [
    {
      href: "/admin/dashboard",
      label: copy.admin.nav.dashboard,
      active: active === "dashboard",
    },
    {
      href: "/admin/approval",
      label: copy.admin.nav.approvalManagement,
      active: active === "approval",
    },
    {
      href: "/admin/add-admin",
      label: copy.admin.nav.addAdmin,
      active: active === "addAdmin",
    },
  ];
}
