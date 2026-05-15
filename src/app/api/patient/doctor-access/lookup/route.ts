import { NextRequest, NextResponse } from "next/server";

import {
  getRequestIp,
  lookupDoctorForPatient,
} from "@/lib/access/doctor-access";
import { DOCTOR_LOOKUP_GENERIC_ERROR } from "@/lib/access/grants";
import { getCurrentRole } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const role = await getCurrentRole();
  if (!role) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
  }
  if (role.kind !== "patient") {
    return NextResponse.json({ error: "Hanya pasien yang dapat mencari dokter" }, { status: 403 });
  }

  let value = "";
  try {
    const body = (await request.json()) as { value?: unknown };
    value = typeof body.value === "string" ? body.value : "";
  } catch {
    return NextResponse.json({ error: DOCTOR_LOOKUP_GENERIC_ERROR }, { status: 400 });
  }

  try {
    const doctor = await lookupDoctorForPatient(role, value, getRequestIp(request.headers));
    return NextResponse.json({ doctor });
  } catch (error) {
    const message = error instanceof Error ? error.message : DOCTOR_LOOKUP_GENERIC_ERROR;
    const status = message.includes("Terlalu banyak") ? 429 : 400;
    const safeMessage =
      message === DOCTOR_LOOKUP_GENERIC_ERROR || status === 429
        ? message
        : "Pencarian dokter gagal";
    return NextResponse.json({ error: safeMessage }, { status });
  }
}
