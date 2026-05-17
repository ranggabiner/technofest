import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("articles pages", () => {
  const listSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const detailSource = readFileSync(new URL("./[slug]/page.tsx", import.meta.url), "utf8");

  it("keeps the article detail header title without a duplicate articles action button", () => {
    expect(detailSource).toContain("contextTitle={articlesCopy.breadcrumbArticles}");
    expect(detailSource).not.toContain("contextAction");
  });

  it("renders the complete article list without a useless load-more control", () => {
    expect(listSource).toContain("articlesCopy.items.map");
    expect(listSource).not.toContain("articlesCopy.loadMore");
    expect(listSource).not.toContain("ChevronDown");
  });
});
