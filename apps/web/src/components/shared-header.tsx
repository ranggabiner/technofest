import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";

import { BrandScrollTopButton } from "@/components/brand-scroll-top-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { cn } from "@/lib/utils";

export const MEDPROOF_LOGO_SRC = "/assets/landing/logo.webp";

export type SharedHeaderAuthMode = "auto" | "public" | "authenticated";
export type SharedHeaderAction = "login" | "logout";
export type SharedHeaderNavigationItem = {
  active?: boolean;
  href?: string | null;
  label: string;
};
export type SharedHeaderLinkAction = {
  href: string;
  label: string;
};

export function resolveSharedHeaderAction({
  authMode = "auto",
  isAuthenticated,
}: {
  authMode?: SharedHeaderAuthMode;
  isAuthenticated: boolean;
}): SharedHeaderAction {
  if (authMode === "public") return "login";
  if (authMode === "authenticated") return "logout";
  return isAuthenticated ? "logout" : "login";
}

type SharedHeaderProps = {
  authMode?: SharedHeaderAuthMode;
  brandAction?: "home" | "scroll-top";
  className?: string;
  contextAction?: SharedHeaderLinkAction;
  contextTitle?: string;
  isAuthenticated?: boolean;
  maxWidth?: "content" | "none";
  mobileMenuLabel?: string;
  navigationItems?: readonly SharedHeaderNavigationItem[];
  navigationLabel?: string;
  position?: "fixed" | "sticky" | "static";
  primaryAction?: SharedHeaderLinkAction;
  showAuthAction?: boolean;
  showLanguageSwitcher?: boolean;
  showThemeToggle?: boolean;
};

