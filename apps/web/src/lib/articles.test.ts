import { describe, expect, it } from "vitest";

import {
  articleAssets,
  getArticleBySlug,
  getArticleDetailPath,
  getLandingArticlePreviews,
  getRelatedArticles,
} from "./articles";
import { dictionary } from "./i18n/dictionary";

describe("marketing articles", () => {
  it("keeps localized article lists aligned with asset metadata", () => {
    const idArticles = dictionary.id.marketing.articlesHub.items;
    const enArticles = dictionary.en.marketing.articlesHub.items;

    expect(idArticles).toHaveLength(enArticles.length);

    for (const article of idArticles) {
      expect(article.slug).toBeTruthy();
      expect(articleAssets[article.slug]).toBeDefined();
    }

    expect(enArticles.map((article) => article.slug)).toEqual(idArticles.map((article) => article.slug));
  });

  it("resolves article detail routes and related articles by slug", () => {
    const articles = dictionary.id.marketing.articlesHub.items;
    const article = getArticleBySlug(articles, "medproof-ai-verifikasi-rekam-medis");

    expect(article?.title).toContain("MedProof AI");
    expect(getArticleDetailPath(article!.slug)).toBe("/articles/medproof-ai-verifikasi-rekam-medis");
    expect(getRelatedArticles(articles, article!.slug, 3)).toHaveLength(3);
    expect(getRelatedArticles(articles, article!.slug, 3).map((item) => item.slug)).not.toContain(article!.slug);
  });

  it("reuses the centralized article list for landing previews", () => {
    const articles = dictionary.id.marketing.articlesHub.items;

    expect(getLandingArticlePreviews(articles)).toEqual(articles.slice(0, 3));
  });
});
