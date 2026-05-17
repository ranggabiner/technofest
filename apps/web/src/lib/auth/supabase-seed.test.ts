import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Supabase auth seed data", () => {
  it("normalizes manually seeded OAuth users for Supabase Auth lookups", () => {
    const seedSource = readFileSync(
      new URL("../../../../supabase/supabase/seed.sql", import.meta.url),
      "utf8",
    );

    expect(seedSource).toContain("confirmation_token = coalesce(confirmation_token, '')");
    expect(seedSource).toContain("recovery_token = coalesce(recovery_token, '')");
    expect(seedSource).toContain("email_change_token_new = coalesce(email_change_token_new, '')");
    expect(seedSource).toContain("email_change = coalesce(email_change, '')");
  });

  it("does not seed real Google admin accounts without provider identities", () => {
    const seedSource = readFileSync(
      new URL("../../../../supabase/supabase/seed.sql", import.meta.url),
      "utf8",
    );

    expect(seedSource).not.toContain("ranggabiner@gmail.com");
    expect(seedSource).not.toContain("00000000-0000-0000-0000-000000000901");
  });
});
