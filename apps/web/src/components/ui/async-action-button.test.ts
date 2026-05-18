import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("async action button helpers", () => {
  const componentUrl = new URL("./async-action-button.tsx", import.meta.url);

  it("provides pending buttons with centered spinner and stable dimensions", () => {
    expect(existsSync(componentUrl)).toBe(true);

    const source = readFileSync(componentUrl, "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("useFormStatus");
    expect(source).toContain("Loader2");
    expect(source).toContain("PendingSubmitButton");
    expect(source).toContain("LoadingActionButton");
    expect(source).toContain("absolute inset-0 grid place-items-center");
    expect(source).toContain("opacity-0");
    expect(source).toContain("cursor-not-allowed");
    expect(source).toContain("disabled:opacity-70");
    expect(source).toContain("animate-spin");
    expect(source).toContain("aria-busy={isLoading}");
    expect(source).toContain("disabled={isLoading || disabled}");
    expect(source).not.toContain("Skeleton");
    expect(source).not.toContain("invisible pointer-events-none");
  });
});
