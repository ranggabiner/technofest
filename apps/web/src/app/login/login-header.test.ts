import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("login header", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  it("removes default marketing nav and login action while preserving the public shared header", () => {
    expect(source).toContain('<SharedHeader authMode="public" navigationItems={[]} showAuthAction={false} />');
  });
});
