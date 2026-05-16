import { defaultLocale } from "./i18n/locales";
import {
  getMarketingFooterLinks,
  getMarketingHeaderLinks,
  getRoleOptions,
  landingLoginHref,
  loginGoogleHref,
  roleSelectionPath,
} from "./i18n/marketing";

export { landingLoginHref, loginGoogleHref, roleSelectionPath };

export const headerLinks = getMarketingHeaderLinks(defaultLocale);
export const footerLinks = getMarketingFooterLinks(defaultLocale);
export const roleOptions = getRoleOptions(defaultLocale);
