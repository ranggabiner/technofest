import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("LanguageSwitcher", () => {
  const source = readFileSync(new URL("./language-switcher.tsx", import.meta.url), "utf8");

  it("uses the same single-click button pattern as the theme toggle", () => {
    expect(source).toContain("import { Button } from \"@/components/ui/button\";");
    expect(source).toContain("getNextLocale");
    expect(source).toContain("router.refresh()");
    expect(source).toContain("window.document.cookie");
    expect(source).not.toContain("supportedLocales.map");
    expect(source).not.toContain("<select");
    expect(source).not.toContain("<details");
  });

  it("announces the target language while showing the current locale code", () => {
    expect(source).toContain("aria-label={ariaLabel}");
    expect(source).toContain("title={ariaLabel}");
    expect(source).toContain("currentLocale === \"id\" ? labels.indonesia : labels.english");
    expect(source).toContain("nextLocale === \"id\" ? labels.switchToIndonesian : labels.switchToEnglish");
  });
});
