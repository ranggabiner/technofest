export const DOCTOR_RAG_DISCLAIMER =
  "Informasi ini dibuat dari data sesi AI MedProof pasien dan bukan diagnosis, asesmen medis, atau rekomendasi pengobatan. Gunakan hanya sebagai konteks awal, bukan sebagai satu-satunya dasar keputusan klinis.";

export type DoctorRagRow = {
  category: "mental" | "physical";
  logDate: string;
  rawQuote: string;
  emergencyFlagged: boolean;
  provenance: string;
  details: string[];
};

export type DoctorRagScopeFlags = {
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
};

export function selectAuthorizedRagRows(
  mentalRows: DoctorRagRow[],
  physicalRows: DoctorRagRow[],
  flags: DoctorRagScopeFlags,
) {
  return [
    ...(flags.canViewScope2Mental ? mentalRows : []),
    ...(flags.canViewScope2Physical ? physicalRows : []),
  ].sort((left, right) => right.logDate.localeCompare(left.logDate));
}

export function buildDoctorRagPrompt(input: { question: string; rows: DoctorRagRow[] }) {
  const context = input.rows
    .map((row, index) => {
      const details = row.details.length > 0 ? row.details.join("; ") : "detail tidak tersedia";
      return [
        `Data ${index + 1}`,
        `Kategori: ${row.category === "mental" ? "mental" : "fisik"}`,
        `Tanggal: ${row.logDate}`,
        `Provenance: ${row.provenance}`,
        `Emergency flag: ${row.emergencyFlagged ? "ya" : "tidak"}`,
        `Detail: ${details}`,
        `Kutipan pasien: ${row.rawQuote}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "Jawab dalam Bahasa Indonesia.",
    "Gunakan hanya data pasien yang tercantum di konteks berikut.",
    "Jangan memberi diagnosis, rencana terapi, dosis obat, atau rekomendasi pengobatan.",
    "Sertakan batasan informasi secara jelas.",
    "",
    DOCTOR_RAG_DISCLAIMER,
    "",
    `Pertanyaan dokter: ${input.question}`,
    "",
    "Konteks terotorisasi:",
    context,
  ].join("\n");
}

export function ensureDoctorRagDisclaimer(answer: string) {
  const trimmed = answer.trim();
  if (trimmed.includes(DOCTOR_RAG_DISCLAIMER)) return trimmed;
  return `${trimmed}\n\n${DOCTOR_RAG_DISCLAIMER}`;
}
