import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultSchemaCacheRetry, getPrivacyValidationConfig, withSchemaCacheRetry } from "./validate-privacy-helpers.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const supabaseRoot = path.resolve(appRoot, "../supabase");

const checks = [
  {
    table: "patients",
    columns: ["profiling_data_ciphertext"],
  },
  {
    table: "ai_sessions",
    columns: ["session_title_ciphertext", "summary_text_ciphertext"],
  },
  {
    table: "ai_messages",
    columns: ["message_text_ciphertext"],
  },
  {
    table: "scope_2_mental",
    columns: [
      "mood_score_ciphertext",
      "anxiety_level_ciphertext",
      "sleep_hours_ciphertext",
      "trigger_notes_ciphertext",
      "raw_quote_ciphertext",
      "is_emergency_flagged_ciphertext",
      "raw_extraction_jsonb_ciphertext",
    ],
  },
  {
    table: "scope_2_physical",
    columns: [
      "symptom_type_ciphertext",
      "severity_ciphertext",
      "body_location_ciphertext",
      "duration_note_ciphertext",
      "raw_quote_ciphertext",
      "is_emergency_flagged_ciphertext",
      "raw_extraction_jsonb_ciphertext",
    ],
  },
  {
    table: "scope_1_medical_records",
    columns: ["record_type_ciphertext", "title_ciphertext", "description_ciphertext", "blockchain_last_error"],
  },
  {
    table: "secure_files",
    columns: ["original_filename_ciphertext", "object_path"],
  },
  {
    table: "audit_logs",
    columns: ["reason", "blockchain_last_error"],
  },
];

const storageBuckets = ["encrypted-kyc-documents", "encrypted-medical-attachments"];

loadEnvFile(path.join(appRoot, ".env"));
loadEnvFile(path.join(appRoot, ".env.local"));
loadEnvFile(path.join(supabaseRoot, ".env"));
loadEnvFile(path.join(supabaseRoot, ".env.local"));

const failures = [];
const retryOptions = {
  maxAttempts: readPositiveInt(process.env.MEDPROOF_SCHEMA_CACHE_RETRY_ATTEMPTS, defaultSchemaCacheRetry.maxAttempts),
  delayMs: readPositiveInt(process.env.MEDPROOF_SCHEMA_CACHE_RETRY_DELAY_MS, defaultSchemaCacheRetry.delayMs),
  onRetry: ({ label, attempt, maxAttempts, delayMs, error }) => {
    console.warn(
      `${label}: ${error.message} Waiting ${delayMs}ms for PostgREST schema cache refresh (${attempt}/${maxAttempts}).`,
    );
  },
};

let config;
try {
  config = getPrivacyValidationConfig(process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
  auth: { persistSession: false },
});

for (const check of checks) {
  await inspectTable(check);
}

for (const bucket of storageBuckets) {
  await inspectBucket(bucket);
}

if (failures.length > 0) {
  console.error(`Privacy validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Privacy validation passed. Checked ${checks.length} table groups and ${storageBuckets.length} storage buckets.`);
console.log(`Sentinel count: ${config.needles.length}. Set MEDPROOF_PRIVACY_SENTINELS to match local demo inputs.`);

async function inspectTable(check) {
  const { data, error } = await withSchemaCacheRetry(
    check.table,
    () => supabase
      .from(check.table)
      .select(check.columns.join(","))
      .limit(1000),
    retryOptions,
  );

  if (error) {
    failures.push(`${check.table}: ${error.message}`);
    return;
  }

  for (const [rowIndex, row] of (data ?? []).entries()) {
    for (const column of check.columns) {
      const value = row[column];
      if (typeof value !== "string") continue;
      const matched = findNeedle(value);
      if (matched) failures.push(`${check.table}.${column}[${rowIndex}] contains sentinel "${matched}"`);
    }
  }
}

async function inspectBucket(bucket) {
  const paths = await listBucketObjects(bucket, "");

  for (const path of paths) {
    const pathMatch = findNeedle(path);
    if (pathMatch) failures.push(`${bucket}/${path} path contains sentinel "${pathMatch}"`);

    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) {
      failures.push(`${bucket}/${path}: ${error.message}`);
      continue;
    }

    const text = await data.text();
    const bodyMatch = findNeedle(text);
    if (bodyMatch) failures.push(`${bucket}/${path} object bytes contain sentinel "${bodyMatch}"`);
  }
}

async function listBucketObjects(bucket, prefix) {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    failures.push(`${bucket}/${prefix}: ${error.message}`);
    return [];
  }

  const paths = [];
  for (const item of data ?? []) {
    const nextPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      paths.push(nextPath);
    } else {
      paths.push(...await listBucketObjects(bucket, nextPath));
    }
  }
  return paths;
}

function findNeedle(value) {
  const normalized = value.toLowerCase();
  return config.needles.find((needle) => normalized.includes(needle.toLowerCase()));
}

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
