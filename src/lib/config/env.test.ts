import { describe, expect, it } from "vitest";

import { parseEnv, parseAdminEmailAllowlist } from "./env";

describe("env parsing", () => {
  it("normalizes admin allowlist emails", () => {
    expect(parseAdminEmailAllowlist("Admin@Example.com, doctor@example.com ")).toEqual([
      "admin@example.com",
      "doctor@example.com",
    ]);
  });

  it("requires feature-scoped env groups only when requested", () => {
    const base = {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      ADMIN_EMAIL_ALLOWLIST: "admin@example.com",
      ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 1).toString("base64"),
      HASH_PEPPER: "local-pepper-value",
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "MedProof <noreply@example.com>",
    };

    expect(parseEnv(base, ["core", "email"]).ok).toBe(true);
    expect(parseEnv(base, ["blockchain"]).ok).toBe(false);
  });
});
