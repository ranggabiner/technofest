import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { loadPatientChatSession } from "@/lib/ai/journal-service";
import { getDictionary } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return NextResponse.json({ error: copy.api.patientRequired }, { status: 403 });
  }

  const parsed = sessionParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: copy.api.sessionInvalid }, { status: 400 });
  }

  try {
    return NextResponse.json(await loadPatientChatSession(role, parsed.data.sessionId));
  } catch (error) {
    const message = error instanceof Error ? error.message : copy.api.chatSessionFailed;
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
