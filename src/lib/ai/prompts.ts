import type { ModelMessage } from "ai";

import type { JournalAiMessage } from "./providers";

export const journalSystemPrompt = `
Anda adalah asisten jurnal kesehatan MedProof untuk data demo/test.
Jawab selalu dalam Bahasa Indonesia.
Tugas Anda membantu pasien mencatat gejala, kondisi fisik, perasaan, tidur, aktivitas, dan konteks harian.
Jangan memberi diagnosis, rencana terapi, dosis obat, atau klaim medis pasti.
Jika ada tanda bahaya seperti nyeri dada berat, sesak napas, pingsan, kelemahan satu sisi, perdarahan hebat, risiko melukai diri, atau kondisi darurat lain, sarankan pasien mencari bantuan medis darurat setempat.
Jaga jawaban singkat, empatik, dan berbentuk pertanyaan lanjutan bila perlu.
`.trim();

export const extractionSystemPrompt = `
Anda mengekstrak jurnal pasien MedProof menjadi JSON valid.
Gunakan hanya informasi yang tertulis di percakapan. Jangan mengarang nilai.
Jika nilai tidak jelas, pakai null.
JSON wajib memiliki bentuk:
{
  "summary": "ringkasan singkat Bahasa Indonesia",
  "mental": {
    "moodScore": 1-10 atau null,
    "anxietyLevel": 1-10 atau null,
    "sleepHours": 0-24 atau null,
    "triggerNotes": "teks atau null",
    "rawQuote": "kutipan pasien",
    "isEmergencyFlagged": true/false,
    "extractionConfidence": 0-1 atau null
  } atau null,
  "physical": [
    {
      "symptomType": "teks atau null",
      "severity": 1-10 atau null,
      "bodyLocation": "teks atau null",
      "durationNote": "teks atau null",
      "rawQuote": "kutipan pasien",
      "isEmergencyFlagged": true/false,
      "extractionConfidence": 0-1 atau null
    }
  ]
}
`.trim();

export function buildChatModelMessages(input: {
  profilingContext: string | null;
  conversation: JournalAiMessage[];
  latestMessage: string;
}): ModelMessage[] {
  const messages: ModelMessage[] = [{ role: "system", content: journalSystemPrompt }];

  if (input.profilingContext) {
    messages.push({
      role: "user",
      content: `Konteks profil terenkripsi yang sudah didekripsi di server: ${input.profilingContext}`,
    });
  }

  for (const message of input.conversation) {
    messages.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    });
  }

  messages.push({ role: "user", content: input.latestMessage });
  return messages;
}

export function buildExtractionPrompt(messages: JournalAiMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "Pasien" : "Asisten"}: ${message.content}`)
    .join("\n");
}
