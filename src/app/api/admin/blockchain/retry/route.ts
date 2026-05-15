import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRole } from "@/lib/auth/session";
import { retryPendingProofs } from "@/lib/blockchain/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const retrySchema = z.object({
  limit: z.number().int().min(1).max(25).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdminRole();
  } catch {
    return NextResponse.json({ error: "Akses admin diperlukan" }, { status: 403 });
  }

  const parsed = retrySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload retry tidak valid" }, { status: 400 });
  }

  try {
    const result = await retryPendingProofs(parsed.data.limit ?? 10);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "Retry proof blockchain gagal atau konfigurasi belum lengkap" },
      { status: 503 },
    );
  }
}
