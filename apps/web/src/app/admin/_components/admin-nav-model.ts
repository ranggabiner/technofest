import { Grid2X2, ShieldCheck, UserPlus, type LucideIcon } from "lucide-react";

import type { AdminLevel } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";

export type AdminNavItem = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
};

export function adminNavItems(activePath: string, copy: Dictionary, adminLevel: AdminLevel): AdminNavItem[] {
  const dashboardHref = adminLevel === "superadmin" ? "/superadmin/dashboard" : "/admin/dashboard";
  const items = [
    { href: dashboardHref, label: copy.admin.nav.dashboard, icon: Grid2X2 },
    { href: "/admin/approval", label: copy.admin.nav.approvalManagement, icon: ShieldCheck },
    ...(adminLevel === "superadmin"
      ? [{ href: "/admin/add-admin", label: copy.admin.nav.addAdmin, icon: UserPlus }]
      : []),
  ];

  return items.map((item) => ({
    ...item,
    active: isActiveAdminPath(activePath, item.href),
  }));
}

function isActiveAdminPath(activePath: string, href: string) {
  if (href === "/admin/dashboard" || href === "/superadmin/dashboard") return activePath === href;
  if (href === "/admin/approval") {
    return (
      activePath === href ||
      activePath.startsWith(`${href}/`) ||
      activePath === "/admin/doctors" ||
      activePath.startsWith("/admin/doctors/")
    );
  }
  return activePath === href || activePath.startsWith(`${href}/`);
}
