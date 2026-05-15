import { NextResponse } from "next/server";

import { requireAdminRole } from "@/lib/auth/session";
import { loadDecryptedKycDocument } from "@/lib/kyc/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  await requireAdminRole();
  const { documentId } = await params;
  const document = await loadDecryptedKycDocument({ documentId });

  return new NextResponse(new Uint8Array(document.bytes), {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `inline; filename="${encodeURIComponent(document.filename)}"`,
      "cache-control": "no-store",
    },
  });
}
