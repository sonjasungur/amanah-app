#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
let failed = 0;

function pass(msg) {
  console.log(`✓ ${msg}`);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

function run(cmd, label) {
  try {
    execSync(cmd, { cwd: root, stdio: "inherit" });
    pass(label);
  } catch {
    fail(label);
  }
}

function shouldSkipSecretScan(filePath) {
  const rel = filePath.replace(root + "/", "");
  if (rel.endsWith(".env.example")) return true;
  if (rel.endsWith(".env.production.example")) return true;
  if (rel === "docker-compose.local.yml") return true;
  if (rel === "docker-compose.prod.yml") return true;
  if (rel.startsWith("src/__tests__/")) return true;
  if (rel.startsWith("docs/")) return true;
  if (rel.startsWith("deploy/")) return true;
  if (rel === "scripts/validate-production-env.mjs") return true;
  return false;
}

function scanForSecrets() {
  let scanFailed = 0;
  const forbidden = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/, label: "OpenAI API key pattern" },
    { pattern: /postgresql:\/\/[^:]+:[^@]+@/i, label: "DATABASE_URL with credentials" },
  ];
  const skipDirs = new Set(["node_modules", ".next", ".git", "coverage", "backups"]);

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (shouldSkipSecretScan(full)) continue;
      if (!/\.(ts|tsx|js|jsx|json|yml|yaml|sh|mjs|cjs)$/.test(entry.name)) continue;
      const text = readFileSync(full, "utf8");
      for (const { pattern, label } of forbidden) {
        if (pattern.test(text)) {
          fail(`${label} found in ${full.replace(root + "/", "")}`);
          scanFailed += 1;
        }
      }
    }
  }

  walk(root);
  if (scanFailed === 0) pass("No obvious committed secrets in source scan");
}

const requiredFiles = [
  ".env.example",
  ".env.production.example",
  "docker-compose.prod.yml",
  "Dockerfile",
  "deploy/Caddyfile.example",
  "deploy/Caddyfile",
  "scripts/deploy-preflight.sh",
  "scripts/backup-postgres.sh",
  "scripts/prod-smoke-test.sh",
  "docker-compose.prod.nocaddy.yml",
  "deploy/Caddyfile.shared-snippet",
  "scripts/init-production-env.sh",
  "scripts/deploy-shared-server.sh",
  "docs/DEPLOY_HETZNER.md",
  "docs/LAUNCH_CHECKLIST.md",
  "docs/ENVIRONMENT.md",
];

console.log("Amanah release check\n");

for (const file of requiredFiles) {
  if (existsSync(join(root, file))) pass(`${file} present`);
  else fail(`${file} missing`);
}

if (existsSync(join(root, "prisma/schema.prisma"))) {
  pass("Prisma schema present");
} else {
  fail("Prisma schema missing");
}

try {
  const tracked = execSync("git ls-files .env.local .env.production 2>/dev/null || true", {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (tracked) fail(`Secret env tracked by git: ${tracked}`);
  else pass(".env.local / .env.production not committed");
} catch {
  pass(".env.local / .env.production not committed (git unavailable)");
}

scanForSecrets();

try {
  const entries = readFileSync(join(root, "src/lib/knowledge/entries.ts"), "utf8");
  const count = (entries.match(/id:\s*"kb-/g) ?? []).length;
  if (count >= 10) pass(`Knowledge entries: ${count}`);
  else fail(`Knowledge entries below 10 (found ${count})`);
} catch {
  fail("Could not count knowledge entries");
}

try {
  const plan = readFileSync(join(root, "src/lib/guided-flow/question-plan.ts"), "utf8");
  const qCount = (plan.match(/id:\s*"gf-/g) ?? []).length;
  if (qCount >= 20) pass(`Guided flow questions: ${qCount}`);
  else fail(`Guided flow questions below 20 (found ${qCount})`);
} catch {
  fail("Could not count guided flow questions");
}

if (commandExists("docker")) {
  try {
    execSync("docker compose -f docker-compose.prod.yml --env-file .env.production.example config", {
      cwd: root,
      stdio: "pipe",
    });
    pass("docker-compose.prod.yml config valid");
  } catch {
    fail("docker-compose.prod.yml config invalid");
  }
} else {
  console.log("⚠ docker not installed — skipping compose config validation");
}

console.log("\nRunning npm run check...\n");
run("npm run check", "npm run check (lint + test + build)");

console.log(failed ? `\nRelease check finished with ${failed} issue(s).\n` : "\nRelease check passed.\n");
process.exit(failed > 0 ? 1 : 0);

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
