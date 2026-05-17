export type AuthCallbackError =
  | "oauth_missing_code"
  | "oauth_provider_denied"
  | "oauth_provider_failed"
  | "oauth_exchange_failed"
  | "oauth_user_missing"
  | "oauth_callback_failed";

export function getAuthCallbackError(callbackUrl: URL): AuthCallbackError | null {
  const code = callbackUrl.searchParams.get("code");
  if (code && code.trim().length > 0) return null;

  const providerError = callbackUrl.searchParams.get("error");
  const providerErrorCode = callbackUrl.searchParams.get("error_code");
  const providerErrorDescription = callbackUrl.searchParams.get("error_description");

  if (providerError === "access_denied" || providerErrorCode === "access_denied") {
    return "oauth_provider_denied";
  }

  if (providerError || providerErrorCode || providerErrorDescription) {
    return "oauth_provider_failed";
  }

  return "oauth_missing_code";
}

export function getAuthCallbackErrorReason(callbackUrl: URL): string | null {
  const rawReason =
    callbackUrl.searchParams.get("error_code") ??
    callbackUrl.searchParams.get("error") ??
    callbackUrl.searchParams.get("error_description");

  if (!rawReason) return null;

  const reason = rawReason
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return reason || null;
}
