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

  it("exposes responsive WebP metadata for list and detail article images", () => {
    for (const asset of Object.values(articleAssets)) {
      expect(asset.list.src).toMatch(/^\/assets\/articles\/.+\.webp$/);
      expect(asset.list.width).toBe(1200);
      expect(asset.list.height).toBe(900);
      expect(asset.detail.src).toMatch(/^\/assets\/articles\/.+\.webp$/);
      expect(asset.detail.width).toBe(2200);
      expect(asset.detail.height).toBe(1238);
    }
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
