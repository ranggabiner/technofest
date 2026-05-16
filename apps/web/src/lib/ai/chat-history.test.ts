import { describe, expect, it } from "vitest";

import { filterChatHistory } from "./chat-history";

const history = [
  {
    id: "session-anxiety",
    title: "Catatan cemas malam",
    messages: ["Saya sulit tidur dan cemas", "Coba catat pola napas"],
  },
  {
    id: "session-flu",
    title: "Keluhan fisik pagi",
    messages: ["Hidung tersumbat dan badan meriang"],
  },
  {
    id: "session-empty",
    title: null,
    messages: [],
  },
];

describe("patient chat history filtering", () => {
  it("returns normal history when search query is empty", () => {
    expect(filterChatHistory(history, "").map((item) => item.id)).toEqual([
      "session-anxiety",
      "session-flu",
      "session-empty",
    ]);
  });

  it("matches chat titles case-insensitively", () => {
    expect(filterChatHistory(history, "CEMAS").map((item) => item.id)).toEqual([
      "session-anxiety",
    ]);
  });

  it("matches decrypted message content", () => {
    expect(filterChatHistory(history, "meriang").map((item) => item.id)).toEqual([
      "session-flu",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterChatHistory(history, "tidak ada").map((item) => item.id)).toEqual([]);
  });
});
