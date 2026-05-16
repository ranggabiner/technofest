import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const MEDPROOF_LOGO_SRC = "/medproof-logo.webp";

export type SharedHeaderAuthMode = "auto" | "public" | "authenticated";
export type SharedHeaderAction = "login" | "logout";

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
  className?: string;
  contextAction?: {
    href: string;
    label: string;
  };
  contextTitle?: string;
  isAuthenticated?: boolean;
  maxWidth?: "content" | "none";
  position?: "fixed" | "sticky" | "static";
  showAuthAction?: boolean;
};

export async function SharedHeader({
  authMode = "auto",
  className,
  contextAction,
  contextTitle,
  isAuthenticated = false,
  maxWidth = "content",
  position = "fixed",
  showAuthAction = true,
}: SharedHeaderProps) {
  const [{ getDictionary, getLocale }, { getMarketingHeaderLinks, landingLoginHref }, { signOutAction }] =
    await Promise.all([
      import("@/lib/i18n/server"),
      import("@/lib/i18n/marketing"),
      import("@/app/auth/actions"),
    ]);
  const locale = await getLocale();
  const copy = await getDictionary();
  const headerLinks = getMarketingHeaderLinks(locale);
  const action = resolveSharedHeaderAction({ authMode, isAuthenticated });

  return (
    <header
      className={cn(
        headerPositionClass[position],
        "border-b border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 md:px-6",
          maxWidth === "content" ? "max-w-[1100px]" : "max-w-none",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex min-w-0 cursor-pointer items-center gap-2 text-[var(--color-midnight)]"
            aria-label={copy.common.brand}
          >
            <Image
              src={MEDPROOF_LOGO_SRC}
              alt=""
              width={44}
              height={51}
              priority
              className="h-9 w-auto shrink-0 object-contain md:h-10"
            />
            <span className="truncate font-serif text-[24px] font-medium leading-none md:text-[36px]">
              {copy.common.brand}
            </span>
          </Link>
          {contextTitle ? (
            <span className="hidden max-w-[260px] truncate border-l border-[var(--color-stone-surface)] pl-3 text-sm font-semibold text-[var(--color-graphite)] lg:inline">
              {contextTitle}
            </span>
          ) : null}
        </div>

        {action === "login" ? (
          <nav className="hidden items-center gap-8 md:flex" aria-label={copy.marketing.primaryNavLabel}>
            {headerLinks.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="cursor-pointer text-[15px] font-normal text-[var(--color-graphite)] transition hover:text-[var(--color-midnight)]"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className="cursor-pointer text-[15px] font-normal text-[var(--color-graphite)] transition hover:text-[var(--color-midnight)]"
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher locale={locale} label={copy.common.language} />
          <ThemeToggle labels={copy.common.theme} />
          {contextAction ? (
            <Link
              href={contextAction.href}
              className="hidden min-h-9 cursor-pointer items-center justify-center rounded-full bg-[var(--color-stone-surface)] px-4 py-2 text-[12px] font-semibold text-[var(--color-midnight)] transition hover:bg-[var(--color-parchment-card)] sm:inline-flex"
            >
              {contextAction.label}
            </Link>
          ) : null}
          {showAuthAction && action === "logout" ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-midnight)] px-3 py-2 text-[12px] font-semibold text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)] md:px-4"
              >
                <span className="hidden sm:inline">{copy.common.logout}</span>
                <LogOut size={15} aria-hidden="true" />
              </button>
            </form>
          ) : null}
          {showAuthAction && action === "login" ? (
            <Link
              href={landingLoginHref}
              className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full bg-[var(--color-midnight)] px-4 py-2 text-[12px] font-semibold text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)]"
            >
              {copy.marketing.loginCta}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

const headerPositionClass: Record<NonNullable<SharedHeaderProps["position"]>, string> = {
  fixed: "fixed inset-x-0 top-0 z-50",
  static: "relative z-40",
  sticky: "sticky top-0 z-40",
};
