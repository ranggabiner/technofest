const fallbackPostLoginPath = "/login/role";

const allowedPostLoginPathPrefixes = [
  "/patient",
  "/doctor",
  "/admin",
  "/superadmin",
  "/login/role",
] as const;

export function sanitizePostLoginNextPath(rawPath: string | null | undefined) {
  if (!rawPath || !rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return fallbackPostLoginPath;
  }

  try {
    const nextUrl = new URL(rawPath, "https://medproof.local");
    if (nextUrl.origin !== "https://medproof.local") return fallbackPostLoginPath;

    const path = nextUrl.pathname;
    const isAllowed = allowedPostLoginPathPrefixes.some((prefix) =>
      path === prefix || path.startsWith(`${prefix}/`),
    );
    if (!isAllowed) return fallbackPostLoginPath;

    return `${path}${nextUrl.search}${nextUrl.hash}`;
  } catch {
    return fallbackPostLoginPath;
  }
}

export function postLoginHandoffPath(nextPath: string) {
  return `/auth/complete?next=${encodeURIComponent(sanitizePostLoginNextPath(nextPath))}`;
}
