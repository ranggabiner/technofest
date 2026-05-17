import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const supabaseRoot = path.resolve(appRoot, "../supabase");
const env = { ...process.env };
const inheritedKeys = new Set(Object.keys(process.env));

for (const envPath of [
  path.join(appRoot, ".env"),
  path.join(appRoot, ".env.local"),
  path.join(supabaseRoot, ".env"),
  path.join(supabaseRoot, ".env.local"),
]) {
  loadEnvFile(envPath);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/run-with-app-env.mjs <command> [...args]");
  process.exit(1);
}

let spawnCmd = command;
let spawnArgs = args;

if (command === "supabase") {
  spawnCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  spawnArgs = ["supabase", ...args];
}

const child = spawn(spawnCmd, spawnArgs, {
  cwd: appRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (inheritedKeys.has(key)) continue;
    env[key] = normalizeValue(rawValue);
  }
}

function normalizeValue(rawValue) {
  const value = rawValue.trim();
  const quote = value[0];

  if ((quote === "\"" || quote === "'") && value[value.length - 1] === quote) {
    return value.slice(1, -1);
  }

  return value;
}
