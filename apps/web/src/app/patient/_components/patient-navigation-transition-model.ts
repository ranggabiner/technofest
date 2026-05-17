import {
  portalPendingSkeletonKey,
  resolvePortalNavigationPath,
  type PortalNavigationTarget,
} from "@/app/_components/portal-navigation-model";

export type PatientPendingSkeletonKey = "dashboard" | "access" | "health-history";

export const patientNavigationTargets: readonly PortalNavigationTarget<PatientPendingSkeletonKey>[] = [
  { href: "/patient/access", skeleton: "access", matchNested: true },
  { href: "/patient/health-history/records", skeleton: "health-history", matchNested: false },
  { href: "/patient/health-history", skeleton: "health-history", matchNested: false },
  { href: "/patient", skeleton: "dashboard", matchNested: false },
];

export function resolvePatientNavigationPath(href: string, currentPath: string) {
  return resolvePortalNavigationPath(href, currentPath, patientNavigationTargets);
}

export function patientPendingSkeletonKey(path: string): PatientPendingSkeletonKey | null {
  return portalPendingSkeletonKey(path, patientNavigationTargets);
}
