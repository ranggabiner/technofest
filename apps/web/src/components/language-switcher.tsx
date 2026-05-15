"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { localeCookieName, supportedLocales, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const router = useRouter();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!pendingLocale) return;
    window.document.cookie = `${localeCookieName}=${pendingLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [pendingLocale, router]);

  return (
    <div
      className="inline-flex items-center rounded-full bg-[var(--color-stone-surface)] p-1"
      aria-label={label}
    >
      {supportedLocales.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setPendingLocale(option)}
          aria-pressed={locale === option}
          className={cn(
            "min-h-7 rounded-full px-3 text-xs font-semibold transition",
            locale === option
              ? "bg-[var(--color-card)] text-[var(--color-midnight)] shadow-[var(--shadow-subtle)]"
              : "text-[var(--color-ash)] hover:text-[var(--color-midnight)]",
          )}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
