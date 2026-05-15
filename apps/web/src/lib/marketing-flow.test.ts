import { describe, expect, it } from "vitest";

import {
  footerLinks,
  headerLinks,
  landingLoginHref,
  loginGoogleHref,
  roleOptions,
  roleSelectionPath,
} from "./marketing-flow";

describe("marketing and login flow contracts", () => {
  it("keeps inactive header links visually clickable without navigation targets", () => {
    expect(headerLinks).toEqual([
      { label: "Landing Page", href: null },
      { label: "Tentang", href: null },
    ]);
  });

  it("starts login from the login screen and keeps role selection as post-auth completion", () => {
    expect(landingLoginHref).toBe("/login");
    expect(loginGoogleHref).toBe("/login");
    expect(roleSelectionPath).toBe("/login/role");
  });

  it("keeps role selection mapped to existing OAuth intents", () => {
    expect(roleOptions).toEqual([
      {
        intent: "patient",
        title: "Daftar sebagai Pasien",
        description: "Kelola catatan medis dan jurnal kesehatan Anda secara mandiri.",
      },
      {
        intent: "doctor",
        title: "Daftar sebagai Dokter",
        description: "Akses data pasien dengan izin dan kelola rekam medis secara aman.",
      },
    ]);
  });

  it("keeps footer links inert for this revision", () => {
    expect(footerLinks).toEqual([
      { label: "Privasi", href: null },
      { label: "Ketentuan", href: null },
      { label: "Bantuan", href: null },
    ]);
  });
});
