#!/usr/bin/env node
/**
 * Creates synthetic pilot test accounts on a STAGING instance through the public API
 * (register → dev outbox link → confirm → consent → synthetic folder). Never against production:
 * the target must report environment "staging" (or "development" for local tests) in /api/health.
 *
 *   STAGING_BASE_URL=https://staging.example.test STAGING_BASIC_AUTH=user:pass \
 *   node scripts/seed-staging-accounts.mjs --count 5 --out /secure/path/staging-accounts.json
 *
 * Passwords are random and written only to the --out file (mode 600, outside the repository),
 * never to stdout. Addresses use the reserved domain staging.invalid.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const base = (process.env.STAGING_BASE_URL ?? "").replace(/\/$/, "");
const count = Number(arg("count", "3"));
const out = arg("out");
const domain = arg("domain", "staging.invalid");
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

if (!base || !out) {
  console.error("Usage: STAGING_BASE_URL=… node scripts/seed-staging-accounts.mjs --count N --out <file outside the repo>");
  process.exit(2);
}
if (path.resolve(out).startsWith(repoRoot + path.sep)) {
  console.error("Refusing to write credentials inside the repository.");
  process.exit(2);
}
if (!Number.isInteger(count) || count < 1 || count > 50) {
  console.error("--count must be between 1 and 50.");
  process.exit(2);
}

const authHeader = process.env.STAGING_BASIC_AUTH ? { Authorization: `Basic ${Buffer.from(process.env.STAGING_BASIC_AUTH).toString("base64")}` } : {};

async function call(pathname, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      ...authHeader,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { Origin: base } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  return res;
}

const health = await (await call("/api/health")).json();
if (health.environment !== "staging" && health.environment !== "development") {
  console.error(`Target reports environment "${health.environment}" — only staging is allowed.`);
  process.exit(1);
}

/** Synthetic folder: obviously fictitious values only. */
function syntheticFolder(i) {
  return {
    userProfile: { name: `Testperson ${i} (synthetisch)`, birthDate: "1970-01-01", language: "de" },
    emergencyCard: {
      name: `Testperson ${i} (synthetisch)`,
      birthDate: "1970-01-01",
      emergencyContact1: { name: "Kontakt Test", phone: "+49 000 0000000", relation: "sonstige" },
      emergencyContact2: { name: "", phone: "", relation: "" },
      familyDoctor: "Praxis Test (fiktiv)",
      illnesses: "",
      medications: "",
      allergies: "",
      language: "de",
      mosqueImam: "",
      preferredFuneralDirector: "",
      hasPatientenverfuegung: null,
      hasVorsorgevollmacht: null,
      hasJanazahWishes: null,
    },
  };
}

const accounts = [];
for (let i = 1; i <= count; i++) {
  const email = `pilot-${String(i).padStart(2, "0")}-${randomBytes(3).toString("hex")}@${domain}`;
  const password = randomBytes(18).toString("base64url");

  const reg = await call("/api/auth/register", { method: "POST", body: { email, password, name: `Pilot ${i}` } });
  if (reg.status !== 202) throw new Error(`register ${i}: HTTP ${reg.status}`);

  const outbox = await (await call(`/api/dev/outbox?to=${encodeURIComponent(email)}`)).json();
  const link = outbox.messages?.filter((m) => m.kind === "verify_email").at(-1)?.text.match(/token=([^\s&]+)/);
  if (!link) throw new Error(`account ${i}: no confirmation mail in the outbox (internal tools on?)`);

  const verified = await call("/api/auth/verify-email", { method: "POST", body: { token: decodeURIComponent(link[1]) } });
  const cookie = verified.headers.get("set-cookie")?.split(";")[0];
  if (verified.status !== 200 || !cookie) throw new Error(`verify ${i}: HTTP ${verified.status}`);

  const { status } = await (await call("/api/consent", { cookie })).json();
  const version = status?.sensitive_folder_storage?.version;
  const consent = await call("/api/consent", {
    method: "POST",
    cookie,
    body: { purpose: "sensitive_folder_storage", version, confirmed: true },
  });
  if (consent.status !== 201) throw new Error(`consent ${i}: HTTP ${consent.status}`);

  const saved = await call("/api/amanah", { method: "PATCH", cookie, body: syntheticFolder(i) });
  if (saved.status !== 200) throw new Error(`folder ${i}: HTTP ${saved.status}`);

  await call("/api/auth/logout", { method: "POST", cookie });
  accounts.push({ email, password });
  console.log(`✓ account ${i}/${count} created (${email})`);
}

writeFileSync(out, JSON.stringify({ base, createdAt: new Date().toISOString(), accounts }, null, 2), { mode: 0o600 });
console.log(`Credentials written to ${out} (mode 600).`);
