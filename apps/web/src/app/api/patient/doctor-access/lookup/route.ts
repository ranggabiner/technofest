import { NextRequest, NextResponse } from "next/server";

import {
  getRequestIp,
  lookupDoctorForPatient,
} from "@/lib/access/doctor-access";
import { DOCTOR_LOOKUP_GENERIC_ERROR } from "@/lib/access/grants";
import { getCurrentRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export async function POST(request: NextRequest) {
  const copy = await getDictionary();
  const role = await getCurrentRole();
  if (!role) {
    return NextResponse.json({ error: copy.api.sessionMissing }, { status: 401 });
  }
  if (role.kind !== "patient") {
    return NextResponse.json({ error: copy.api.patientLookupOnly }, { status: 403 });
  }

  let value = "";
  try {
    const body = (await request.json()) as { value?: unknown };
    value = typeof body.value === "string" ? body.value : "";
  } catch {
    return NextResponse.json({ error: copy.patient.access.doctorNotFound }, { status: 400 });
  }

  try {
    const doctor = await lookupDoctorForPatient(role, value, getRequestIp(request.headers));
    return NextResponse.json({ doctor });
  } catch (error) {
    const message = error instanceof Error ? error.message : DOCTOR_LOOKUP_GENERIC_ERROR;
    const status = message.includes("Terlalu banyak") ? 429 : 400;
    const safeMessage =
      status === 429
        ? copy.api.lookupRateLimited
        : message === DOCTOR_LOOKUP_GENERIC_ERROR
          ? copy.patient.access.doctorNotFound
          : copy.patient.access.lookupFailed;
    return NextResponse.json({ error: safeMessage }, { status });
  }
}
