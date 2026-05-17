export const defaultPrivacySentinels = [
  "Diagnosis plaintext",
  "Prescription plaintext",
  "gejala rahasia",
  "mood rahasia",
  "raw quote rahasia",
  "nama pasien rahasia",
];

export const defaultSchemaCacheRetry = {
  maxAttempts: 6,
  delayMs: 5000,
};

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function getPrivacyValidationConfig(env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? env.API_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SERVICE_ROLE_KEY;
  const projectRef = env.SUPABASE_PROJECT_REF;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  assertProjectRefMatchesUrl(supabaseUrl, projectRef);

  const sentinels = (env.MEDPROOF_PRIVACY_SENTINELS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    supabaseUrl,
    serviceRoleKey,
    projectRef,
    needles: sentinels.length > 0 ? sentinels : defaultPrivacySentinels,
  };
}

export function assertProjectRefMatchesUrl(supabaseUrl, projectRef) {
  if (!projectRef) return;

  let parsed;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL must be a valid URL.");
  }

  if (projectRef === "local") {
    if (localHosts.has(parsed.hostname)) return;
    throw new Error("SUPABASE_PROJECT_REF=local only matches localhost Supabase URLs.");
  }

  const expectedHost = `${projectRef}.supabase.co`;
  if (parsed.hostname !== expectedHost) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL host "${parsed.hostname}" does not match SUPABASE_PROJECT_REF "${projectRef}".`);
  }
}

export function isSchemaCacheMiss(error) {
  if (!error) return false;
  if (error.code === "PGRST205") return true;

  const text = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes("schema cache") && (text.includes("could not find") || text.includes("cannot find"));
}

export async function withSchemaCacheRetry(label, operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? defaultSchemaCacheRetry.maxAttempts;
  const delayMs = options.delayMs ?? defaultSchemaCacheRetry.delayMs;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const onRetry = options.onRetry ?? (() => undefined);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await operation(attempt);
    if (!result?.error || !isSchemaCacheMiss(result.error) || attempt === maxAttempts) return result;

    onRetry({ label, attempt, maxAttempts, delayMs, error: result.error });
    await sleep(delayMs);
  }

  throw new Error("Unreachable schema cache retry state.");
}
