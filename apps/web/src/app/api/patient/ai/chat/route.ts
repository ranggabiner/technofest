import { streamText } from "ai";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createDeepSeekChatModel } from "@/lib/ai/deepseek";
import {
  preparePatientChatTurn,
  storeAiAssistantMessage,
} from "@/lib/ai/journal-service";
import { getDictionary } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return new Response(copy.api.patientRequired, { status: 403 });
  }

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(copy.api.messageInvalid, { status: 400 });
  }

  try {
    const turn = await preparePatientChatTurn({
      role,
      message: parsed.data.message,
      requestedSessionId: parsed.data.sessionId,
    });

    const result = streamText({
      model: createDeepSeekChatModel(),
      messages: turn.modelMessages,
      maxOutputTokens: 700,
      temperature: 0.3,
      maxRetries: 1,
      onFinish: async ({ text }) => {
        await storeAiAssistantMessage({
          patientId: turn.patientId,
          sessionId: turn.sessionId,
          content: text,
        });
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store",
        "X-MedProof-Session-Id": turn.sessionId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : copy.api.chatFailed;
    const status = message.includes("5 pesan") ? 429 : 400;
    return new Response(message, { status });
  }
}
