import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  BarChart3,
  Eye,
  Hospital,
  KeyRound,
  MessageCircle,
  SearchCheck,
  Send,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";

import { LandingScrollReveal } from "@/components/landing-scroll-reveal";
import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { motion } from "@/components/ui/motion";
import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { articleAssets, getArticleDetailPath, getLandingArticlePreviews, type MarketingArticle } from "@/lib/articles";
import { dictionary } from "@/lib/i18n/dictionary";
import { defaultLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const imagePaths = {
  hero: "/assets/landing/hero-ai-interface.webp",
  about: "/assets/landing/doctor-tablet.webp",
} as const;

const featureIcons = [SearchCheck, ShieldCheck, KeyRound] as const;
const aboutIcons = [Eye, Target] as const;
const workflowIcons = [MessageCircle, BarChart3, Hospital] as const;
const defaultLanding = dictionary[defaultLocale].marketing.landing;

type LandingCopy = Awaited<ReturnType<typeof getDictionary>>["marketing"]["landing"];
type LandingListItem = {
  description: string;
  title: string;
};

function revealDelay(index: number): CSSProperties {
  return { "--scroll-reveal-delay": `${index * 60}ms` } as CSSProperties;
}

function resolveLandingText(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

function resolveLandingList(
  localizedItems: readonly LandingListItem[] | null | undefined,
  fallbackItems: readonly LandingListItem[],
) {
  return fallbackItems.map((fallbackItem, index) => {
    const localizedItem = localizedItems?.[index];

    return {
      title: resolveLandingText(localizedItem?.title, fallbackItem.title),
      description: resolveLandingText(localizedItem?.description, fallbackItem.description),
    };
  });
}

export default async function HomePage() {
  await redirectAuthenticatedUserFromPublicRoute();

  const copy = await getDictionary();
  const landing = copy.marketing.landing;
  const articlePreviews = getLandingArticlePreviews(copy.marketing.articlesHub.items);

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader
        authMode="public"
        brandAction="scroll-top"
        mobileMenuLabel={landing.mobileMenuLabel}
        navigationItems={landing.nav}
        navigationLabel={copy.marketing.primaryNavLabel}
        primaryAction={{ href: "/login", label: copy.marketing.loginCta }}
      />
      <LandingScrollReveal />
      <main className="flex flex-col items-center pt-20">
        <HeroSection landing={landing} />
        <AboutSection landing={landing} />
        <FeatureSection landing={landing} />
        <ArticleSection
          articles={articlePreviews}
          landing={landing}
          readMoreLabel={copy.marketing.articlesHub.readMore}
        />
        <WorkflowSection landing={landing} />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroSection({ landing }: { landing: LandingCopy }) {
  return (
    <section data-scroll-reveal="" data-scroll-reveal-group="hero-section" className="w-full overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-teal-surface)_70%,var(--color-warm-canvas))_0%,var(--color-warm-canvas)_100%)] px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-10 lg:flex-row lg:gap-12">
        <div
          data-scroll-reveal=""
          data-scroll-reveal-group="hero-copy"
          className="z-10 flex flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left"
        >
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[var(--color-charcoal-primary)] sm:text-5xl lg:text-6xl">
            {landing.hero.title}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-[var(--color-graphite)] lg:mx-0">
            {landing.hero.description}
          </p>
          <Link
            href="/login"
            className={cn(
              "mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--color-teal-deep)] px-8 text-center text-sm font-semibold uppercase tracking-normal text-[var(--color-inverted)] shadow-[0_18px_36px_color-mix(in_srgb,var(--color-teal-primary)_24%,transparent)] hover:bg-[var(--color-teal-primary)] sm:w-auto",
              motion.button,
            )}
          >
            {landing.hero.primaryCta}
          </Link>
        </div>

        <div data-scroll-reveal="" data-scroll-reveal-group="hero-image" style={revealDelay(1)} className="w-full flex-1">
          <div className="mx-auto max-w-lg">
            <Image
              src={imagePaths.hero}
              alt={landing.hero.imageAlt}
              width={512}
              height={512}
              priority
              sizes="(max-width: 1023px) calc(100vw - 2rem), 512px"
              className="aspect-square w-full rounded-3xl object-cover shadow-[var(--shadow-elevated)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ landing }: { landing: LandingCopy }) {
  const about = landing.about ?? defaultLanding.about;
  const aboutCards = resolveLandingList(about.cards, defaultLanding.about.cards);

  return (
    <section id="about" data-scroll-reveal="" data-scroll-reveal-group="about-section" className="w-full scroll-mt-24 bg-[var(--color-card)] px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
      <SectionIntro
        title={resolveLandingText(about.title, defaultLanding.about.title)}
        accent={resolveLandingText(about.accent, defaultLanding.about.accent)}
        description={resolveLandingText(about.description, defaultLanding.about.description)}
      />
      <div className="mx-auto grid w-full max-w-[1100px] items-center gap-12 lg:grid-cols-[5fr_7fr]">
        <Image
          data-scroll-reveal=""
          data-scroll-reveal-group="about-image"
          src={imagePaths.about}
          alt={resolveLandingText(about.imageAlt, defaultLanding.about.imageAlt)}
          width={512}
          height={512}
          sizes="(max-width: 1023px) calc(100vw - 2rem), 512px"
          className="aspect-square w-full rounded-3xl object-cover shadow-[var(--shadow-elevated)]"
        />
        <div className="flex flex-col gap-6">
          {aboutCards.map((card, index) => {
            const Icon = aboutIcons[index] ?? Eye;
            return (
              <div
                key={card.title}
                data-scroll-reveal=""
                data-scroll-reveal-group="about-card"
                style={revealDelay(index + 1)}
              >
                <InfoCard icon={Icon} title={card.title} description={card.description} align="left" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureSection({ landing }: { landing: LandingCopy }) {
  const features = landing.features ?? defaultLanding.features;
  const featureItems = resolveLandingList(features.items, defaultLanding.features.items);

  return (
    <section id="features" data-scroll-reveal="" data-scroll-reveal-group="features-section" className="w-full scroll-mt-24 bg-[var(--color-parchment-card)] px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
      <SectionIntro
        title={resolveLandingText(features.title, defaultLanding.features.title)}
        accent={resolveLandingText(features.accent, defaultLanding.features.accent)}
        description={resolveLandingText(features.description, defaultLanding.features.description)}
      />
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 md:grid-cols-3">
        {featureItems.map((item, index) => {
          const Icon = featureIcons[index] ?? SearchCheck;
          return (
            <div
              key={item.title}
              data-scroll-reveal=""
              data-scroll-reveal-group="feature-card"
              style={revealDelay(index)}
            >
              <InfoCard icon={Icon} title={item.title} description={item.description} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ArticleSection({
  articles,
  landing,
  readMoreLabel,
}: {
  articles: readonly MarketingArticle[];
  landing: LandingCopy;
  readMoreLabel: string;
}) {
  return (
    <section id="articles" data-scroll-reveal="" data-scroll-reveal-group="articles-section" className="w-full scroll-mt-24 bg-[var(--color-card)] px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
      <SectionIntro
        title={landing.articles.title}
        accent={landing.articles.accent}
        description={landing.articles.description}
      />
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 md:grid-cols-3">
        {articles.map((article, index) => (
          <div
            key={article.slug}
            data-scroll-reveal=""
            data-scroll-reveal-group="article-card"
            style={revealDelay(index)}
          >
            <Link
              href={getArticleDetailPath(article.slug)}
              className={cn(
                "group flex cursor-pointer overflow-hidden rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)] hover:border-[color-mix(in_srgb,var(--color-teal-primary)_36%,var(--color-stone-surface))]",
                motion.cardInteractive,
              )}
            >
              <article className="flex w-full flex-col">
                <Image
                  src={articleAssets[article.slug]?.list ?? "/assets/landing/article-ai-healthcare.webp"}
                  alt={article.imageAlt}
                  width={512}
                  height={512}
                  sizes="(max-width: 767px) calc(100vw - 2rem), 33vw"
                  className="h-48 w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-3 text-lg font-bold leading-snug text-[var(--color-charcoal-primary)]">{article.title}</h3>
                  <p className="mb-5 flex-1 text-sm leading-6 text-[var(--color-graphite)]">{article.excerpt}</p>
                  <span
                    className={cn("inline-flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-normal text-[var(--color-teal-deep)] hover:text-[var(--color-teal-primary)]", motion.navLink)}
                  >
                    <Send size={15} aria-hidden="true" />
                    {readMoreLabel}
                  </span>
                </div>
              </article>
            </Link>
          </div>
        ))}
      </div>
      <div data-scroll-reveal="" data-scroll-reveal-group="articles-view-all" className="mx-auto mt-10 flex w-full max-w-[1100px] justify-start sm:justify-end">
        <Link
          href="/articles"
          className={cn("cursor-pointer font-medium text-[var(--color-midnight)] underline underline-offset-4 hover:text-[var(--color-teal-deep)]", motion.navLink)}
        >
          {landing.articles.viewAll}
        </Link>
      </div>
    </section>
  );
}

function WorkflowSection({ landing }: { landing: LandingCopy }) {
  const workflow = landing.workflow ?? defaultLanding.workflow;
  const workflowSteps = resolveLandingList(workflow.steps, defaultLanding.workflow.steps);

  return (
    <section id="workflow" data-scroll-reveal="" data-scroll-reveal-group="workflow-section" className="w-full scroll-mt-24 bg-[var(--color-parchment-card)] px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
      <SectionIntro
        title={resolveLandingText(workflow.title, defaultLanding.workflow.title)}
        accent={resolveLandingText(workflow.accent, defaultLanding.workflow.accent)}
        description={resolveLandingText(workflow.description, defaultLanding.workflow.description)}
      />
      <div className="relative mx-auto w-full max-w-4xl px-4">
        <div className="absolute left-12 right-12 top-12 z-0 hidden h-1 rounded-full bg-[var(--color-stone-surface)] md:block" />
        <div className="relative z-10 grid gap-10 md:grid-cols-3">
          {workflowSteps.map((step, index) => {
            const Icon = workflowIcons[index] ?? MessageCircle;
            const active = index === 1;
            return (
              <div
                key={step.title}
                data-scroll-reveal=""
                data-scroll-reveal-group="workflow-step"
                style={revealDelay(index)}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={
                    active
                      ? "mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[color-mix(in_srgb,var(--color-teal-primary)_22%,var(--color-card))] bg-[var(--color-teal-deep)] text-[var(--color-inverted)] shadow-[0_18px_36px_color-mix(in_srgb,var(--color-teal-primary)_24%,transparent)]"
                      : cn(
                          "mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--color-stone-surface)] bg-[var(--color-card)] text-[var(--color-teal-deep)] hover:border-[var(--color-teal-primary)]",
                          motion.base,
                        )
                  }
                >
                  <Icon size={36} aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold leading-snug text-[var(--color-charcoal-primary)]">{step.title}</h3>
                <p className="text-sm leading-6 text-[var(--color-graphite)]">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ title, accent, description }: { title: string; accent: string; description: string }) {
  return (
    <div data-scroll-reveal="" data-scroll-reveal-group="section-intro" className="mx-auto mb-12 w-full max-w-[1100px] text-center sm:mb-16">
      <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-charcoal-primary)] lg:text-5xl">
        {title} <span className="text-[var(--color-teal-deep)]">{accent}</span>
      </h2>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[var(--color-graphite)]">{description}</p>
    </div>
  );
}

function InfoCard({
  align = "center",
  description,
  icon,
  title,
}: {
  align?: "center" | "left";
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  const Icon = icon;
  const left = align === "left";

  return (
    <div
      className={cn(
        left
          ? "flex flex-col items-center gap-5 rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-5 text-center shadow-[var(--shadow-elevated)] hover:border-[color-mix(in_srgb,var(--color-teal-primary)_36%,var(--color-stone-surface))] sm:gap-6 sm:p-8 lg:flex-row lg:items-start lg:text-left"
          : "flex flex-col items-center rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 text-center shadow-[var(--shadow-elevated)] sm:p-8",
        motion.cardInteractive,
      )}
    >
      <IconBadge icon={Icon} className={left ? "shrink-0" : "mb-6"} />
      <div>
        <h3
          className={
            left
              ? "mb-2 text-sm font-bold uppercase tracking-normal text-[var(--color-charcoal-primary)]"
              : "mb-4 text-lg font-bold leading-snug text-[var(--color-charcoal-primary)]"
          }
        >
          {title}
        </h3>
        <p className="text-sm leading-6 text-[var(--color-graphite)]">{description}</p>
      </div>
    </div>
  );
}

function IconBadge({ className = "", icon }: { className?: string; icon: LucideIcon }) {
  const Icon = icon;

  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)] ${className}`}>
      <Icon size={30} aria-hidden="true" />
    </div>
  );
}
