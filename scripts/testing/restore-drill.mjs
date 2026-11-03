#!/usr/bin/env node
/**
 * Full restore drill with synthetic accounts: real server, real pg_dump, the real restore script.
 * Only against a throwaway database. Needs an API-mode build in .next and a running container
 * (see docs/strategy/39). Refuses any other database. Prints checks only, no data, no secrets.
 */
import { spawn, spawnSync as spawnSyncUnbounded } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, chmodSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

/** No step may hang the drill: a stuck command fails its check instead. */
const spawnSync = (command, args, options = {}) => spawnSyncUnbounded(command, args, { timeout: 120_000, killSignal: "SIGKILL", ...options });

const CONTAINER = "amanah-history-test-pg";
const DB = "hist";
const PORT = "3096";
const BASE = `http://127.0.0.1:${PORT}`;
const DATABASE_URL = `postgresql://test:testonly@127.0.0.1:5447/${DB}`;
const PASSWORD = "drill-passwort-1";

if (!spawnSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" }).stdout.split("\n").includes(CONTAINER)) {
  console.error("FAIL throwaway container is not running");
  process.exit(2);
}

const work = mkdtempSync(join(tmpdir(), "restore-drill-"));
const keyA = randomBytes(32).toString("base64");
const keyB = randomBytes(32).toString("base64");
const ledgerEnv = {
  AMANAH_DELETION_LEDGER: "required",
  AMANAH_DELETION_LEDGER_DIR: join(work, "ledger"),
  AMANAH_DELETION_LEDGER_HEAD: join(work, "second-volume", "head.json"),
  AMANAH_DELETION_LEDGER_KEYS: `a:${keyA}`,
  AMANAH_BACKUP_MAX_RETENTION_DAYS: "30",
};
const appEnv = {
  ...process.env,
  ...ledgerEnv,
  AMANAH_PUBLIC_REGISTRATION_ENABLED: "true",
  AMANAH_SERVER_STORAGE: "postgres",
  DATABASE_URL,
  AMANAH_DATA_KEYS: `t:${randomBytes(32).toString("base64")}`,
  AMANAH_DATA_KEY_ACTIVE: "t",
  SESSION_SECRET: randomBytes(32).toString("hex"),
  AMANAH_MAIL_TRANSPORT: "outbox",
  AMANAH_INTERNAL_TOOLS: "true",
  AMANAH_PUBLIC_BASE_URL: BASE,
  AMANAH_DATA_HISTORY: "true",
};

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
  if (!ok) failed += 1;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Starts the app; resolves to the process, or to null when it refused to start. */
async function startApp(env = appEnv) {
  const child = spawn("npx", ["next", "start", "-p", PORT], { env, stdio: "ignore" });
  let exited = false;
  child.on("exit", () => (exited = true));
  for (let i = 0; i < 60; i++) {
    if (exited) return null;
    try {
      if ((await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) })).ok) return child;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  return null;
}

async function stopApp(child) {
  const pid = spawnSync("ss", ["-ltnp"], { encoding: "utf8" }).stdout.split("\n").find((l) => l.includes(`:${PORT} `))?.match(/pid=(\d+)/)?.[1];
  if (pid) process.kill(Number(pid));
  child?.kill();
  for (let i = 0; i < 20 && spawnSync("ss", ["-ltn"], { encoding: "utf8" }).stdout.includes(`:${PORT} `); i++) await sleep(250);
}

