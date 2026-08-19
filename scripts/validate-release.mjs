#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateProductionEnv } from "./validate-production-env.mjs";

const root = join(import.meta.dirname, "..");
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "private-review";

if (!["private-review", "public-pilot"].includes(mode)) {
  console.error("✗ Invalid mode. Use --mode=private-review or --mode=public-pilot");
  process.exit(1);
}

const blockers = [];
const warnings = [];
const notes = [];

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function ok(message) {
  notes.push(`✓ ${message}`);
}

function fail(message) {
  blockers.push(message);
}

function warn(message) {
  warnings.push(message);
}

function requireEnv(name, expected) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    fail(`Missing env: ${name}`);
    return;
  }
  if (expected !== undefined && value !== expected) {
    fail(`Invalid env ${name} (expected ${expected})`);
    return;
  }
  ok(`Env ${name} present`);
}

const envTemplate = read(".env.production.example");
const requiredEnvNames = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "POSTGRES_PASSWORD",
  "NEXT_PUBLIC_AUTH_MODE",
  "NEXT_PUBLIC_STORAGE_MODE",
  "AMANAH_SERVER_STORAGE",
  "AMANAH_PUBLIC_REGISTRATION_ENABLED",
  "NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED",
  "AMANAH_AI_ENABLED",
  "NEXT_PUBLIC_AMANAH_AI_ENABLED",
];
for (const key of requiredEnvNames) {
  if (!new RegExp(`^${key}=`, "m").test(envTemplate)) {
    fail(`Env template missing key: ${key}`);
  }
}
if (blockers.length === 0) ok("Required env variable names are present in .env.production.example");

requireEnv("NEXT_PUBLIC_AUTH_MODE", "api");
requireEnv("NEXT_PUBLIC_STORAGE_MODE", "api");
requireEnv("AMANAH_SERVER_STORAGE", "postgres");
requireEnv("AMANAH_PUBLIC_REGISTRATION_ENABLED", "false");
requireEnv("NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED", "false");
requireEnv("AMANAH_AI_ENABLED", "false");
requireEnv("NEXT_PUBLIC_AMANAH_AI_ENABLED", "false");

const prodEnvValidation = validateProductionEnv(process.env);
for (const e of prodEnvValidation.errors) fail(`Production env invalid: ${e}`);
for (const w of prodEnvValidation.warnings) warn(`Production env warning: ${w}`);

if (!process.env.OPENAI_API_KEY) {
  ok("OPENAI_API_KEY not required for this release mode");
}

const pricingPage = read("src/app/preise/page.tsx");
const homePage = read("src/app/page.tsx");
if (pricingPage.includes("/checkout") || homePage.includes("/checkout")) {
  fail("Checkout route is referenced in public pages");
} else {
  ok("No checkout route in public pricing/home pages");
}

if (mode === "private-review") {
  const imprint = read("src/lib/legal/imprint.ts");
  if (imprint.includes("isPlaceholder: true")) {
    warn("Impressum placeholders still active (allowed in private-review mode)");
  }
}

if (mode === "public-pilot") {
  requireEnv("NEXT_PUBLIC_SITE_URL");
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith("https://")) {
    fail("NEXT_PUBLIC_SITE_URL must be HTTPS for public pilot");
  }

  const imprint = read("src/lib/legal/imprint.ts");
  if (imprint.includes("isPlaceholder: true") || imprint.includes("Platzhalter")) {
    fail("Impressum placeholders still present");
  } else {
    ok("Impressum has no known placeholders");
  }

  const privacy = read("src/app/datenschutz/page.tsx");
  if (privacy.includes("Betreiber der Plattform")) {
    fail("Datenschutz page still uses non-concrete operator wording");
  } else {
    ok("Datenschutz operator wording appears concrete");
  }

  const knowledgeEntries = read("src/lib/knowledge/entries.ts");
  if (!knowledgeEntries.includes('return getAllEntries().filter((e) => e.reviewedStatus === "reviewed");')) {
    fail("Public knowledge filter is not strict reviewed-only");
  } else {
    ok("Public knowledge filter is reviewed-only");
  }

  const wissenPage = read("src/app/wissen/page.tsx");
  if (!wissenPage.includes("getPublicWissenTopics")) {
    fail("Wissen page is not using reviewed-only topic source");
  } else {
    ok("Wissen page uses reviewed-only topic source");
  }

  const partnerData = read("src/lib/mock/funeral-partners.ts");
  if (!partnerData.includes("funeralPartners: FuneralPartner[] = []")) {
    fail("Public funeral directory contains partner records");
  } else {
    ok("Public funeral directory has no mock partner records");
  }

  const bestatterPage = read("src/app/bestatter/page.tsx");
  if (!bestatterPage.includes("In Vorbereitung") || !bestatterPage.includes("keine Einträge")) {
    fail("Bestatter page does not show explicit in-preparation empty state");
  } else {
    ok("Bestatter page shows explicit in-preparation empty state");
  }
}

console.log(`Release validation mode: ${mode}`);
for (const line of notes) console.log(line);
for (const line of warnings) console.log(`⚠ ${line}`);
for (const line of blockers) console.error(`✗ ${line}`);

if (blockers.length > 0) {
  process.exit(1);
}

console.log("Release validation passed.");
