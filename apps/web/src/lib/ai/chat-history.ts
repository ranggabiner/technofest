export type ChatHistorySearchItem = {
  id: string;
  title: string | null;
  messages: readonly string[];
};

export function filterChatHistory<T extends ChatHistorySearchItem>(
  history: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeChatHistoryText(query);
  if (!normalizedQuery) return [...history];

  return history.filter((item) => {
    const title = normalizeChatHistoryText(item.title ?? "");
    if (title.includes(normalizedQuery)) return true;

    return item.messages.some((message) =>
      normalizeChatHistoryText(message).includes(normalizedQuery),
    );
  });
}

export function buildSessionTitleFromMessage(message: string) {
  const title = message.replace(/\s+/g, " ").trim();
  if (title.length <= 64) return title || "Jurnal AI";
  return `${title.slice(0, 61).trim()}...`;
}

function normalizeChatHistoryText(value: string) {
  return value.toLocaleLowerCase("id-ID").trim();
}
