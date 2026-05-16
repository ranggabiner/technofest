import { describe, expect, it } from "vitest";

import { dictionary } from "./dictionary";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  parseLocale,
  supportedLocales,
} from "./locales";
import { getMarketingHeaderLinks, getRoleOptions } from "./marketing";

function objectShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(objectShape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, objectShape(child)]),
    );
  }
  return typeof value;
}

describe("i18n locale contracts", () => {
  it("defaults to Indonesian and rejects unknown locale values", () => {
    expect(defaultLocale).toBe("id");
    expect(localeCookieName).toBe("medproof_locale");
    expect(supportedLocales).toEqual(["id", "en"]);
    expect(isLocale("id")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ja")).toBe(false);
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("id")).toBe("id");
    expect(parseLocale("")).toBe("id");
    expect(parseLocale(undefined)).toBe("id");
  });

  it("keeps Indonesian and English dictionaries structurally identical", () => {
    expect(objectShape(dictionary.en)).toEqual(objectShape(dictionary.id));
  });

  it("resolves marketing and role labels from selected locale", () => {
    expect(getMarketingHeaderLinks("id")).toEqual([
      { label: "Landing Page", href: null },
      { label: "Tentang", href: null },
    ]);
    expect(getMarketingHeaderLinks("en")).toEqual([
      { label: "Landing Page", href: null },
      { label: "About", href: null },
    ]);
    expect(getRoleOptions("en")[0]).toMatchObject({
      intent: "patient",
      title: "Register as Patient",
    });
  });

  it("provides localized auth error messages for OAuth redirects", () => {
    const idLogin = dictionary.id.marketing.login as typeof dictionary.id.marketing.login & {
      authErrors?: Record<string, string>;
    };
    const enLogin = dictionary.en.marketing.login as typeof dictionary.en.marketing.login & {
      authErrors?: Record<string, string>;
    };

    expect(idLogin.authErrors).toMatchObject({
      oauth_missing_code: expect.any(String),
      oauth_exchange_failed: expect.any(String),
      oauth_user_missing: expect.any(String),
      oauth_start_failed: expect.any(String),
      oauth_callback_failed: expect.any(String),
      unauthorized: expect.any(String),
      unknown: expect.any(String),
    });
    expect(enLogin.authErrors).toMatchObject({
      oauth_missing_code: expect.any(String),
      oauth_exchange_failed: expect.any(String),
      oauth_user_missing: expect.any(String),
      oauth_start_failed: expect.any(String),
      oauth_callback_failed: expect.any(String),
      unauthorized: expect.any(String),
      unknown: expect.any(String),
    });
  });

  it("keeps doctor upload error messages short but reason-specific", () => {
    const uploadErrorKeys = ["empty_file", "file_too_large", "unsupported_type", "network", "server", "unknown"] as const;

    for (const locale of ["id", "en"] as const) {
      for (const key of uploadErrorKeys) {
        const message = dictionary[locale].doctor.onboarding.uploadErrors[key];
        const wordCount = message.split(/\s+/).filter(Boolean).length;

        expect(wordCount, `${locale}.${key}: ${message}`).toBeGreaterThanOrEqual(3);
        expect(wordCount, `${locale}.${key}: ${message}`).toBeLessThanOrEqual(4);
      }
    }
  });
});
