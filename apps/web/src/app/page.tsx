import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
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
import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { articleAssets, getArticleDetailPath, getLandingArticlePreviews, type MarketingArticle } from "@/lib/articles";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const landingSerif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-landing-serif",
});

const imagePaths = {
  hero: "/assets/landing/hero-ai-interface.webp",
  about: "/assets/landing/doctor-tablet.webp",
} as const;

const featureIcons = [SearchCheck, ShieldCheck, KeyRound] as const;
const aboutIcons = [Eye, Target] as const;
const workflowIcons = [MessageCircle, BarChart3, Hospital] as const;

function revealDelay(index: number): CSSProperties {
  return { "--scroll-reveal-delay": `${index * 80}ms` } as CSSProperties;
}

export default async function HomePage() {
  await redirectAuthenticatedUserFromPublicRoute();

  const copy = await getDictionary();
  const landing = copy.marketing.landing;
  const articlePreviews = getLandingArticlePreviews(copy.marketing.articlesHub.items);

  return (
    <div className={`${landingSerif.variable} min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]`}>
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

function HeroSection({ landing }: { landing: Awaited<ReturnType<typeof getDictionary>>["marketing"]["landing"] }) {
  return (
    <section data-scroll-reveal="" data-scroll-reveal-group="hero-section" className="w-full overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-teal-surface)_70%,var(--color-warm-canvas))_0%,var(--color-warm-canvas)_100%)] px-6 py-20 lg:py-32">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-12 lg:flex-row">
        <div
          data-scroll-reveal=""
          data-scroll-reveal-group="hero-copy"
          className="z-10 flex flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left"
        >
          <h1 className="max-w-2xl font-[var(--font-landing-serif)] text-[40px] font-bold leading-[1.1] tracking-normal text-[var(--color-charcoal-primary)] sm:text-[48px] lg:text-[56px]">
            {landing.hero.title}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[16px] leading-7 text-[var(--color-graphite)] lg:mx-0">
            {landing.hero.description}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[var(--color-teal-deep)] px-8 text-[14px] font-semibold uppercase tracking-normal text-[var(--color-inverted)] shadow-[0_18px_36px_color-mix(in_srgb,var(--color-teal-primary)_24%,transparent)] transition hover:-translate-y-1 hover:bg-[var(--color-teal-primary)]"
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
              className="aspect-square w-full rounded-3xl object-cover shadow-[var(--shadow-elevated)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ landing }: { landing: Awaited<ReturnType<typeof getDictionary>>["marketing"]["landing"] }) {
  return (
    <section id="about" data-scroll-reveal="" data-scroll-reveal-group="about-section" className="w-full scroll-mt-24 bg-[var(--color-card)] px-6 py-20 lg:py-32">
      <SectionIntro title={landing.about.title} accent={landing.about.accent} description={landing.about.description} />
      <div className="mx-auto grid w-full max-w-[1100px] items-center gap-12 lg:grid-cols-[5fr_7fr]">
        <Image
          data-scroll-reveal=""
          data-scroll-reveal-group="about-image"
          src={imagePaths.about}
          alt={landing.about.imageAlt}
          width={512}
          height={512}
          className="aspect-square w-full rounded-3xl object-cover shadow-[var(--shadow-elevated)]"
        />
        <div className="flex flex-col gap-6">
          {landing.about.cards.map((card, index) => {
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

function FeatureSection({ landing }: { landing: Awaited<ReturnType<typeof getDictionary>>["marketing"]["landing"] }) {
  return (
    <section id="features" data-scroll-reveal="" data-scroll-reveal-group="features-section" className="w-full scroll-mt-24 bg-[var(--color-parchment-card)] px-6 py-20 lg:py-32">
      <SectionIntro
        title={landing.features.title}
        accent={landing.features.accent}
        description={landing.features.description}
      />
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 md:grid-cols-3">
        {landing.features.items.map((item, index) => {
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
  landing: Awaited<ReturnType<typeof getDictionary>>["marketing"]["landing"];
  readMoreLabel: string;
}) {
  return (
    <section id="articles" data-scroll-reveal="" data-scroll-reveal-group="articles-section" className="w-full scroll-mt-24 bg-[var(--color-card)] px-6 py-20 lg:py-32">
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
              className="group flex cursor-pointer overflow-hidden rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)] transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--color-teal-primary)_36%,var(--color-stone-surface))]"
            >
              <article className="flex w-full flex-col">
                <Image
                  src={articleAssets[article.slug]?.list ?? "/assets/landing/article-ai-healthcare.webp"}
                  alt={article.imageAlt}
                  width={512}
                  height={512}
                  className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-3 text-[19px] font-bold leading-snug text-[var(--color-charcoal-primary)]">{article.title}</h3>
                  <p className="mb-5 flex-1 text-[14px] leading-6 text-[var(--color-graphite)]">{article.excerpt}</p>
                  <span
                    className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold uppercase tracking-normal text-[var(--color-teal-deep)] transition hover:text-[var(--color-teal-primary)]"
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
      <div data-scroll-reveal="" data-scroll-reveal-group="articles-view-all" className="mx-auto mt-10 flex w-full max-w-[1100px] justify-end">
        <Link
          href="/articles"
          className="cursor-pointer font-medium text-[var(--color-midnight)] underline underline-offset-4 transition-colors hover:text-[var(--color-teal-deep)]"
        >
          {landing.articles.viewAll}
        </Link>
      </div>
    </section>
  );
}

function WorkflowSection({ landing }: { landing: Awaited<ReturnType<typeof getDictionary>>["marketing"]["landing"] }) {
  return (
    <section id="workflow" data-scroll-reveal="" data-scroll-reveal-group="workflow-section" className="w-full scroll-mt-24 bg-[var(--color-parchment-card)] px-6 py-20 lg:py-32">
      <SectionIntro
        title={landing.workflow.title}
        accent={landing.workflow.accent}
        description={landing.workflow.description}
      />
      <div className="relative mx-auto w-full max-w-4xl px-4">
        <div className="absolute left-12 right-12 top-12 z-0 hidden h-1 rounded-full bg-[var(--color-stone-surface)] md:block" />
        <div className="relative z-10 grid gap-10 md:grid-cols-3">
          {landing.workflow.steps.map((step, index) => {
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
                      : "mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--color-stone-surface)] bg-[var(--color-card)] text-[var(--color-teal-deep)] transition-colors hover:border-[var(--color-teal-primary)]"
                  }
                >
                  <Icon size={36} aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-[19px] font-bold leading-snug text-[var(--color-charcoal-primary)]">{step.title}</h3>
                <p className="text-[14px] leading-6 text-[var(--color-graphite)]">{step.description}</p>
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
    <div data-scroll-reveal="" data-scroll-reveal-group="section-intro" className="mx-auto mb-16 w-full max-w-[1100px] text-center">
      <h2 className="font-[var(--font-landing-serif)] text-[32px] font-semibold leading-tight tracking-normal text-[var(--color-charcoal-primary)] lg:text-[44px]">
        {title} <span className="text-[var(--color-teal-deep)]">{accent}</span>
      </h2>
      <p className="mx-auto mt-4 max-w-3xl text-[16px] leading-7 text-[var(--color-graphite)]">{description}</p>
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
      className={
        left
          ? "flex flex-col items-center gap-6 rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-8 text-center shadow-[var(--shadow-elevated)] transition-colors hover:border-[color-mix(in_srgb,var(--color-teal-primary)_36%,var(--color-stone-surface))] lg:flex-row lg:items-start lg:text-left"
          : "flex flex-col items-center rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-8 text-center shadow-[var(--shadow-elevated)] transition-transform duration-300 hover:-translate-y-2"
      }
    >
      <IconBadge icon={Icon} className={left ? "shrink-0" : "mb-6"} />
      <div>
        <h3
          className={
            left
              ? "mb-2 text-sm font-bold uppercase tracking-normal text-[var(--color-charcoal-primary)]"
              : "mb-4 text-[19px] font-bold leading-snug text-[var(--color-charcoal-primary)]"
          }
        >
          {title}
        </h3>
        <p className="text-[14px] leading-6 text-[var(--color-graphite)]">{description}</p>
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
