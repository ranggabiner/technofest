export const supportedLocales = ["id", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "id";
export const localeCookieName = "medproof_locale";

export const localeToggleTargets: Record<Locale, Locale> = {
  id: "en",
  en: "id",
};

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getNextLocale(currentLocale: unknown): Locale {
  return isLocale(currentLocale) ? localeToggleTargets[currentLocale] : defaultLocale;
}
