import { NextResponse } from "next/server";

import { requireDoctorRole } from "@/lib/auth/session";
import { DoctorAccessError, loadMedicalAttachment } from "@/lib/doctor-records/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ grantId: string; fileId: string }> },
) {
  const role = await requireDoctorRole();
  const { grantId, fileId } = await params;
  let file;

  try {
    file = await loadMedicalAttachment({ role, grantId, fileId, requireDownload: false });
  } catch (error) {
    if (error instanceof DoctorAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.reason === "not_found" ? 404 : 403 },
      );
    }

    throw error;
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "content-type": file.mimeType,
      "content-disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "cache-control": "no-store",
    },
  });
}
