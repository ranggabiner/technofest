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

  it("seeds only documented demo password users through Supabase Auth identities", () => {
    const seedSource = readFileSync(
      new URL("../../../../supabase/supabase/seed.sql", import.meta.url),
      "utf8",
    );

    for (const email of ["dokter@test.com", "pasien@test.com", "superadmin@test.com", "admin@test.com"]) {
      expect(seedSource).toContain(email);
    }

    expect(seedSource).toContain("encrypted_password");
    expect(seedSource).toContain("extensions.crypt('test123', extensions.gen_salt('bf'))");
    expect(seedSource).toContain("insert into auth.identities");
    expect(seedSource).toContain("provider_id");
    expect(seedSource).toContain("'email'");
  });

  it("keeps demo auth provisioning as an explicit service-role script for hosted demo projects", () => {
    const scriptSource = readFileSync(
      new URL("../../../../web/scripts/seed-demo-auth-users.mjs", import.meta.url),
      "utf8",
    );
    const packageSource = readFileSync(
      new URL("../../../../web/package.json", import.meta.url),
      "utf8",
    );

    expect(scriptSource).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(scriptSource).toContain("auth.admin.createUser");
    expect(scriptSource).toContain("auth.admin.updateUserById");
    expect(scriptSource).toContain("test123");
    expect(scriptSource).toContain("superadmin@test.com");
    expect(packageSource).toContain("\"demo:seed-auth\"");
  });
});
