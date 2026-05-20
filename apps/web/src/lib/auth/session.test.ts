import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieRows: [] as Array<{ name: string; value: string }>,
  createClient: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    delete: vi.fn(),
    get: vi.fn(),
    getAll: () => mocks.cookieRows,
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { redirectAuthenticatedUserFromPublicRoute } from "./session";

describe("public route auth redirects", () => {
  beforeEach(() => {
    mocks.cookieRows = [];
    mocks.createClient.mockReset();
    mocks.getUser.mockReset();
    mocks.redirect.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: mocks.getUser,
      },
    });
  });

  it("skips Supabase user lookup when the request has no Supabase auth cookie", async () => {
    await redirectAuthenticatedUserFromPublicRoute();

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
