import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRole } from "@/lib/auth/session";
import { retryPendingProofs } from "@/lib/blockchain/service";
import { getDictionary } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const retrySchema = z.object({
  limit: z.number().int().min(1).max(25).optional(),
});

export async function POST(request: Request) {
  const copy = await getDictionary();
  try {
    await requireAdminRole();
  } catch {
    return NextResponse.json({ error: copy.api.adminRequired }, { status: 403 });
  }

  const parsed = retrySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: copy.api.retryInvalid }, { status: 400 });
  }

  try {
    const result = await retryPendingProofs(parsed.data.limit ?? 10);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: copy.api.retryConfigFailed },
      { status: 503 },
    );
  }
}
