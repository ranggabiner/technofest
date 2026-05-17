import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import {
  loadPatientHealthHistoryAttachment,
  PatientHealthHistoryAttachmentError,
} from "@/lib/patient/health-history";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string; fileId: string }> },
) {
  const role = await requireRole();
  const { recordId, fileId } = await params;
  let file;

  try {
    file = await loadPatientHealthHistoryAttachment({ role, recordId, fileId });
  } catch (error) {
    if (error instanceof PatientHealthHistoryAttachmentError) {
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
