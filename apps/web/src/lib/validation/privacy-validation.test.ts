import { describe, expect, it } from "vitest";

import {
  getPrivacyValidationConfig,
  isSchemaCacheMiss,
  withSchemaCacheRetry,
} from "../../../scripts/validate-privacy-helpers.mjs";

describe("privacy validation config", () => {
  it("rejects a Supabase URL that does not match SUPABASE_PROJECT_REF", () => {
    expect(() =>
      getPrivacyValidationConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://prod-ref.supabase.co",
        SUPABASE_PROJECT_REF: "staging-ref",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      }),
    ).toThrow(/does not match SUPABASE_PROJECT_REF/);
  });

  it("allows localhost only for the local Supabase project ref", () => {
    expect(
      getPrivacyValidationConfig({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
        SUPABASE_PROJECT_REF: "local",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      }).supabaseUrl,
    ).toBe("http://127.0.0.1:55321");
  });
});

describe("privacy validation schema cache retry", () => {
  it("recognizes PostgREST schema cache misses", () => {
    expect(isSchemaCacheMiss({ code: "PGRST205", message: "Could not find the table" })).toBe(true);
    expect(isSchemaCacheMiss({ message: "Could not find public.patients in the schema cache" })).toBe(true);
    expect(isSchemaCacheMiss({ code: "42501", message: "permission denied for table patients" })).toBe(false);
  });

  it("retries schema cache misses and returns the first successful result", async () => {
    let attempts = 0;

    const result = await withSchemaCacheRetry(
      "patients",
      async () => {
        attempts += 1;
        if (attempts < 3) {
          return {
            data: null,
            error: { code: "PGRST205", message: "Could not find public.patients in the schema cache" },
          };
        }

        return { data: [], error: null };
      },
      { maxAttempts: 3, sleep: async () => undefined },
    );

    expect(result).toEqual({ data: [], error: null });
    expect(attempts).toBe(3);
  });

  it("does not retry non-cache validation errors", async () => {
    let attempts = 0;

    const result = await withSchemaCacheRetry(
      "patients",
      async () => {
        attempts += 1;
        return { data: null, error: { code: "42501", message: "permission denied for table patients" } };
      },
      { maxAttempts: 3, sleep: async () => undefined },
    );

    expect(result.error?.message).toBe("permission denied for table patients");
    expect(attempts).toBe(1);
  });
});
