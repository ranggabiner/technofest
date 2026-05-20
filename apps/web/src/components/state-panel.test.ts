import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState, InlineStatusMessage } from "./state-panel";

describe("state panel primitives", () => {
  it("allows empty states without an icon for legacy compact call sites", () => {
    const html = renderToStaticMarkup(
      React.createElement(EmptyState, { message: "No records", icon: false }),
    );

    expect(html).toContain("No records");
    expect(html).toContain("rounded-[10px]");
    expect(html).not.toContain("<svg");
  });

  it("renders consistent inline success and danger messages", () => {
    const success = renderToStaticMarkup(
      React.createElement(InlineStatusMessage, { tone: "success", message: "Saved" }),
    );
    const danger = renderToStaticMarkup(
      React.createElement(InlineStatusMessage, { tone: "danger", message: "Failed" }),
    );

    expect(success).toContain("border-[var(--color-teal-primary)]");
    expect(success).toContain("bg-[var(--color-teal-surface)]");
    expect(success).toContain("Saved");
    expect(danger).toContain("border-[var(--color-error-red)]");
    expect(danger).toContain("bg-[var(--color-error-surface)]");
    expect(danger).toContain("Failed");
  });
});
