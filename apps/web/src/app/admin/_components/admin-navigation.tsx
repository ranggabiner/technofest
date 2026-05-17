"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  PortalDesktopNavigation,
  PortalMobileNavigation,
  PortalNavigationContent,
  usePortalNavigationTransition,
} from "@/app/_components/portal-navigation";
import {
  AdminAddAdminSkeleton,
  AdminApprovalSkeleton,
  AdminDashboardSkeleton,
  AdminDoctorDetailSkeleton,
} from "@/components/loading-skeletons";
import type { AdminLevel } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { adminNavItems } from "./admin-nav-model";
import { adminPendingSkeletonKey } from "./admin-navigation-transition-model";

export function AdminDesktopNavigation({ adminLevel, copy }: { adminLevel: AdminLevel; copy: Dictionary }) {
  const pathname = usePathname() ?? "/admin/dashboard";
  const { pendingPath } = usePortalNavigationTransition();
  const navItems = adminNavItems(pendingPath ?? pathname, copy, adminLevel);

  return (
    <PortalDesktopNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      sectionLabel={copy.admin.doctors.title}
    />
  );
}

export function AdminMobileNavigation({ adminLevel, copy }: { adminLevel: AdminLevel; copy: Dictionary }) {
  const pathname = usePathname() ?? "/admin/dashboard";
  const { pendingPath } = usePortalNavigationTransition();
  const navItems = adminNavItems(pendingPath ?? pathname, copy, adminLevel);

  return (
    <PortalMobileNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      role="admin"
    />
  );
}

export function AdminNavigationContent({ children }: { children: ReactNode }) {
  return (
    <PortalNavigationContent
      dataPendingAttribute="data-admin-main-pending"
      renderSkeleton={renderPendingSkeleton}
    >
      {children}
    </PortalNavigationContent>
  );
}

function renderPendingSkeleton(path: string) {
  const key = adminPendingSkeletonKey(path);

  if (key === "dashboard") return <AdminDashboardSkeleton />;
  if (key === "approval") return <AdminApprovalSkeleton />;
  if (key === "add-admin") return <AdminAddAdminSkeleton />;
  if (key === "doctor-detail") return <AdminDoctorDetailSkeleton />;
  return null;
}
