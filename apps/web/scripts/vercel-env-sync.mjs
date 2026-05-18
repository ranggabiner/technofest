const TARGETS = {
  staging: {
    vercelTarget: "preview",
    gitBranch: "development",
  },
  production: {
    vercelTarget: "production",
  },
};

const ENV_VARS = [
  { key: "NEXT_PUBLIC_APP_URL", type: "plain" },
  { key: "NEXT_PUBLIC_SUPABASE_URL", type: "plain" },
  { key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", type: "plain" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", type: "sensitive" },
  { key: "SUPABASE_PROJECT_REF", type: "plain" },
  { key: "ADMIN_EMAIL_ALLOWLIST", type: "sensitive" },
  { key: "ENCRYPTION_MASTER_KEY", type: "sensitive" },
  { key: "HASH_PEPPER", type: "sensitive" },
  { key: "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID", type: "plain" },
  { key: "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET", type: "sensitive" },
  { key: "RESEND_API_KEY", type: "sensitive" },
  { key: "RESEND_FROM_EMAIL", type: "plain" },
  { key: "DEEPSEEK_API_KEY", type: "sensitive" },
  { key: "AMOY_RPC_URL", type: "plain" },
  { key: "RELAYER_PRIVATE_KEY", type: "sensitive" },
  { key: "MEDPROOF_CONTRACT_ADDRESS", type: "plain" },
  { key: "NEXT_PUBLIC_MEDPROOF_CONTRACT_ADDRESS", type: "plain" },
];

const dryRun = process.env.VERCEL_ENV_SYNC_DRY_RUN === "1";
const targetName = requireEnv("VERCEL_ENV_SYNC_TARGET");
const target = TARGETS[targetName];

if (!target) {
  fail(`VERCEL_ENV_SYNC_TARGET must be one of: ${Object.keys(TARGETS).join(", ")}.`);
}

const token = dryRun ? process.env.VERCEL_TOKEN : requireEnv("VERCEL_TOKEN");
const projectId = requireEnv("VERCEL_PROJECT_ID");
const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;

if (!teamId) {
  fail("VERCEL_TEAM_ID or VERCEL_ORG_ID is required.");
}

const missingEnvVars = ENV_VARS.filter(({ key }) => !process.env[key]).map(({ key }) => key);

if (missingEnvVars.length > 0) {
  fail(`Missing required app env values: ${missingEnvVars.join(", ")}.`);
}

for (const spec of ENV_VARS) {
  await upsertEnv(spec);
}

console.log(
  `Synced ${ENV_VARS.length} Vercel env vars to ${target.vercelTarget}${target.gitBranch ? ` (${target.gitBranch})` : ""}.`,
);

async function upsertEnv(spec) {
  const payload = {
    key: spec.key,
    value: process.env[spec.key],
    type: spec.type,
    target: [target.vercelTarget],
    comment: `Managed by ${process.env.GITHUB_REPOSITORY ?? "GitHub Actions"}.`,
  };

  if (target.gitBranch) {
    payload.gitBranch = target.gitBranch;
  }

  if (dryRun) {
    console.log(`DRY RUN: would upsert ${spec.key} as ${spec.type}.`);
    return;
  }

  const url = new URL(`https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env`);
  url.searchParams.set("upsert", "true");
  url.searchParams.set("teamId", teamId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await readJson(response);

  if (!response.ok) {
    fail(`Failed to upsert ${spec.key}: ${formatApiError(body, response.status)}.`);
  }

  if (Array.isArray(body?.failed) && body.failed.length > 0) {
    const messages = body.failed.map((item) => item?.error?.message ?? item?.error?.code ?? "unknown error");
    fail(`Failed to upsert ${spec.key}: ${messages.join("; ")}.`);
  }

  console.log(`Upserted ${spec.key} as ${spec.type}.`);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatApiError(body, status) {
  const error = body?.error ?? body;
  const code = error?.code ? `${error.code}: ` : "";
  const message = error?.message ?? `HTTP ${status}`;

  return `${code}${message}`;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    fail(`${name} is required.`);
  }

  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
