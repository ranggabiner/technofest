import type { AuthIntent } from "@/lib/auth/roles";

import { dictionary } from "./dictionary";
import type { Locale } from "./locales";

type RoleOption = {
  intent: Exclude<AuthIntent, null>;
  title: string;
  description: string;
};

export const landingLoginHref = "/login";
export const loginDemoHref = "/login/demo";
export const loginRealHref = "/login/real";
export const roleSelectionPath = "/login/role";
export const loginGoogleHref = loginRealHref;

export function getMarketingHeaderLinks(locale: Locale) {
  return [...dictionary[locale].marketing.headerLinks];
}

export function getMarketingFooterLinks(locale: Locale) {
  return [...dictionary[locale].marketing.footerLinks];
}

export function getRoleOptions(locale: Locale): RoleOption[] {
  return dictionary[locale].marketing.role.options.map((option) => ({
    intent: option.intent,
    title: option.title,
    description: option.description,
  }));
}
