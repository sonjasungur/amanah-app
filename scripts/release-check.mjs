#!/usr/bin/env node
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
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

/**
 * The only database addresses with credentials allowed in the source: throwaway Postgres containers
 * that one test script starts on this machine (127.0.0.1) or on its own Docker network ($DB), each
 * allowed in exactly that script. Any other address, or this one in another file, still fails.
 */
/** File → SHA-256 of the one exact address allowed there (the address itself stays out of this file). */
const ALLOWED_TEST_DATABASE_URLS = new Map([
  ["scripts/testing/migration-rehearsal.sh", "2b39b8d9ff786a3fe3e22bef365e84dc989458d60da4d8426d4e1d3fbbe342e4"],
  ["scripts/testing/release-check.sh", "b9c9d8f36fbd6d8bca822c11d3d177449d867c00cdb21e7826ddb6fe51455df7"],
  ["scripts/testing/restore-drill.mjs", "36d871685416b5d683f5891b1d8c9f43340fd9cdfc5f1be91c4882a62ed6064a"],
  ["scripts/testing/rollback-encryption-probe.sh", "365e8498a4f1f4a51a6eda57e65663a94a851bf2332d0301cf1a47ce0fd2e900"],
]);
const DATABASE_URL_WITH_CREDENTIALS = /postgresql:\/\/[^:\s"'`]+:[^@\s"'`]+@[^/\s"'`]+/gi;
const DATABASE_URL_PATTERN = /postgresql:\/\/[^:]+:[^@]+@/i;
const LOCAL_TEST_HOST = /@(127\.0\.0\.1|\$DB)(:|$)/;

/** True if every credential URL in this file is the one allowlisted for it. */
function onlyAllowedTestDatabaseUrls(rel, text) {
  const allowed = ALLOWED_TEST_DATABASE_URLS.get(rel);
  const found = text.match(DATABASE_URL_WITH_CREDENTIALS) ?? [];
  const fingerprint = (url) => createHash("sha256").update(url).digest("hex");
  return found.length > 0 && allowed !== undefined && found.every((url) => LOCAL_TEST_HOST.test(url) && fingerprint(url) === allowed);
}

function scanForSecrets() {
  let scanFailed = 0;
  const forbidden = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/, label: "OpenAI API key pattern" },
    { pattern: DATABASE_URL_PATTERN, label: "DATABASE_URL with credentials" },
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
      const rel = full.replace(root + "/", "");
      for (const { pattern, label } of forbidden) {
        if (pattern === DATABASE_URL_PATTERN && pattern.test(text) && onlyAllowedTestDatabaseUrls(rel, text)) continue;
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
  "scripts/verify-deploy-remote.sh",
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

// The public production route stays closed: nothing in the repository may be able to open it by accident.
function checkProductionRouteLock() {
  const read = (file) => (existsSync(join(root, file)) ? readFileSync(join(root, file), "utf8") : "");
  const active = (text) => text.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#")).join("\n");

  const installer = active(read("scripts/install-shared-caddy.sh"));
  const installerLocked = /^exit 1$/m.test(installer) && !/docker|caddy +reload|>>|\bcp\b|\bif\b|\$\{?[A-Z_]/.test(installer);
  if (installerLocked) pass("Shared proxy installer is permanently locked");
  else fail("scripts/install-shared-caddy.sh must abort unconditionally and change nothing");

  if (active(read("deploy/Caddyfile.shared-snippet")) === "") pass("Shared proxy snippet holds no route");
  else fail("deploy/Caddyfile.shared-snippet must not hold a route");

  const overlay = active(read("docker-compose.prod.nocaddy.yml"));
  if (/shared_proxy|gemeinsam1|external:|^\s*networks:/m.test(overlay)) fail("docker-compose.prod.nocaddy.yml must not attach the app to the shared proxy network");
  else pass("Shared-server overlay keeps the app off the proxy network");
  if ((overlay.match(/^\s+- "[^"]+"/gm) ?? []).every((port) => port.includes("127.0.0.1:"))) pass("Shared-server overlay publishes no public port");
  else fail("docker-compose.prod.nocaddy.yml must bind ports to 127.0.0.1 only");
}

checkProductionRouteLock();

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
