import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import {
  loadPatientChatHistory,
  startNewPatientChatSession,
} from "@/lib/ai/journal-service";
import { getDictionary } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newSessionSchema = z.object({
  action: z.literal("new"),
});

export async function GET(request: NextRequest) {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return NextResponse.json({ error: copy.api.patientRequired }, { status: 403 });
  }

  try {
    const query = request.nextUrl.searchParams.get("query") ?? "";
    return NextResponse.json({
      sessions: await loadPatientChatHistory(role, query),
    });
  } catch {
    return NextResponse.json({ error: copy.api.chatHistoryFailed }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return NextResponse.json({ error: copy.api.patientRequired }, { status: 403 });
  }

  const parsed = newSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: copy.api.sessionInvalid }, { status: 400 });
  }

  try {
    return NextResponse.json(await startNewPatientChatSession(role));
  } catch (error) {
    const message = error instanceof Error ? error.message : copy.api.chatSessionFailed;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
