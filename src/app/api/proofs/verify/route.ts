import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentRole } from "@/lib/auth/session";
import { verifyProofForRole } from "@/lib/blockchain/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  proofType: z.enum(["scope1_record", "access_grant", "audit_log"]),
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });

  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload verifikasi tidak valid" }, { status: 400 });
  }

  try {
    const result = await verifyProofForRole(role, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verifikasi proof gagal";
    const status = message.includes("berwenang") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
