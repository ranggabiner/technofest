import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentRole } from "@/lib/auth/session";
import {
  DoctorAccessError,
  DoctorRagNoDataError,
  answerDoctorRag,
} from "@/lib/doctor-records/service";
import { getDictionary } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ragRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ grantId: string }> },
) {
  const copy = await getDictionary();
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: copy.api.sessionMissing }, { status: 401 });
  if (role.kind !== "doctor") {
    return NextResponse.json({ error: copy.api.doctorRequired }, { status: 403 });
  }

  const parsed = ragRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: copy.api.questionInvalid }, { status: 400 });
  }

  const { grantId } = await params;
  try {
    const answer = await answerDoctorRag({
      role,
      grantId,
      question: parsed.data.question,
    });
    return NextResponse.json(answer);
  } catch (error) {
    if (error instanceof DoctorAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof DoctorRagNoDataError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: copy.api.doctorRagFailed }, { status: 500 });
  }
}
