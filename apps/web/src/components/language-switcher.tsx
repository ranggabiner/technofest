"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import { useRouteTransition } from "@/components/route-transition";
import { Button } from "@/components/ui/button";
import { getNextLocale, localeCookieName, type Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: {
    indonesia: string;
    english: string;
    switchToIndonesian: string;
    switchToEnglish: string;
  };
}) {
  const router = useRouter();
  const { beginRouteRefreshTransition } = useRouteTransition();

  const nextLocale = getNextLocale(locale);
  const label = locale === "id" ? labels.indonesia : labels.english;
  const ariaLabel = nextLocale === "id" ? labels.switchToIndonesian : labels.switchToEnglish;

  function handleClick() {
    beginRouteRefreshTransition(nextLocale);
    window.document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-11 min-w-11 rounded-full px-3 text-xs"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={handleClick}
    >
      <Languages size={15} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
