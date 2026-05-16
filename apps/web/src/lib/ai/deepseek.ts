import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";

import { requireEnv } from "@/lib/config/env";

import { aiExtractionSchema, type AiExtraction } from "./extraction";
import { buildExtractionPrompt, extractionSystemPrompt } from "./prompts";
import type { JournalAiMessage, JournalAiProvider } from "./providers";

export const DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export function createDeepSeekChatModel() {
  const env = requireEnv(["ai"]);
  const deepseek = createOpenAI({
    apiKey: env.data.DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
    name: "deepseek",
  });

  return deepseek.chat(DEEPSEEK_MODEL);
}

export function createDeepSeekJournalAiProvider(): JournalAiProvider {
  return {
    async extractSession(messages) {
      return extractSessionWithDeepSeek(messages);
    },
  };
}

async function extractSessionWithDeepSeek(messages: JournalAiMessage[]): Promise<AiExtraction> {
  const result = await generateText({
    model: createDeepSeekChatModel(),
    output: Output.json(),
    system: extractionSystemPrompt,
    prompt: `Ekstrak percakapan berikut menjadi json valid:\n\n${buildExtractionPrompt(messages)}`,
    maxOutputTokens: 1800,
    temperature: 0,
    maxRetries: 1,
  });

  return aiExtractionSchema.parse(result.output);
}
