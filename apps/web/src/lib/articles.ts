import type { Dictionary } from "@/lib/i18n/dictionary";

export type MarketingArticle = Dictionary["marketing"]["articlesHub"]["items"][number];

type ArticleAsset = {
  detail: MarketingImageAsset;
  list: MarketingImageAsset;
};

export type MarketingImageAsset = {
  height: number;
  src: string;
  width: number;
};

const articleListImage = (src: string): MarketingImageAsset => ({
  src,
  width: 1200,
  height: 900,
});

const articleDetailImage = (src: string): MarketingImageAsset => ({
  src,
  width: 2200,
  height: 1238,
});

const fallbackArticleListAsset = articleListImage("/assets/landing/article-ai-healthcare.webp");
const fallbackArticleDetailAsset = articleDetailImage("/assets/articles/ai-diagnostics-clinic.webp");

export const articleAssets: Record<string, ArticleAsset> = {
  "medproof-ai-verifikasi-rekam-medis": {
    detail: articleDetailImage("/assets/articles/ai-diagnostics-clinic.webp"),
    list: articleListImage("/assets/articles/medical-research-lab.webp"),
  },
  "standar-enkripsi-privasi-pasien": {
    detail: articleDetailImage("/assets/articles/encryption-records-detail.webp"),
    list: articleListImage("/assets/articles/encryption-records.webp"),
  },
  "rs-sejahtera-administrasi-40": {
    detail: articleDetailImage("/assets/articles/medical-network-detail.webp"),
    list: articleListImage("/assets/articles/medical-network.webp"),
  },
  "hak-akses-rekam-medis-elektronik": {
    detail: articleDetailImage("/assets/articles/patient-rights-detail.webp"),
    list: articleListImage("/assets/articles/patient-rights.webp"),
  },
};

export function getArticleBySlug(articles: readonly MarketingArticle[], slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticleDetailPath(slug: string) {
  return `/articles/${slug}`;
}

export function getArticleDetailImageAsset(slug: string) {
  return articleAssets[slug]?.detail ?? fallbackArticleDetailAsset;
}

export function getArticleListImageAsset(slug: string) {
  return articleAssets[slug]?.list ?? fallbackArticleListAsset;
}

export function getLandingArticlePreviews(articles: readonly MarketingArticle[], limit = 3) {
  return articles.slice(0, limit);
}

export function getRelatedArticles(articles: readonly MarketingArticle[], slug: string, limit = 3) {
  return articles.filter((article) => article.slug !== slug).slice(0, limit);
}
