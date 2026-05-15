import { describe, expect, it } from "vitest";

import { createFakeJournalAiProvider } from "./providers";

describe("journal AI providers", () => {
  it("uses a fake provider for automated extraction tests", async () => {
    const provider = createFakeJournalAiProvider();

    const extraction = await provider.extractSession([
      { role: "user", content: "Saya tidur 7 jam dan sakit kepala ringan." },
    ]);

    expect(extraction.summary).toContain("Ringkasan uji");
    expect(extraction.physical[0].rawQuote).toBe("Saya tidur 7 jam dan sakit kepala ringan.");
  });
});
