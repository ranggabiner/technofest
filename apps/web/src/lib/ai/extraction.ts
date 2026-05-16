import { z } from "zod";

import { sha256Hex } from "../crypto/hashing";
import { encryptString, type EncryptedValue } from "../crypto/server";
import {
  validateMentalExtractionValues,
  validatePhysicalExtractionValues,
} from "../health/validators";

export const aiExtractionSchema = z.object({
  summary: z.object({
    general: z.string().trim().min(1),
    mental: z.string().trim().min(1),
    physical: z.string().trim().min(1),
  }),
  mental: z
    .object({
      moodScore: z.number().int().nullable(),
      anxietyLevel: z.number().int().nullable(),
      sleepHours: z.number().nullable(),
      triggerNotes: z.string().trim().nullable(),
      rawQuote: z.string().trim(),
      isEmergencyFlagged: z.boolean(),
      extractionConfidence: z.number().nullable(),
    })
    .nullable(),
  physical: z.array(
    z.object({
      symptomType: z.string().trim().nullable(),
      severity: z.number().int().nullable(),
      bodyLocation: z.string().trim().nullable(),
      durationNote: z.string().trim().nullable(),
      rawQuote: z.string().trim(),
      isEmergencyFlagged: z.boolean(),
      extractionConfidence: z.number().nullable(),
    }),
  ),
});

export type AiExtraction = z.infer<typeof aiExtractionSchema>;

export type EncryptedColumnSet = {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: string;
};

type EncryptedDbColumns<Prefix extends string> = {
  [Key in `${Prefix}_ciphertext` | `${Prefix}_iv` | `${Prefix}_tag`]: string;
};

export type Scope2MentalInsertPayload = {
  patient_id: string;
  session_id: string;
  log_date: string;
  mood_score_ciphertext: string | null;
  mood_score_iv: string | null;
  mood_score_tag: string | null;
  anxiety_level_ciphertext: string | null;
  anxiety_level_iv: string | null;
  anxiety_level_tag: string | null;
  sleep_hours_ciphertext: string | null;
  sleep_hours_iv: string | null;
  sleep_hours_tag: string | null;
  trigger_notes_ciphertext: string | null;
  trigger_notes_iv: string | null;
  trigger_notes_tag: string | null;
  raw_quote_ciphertext: string;
  raw_quote_iv: string;
  raw_quote_tag: string;
  is_emergency_flagged_ciphertext: string;
  is_emergency_flagged_iv: string;
  is_emergency_flagged_tag: string;
  extraction_confidence_ciphertext: string | null;
  extraction_confidence_iv: string | null;
  extraction_confidence_tag: string | null;
  ai_model: string;
  raw_extraction_jsonb_ciphertext: string;
  raw_extraction_jsonb_iv: string;
  raw_extraction_jsonb_tag: string;
  raw_quote_hash: string;
  key_version: string;
};

export type Scope2PhysicalInsertPayload = {
  patient_id: string;
  session_id: string;
  log_date: string;
  symptom_type_ciphertext: string | null;
  symptom_type_iv: string | null;
  symptom_type_tag: string | null;
  severity_ciphertext: string | null;
  severity_iv: string | null;
  severity_tag: string | null;
  body_location_ciphertext: string | null;
  body_location_iv: string | null;
  body_location_tag: string | null;
  duration_note_ciphertext: string | null;
  duration_note_iv: string | null;
  duration_note_tag: string | null;
  raw_quote_ciphertext: string;
  raw_quote_iv: string;
  raw_quote_tag: string;
  is_emergency_flagged_ciphertext: string;
  is_emergency_flagged_iv: string;
  is_emergency_flagged_tag: string;
  extraction_confidence_ciphertext: string | null;
  extraction_confidence_iv: string | null;
  extraction_confidence_tag: string | null;
  ai_model: string;
  raw_extraction_jsonb_ciphertext: string;
  raw_extraction_jsonb_iv: string;
  raw_extraction_jsonb_tag: string;
  raw_quote_hash: string;
  key_version: string;
};

