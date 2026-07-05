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

function scanForSecrets() {
  const forbidden = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/, label: "OpenAI API key pattern" },
    { pattern: /postgresql:\/\/[^:]+:[^@]+@/i, label: "DATABASE_URL with credentials" },
  ];
  const skipDirs = new Set(["node_modules", ".next", ".git", "coverage"]);
  const skipFiles = new Set([".env.local", ".env"]);

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (skipFiles.has(entry.name)) continue;
      if (!/\.(ts|tsx|js|jsx|json|md|yml|yaml|sh|mjs|cjs|env\.example)$/.test(entry.name)) continue;
      const text = readFileSync(full, "utf8");
      for (const { pattern, label } of forbidden) {
        if (pattern.test(text) && !full.endsWith(".env.example")) {
          fail(`${label} found in ${full.replace(root + "/", "")}`);
        }
      }
    }
  }

  walk(root);
  pass("No obvious committed secrets in source scan");
}

console.log("Amanah release check\n");

if (existsSync(join(root, ".env.example"))) {
  pass(".env.example present");
} else {
  fail(".env.example missing");
}

if (existsSync(join(root, "prisma/schema.prisma"))) {
  pass("Prisma schema present");
} else {
  fail("Prisma schema missing");
}

try {
  const tracked = execSync("git ls-files .env.local 2>/dev/null || true", { cwd: root, encoding: "utf8" }).trim();
  if (tracked) fail(".env.local is tracked by git");
  else pass(".env.local not committed");
} catch {
  pass(".env.local not committed (git unavailable)");
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

console.log("\nRunning npm run check...\n");
run("npm run check", "npm run check (lint + test + build)");

console.log(failed ? `\nRelease check finished with ${failed} issue(s).\n` : "\nRelease check passed.\n");
process.exit(failed > 0 ? 1 : 0);
