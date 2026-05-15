export const scope1RecordTypes = [
  "lab",
  "xray",
  "diagnosis",
  "prescription",
  "vaccine",
  "action",
  "note",
] as const;

export type Scope1RecordType = (typeof scope1RecordTypes)[number];

type ValidationResult<T = void> = { ok: true; value: T } | { ok: true } | { ok: false; errors: string[] };

type MentalExtractionInput = {
  moodScore?: unknown;
  anxietyLevel?: unknown;
  sleepHours?: unknown;
  isEmergencyFlagged: unknown;
  extractionConfidence?: unknown;
};

type PhysicalExtractionInput = {
  severity?: unknown;
  isEmergencyFlagged: unknown;
  extractionConfidence?: unknown;
  rawQuoteHash: unknown;
};

export function validateScope1RecordType(value: unknown): ValidationResult<Scope1RecordType> {
  if (typeof value === "string" && scope1RecordTypes.includes(value as Scope1RecordType)) {
    return { ok: true, value: value as Scope1RecordType };
  }

  return {
    ok: false,
    errors: ["record_type must be one of lab, xray, diagnosis, prescription, vaccine, action, note"],
  };
}

export function validateMentalExtractionValues(input: MentalExtractionInput): ValidationResult {
  const errors: string[] = [];

  validateOptionalIntegerRange(input.moodScore, 1, 10, "mood_score", errors);
  validateOptionalIntegerRange(input.anxietyLevel, 1, 10, "anxiety_level", errors);
  validateOptionalNumberRange(input.sleepHours, 0, 24, "sleep_hours", errors);
  validateBoolean(input.isEmergencyFlagged, "is_emergency_flagged", errors);
  validateOptionalNumberRange(input.extractionConfidence, 0, 1, "extraction_confidence", errors);

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function validatePhysicalExtractionValues(input: PhysicalExtractionInput): ValidationResult {
  const errors: string[] = [];

  validateOptionalIntegerRange(input.severity, 1, 10, "severity", errors);
  validateBoolean(input.isEmergencyFlagged, "is_emergency_flagged", errors);
  validateOptionalNumberRange(input.extractionConfidence, 0, 1, "extraction_confidence", errors);

  if (typeof input.rawQuoteHash !== "string" || input.rawQuoteHash.trim().length === 0) {
    errors.push("raw_quote_hash is required for physical Scope 2 rows");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

function validateOptionalIntegerRange(
  value: unknown,
  min: number,
  max: number,
  fieldName: string,
  errors: string[],
) {
  if (value == null) return;

  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    errors.push(`${fieldName} must be an integer from ${min} to ${max}`);
  }
}

function validateOptionalNumberRange(
  value: unknown,
  min: number,
  max: number,
  fieldName: string,
  errors: string[],
) {
  if (value == null) return;

  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    errors.push(`${fieldName} must be a number from ${min} to ${max}`);
  }
}

function validateBoolean(value: unknown, fieldName: string, errors: string[]) {
  if (typeof value !== "boolean") {
    errors.push(`${fieldName} must be boolean`);
  }
}
