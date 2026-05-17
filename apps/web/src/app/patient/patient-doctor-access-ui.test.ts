import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("patient doctor access page", () => {
  const pageSource = () =>
    readFileSync(new URL("./(portal)/access/page.tsx", import.meta.url), "utf8");
  const clientSource = () =>
    readFileSync(new URL("./_components/doctor-access-client.tsx", import.meta.url), "utf8");
  const dashboardQuickAccessSource = () =>
    readFileSync(new URL("./_components/patient-dashboard-quick-access.tsx", import.meta.url), "utf8");
  const scannerModalSource = () =>
    readFileSync(new URL("./_components/doctor-qr-scanner-modal.tsx", import.meta.url), "utf8");

  it("keeps the doctor access page inside the current patient portal shell", () => {
    const source = pageSource();

    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
    expect(source).toContain("DoctorAccessClient");
    expect(source).toContain("loadPatientAccessState");
  });

  it("builds only the main content area from the Stitch doctor access reference", () => {
    const page = pageSource();
    const client = clientSource();

    expect(page).toContain('data-doctor-access-page="main"');
    expect(page).toContain('data-doctor-access-section="grant"');
    expect(page).toContain('data-doctor-access-section="activity"');
    expect(page).toContain('data-doctor-access-section="history"');
    expect(page).toContain("copy.patient.access.description");
    expect(page).toContain("copy.patient.access.newAccessTitle");
    expect(page).toContain("copy.patient.access.activityTitle");
    expect(page).toContain("DoctorAccessStatusLog");
    expect(page).toContain("AccessHistoryList");
    expect(page).not.toContain("/patient/access-history");
    expect(page).not.toContain("copy.patient.access.historyCta");
    expect(page).toContain('DashboardCard className="grid content-start gap-4 p-6"');

    expect(client).toContain('data-doctor-access-method="code"');
    expect(client).toContain('data-doctor-access-method="qr"');
    expect(client).toContain('data-doctor-access-active-card');
  });

  it("keeps manual doctor code fields numeric and capped at six digits", () => {
    const client = clientSource();
    const dashboardQuickAccess = dashboardQuickAccessSource();

    for (const source of [client, dashboardQuickAccess]) {
      expect(source).toContain("normalizeDoctorAccessCodeInput");
      expect(source).toContain("mergeDoctorAccessCodeInput");
      expect(source).toContain("preventNonNumericDoctorCodeInput");
      expect(source).toContain("maxLength={DOCTOR_ACCESS_CODE_MAX_LENGTH}");
      expect(source).toContain('inputMode="numeric"');
      expect(source).toContain('pattern="[0-9]*"');
      expect(source).toContain("onPaste=");
    }

    expect(client).not.toContain("setLookupValue(rawValue)");
  });

  it("localizes all Stitch-derived doctor access content in Indonesian and English", () => {
    const idAccess = dictionary.id.patient.access;
    const enAccess = dictionary.en.patient.access;

    expect(idAccess.title).toBe("Kelola Akses Dokter");
    expect(idAccess.newAccessTitle).toBe("Berikan Akses Baru");
    expect(idAccess.newAccessDescription).toContain("Pilih cara");
    expect(idAccess.codeMethodTitle).toBe("Gunakan Kode 6 Digit");
    expect(idAccess.qrMethodTitle).toBe("Pindai Kode QR");
    expect(idAccess.activityTitle).toBe("Akses Aktif & Riwayat");
    expect(idAccess.historyTitle).toBe("Riwayat akses dan Proof");
    expect(idAccess.activeSessionAlreadyExists).toBe(
      "Sesi akses untuk dokter ini sudah aktif. Kamu hanya dapat memiliki satu sesi aktif untuk dokter yang sama.",
    );

    expect(enAccess.title).toBe("Manage Doctor Access");
    expect(enAccess.newAccessTitle).toBe("Grant New Access");
    expect(enAccess.newAccessDescription).toContain("Choose");
    expect(enAccess.codeMethodTitle).toBe("Use 6-Digit Code");
    expect(enAccess.qrMethodTitle).toBe("Scan QR Code");
    expect(enAccess.activityTitle).toBe("Active Access & History");
    expect(enAccess.historyTitle).toBe("Access history and Proof");
    expect(enAccess.activeSessionAlreadyExists).toBe(
      "An access session for this doctor is already active. You can only have one active session for the same doctor at a time.",
    );
  });

  it("requires a permission modal before a verified doctor access grant is submitted", () => {
    const client = clientSource();
    const idAccess = dictionary.id.patient.access;
    const enAccess = dictionary.en.patient.access;

    expect(client).toContain("PermissionAccessModal");
    expect(client).toContain("setPermissionDoctor(body.doctor)");
    expect(client).toContain("setPermissionModalOpen(true)");
    expect(client).toContain('data-permission-access-modal');
    expect(client).toContain('dataScope="scope1"');
    expect(client).toContain("data-permission-scope-card={dataScope}");
    expect(client).toContain('data-permission-record-row');
    expect(client).toContain('dataValue="30"');
    expect(client).toContain("data-permission-time-option={dataValue}");
    expect(client).toContain('name="attachment_record_ids"');
    expect(client).toContain('startName="scope2_mental_start_date"');
    expect(client).toContain('endName="scope2_mental_end_date"');
    expect(client).toContain('startName="scope2_physical_start_date"');
    expect(client).toContain('endName="scope2_physical_end_date"');
    expect(client).not.toContain('defaultValue="last_n_days:90"');
    expect(client).toContain('data-permission-action="allow"');
    expect(client).toContain('data-permission-action="cancel"');
    expect(pageSource()).toContain("loadPatientAccessPermissionOptions");
    expect(pageSource()).toContain("permissionOptions={permissionOptions}");

    expect(idAccess.permissionModalTitle).toBe("Izin Akses Medis");
    expect(idAccess.permissionModalDescription).toContain("meminta izin");
    expect(idAccess.permissionModalTimeTitle).toBe("Batas Waktu Akses");
    expect(idAccess.permissionTime30Minutes).toBe("30 Menit");
    expect(idAccess.permissionModalCancel).toBe("Batal");
    expect(idAccess.permissionModalAllow).toBe("Berikan Akses");

    expect(enAccess.permissionModalTitle).toBe("Medical Access Permission");
    expect(enAccess.permissionModalDescription).toContain("is requesting permission");
    expect(enAccess.permissionModalTimeTitle).toBe("Access Time Limit");
    expect(enAccess.permissionTime30Minutes).toBe("30 Minutes");
    expect(enAccess.permissionModalCancel).toBe("Cancel");
    expect(enAccess.permissionModalAllow).toBe("Grant Access");
  });

  it("opens patient QR scanning inside a dismissible modal and stops camera on close", () => {
    const client = clientSource();
    const dashboardQuickAccess = dashboardQuickAccessSource();
    const scannerModal = scannerModalSource();
    const idAccess = dictionary.id.patient.access;
    const enAccess = dictionary.en.patient.access;

    for (const source of [client, dashboardQuickAccess]) {
      expect(source).toContain("DoctorQrScannerModal");
      expect(source).not.toContain("useDoctorQrScanner");
      expect(source).not.toContain("<video");
    }

    expect(client).toContain("scannerModalOpen");
    expect(client).toContain("openScannerModal");
    expect(client).toContain("closeScannerModal");
    expect(client).toContain('source === "qr_modal"');
    expect(client).toContain("requireScannerOpen");
    expect(client).toContain("onScan={(rawValue) =>");

    expect(dashboardQuickAccess).toContain('savePendingDoctorLookup(rawValue, { source: "qr_modal" })');

    expect(scannerModal).toContain("data-doctor-qr-scanner-modal");
    expect(scannerModal).toContain('role="dialog"');
    expect(scannerModal).toContain('aria-modal="true"');
    expect(scannerModal).toContain("<video");
    expect(scannerModal).toContain("handleClose");
    expect(scannerModal).toContain("stopCamera()");
    expect(scannerModal).toContain('event.key === "Escape"');
    expect(scannerModal).toContain("onMouseDown={(event)");

    expect(idAccess.scannerModalTitle).toBe("Pindai QR Dokter");
    expect(idAccess.scannerModalClose).toBe("Tutup pemindai QR");
    expect(idAccess.scannerModalVerifying).toBe("Memverifikasi QR dokter...");

    expect(enAccess.scannerModalTitle).toBe("Scan Doctor QR");
    expect(enAccess.scannerModalClose).toBe("Close QR scanner");
    expect(enAccess.scannerModalVerifying).toBe("Verifying doctor QR...");
  });
});
