export type PortalNavigationTarget<SkeletonKey extends string = string> = {
  href: string;
  skeleton: SkeletonKey;
  matchNested: boolean;
};

const SAME_ORIGIN_BASE = "https://medproof.local";

export function resolvePortalNavigationPath(
  href: string,
  currentPath: string,
  targets: readonly PortalNavigationTarget[],
) {
  const path = normalizeSameOriginPath(href);
  if (!path || !portalPendingSkeletonKey(path, targets)) return null;

  return path === normalizePath(currentPath) ? null : path;
}

export function portalPendingSkeletonKey<SkeletonKey extends string>(
  path: string,
  targets: readonly PortalNavigationTarget<SkeletonKey>[],
): SkeletonKey | null {
  const normalizedPath = normalizePath(path);
  const target = targets.find(({ href, matchNested }) => {
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
