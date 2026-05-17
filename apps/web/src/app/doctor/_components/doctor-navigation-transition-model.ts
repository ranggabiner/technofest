import {
  portalPendingSkeletonKey,
  resolvePortalNavigationPath,
  type PortalNavigationTarget,
} from "@/app/_components/portal-navigation-model";

export type DoctorPendingSkeletonKey = "dashboard" | "medical-record-library" | "grant";

export const doctorNavigationTargets: readonly PortalNavigationTarget<DoctorPendingSkeletonKey>[] = [
  { href: "/doctor/grants", skeleton: "grant", matchNested: true },
  { href: "/doctor/medical-record-library", skeleton: "medical-record-library", matchNested: true },
  { href: "/doctor", skeleton: "dashboard", matchNested: false },
];

export function resolveDoctorNavigationPath(href: string, currentPath: string) {
  return resolvePortalNavigationPath(href, currentPath, doctorNavigationTargets);
}

export function doctorPendingSkeletonKey(path: string): DoctorPendingSkeletonKey | null {
  return portalPendingSkeletonKey(path, doctorNavigationTargets);
}
