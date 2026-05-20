import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import {
  isSupabaseAuthCookieName,
  isSupabaseRefreshTokenMissingError,
  isSupabaseStaleSessionError,
  updateSession,
} from "./proxy";

describe("Supabase SSR proxy helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    mocks.createServerClient.mockReset();
    mocks.getClaims.mockReset();
    mocks.getUser.mockReset();
    mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.createServerClient.mockReturnValue({
      auth: {
        getClaims: mocks.getClaims,
        getUser: mocks.getUser,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("skips Supabase client work when the request has no Supabase auth cookie", async () => {
    await updateSession(createRequest([]));

    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(mocks.getClaims).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("refreshes cookie-bearing requests with getClaims instead of getUser", async () => {
    await updateSession(createRequest([{ name: "sb-demo-ref-auth-token", value: "token" }]));

    expect(mocks.createServerClient).toHaveBeenCalledTimes(1);
    expect(mocks.getClaims).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});

function createRequest(cookies: Array<{ name: string; value: string }>) {
  const store = new Map(cookies.map((cookie) => [cookie.name, cookie.value]));

  return {
    cookies: {
      getAll: () => Array.from(store, ([name, value]) => ({ name, value })),
      set: (name: string, value: string) => {
        store.set(name, value);
      },
      delete: (name: string) => {
        store.delete(name);
      },
    },
  } as never;
}
