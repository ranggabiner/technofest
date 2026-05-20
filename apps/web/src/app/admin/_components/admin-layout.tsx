import type { ReactNode } from "react";

import {
  PortalForbiddenLayout,
  PortalLayout,
} from "@/app/_components/portal-layout";
import type { ResolvedRole } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { AdminDesktopNavigation, AdminMobileNavigation, AdminNavigationContent } from "./admin-navigation";
import { adminNavigationTargets } from "./admin-navigation-transition-model";

export function AdminLayout({
  children,
  copy,
  role,
}: {
  children: ReactNode;
  copy: Dictionary;
  role: ResolvedRole;
}) {
  if (role.kind !== "medical_admin") {
    return <PortalForbiddenLayout title={copy.admin.dashboard.title} role={role} />;
  }

  return (
    <PortalLayout
      copy={copy}
      desktopNavigation={<AdminDesktopNavigation adminLevel={role.adminLevel} copy={copy} />}
      mobileNavigation={<AdminMobileNavigation adminLevel={role.adminLevel} copy={copy} />}
      navigationTargets={adminNavigationTargets}
      profileHref={role.adminLevel === "superadmin" ? "/superadmin/profile" : "/admin/profile"}
      profileLabel={copy.profile.shell.profile}
      role="admin"
      sectionLabel={copy.admin.doctors.title}
      title={copy.admin.dashboard.title}
      userAvatarUrl={role.avatarUrl}
      userEmail={role.email}
      userName={role.fullName}
    >
      <AdminNavigationContent>{children}</AdminNavigationContent>
    </PortalLayout>
  );
}
