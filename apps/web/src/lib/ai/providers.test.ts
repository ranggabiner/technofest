import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { createFakeJournalAiProvider } from "./providers";

describe("journal AI providers", () => {
  it("uses a fake provider for automated extraction tests", async () => {
    const provider = createFakeJournalAiProvider();

    const extraction = await provider.extractSession([
      { role: "user", content: "Saya tidur 7 jam dan sakit kepala ringan." },
    ]);

    expect(extraction.summary).toEqual({
      general: "Ringkasan umum uji dari provider palsu.",
      mental: "Ringkasan mental uji dari provider palsu.",
      physical: "Ringkasan fisik uji dari provider palsu.",
    });
    expect(extraction.physical[0].rawQuote).toBe("Saya tidur 7 jam dan sakit kepala ringan.");
  });

  it("keeps DeepSeek extraction on json_object mode with local schema validation", () => {
    const source = readFileSync(new URL("./deepseek.ts", import.meta.url), "utf8");

    expect(source).not.toContain("generateObject");
    expect(source).toContain("Output.json()");
    expect(source).toContain("aiExtractionSchema.parse(result.output)");
  });
});
