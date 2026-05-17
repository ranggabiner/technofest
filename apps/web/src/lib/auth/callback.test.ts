import { describe, expect, it } from "vitest";

import { getAuthCallbackError, getAuthCallbackErrorReason } from "./callback";

describe("OAuth callback error classification", () => {
  it("allows callbacks that carry an exchange code", () => {
    const callbackUrl = new URL("http://localhost:3000/auth/callback?code=abc123");

    expect(getAuthCallbackError(callbackUrl)).toBeNull();
    expect(getAuthCallbackErrorReason(callbackUrl)).toBeNull();
  });

  it("classifies denied provider callbacks before the generic missing-code error", () => {
    const callbackUrl = new URL(
      "http://localhost:3000/auth/callback?error=access_denied&error_code=user_cancelled",
    );

    expect(getAuthCallbackError(callbackUrl)).toBe("oauth_provider_denied");
    expect(getAuthCallbackErrorReason(callbackUrl)).toBe("user_cancelled");
  });

  it("classifies provider failures with sanitized diagnostic reason", () => {
    const callbackUrl = new URL(
      "http://localhost:3000/auth/callback?error=server_error&error_description=OAuth%20State%20Mismatch!",
    );

    expect(getAuthCallbackError(callbackUrl)).toBe("oauth_provider_failed");
    expect(getAuthCallbackErrorReason(callbackUrl)).toBe("server_error");
  });

  it("keeps truly empty callbacks as missing code", () => {
    const callbackUrl = new URL("http://localhost:3000/auth/callback");

    expect(getAuthCallbackError(callbackUrl)).toBe("oauth_missing_code");
    expect(getAuthCallbackErrorReason(callbackUrl)).toBeNull();
  });
});
