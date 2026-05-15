import { z } from "zod";

export type EnvGroup = "core" | "email" | "ai" | "blockchain";

export type ParsedEnv =
  | { ok: true; data: Record<string, string>; adminEmailAllowlist: string[] }
  | { ok: false; errors: string[] };

const envSchemas: Record<EnvGroup, z.ZodObject<Record<string, z.ZodString>>> = {
  core: z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ADMIN_EMAIL_ALLOWLIST: z.string().min(1),
    ENCRYPTION_MASTER_KEY: z.string().refine(isBase64AesKey, {
      message: "must be base64 for exactly 32 bytes",
    }),
    HASH_PEPPER: z.string().min(16),
  }),
  email: z.object({
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().min(3),
  }),
  ai: z.object({
    DEEPSEEK_API_KEY: z.string().min(1),
  }),
  blockchain: z.object({
    AMOY_RPC_URL: z.string().url(),
    RELAYER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    MEDPROOF_CONTRACT_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
};

export function parseAdminEmailAllowlist(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function parseEnv(
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  groups: EnvGroup[] = ["core"],
): ParsedEnv {
  const errors: string[] = [];
  const data: Record<string, string> = {};

  for (const group of groups) {
    const schema = envSchemas[group];
    const result = schema.safeParse(source);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const name = issue.path.join(".") || group;
        errors.push(`${name}: ${issue.message}`);
      }
      continue;
    }

    Object.assign(data, result.data);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data,
    adminEmailAllowlist: parseAdminEmailAllowlist(data.ADMIN_EMAIL_ALLOWLIST),
  };
}

export function requireEnv(groups: EnvGroup[] = ["core"]) {
  const parsed = parseEnv(process.env, groups);

  if (!parsed.ok) {
    throw new Error(`Invalid MedProof environment: ${parsed.errors.join("; ")}`);
  }

  return parsed;
}

function isBase64AesKey(value: string) {
  try {
    return Buffer.from(value, "base64").byteLength === 32;
  } catch {
    return false;
  }
}
