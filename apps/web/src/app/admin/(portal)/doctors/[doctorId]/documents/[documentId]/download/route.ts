import { NextResponse } from "next/server";

import { requireAdminRole } from "@/lib/auth/session";
import { loadDoctorKycDocumentPreview } from "@/lib/kyc/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string; documentId: string }> },
) {
  await requireAdminRole();
  const { doctorId, documentId } = await params;
  const document = await loadDoctorKycDocumentPreview({ doctorId, documentId });

  return new NextResponse(new Uint8Array(document.bytes), {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `attachment; filename="${encodeURIComponent(document.filename)}"`,
      "cache-control": "no-store",
    },
  });
}
