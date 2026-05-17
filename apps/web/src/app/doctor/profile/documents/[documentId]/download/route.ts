import { NextResponse } from "next/server";

import { requireDoctorRole } from "@/lib/auth/session";
import { loadDoctorKycDocumentPreview } from "@/lib/kyc/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const role = await requireDoctorRole();
  if (!role.doctorId) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  const { documentId } = await params;
  const document = await loadDoctorKycDocumentPreview({
    documentId,
    doctorId: role.doctorId,
  });

  return new NextResponse(new Uint8Array(document.bytes), {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `attachment; filename="${encodeURIComponent(document.filename)}"`,
      "cache-control": "no-store",
    },
  });
}
