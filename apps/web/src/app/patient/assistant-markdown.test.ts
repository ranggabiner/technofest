import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AssistantMarkdown } from "./_components/assistant-markdown";

describe("AssistantMarkdown", () => {
  function render(content: string) {
    return renderToStaticMarkup(
      React.createElement(AssistantMarkdown, { content }),
    );
  }

  it("renders emphasis, lists, paragraphs, inline code, and code blocks", () => {
    const html = render(`**Penting** dan _tenang_.

- Minum air
- Istirahat

1. Catat gejala
2. Hubungi dokter

Gunakan \`kode\`.

\`\`\`txt
baris panjang tanpa spasi
\`\`\``);

    expect(html).toContain("<strong");
    expect(html).toContain("Penting");
    expect(html).toContain("<em");
    expect(html).toContain("tenang");
    expect(html).toContain("<ul");
    expect(html).toContain("<ol");
    expect(html).toContain("<li");
    expect(html).toContain("<code");
    expect(html).toContain("<pre");
    expect(html).toContain("overflow-x-auto");
  });

  it("renders safe links and blocks unsafe link protocols", () => {
    const safeHtml = render("[MedProof](https://medproof.test/path)");
    const unsafeHtml = render("[bahaya](javascript:alert(1))");

    expect(safeHtml).toContain('href="https://medproof.test/path"');
    expect(safeHtml).toContain('target="_blank"');
    expect(safeHtml).toContain('rel="noopener noreferrer"');
    expect(unsafeHtml).not.toContain("javascript:alert");
    expect(unsafeHtml).not.toContain("href=");
  });

  it("does not render raw HTML from assistant content", () => {
    const html = render("<script>alert(1)</script><strong>teks</strong>");

    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).not.toContain("<strong>teks</strong>");
  });
});
