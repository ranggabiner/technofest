export const MAX_PATIENT_MESSAGES_PER_SESSION = 5;

export function assertCanSendPatientMessage(existingPatientMessageCount: number) {
  if (existingPatientMessageCount >= MAX_PATIENT_MESSAGES_PER_SESSION) {
    throw new Error("Sesi uji AI dibatasi 5 pesan pasien");
  }
}