export async function SharedHeader({
  authMode = "auto",
  brandAction = "home",
  className,
  contextAction,
  contextTitle,
  isAuthenticated = false,
  maxWidth = "content",
  mobileMenuLabel,
  navigationItems,
  navigationLabel,
  position = "fixed",
  primaryAction,
  showAuthAction = true,
  showLanguageSwitcher = true,
  showThemeToggle = true,
}: SharedHeaderProps) {
  const [{ getDictionary, getLocale }, { getMarketingHeaderLinks, landingLoginHref }, { signOutAction }] =
    await Promise.all([
      import("@/lib/i18n/server"),
      import("@/lib/i18n/marketing"),
      import("@/app/auth/actions"),
    ]);
  const locale = await getLocale();
  const copy = await getDictionary();
  const landing = copy.marketing.landing;
  const action = resolveSharedHeaderAction({ authMode, isAuthenticated });
  const navigation = navigationItems ?? (action === "login" ? getMarketingHeaderLinks(locale) : []);
  const loginAction = primaryAction ?? { href: landingLoginHref, label: copy.marketing.loginCta };
  const visiblePrimaryAction = showAuthAction && action === "login" ? loginAction : null;
  const hasMobileMenu = navigation.length > 0 || Boolean(visiblePrimaryAction);
  const brandRootClassName = "flex min-w-0 cursor-pointer items-center gap-2 text-[var(--color-teal-deep)]";
  const brandLogoClassName = "h-8 w-auto object-contain sm:h-10";
  const brandTextClassName = "truncate text-xl font-semibold leading-none tracking-tight sm:text-2xl";

  return (
    <header className={cn(headerPositionClass[position], className)}>
      <div
        className={cn(
          "mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6",
          maxWidth === "none" && "max-w-none",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {brandAction === "scroll-top" ? (
            <BrandScrollTopButton
              brand={copy.common.brand}
              brandClassName={brandTextClassName}
              className={brandRootClassName}
              logoClassName={brandLogoClassName}
              logoPriority
              logoSrc={MEDPROOF_LOGO_SRC}
              scrollToTopLabel={copy.common.scrollToTop}
            />
          ) : (
            <Link
              href="/"
              className={brandRootClassName}
              aria-label={copy.common.brand}
            >
              <Image src={MEDPROOF_LOGO_SRC} alt="" width={44} height={51} priority className={brandLogoClassName} />
              <span className={brandTextClassName}>{copy.common.brand}</span>
            </Link>
          )}
          {contextTitle ? (
            <span className="hidden max-w-[260px] truncate border-l border-[var(--color-stone-surface)] pl-3 text-sm font-semibold text-[var(--color-graphite)] xl:inline">
              {contextTitle}
            </span>
          ) : null}
        </div>

        {navigation.length > 0 ? (
          <nav className="hidden items-center gap-6 lg:flex" aria-label={navigationLabel ?? copy.marketing.primaryNavLabel}>
            {navigation.map((item) => (
              <HeaderNavigationItem key={`${item.label}-${item.href ?? "button"}`} item={item} />
            ))}
          </nav>
        ) : null}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showLanguageSwitcher ? <LanguageSwitcher key={locale} locale={locale} labels={copy.common.languageToggle} /> : null}
          {showThemeToggle ? <ThemeToggle labels={copy.common.theme} /> : null}
          {contextAction ? (
            <Link
              href={contextAction.href}
              className="hidden min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-5 text-sm font-semibold leading-none text-[var(--color-teal-deep)] transition-colors hover:bg-[var(--color-teal-surface)] sm:inline-flex"
            >
              {contextAction.label}
            </Link>
          ) : null}
          {showAuthAction && action === "logout" ? (
            <form action={signOutAction}>
              <PendingSubmitButton
                type="submit"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-teal-deep)] px-4 text-sm font-semibold text-[var(--color-inverted)] transition-colors hover:bg-[var(--color-teal-primary)]"
                loadingLabel={copy.common.logout}
              >
                <span className="hidden sm:inline">{copy.common.logout}</span>
                <LogOut size={15} aria-hidden="true" />
              </PendingSubmitButton>
            </form>
          ) : null}
          {visiblePrimaryAction ? (
            <div className="hidden items-center lg:flex">
              <Link
                href={visiblePrimaryAction.href}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--color-teal-deep)] bg-[var(--color-card)] px-6 text-sm font-semibold leading-none text-[var(--color-teal-deep)] transition-colors hover:bg-[var(--color-teal-deep)] hover:text-[var(--color-inverted)]"
              >
                {visiblePrimaryAction.label}
              </Link>
            </div>
          ) : null}

          {hasMobileMenu ? (
            <details className="relative lg:hidden">
              <summary
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-midnight)] shadow-[var(--shadow-subtle)] [&::-webkit-details-marker]:hidden"
                aria-label={mobileMenuLabel ?? landing.mobileMenuLabel}
              >
                <Menu size={24} aria-hidden="true" />
              </summary>
              <div className="absolute right-0 mt-3 w-[min(calc(100vw-2rem),18rem)] rounded-2xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:rounded-3xl">
                <nav className="flex flex-col gap-1" aria-label={navigationLabel ?? copy.marketing.primaryNavLabel}>
                  {navigation.map((item) => (
                    <HeaderNavigationItem key={`${item.label}-${item.href ?? "button"}-mobile`} item={item} variant="mobile" />
                  ))}
                  {visiblePrimaryAction ? (
                    <Link
                      href={visiblePrimaryAction.href}
                      className="mt-2 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[var(--color-teal-deep)] px-5 text-sm font-semibold text-[var(--color-inverted)] transition-colors hover:bg-[var(--color-teal-primary)]"
                    >
                      {visiblePrimaryAction.label}
                    </Link>
                  ) : null}
                </nav>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function HeaderNavigationItem({
  item,
  variant = "desktop",
}: {
  item: SharedHeaderNavigationItem;
  variant?: "desktop" | "mobile";
}) {
  const className =
    variant === "mobile"
      ? cn(
          "cursor-pointer rounded-full px-4 py-3 text-sm font-medium text-[var(--color-graphite)] transition-colors hover:bg-[var(--color-teal-surface)] hover:text-[var(--color-teal-deep)]",
          item.active && "bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]",
        )
      : cn(
          "cursor-pointer text-sm font-medium text-[var(--color-graphite)] transition-colors hover:text-[var(--color-teal-deep)]",
          item.active && "text-[var(--color-teal-deep)]",
        );

  if (!item.href) {
    return (
      <button type="button" className={className}>
        {item.label}
      </button>
    );
  }

  if (item.href.startsWith("#")) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  );
}

const headerPositionClass: Record<NonNullable<SharedHeaderProps["position"]>, string> = {
  fixed:
    "fixed inset-x-0 top-0 z-50 border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-warm-canvas)_90%,transparent)] shadow-[0_1px_10px_color-mix(in_srgb,var(--color-midnight)_4%,transparent)] backdrop-blur-md",
  static:
    "relative z-40 border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-warm-canvas)_90%,transparent)] shadow-[0_1px_10px_color-mix(in_srgb,var(--color-midnight)_4%,transparent)] backdrop-blur-md",
  sticky:
    "sticky top-0 z-40 border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-warm-canvas)_90%,transparent)] shadow-[0_1px_10px_color-mix(in_srgb,var(--color-midnight)_4%,transparent)] backdrop-blur-md",
};
