import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  removeStatusToastParams,
  STATUS_TOAST_AUTO_DISMISS_MS,
} from "./status-toast";

describe("patient chat status toast", () => {
  const componentPath = new URL("./status-toast.tsx", import.meta.url);
  const source = () => readFileSync(componentPath, "utf8");

  it("uses a bounded auto-dismiss toast and clears status params from the URL", () => {
    expect(existsSync(componentPath)).toBe(true);

    const component = source();

    expect(component).toContain('"use client"');
    expect(component).toContain("export const STATUS_TOAST_AUTO_DISMISS_MS = 4000");
    expect(component).toContain("window.setTimeout");
    expect(component).toContain("window.clearTimeout");
    expect(component).toContain("window.history.replaceState");
    expect(component).toContain('url.searchParams.delete("ai_status")');
    expect(component).toContain('url.searchParams.delete("ai_error")');
    expect(component).toContain('url.searchParams.delete("ai_toast")');
  });

  it("uses a four second auto-dismiss duration", () => {
    expect(STATUS_TOAST_AUTO_DISMISS_MS).toBe(4000);
  });

  it("removes only chat toast params while preserving other query values and hash", () => {
    expect(
      removeStatusToastParams(
        "https://medproof.test/patient/chat?ai_status=finalized&tab=history&ai_error=finalize_failed&ai_toast=123#latest",
      ),
    ).toBe("/patient/chat?tab=history#latest");
  });
});
