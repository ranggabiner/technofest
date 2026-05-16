import type { AiExtraction } from "./extraction";

export type JournalAiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type JournalAiProvider = {
  extractSession(messages: JournalAiMessage[]): Promise<AiExtraction>;
};

export function createFakeJournalAiProvider(): JournalAiProvider {
  return {
    async extractSession(messages) {
      const firstUserMessage =
        messages.find((message) => message.role === "user")?.content ??
        "Tidak ada kutipan pasien dalam sesi uji.";

      return {
        summary: {
          general: "Ringkasan umum uji dari provider palsu.",
          mental: "Ringkasan mental uji dari provider palsu.",
          physical: "Ringkasan fisik uji dari provider palsu.",
        },
        mental: {
          moodScore: 7,
          anxietyLevel: 3,
          sleepHours: 7,
          triggerNotes: "Data uji otomatis.",
          rawQuote: firstUserMessage,
          isEmergencyFlagged: false,
          extractionConfidence: 0.8,
        },
        physical: [
          {
            symptomType: "keluhan uji",
            severity: 3,
            bodyLocation: null,
            durationNote: null,
            rawQuote: firstUserMessage,
            isEmergencyFlagged: false,
            extractionConfidence: 0.75,
          },
        ],
      };
    },
  };
}
