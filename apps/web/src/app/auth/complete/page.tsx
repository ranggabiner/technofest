import { sanitizePostLoginNextPath } from "@/lib/auth/post-login";

import { PostLoginDestinationSkeleton } from "./post-login-destination-skeleton";
import { PostLoginRedirect } from "./post-login-redirect";

type AuthCompleteSearchParams = {
  next?: string | string[];
};

export const dynamic = "force-dynamic";

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams?: Promise<AuthCompleteSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const rawNextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizePostLoginNextPath(rawNextPath);

  return (
    <>
      <PostLoginDestinationSkeleton nextPath={nextPath} />
      <PostLoginRedirect nextPath={nextPath} />
    </>
  );
}
