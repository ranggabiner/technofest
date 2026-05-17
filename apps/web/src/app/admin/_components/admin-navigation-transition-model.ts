import {
  portalPendingSkeletonKey,
  resolvePortalNavigationPath,
  type PortalNavigationTarget,
} from "@/app/_components/portal-navigation-model";

export type AdminPendingSkeletonKey = "dashboard" | "approval" | "add-admin" | "doctor-detail";

export const adminNavigationTargets: readonly PortalNavigationTarget<AdminPendingSkeletonKey>[] = [
  { href: "/admin/doctors", skeleton: "doctor-detail", matchNested: true },
  { href: "/admin/add-admin", skeleton: "add-admin", matchNested: true },
  { href: "/admin/approval", skeleton: "approval", matchNested: true },
  { href: "/admin/dashboard", skeleton: "dashboard", matchNested: false },
  { href: "/superadmin/dashboard", skeleton: "dashboard", matchNested: false },
];

export function resolveAdminNavigationPath(href: string, currentPath: string) {
  return resolvePortalNavigationPath(href, currentPath, adminNavigationTargets);
}

export function adminPendingSkeletonKey(path: string): AdminPendingSkeletonKey | null {
  return portalPendingSkeletonKey(path, adminNavigationTargets);
}
