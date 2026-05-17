import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { articleAssets, getArticleDetailPath } from "@/lib/articles";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const copy = await getDictionary();
  const articlesCopy = copy.marketing.articlesHub;

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="public" />
      <main className="mx-auto min-h-screen w-full max-w-[1100px] px-6 pb-24 pt-28 md:pt-32">
        <section className="mx-auto mb-20 max-w-3xl text-center">
          <h1 className="font-serif text-[34px] font-semibold leading-tight text-[var(--color-charcoal-primary)] md:text-[56px]">
            {articlesCopy.listTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-[var(--color-graphite)]">
            {articlesCopy.listDescription}
          </p>
          <label className="sr-only" htmlFor="article-search">
            {articlesCopy.searchLabel}
          </label>
          <div className="relative mx-auto mt-10 max-w-xl">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-ash)]"
            />
            <input
              id="article-search"
              type="search"
              className="min-h-14 w-full rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-12 text-[15px] text-[var(--color-charcoal-primary)] outline-none transition focus:shadow-[inset_0_0_0_2px_var(--color-stone-surface)]"
              placeholder={articlesCopy.searchPlaceholder}
            />
          </div>
        </section>

        <section className="space-y-6" aria-label={articlesCopy.listTitle}>
          {articlesCopy.items.map((article) => (
            <Link
              key={article.slug}
              href={getArticleDetailPath(article.slug)}
              className="group flex cursor-pointer flex-col gap-6 rounded-xl bg-[var(--color-card)] p-6 shadow-[var(--shadow-subtle)] transition hover:bg-[var(--color-parchment-card)] md:flex-row md:gap-12"
            >
              <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg md:w-80">
                <Image
                  src={articleAssets[article.slug]?.list ?? "/assets/landing/article-ai-healthcare.webp"}
                  alt={article.imageAlt}
                  width={640}
                  height={480}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <article className="flex flex-1 flex-col justify-center">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] leading-5">
                  <span className="font-semibold uppercase tracking-[0.05em] text-[var(--color-teal-deep)]">
                    {article.category}
                  </span>
                  <span className="text-[var(--color-fog)]">•</span>
                  <time className="text-[var(--color-graphite)]">{article.publishedAt}</time>
                </div>
                <h2 className="text-[21px] font-semibold leading-snug text-[var(--color-charcoal-primary)] transition group-hover:text-[var(--color-teal-deep)] md:text-[24px]">
                  {article.title}
                </h2>
                <p className="mt-4 line-clamp-3 text-[15px] leading-7 text-[var(--color-graphite)]">
                  {article.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-midnight)] group-hover:underline group-hover:underline-offset-4">
                  {articlesCopy.readMore}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </article>
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
