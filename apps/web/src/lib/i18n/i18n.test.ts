import { describe, expect, it } from "vitest";

import { dictionary } from "./dictionary";
import {
  defaultLocale,
  getNextLocale,
  isLocale,
  localeCookieName,
  localeToggleTargets,
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
    expect(localeToggleTargets).toEqual({
      id: "en",
      en: "id",
    });
    expect(isLocale("id")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ja")).toBe(false);
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("id")).toBe("id");
    expect(parseLocale("")).toBe("id");
    expect(parseLocale(undefined)).toBe("id");
  });

  it("toggles directly between Indonesian and English", () => {
    expect(getNextLocale("id")).toBe("en");
    expect(getNextLocale("en")).toBe("id");
    expect(getNextLocale(undefined)).toBe("id");
    expect(getNextLocale("ja")).toBe("id");
  });

  it("keeps Indonesian and English dictionaries structurally identical", () => {
    expect(objectShape(dictionary.en)).toEqual(objectShape(dictionary.id));
  });

  it("provides localized scroll-to-top brand action labels", () => {
    expect(dictionary.id.common.scrollToTop).toBe("Kembali ke bagian atas halaman");
    expect(dictionary.en.common.scrollToTop).toBe("Back to top of page");
  });

  it("frames landing copy around blockchain-verified records, access tracking, and AI Journaling", () => {
    expect(dictionary.id.metadata.description).toBe(
      "Platform rekam medis terenkripsi dengan proof blockchain, log akses transparan, dan Jurnal AI pasien.",
    );
    expect(dictionary.id.marketing.landing.hero.title).toBe(
      "Rekam Medis Aman, Jurnal AI Lebih Siap Konsultasi",
    );
    expect(dictionary.id.marketing.landing.hero.description).toContain("audit trail");
    expect(dictionary.id.marketing.landing.hero.description).toContain("keluhan mental maupun fisik");
    expect(dictionary.id.marketing.landing.about.accent).toBe("MedProof");
    expect(dictionary.id.marketing.landing.about.cards[1].description).toContain("catatan rekam medis baru");
    expect(dictionary.id.marketing.landing.about.cards[1].description).toContain("tanpa mengubah catatan lama");
    expect(dictionary.id.marketing.landing.about.cards[1].description).not.toContain("Scope");
    expect(dictionary.id.marketing.landing.features.items.map((item) => item.title)).toEqual([
      "Rekam Medis Terverifikasi Blockchain",
      "Audit Trail Akses Dokter",
      "Jurnal AI Keluhan Pasien",
    ]);
    expect(dictionary.id.marketing.landing.footer.description).toContain("melacak akses dokter");

    expect(dictionary.en.metadata.description).toBe(
      "Encrypted medical records with blockchain proof, transparent access logs, and patient AI Journaling.",
    );
    expect(dictionary.en.marketing.landing.hero.title).toBe(
      "Secure Medical Records, AI Journaling for Better Consultations",
    );
    expect(dictionary.en.marketing.landing.hero.description).toContain("audit trail");
    expect(dictionary.en.marketing.landing.hero.description).toContain("mental or physical complaints");
    expect(dictionary.en.marketing.landing.about.accent).toBe("MedProof");
    expect(dictionary.en.marketing.landing.about.cards[1].description).toContain("new medical record notes");
    expect(dictionary.en.marketing.landing.about.cards[1].description).toContain("without changing the original record");
    expect(dictionary.en.marketing.landing.about.cards[1].description).not.toContain("Scope");
    expect(dictionary.en.marketing.landing.features.items.map((item) => item.title)).toEqual([
      "Blockchain-Verified Medical Records",
      "Doctor Access Audit Trail",
      "Patient Complaint AI Journal",
    ]);
    expect(dictionary.en.marketing.landing.footer.description).toContain("track doctor access");
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
      oauth_provider_denied: expect.any(String),
      oauth_provider_failed: expect.any(String),
      oauth_exchange_failed: expect.any(String),
      oauth_user_missing: expect.any(String),
      oauth_start_failed: expect.any(String),
      oauth_callback_failed: expect.any(String),
      unauthorized: expect.any(String),
      unknown: expect.any(String),
    });
    expect(enLogin.authErrors).toMatchObject({
      oauth_missing_code: expect.any(String),
      oauth_provider_denied: expect.any(String),
      oauth_provider_failed: expect.any(String),
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
