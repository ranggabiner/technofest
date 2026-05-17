"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);

  const nextLocale = getNextLocale(currentLocale);
  const label = currentLocale === "id" ? labels.indonesia : labels.english;
  const ariaLabel = nextLocale === "id" ? labels.switchToIndonesian : labels.switchToEnglish;

  function handleClick() {
    setCurrentLocale(nextLocale);
    window.document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-9 rounded-full px-3 text-xs"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={handleClick}
    >
      <Languages size={15} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