export function buildScope2PersistencePayload(input: {
  extraction: AiExtraction;
  patientId: string;
  sessionId: string;
  encryptionKey: string;
  model: string;
  now: Date;
}) {
  const parsed = aiExtractionSchema.parse(input.extraction);
  const validationErrors = validateExtraction(parsed);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join("; "));
  }

  const logDate = input.now.toISOString().slice(0, 10);
  const rawExtraction = JSON.stringify(parsed);
  const encryptedRawExtraction = encryptedColumns(
    "raw_extraction_jsonb",
    rawExtraction,
    input.encryptionKey,
  );

  const mentalRow = parsed.mental
    ? {
        patient_id: input.patientId,
        session_id: input.sessionId,
        log_date: logDate,
        ...optionalEncryptedColumns("mood_score", parsed.mental.moodScore, input.encryptionKey),
        ...optionalEncryptedColumns(
          "anxiety_level",
          parsed.mental.anxietyLevel,
          input.encryptionKey,
        ),
        ...optionalEncryptedColumns("sleep_hours", parsed.mental.sleepHours, input.encryptionKey),
        ...optionalEncryptedColumns(
          "trigger_notes",
          parsed.mental.triggerNotes,
          input.encryptionKey,
        ),
        ...encryptedColumns("raw_quote", parsed.mental.rawQuote, input.encryptionKey),
        ...encryptedColumns(
          "is_emergency_flagged",
          parsed.mental.isEmergencyFlagged,
          input.encryptionKey,
        ),
        ...optionalEncryptedColumns(
          "extraction_confidence",
          parsed.mental.extractionConfidence,
          input.encryptionKey,
        ),
        ai_model: input.model,
        ...encryptedRawExtraction,
        raw_quote_hash: sha256Hex(parsed.mental.rawQuote),
        key_version: "v1",
      }
    : null;

  const physicalRows = parsed.physical.map((item) => ({
    patient_id: input.patientId,
    session_id: input.sessionId,
    log_date: logDate,
    ...optionalEncryptedColumns("symptom_type", item.symptomType, input.encryptionKey),
    ...optionalEncryptedColumns("severity", item.severity, input.encryptionKey),
    ...optionalEncryptedColumns("body_location", item.bodyLocation, input.encryptionKey),
    ...optionalEncryptedColumns("duration_note", item.durationNote, input.encryptionKey),
    ...encryptedColumns("raw_quote", item.rawQuote, input.encryptionKey),
    ...encryptedColumns("is_emergency_flagged", item.isEmergencyFlagged, input.encryptionKey),
    ...optionalEncryptedColumns(
      "extraction_confidence",
      item.extractionConfidence,
      input.encryptionKey,
    ),
    ai_model: input.model,
    ...encryptedRawExtraction,
    raw_quote_hash: sha256Hex(item.rawQuote),
    key_version: "v1",
  }));

  const sessionSummary = encryptString(JSON.stringify(parsed.summary), input.encryptionKey);

  return {
    sessionSummary: {
      ...sessionSummary,
      summary_text_ciphertext: sessionSummary.ciphertext,
      summary_text_iv: sessionSummary.iv,
      summary_text_tag: sessionSummary.tag,
    },
    mentalRow: mentalRow as Scope2MentalInsertPayload | null,
    physicalRows: physicalRows as Scope2PhysicalInsertPayload[],
  };
}

function validateExtraction(extraction: AiExtraction) {
  const errors: string[] = [];

  if (extraction.mental) {
    if (!extraction.mental.rawQuote.trim()) {
      errors.push("raw_quote is required for mental Scope 2 rows");
    }

    const result = validateMentalExtractionValues({
      moodScore: extraction.mental.moodScore,
      anxietyLevel: extraction.mental.anxietyLevel,
      sleepHours: extraction.mental.sleepHours,
      isEmergencyFlagged: extraction.mental.isEmergencyFlagged,
      extractionConfidence: extraction.mental.extractionConfidence,
    });
    if (!result.ok) errors.push(...result.errors);
  }

  for (const item of extraction.physical) {
    if (!item.rawQuote.trim()) {
      errors.push("raw_quote is required for physical Scope 2 rows");
    }

    const result = validatePhysicalExtractionValues({
      severity: item.severity,
      isEmergencyFlagged: item.isEmergencyFlagged,
      extractionConfidence: item.extractionConfidence,
      rawQuoteHash: item.rawQuote.trim() ? sha256Hex(item.rawQuote) : "",
    });
    if (!result.ok) errors.push(...result.errors);
  }

  return errors;
}

export function encryptedColumns<Prefix extends string>(
  prefix: Prefix,
  value: unknown,
  encryptionKey: string,
): EncryptedDbColumns<Prefix> {
  const encrypted = encryptString(String(value), encryptionKey);
  return {
    [`${prefix}_ciphertext`]: encrypted.ciphertext,
    [`${prefix}_iv`]: encrypted.iv,
    [`${prefix}_tag`]: encrypted.tag,
  } as EncryptedDbColumns<Prefix>;
}

export function optionalEncryptedColumns<Prefix extends string>(
  prefix: Prefix,
  value: unknown,
  encryptionKey: string,
): Record<`${Prefix}_ciphertext` | `${Prefix}_iv` | `${Prefix}_tag`, string | null> {
  if (value == null || value === "") {
    return {
      [`${prefix}_ciphertext`]: null,
      [`${prefix}_iv`]: null,
      [`${prefix}_tag`]: null,
    } as Record<`${Prefix}_ciphertext` | `${Prefix}_iv` | `${Prefix}_tag`, string | null>;
  }

  return encryptedColumns(prefix, value, encryptionKey);
}

export function encryptedValueToColumns(prefix: string, encrypted: EncryptedValue) {
  return {
    [`${prefix}_ciphertext`]: encrypted.ciphertext,
    [`${prefix}_iv`]: encrypted.iv,
    [`${prefix}_tag`]: encrypted.tag,
    key_version: encrypted.keyVersion,
  };
}
