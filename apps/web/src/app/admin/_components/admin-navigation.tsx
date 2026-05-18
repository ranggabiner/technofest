"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  PortalDesktopNavigation,
  PortalMobileNavigation,
  PortalNavigationContent,
  usePortalNavigationTransition,
} from "@/app/_components/portal-navigation";
import type { AdminLevel } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { adminNavItems } from "./admin-nav-model";
import { adminPendingSkeletonKey } from "./admin-navigation-transition-model";

const AdminAddAdminSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.AdminAddAdminSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const AdminApprovalSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.AdminApprovalSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const AdminDashboardSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.AdminDashboardSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const AdminDoctorDetailSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.AdminDoctorDetailSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);

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

function PendingSkeletonFallback() {
  return (
    <div className="grid min-h-[360px] animate-pulse gap-4">
      <div className="h-28 rounded-[10px] bg-[var(--color-stone-surface)]" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-40 rounded-[10px] bg-[var(--color-stone-surface)]" />
        <div className="h-40 rounded-[10px] bg-[var(--color-stone-surface)]" />
      </div>
      <div className="h-32 rounded-[10px] bg-[var(--color-stone-surface)]" />
    </div>
  );
}
