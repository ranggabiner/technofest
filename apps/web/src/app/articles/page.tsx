import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { motion } from "@/components/ui/motion";
import { getArticleDetailPath, getArticleListImageAsset } from "@/lib/articles";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const copy = await getDictionary();
  const articlesCopy = copy.marketing.articlesHub;

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="public" />
      <main className="mx-auto min-h-screen w-full max-w-[1100px] px-6 pb-24 pt-28 md:pt-32">
        <section className="mx-auto mb-20 max-w-3xl text-center">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-charcoal-primary)] md:text-6xl">
            {articlesCopy.listTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[var(--color-graphite)]">
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
              className={cn(
                "min-h-14 w-full rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-12 text-sm text-[var(--color-charcoal-primary)] outline-none focus:shadow-[inset_0_0_0_2px_var(--color-stone-surface)]",
                motion.input,
              )}
              placeholder={articlesCopy.searchPlaceholder}
            />
          </div>
        </section>

        <section className="space-y-6" aria-label={articlesCopy.listTitle}>
          {articlesCopy.items.map((article) => {
            const articleImage = getArticleListImageAsset(article.slug);

            return (
              <Link
                key={article.slug}
                href={getArticleDetailPath(article.slug)}
                className={cn(
                  "group flex cursor-pointer flex-col gap-6 rounded-xl bg-[var(--color-card)] p-6 shadow-[var(--shadow-subtle)] hover:bg-[var(--color-parchment-card)] md:flex-row md:gap-12",
                  motion.cardInteractive,
                )}
              >
                <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg md:w-80">
                  <Image
                    src={articleImage.src}
                    alt={article.imageAlt}
                    width={articleImage.width}
                    height={articleImage.height}
                    quality={82}
                    sizes="(max-width: 767px) calc(100vw - 3rem), 320px"
                    className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                </div>
                <article className="flex flex-1 flex-col justify-center">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs leading-5">
                    <span className="font-semibold uppercase tracking-wide text-[var(--color-teal-deep)]">
                      {article.category}
                    </span>
                    <span className="text-[var(--color-fog)]">•</span>
                    <time className="text-[var(--color-graphite)]">{article.publishedAt}</time>
                  </div>
                  <h2 className={cn("text-xl font-semibold leading-snug text-[var(--color-charcoal-primary)] group-hover:text-[var(--color-teal-deep)] md:text-2xl", motion.base)}>
                    {article.title}
                  </h2>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--color-graphite)]">
                    {article.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-midnight)] group-hover:underline group-hover:underline-offset-4">
                    {articlesCopy.readMore}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </span>
                </article>
              </Link>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
