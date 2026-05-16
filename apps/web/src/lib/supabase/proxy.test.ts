import { describe, expect, it } from "vitest";

import {
  isSupabaseAuthCookieName,
  isSupabaseRefreshTokenMissingError,
  isSupabaseStaleSessionError,
} from "./proxy";

describe("Supabase SSR proxy helpers", () => {
  it("detects Supabase auth cookies and chunked auth cookies", () => {
    expect(isSupabaseAuthCookieName("sb-demo-ref-auth-token")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-demo-ref-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-demo-ref-auth-token-code-verifier")).toBe(false);
    expect(isSupabaseAuthCookieName("theme")).toBe(false);
  });

  it("detects stale refresh-token errors without relying on thrown AuthApiError classes", () => {
    expect(isSupabaseRefreshTokenMissingError({ code: "refresh_token_not_found" })).toBe(true);
    expect(isSupabaseRefreshTokenMissingError({ code: "other_auth_error" })).toBe(false);
    expect(isSupabaseRefreshTokenMissingError(null)).toBe(false);
  });

  it("detects stale sessions after local database resets", () => {
    expect(isSupabaseStaleSessionError({ code: "refresh_token_not_found" })).toBe(true);
    expect(isSupabaseStaleSessionError({ code: "user_not_found" })).toBe(true);
    expect(isSupabaseStaleSessionError({ code: "other_auth_error" })).toBe(false);
    expect(isSupabaseStaleSessionError(null)).toBe(false);
  });
});
