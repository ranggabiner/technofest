import type { Dictionary } from "@/lib/i18n/dictionary";

export type MarketingArticle = Dictionary["marketing"]["articlesHub"]["items"][number];

type ArticleAsset = {
  detail: string;
  list: string;
};

export const articleAssets: Record<string, ArticleAsset> = {
  "medproof-ai-verifikasi-rekam-medis": {
    detail: "/assets/articles/ai-diagnostics-clinic.webp",
    list: "/assets/articles/medical-research-lab.webp",
  },
  "standar-enkripsi-privasi-pasien": {
    detail: "/assets/articles/encryption-records.webp",
    list: "/assets/articles/encryption-records.webp",
  },
  "rs-sejahtera-administrasi-40": {
    detail: "/assets/articles/medical-network.webp",
    list: "/assets/articles/medical-network.webp",
  },
  "hak-akses-rekam-medis-elektronik": {
    detail: "/assets/articles/patient-rights.webp",
    list: "/assets/articles/patient-rights.webp",
  },
};

export function getArticleBySlug(articles: readonly MarketingArticle[], slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticleDetailPath(slug: string) {
  return `/articles/${slug}`;
}

export function getLandingArticlePreviews(articles: readonly MarketingArticle[], limit = 3) {
  return articles.slice(0, limit);
}

export function getRelatedArticles(articles: readonly MarketingArticle[], slug: string, limit = 3) {
  return articles.filter((article) => article.slug !== slug).slice(0, limit);
}