async function isReachable() {
  try {
    return (await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
}

function request(path, method, cookie, body) {
  return fetch(`${BASE}${path}`, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    headers: { Origin: BASE, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const cookieOf = (res) => res.headers.getSetCookie().map((c) => c.split(";")[0]).find((c) => c.includes("amanah_session")) ?? null;

async function login(email) {
  return cookieOf(await request("/api/auth/login", "POST", null, { email, password: PASSWORD }));
}

async function account(label) {
  const email = `${label}-${Date.now()}@test.invalid`;
  const reg = await request("/api/auth/register", "POST", null, { email, password: PASSWORD, name: label });
  if (!reg.ok) throw new Error(`register ${reg.status}`);
  const { messages } = await (await request(`/api/dev/outbox?to=${encodeURIComponent(email)}`, "GET")).json();
  const token = new URL(messages.at(-1).text.match(/https?:\/\/\S+token=\S+/)[0]).searchParams.get("token");
  const verified = await request("/api/auth/verify-email", "POST", null, { token });
  const cookie = cookieOf(verified) ?? (await login(email));
  const defs = await (await request("/api/consent", "GET", cookie)).json();
  await request("/api/consent", "POST", cookie, { purpose: "sensitive_folder_storage", version: defs.definitions.sensitive_folder_storage.version, confirmed: true });
  return { email, cookie };
}

const save = (a, letter) => request("/api/amanah", "PUT", a.cookie, { familyMessage: { familyLetter: letter }, assets: [{ id: "a1", type: "bank", description: letter }] });

async function folderOf(cookie) {
  return (await (await request("/api/amanah", "GET", cookie)).json()).data;
}

async function dbValue(sql, params = []) {
  const client = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 5000, statement_timeout: 20_000 });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows[0]?.n;
  } finally {
    await client.end();
  }
}

const count = (table, column, value) => dbValue(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1`, [value]);
const userId = async (email) => dbValue("SELECT id AS n FROM users WHERE email = $1", [email]);

function backup() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
  const file = join(work, `amanah_${DB}_${stamp}.sql.gz`);
  const dump = spawnSync("sh", ["-c", `docker exec ${CONTAINER} pg_dump -U test -d ${DB} --no-owner --no-acl | gzip > '${file}'`]);
  if (dump.status !== 0) throw new Error("backup failed");
  return file;
}

function runRestore(file, env = {}) {
  writeFileSync(join(work, "env"), `POSTGRES_USER=test\nPOSTGRES_DB=${DB}\n`);
  return spawnSync("scripts/restore-with-deletions.sh", [file], {
    encoding: "utf8",
    env: { ...appEnv, ENV_FILE: join(work, "env"), POSTGRES_CONTAINER: CONTAINER, RESTORE_CONFIRM: "RESTORE", APP_HEALTH_URL: `${BASE}/api/health`, BACKUP_TAKEN_AT: new Date(Date.now() - 1000).toISOString(), ...env },
  });
}

const tool = (args, env = {}) => spawnSync("node", ["scripts/deletion-ledger.mjs", ...args], { encoding: "utf8", env: { ...appEnv, ...env } });
const ledgerFile = join(work, "ledger", "deletions.jsonl");

try {
  console.log("--- scenario: accounts before the backup");
  spawnSync("docker", ["exec", CONTAINER, "psql", "-q", "-U", "test", "-d", DB, "-c", "TRUNCATE users CASCADE; DELETE FROM deletion_ledger_anchor; DELETE FROM data_key_references;"]);
  // This drill brings its own key, so its environment gets its own reference.
  spawnSync("node", ["scripts/key-reference.mjs", "init"], { env: { ...appEnv, AMANAH_KEY_REFERENCE_CONFIRM: "yes" } });
  let app = await startApp();
  check("application starts with the ledger on", Boolean(app));
  const keep = await account("keep");
  const deleted = await account("deleted");
  const folder = await account("folder");
  const withdrawn = await account("withdrawn");
  const history = await account("history");
  for (const a of [keep, deleted, folder, withdrawn, history]) {
    await save(a, "vorher");
    await save(a, "erste Aenderung");
  }
  const ids = {};
  for (const [name, a] of Object.entries({ keep, deleted, folder, withdrawn, history })) ids[name] = await userId(a.email);
  check("history holds versions", (await count("amanah_data_versions", "user_id", ids.history)) > 0);
  await sleep(1100);
  const file = backup();
  console.log("--- scenario: deletions after the backup");
  check("account deleted", (await request("/api/account", "DELETE", deleted.cookie, { password: PASSWORD })).ok);
  check("folder deleted", (await request("/api/amanah", "DELETE", folder.cookie)).ok);
  check("consent withdrawn", (await request("/api/consent", "DELETE", withdrawn.cookie, { purpose: "sensitive_folder_storage" })).ok);
  check("history deleted", (await request("/api/amanah/history", "DELETE", history.cookie)).ok);
  const raw = readFileSync(ledgerFile, "utf8");
  check("ledger holds no e-mail address and no account id", !raw.includes("@") && !Object.values(ids).some((id) => raw.includes(id)));
  check("restore refuses while the application runs", runRestore(file).status !== 0 && !existsSync(join(work, "ledger", "RESTORE_PENDING")));
  await stopApp(app);

  console.log("--- scenario: the gate holds before the deletions are applied");
  tool(["lock"]);
  app = await startApp();
  check("application refuses to start during a restore", app === null && !(await isReachable()));
  tool(["unlock"]);
  spawnSync("sh", ["-c", `gunzip -c '${file}' > '${file}.plain'`]);
  spawnSync("docker", ["exec", CONTAINER, "dropdb", "--force", "-U", "test", DB]);
  spawnSync("docker", ["exec", CONTAINER, "createdb", "-U", "test", DB]);
  spawnSync("sh", ["-c", `docker exec -i ${CONTAINER} psql -q -U test -d ${DB} < '${file}.plain'`]);
  check("raw restore brings the deleted account back (what the gate is for)", (await count("users", "id", ids.deleted)) === 1);

  console.log("--- scenario: restore through the script");
  const restored = runRestore(file);
  check("restore script succeeds", restored.status === 0);
  check("lock removed only at the end", !existsSync(join(work, "ledger", "RESTORE_PENDING")));
  check("deleted account is gone", (await count("users", "id", ids.deleted)) === 0);
  check("its folder is gone", (await count("amanah_data", "user_id", ids.deleted)) === 0);
  check("deleted folder is gone", (await count("amanah_data", "user_id", ids.folder)) === 0);
  check("its history is gone", (await count("amanah_data_versions", "user_id", ids.folder)) === 0);
  check("that account itself stays", (await count("users", "id", ids.folder)) === 1);
  check("withdrawn folder is gone", (await count("amanah_data", "user_id", ids.withdrawn)) === 0);
  check("consent is withdrawn again", (await dbValue("SELECT count(*)::int AS n FROM consent_records WHERE user_id = $1 AND revoked_at IS NULL", [ids.withdrawn])) === 0);
  check("deleted history is gone", (await count("amanah_data_versions", "user_id", ids.history)) === 0);
  check("the folder without its history stays", (await count("amanah_data", "user_id", ids.history)) === 1);
  check("unrelated account keeps folder and history", (await count("amanah_data", "user_id", ids.keep)) === 1 && (await count("amanah_data_versions", "user_id", ids.keep)) > 0);

  console.log("--- scenario: back in service");
  app = await startApp();
  check("application starts after the restore", Boolean(app));
  check("deleted account cannot log in", (await login(deleted.email)) === null);
  const keepCookie = await login(keep.email);
  check("unrelated account logs in and reads its encrypted data", keepCookie && (await folderOf(keepCookie)).familyMessage.familyLetter === "erste Aenderung");
  const withdrawnCookie = await login(withdrawn.email);
  check("withdrawn account cannot store without new consent", (await save({ cookie: withdrawnCookie }, "neu")).status === 403);
  await stopApp(app);

  console.log("--- scenario: a start without restore repeats harmlessly");
  app = await startApp();
  check("second start is fine", Boolean(app));
  check("data unchanged", (await count("amanah_data", "user_id", ids.keep)) === 1);
  await stopApp(app);

  console.log("--- scenario: key rotation");
  const rotatedEnv = { ...appEnv, AMANAH_DELETION_LEDGER_KEYS: `a:${keyA},b:${keyB}`, AMANAH_DELETION_LEDGER_KEY_ACTIVE: "b" };
  app = await startApp(rotatedEnv);
  check("application starts with a rotated key", Boolean(app));
  const historyCookie = await login(history.email);
  await sleep(1100);
  const beforeRotationDeletion = backup();
  check("deletion with the new key", (await request("/api/amanah", "DELETE", historyCookie)).ok);
  await stopApp(app);
  check("restore replays entries of both keys", runRestore(beforeRotationDeletion, rotatedEnv).status === 0);
  check("old key's deletion stays effective", (await count("users", "id", ids.deleted)) === 0);
  check("new key's deletion is effective", (await count("amanah_data", "user_id", ids.history)) === 0);
  app = await startApp({ ...appEnv, AMANAH_DELETION_LEDGER_KEYS: `b:${keyB}`, AMANAH_DELETION_LEDGER_KEY_ACTIVE: "b" });
  check("removing an old key that is still needed stops the start", app === null);

  console.log("--- scenario: a manipulated ledger");
  const intact = readFileSync(ledgerFile, "utf8");
  const lines = intact.split("\n").filter(Boolean);
  writeFileSync(ledgerFile, `${lines.filter((_, i) => i !== 2).join("\n")}\n`);
  check("removed entry: tool reports it", tool(["verify"], rotatedEnv).status !== 0);
  app = await startApp(rotatedEnv);
  check("removed entry: application refuses to start", app === null);
  const before = await dbValue("SELECT count(*)::int AS n FROM users");
  check("removed entry: restore stops before touching the database", runRestore(file, rotatedEnv).status !== 0 && (await dbValue("SELECT count(*)::int AS n FROM users")) === before);
  check("removed entry: the lock stays", existsSync(join(work, "ledger", "RESTORE_PENDING")));
  tool(["unlock"], rotatedEnv);
  writeFileSync(ledgerFile, intact);
  check("restored ledger verifies again", tool(["verify"], rotatedEnv).status === 0);

  console.log("--- scenario: emergency, half a line after a crash");
  const headFile = join(work, "second-volume", "head.json");
  const repairEnv = { ...rotatedEnv, AMANAH_LEDGER_REPAIR: "yes" };
  const startsAndStops = async () => {
    const running = await startApp(rotatedEnv);
    await stopApp(running);
    return Boolean(running);
  };
  appendFileSync(ledgerFile, '{"epoch":1,"seq":99,"at":"20');
  check("half a line: application refuses to start", !(await startsAndStops()));
  check("half a line: repair needs an explicit confirmation", tool(["repair-tail"], rotatedEnv).status === 2);
  check("half a line: repair works", tool(["repair-tail"], repairEnv).status === 0);
  check("half a line: ledger identical to before", readFileSync(ledgerFile, "utf8") === intact);
  check("half a line: application starts again", await startsAndStops());
  check("half a line: deletions stay effective", (await count("users", "id", ids.deleted)) === 0);

  console.log("--- scenario: emergency, lost or damaged head");
  rmSync(headFile);
  check("lost head: application refuses to start", !(await startsAndStops()));
  check("lost head: rebuild needs an explicit confirmation", tool(["rebuild-head"], rotatedEnv).status === 2);
  check("lost head: rebuild works", tool(["rebuild-head"], repairEnv).status === 0);
  check("lost head: application starts again", await startsAndStops());
  writeFileSync(headFile, "kaputt");
  check("damaged head: application refuses to start", !(await startsAndStops()));
  check("damaged head: rebuild works", tool(["rebuild-head"], repairEnv).status === 0);
  check("damaged head: application starts again", await startsAndStops());

  console.log("--- scenario: emergency, changed entry and a separate copy");
  const changedLines = intact.split("\n");
  changedLines[2] = changedLines[2].replace(/"subject":"./, '"subject":"#');
  const changed = changedLines.join("\n");
  writeFileSync(ledgerFile, changed);
  check("changed entry: application refuses to start", !(await startsAndStops()));
  check("changed entry: repair and rebuild refuse it", tool(["repair-tail"], repairEnv).stdout.includes("false") && tool(["rebuild-head"], repairEnv).status !== 0);
  check("changed entry: nothing was altered", readFileSync(ledgerFile, "utf8") === changed);
  writeFileSync(ledgerFile, intact);
  check("changed entry: the separate copy verifies", tool(["verify"], rotatedEnv).status === 0);
  check("changed entry: application starts again", await startsAndStops());

  console.log("--- scenario: emergency, ledger cannot be written");
  app = await startApp(rotatedEnv);
  const keepAgain = await login(keep.email);
  chmodSync(ledgerFile, 0o400);
  const blocked = await request("/api/amanah", "DELETE", keepAgain);
  check("read-only ledger: deletion is refused", blocked.status === 500);
  check("read-only ledger: nothing was deleted", (await count("amanah_data", "user_id", ids.keep)) === 1);
  chmodSync(ledgerFile, 0o600);
  await stopApp(app);

  console.log("--- scenario: emergency, restore stopped halfway");
  tool(["lock"], rotatedEnv);
  check("stopped restore: application refuses to start", !(await startsAndStops()));
  check("stopped restore: the script can simply run again", runRestore(beforeRotationDeletion, rotatedEnv).status === 0);
  check("stopped restore: lock is gone", !existsSync(join(work, "ledger", "RESTORE_PENDING")));
  check("stopped restore: deletions stay effective", (await count("users", "id", ids.deleted)) === 0);
  check("stopped restore: application starts again", await startsAndStops());

  console.log("--- scenario: a lost ledger");
  renameSync(ledgerFile, `${ledgerFile}.lost`);
  app = await startApp(rotatedEnv);
  check("lost ledger: application refuses to start", app === null);
  check("lost ledger: restore stops", runRestore(file, rotatedEnv).status !== 0);
  tool(["unlock"], rotatedEnv);
  check("lost ledger: acceptance needs an explicit confirmation", tool(["accept-loss"], rotatedEnv).status === 2);
  check("lost ledger: explicit acceptance works", tool(["accept-loss"], { ...rotatedEnv, AMANAH_LEDGER_ACCEPT_LOSS: "yes" }).status === 0);
  check("lost ledger: older backups are now refused", runRestore(file, { ...rotatedEnv, BACKUP_TAKEN_AT: "2020-01-01T00:00:00Z" }).status !== 0);
  check("lost ledger: refusal keeps the lock", existsSync(join(work, "ledger", "RESTORE_PENDING")));
  tool(["unlock"], rotatedEnv);
} catch (error) {
  check(`unexpected: ${error?.name ?? "error"}`, false);
} finally {
  await stopApp();
  rmSync(work, { recursive: true, force: true });
}

console.log(failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);
