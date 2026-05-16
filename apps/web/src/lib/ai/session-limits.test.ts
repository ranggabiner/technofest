import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("patient AI chat message limit removal", () => {
  it("removes the session-limit module and all runtime imports", () => {
    expect(existsSync(new URL("./session-limits.ts", import.meta.url))).toBe(false);

    const serviceSource = readFileSync(new URL("./journal-service.ts", import.meta.url), "utf8");
    const routeSource = readFileSync(
      new URL("../../app/api/patient/ai/chat/route.ts", import.meta.url),
      "utf8",
    );
    const clientSource = readFileSync(
      new URL("../../app/patient/_components/ai-journal-client.tsx", import.meta.url),
      "utf8",
    );
    const source = `${serviceSource}\n${routeSource}\n${clientSource}`;

    expect(source).not.toContain("MAX_PATIENT_MESSAGES_PER_SESSION");
    expect(source).not.toContain("assertCanSendPatientMessage");
    expect(routeSource).not.toContain("5 pesan");
    expect(clientSource).not.toContain("limitReached");
  });
});
