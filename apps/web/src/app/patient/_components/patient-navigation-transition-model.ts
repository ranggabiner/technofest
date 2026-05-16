export type PatientPendingSkeletonKey = "dashboard" | "access";

const SAME_ORIGIN_BASE = "https://medproof.local";

const PATIENT_PORTAL_TARGETS: Array<{
  href: string;
  skeleton: PatientPendingSkeletonKey;
  matchNested: boolean;
}> = [
  { href: "/patient/access", skeleton: "access", matchNested: true },
  { href: "/patient", skeleton: "dashboard", matchNested: false },
];

export function resolvePatientNavigationPath(href: string, currentPath: string) {
  const path = normalizeSameOriginPath(href);
  if (!path || !patientPendingSkeletonKey(path)) return null;

  return path === normalizePath(currentPath) ? null : path;
}

export function patientPendingSkeletonKey(path: string): PatientPendingSkeletonKey | null {
  const normalizedPath = normalizePath(path);
  const target = PATIENT_PORTAL_TARGETS.find(({ href, matchNested }) => {
    if (normalizedPath === href) return true;
    return matchNested && normalizedPath.startsWith(`${href}/`);
  });

  return target?.skeleton ?? null;
}

function normalizeSameOriginPath(href: string) {
  try {
    const url = new URL(href, SAME_ORIGIN_BASE);
    if (url.origin !== SAME_ORIGIN_BASE) return null;
    return normalizePath(url.pathname);
  } catch {
    return null;
  }
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}
