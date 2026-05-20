import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { motion } from "@/components/ui/motion";
import { articleAssets, getArticleBySlug, getArticleDetailPath, getRelatedArticles } from "@/lib/articles";
import { dictionary } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return dictionary.id.marketing.articlesHub.items.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const [{ slug }, copy] = await Promise.all([params, getDictionary()]);
  const article = getArticleBySlug(copy.marketing.articlesHub.items, slug);

  if (!article) {
    return {
      title: copy.common.brand,
      description: copy.metadata.description,
    };
  }

  return {
    title: `${article.title} | ${copy.common.brand}`,
    description: article.excerpt,
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const [{ slug }, copy] = await Promise.all([params, getDictionary()]);
  const articlesCopy = copy.marketing.articlesHub;
  const article = getArticleBySlug(articlesCopy.items, slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(articlesCopy.items, article.slug, 3);
  const publishedMeta = articlesCopy.publishedMeta
    .replace("{date}", article.publishedAt)
    .replace("{readTime}", article.readTime);

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader
        authMode="public"
        contextTitle={articlesCopy.breadcrumbArticles}
      />
      <main className="mx-auto w-full max-w-[1100px] px-6 pb-24 pt-28 md:pt-32">
        <nav className="mb-12 flex flex-wrap items-center gap-2 text-xs leading-5 text-[var(--color-graphite)]">
          <Link className={cn("cursor-pointer hover:text-[var(--color-midnight)]", motion.navLink)} href="/">
            {articlesCopy.breadcrumbHome}
          </Link>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-[var(--color-ash)]" />
          <Link className={cn("cursor-pointer hover:text-[var(--color-midnight)]", motion.navLink)} href="/articles">
            {articlesCopy.breadcrumbArticles}
          </Link>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-[var(--color-ash)]" />
          <span className="font-medium text-[var(--color-midnight)]">{article.title}</span>
        </nav>

        <article>
          <header className="mx-auto mb-20 max-w-[800px] text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-teal-deep)]">
              {article.category}
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-charcoal-primary)] md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-6 text-xs leading-5 text-[var(--color-graphite)]">{publishedMeta}</p>
          </header>

          <div className="mb-20 overflow-hidden rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)]">
            <Image
              src={
                articleAssets[article.slug]?.detail ??
                articleAssets[article.slug]?.list ??
                "/assets/landing/article-ai-healthcare.webp"
              }
              alt={article.detailImageAlt}
              width={1280}
              height={720}
              priority
              sizes="(max-width: 1100px) calc(100vw - 3rem), 1100px"
              className="max-h-[500px] w-full object-cover"
            />
          </div>

          <div className="mx-auto max-w-[800px] space-y-10 text-base leading-8 text-[var(--color-charcoal-primary)]">
            {article.body.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            {article.body.sections.map((section) => (
              <section key={section.title} className="space-y-5">
                <h2 className="pt-4 text-xl font-semibold leading-snug text-[var(--color-midnight)]">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-6 text-[var(--color-graphite)]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>

        <div className="mx-auto my-20 max-w-[800px] border-t border-[var(--color-stone-surface)]" />

        <section aria-labelledby="related-articles-title">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="related-articles-title" className="text-lg font-semibold text-[var(--color-midnight)]">
              {articlesCopy.relatedTitle}
            </h2>
            <Link
              href="/articles"
              className={cn("inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--color-teal-deep)] hover:text-[var(--color-midnight)]", motion.navLink)}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {articlesCopy.breadcrumbArticles}
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={getArticleDetailPath(related.slug)}
                className={cn(
                  "group flex cursor-pointer flex-col rounded-lg border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-6 hover:bg-[var(--color-parchment-card)]",
                  motion.cardInteractive,
                )}
              >
                <Image
                  src={articleAssets[related.slug]?.list ?? "/assets/landing/article-ai-healthcare.webp"}
                  alt={related.imageAlt}
                  width={480}
                  height={320}
                  sizes="(max-width: 767px) calc(100vw - 3rem), 33vw"
                  className="mb-4 h-40 w-full rounded-md object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
                />
                <h3 className="line-clamp-2 text-lg font-medium leading-snug text-[var(--color-midnight)]">
                  {related.title}
                </h3>
                <p className="mt-auto pt-4 text-xs leading-5 text-[var(--color-graphite)]">
                  {related.publishedAt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
