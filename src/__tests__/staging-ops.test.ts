import { chmodSync, mkdtempSync, readFileSync, utimesSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { beforeEach, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const ALERT = join(ROOT, "scripts/staging-alert.sh");
const HEALTH = join(ROOT, "scripts/staging-healthcheck.sh");

let dir: string;

// curl stand-in: records arguments and the stdin config, never touches the network.
function fakeCurl(): string {
  const bin = join(dir, "bin");
  spawnSync("mkdir", ["-p", bin]);
  const file = join(bin, "curl");
  writeFileSync(
    file,
    `#!/usr/bin/env bash\necho "ARGS $*" >> "${dir}/curl.calls"\ncat >> "${dir}/curl.calls"\necho >> "${dir}/curl.calls"\n`,
  );
  chmodSync(file, 0o755);
  return bin;
}

function alert(check: string, code: number, log?: string, env: Record<string, string> = {}) {
  return spawnSync("bash", [ALERT, check, String(code), ...(log ? [log] : [])], {
    encoding: "utf8",
    env: {
      NODE_ENV: "test",
      PATH: `${fakeCurl()}:${process.env.PATH}`,
      ALERT_CONFIG: join(dir, "alert.env"),
      ALERT_STATE_DIR: join(dir, "state"),
      ALERT_LOG: join(dir, "alerts.log"),
      ...env,
    },
  });
}

const alertLog = () => (existsSync(join(dir, "alerts.log")) ? readFileSync(join(dir, "alerts.log"), "utf8") : "");
const curlCalls = () => (existsSync(join(dir, "curl.calls")) ? readFileSync(join(dir, "curl.calls"), "utf8") : "");

function writeLog(name: string, text: string): string {
  const file = join(dir, name);
  writeFileSync(file, text);
  return file;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "amanah-ops-"));
});

describe("staging alert dispatcher", () => {
  it("alarms once per failure, stays quiet while it persists and sends an all-clear", () => {
    const log = writeLog("h.log", "OK   status ok\nFAIL disk / 87% over 85%\n");
    expect(alert("health", 1, log).status).toBe(0);
    alert("health", 1, writeLog("h.log", "OK   status ok\nFAIL disk / 88% over 85%\n"));
    expect(alertLog().match(/ALARM/g)).toHaveLength(1);

    alert("health", 1, writeLog("h.log", "FAIL disk / 88% over 85%\nFAIL database not reachable\n"));
    expect(alertLog().match(/ALARM/g)).toHaveLength(2);
    expect(alertLog()).toContain("database not reachable");

    alert("health", 0, writeLog("h.log", "OK   status ok\n"));
    alert("health", 0, writeLog("h.log", "OK   status ok\n"));
    expect(alertLog().match(/OK amanah-staging health/g)).toHaveLength(1);
  });

  it("sends a reminder while a failure persists past the repeat interval", () => {
    const log = writeLog("b.log", "pg_dump: error\n");
    alert("backup", 1, log);
    const state = join(dir, "state/backup.state");
    const old = new Date(Date.now() - 25 * 3600 * 1000);
    utimesSync(state, old, old);
    alert("backup", 1, log);
    expect(alertLog()).toContain("REMINDER amanah-staging backup");
  });

  it("reports jobs without FAIL lines generically and never forwards log contents", () => {
    alert("backup", 1, writeLog("b.log", "BACKUP_REQUIRE_ENCRYPTION=true but BACKUP_AGE_RECIPIENTS is empty.\nsecret-ish detail\n"));
    expect(alertLog()).toContain("backup job exited with code 1");
    expect(alertLog()).not.toContain("secret-ish");
  });

  it("does not send anything off the server unless ALERT_EXTERNAL=true", () => {
    writeFileSync(join(dir, "alert.env"), "ALERT_NTFY_URL=https://ntfy.invalid/topic-xyz\nALERT_NTFY_TOKEN=tk_dummy\n");
    alert("health", 1, writeLog("h.log", "FAIL status not ok\n"));
    expect(alertLog()).toContain("ALARM");
    expect(curlCalls()).toBe("");
  });

  it("passes URL and token to curl via stdin, not as arguments, when enabled", () => {
    writeFileSync(
      join(dir, "alert.env"),
      "ALERT_EXTERNAL=true\nALERT_NTFY_URL=https://ntfy.invalid/topic-xyz\nALERT_NTFY_TOKEN=tk_dummy\nALERT_WEBHOOK_URL=https://hook.invalid/abc\n",
    );
    alert("restore", 1, writeLog("r.log", "FAIL backup x could not be decrypted or loaded\n"));
    const calls = curlCalls();
    const args = calls.split("\n").filter((l) => l.startsWith("ARGS"));
    expect(args).toHaveLength(2);
    expect(args.join("\n")).not.toMatch(/tk_dummy|topic-xyz|hook\.invalid/);
    expect(calls).toContain('url = "https://ntfy.invalid/topic-xyz"');
    expect(calls).toContain("Authorization: Bearer tk_dummy");
    expect(calls).toContain("Title: ALARM amanah-staging restore");
    expect(alertLog()).not.toMatch(/tk_dummy|topic-xyz/);
  });

  it("rejects malformed arguments", () => {
    expect(spawnSync("bash", [ALERT, "../etc", "1"]).status).toBe(2);
    expect(spawnSync("bash", [ALERT, "health", "x"]).status).toBe(2);
  });
});

describe("staging health check: restore proof and certificate", () => {
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");
  // Health endpoint deliberately unreachable: only the restore lines are asserted here.
  function health(env: Record<string, string>) {
    const res = spawnSync("bash", [HEALTH], {
      encoding: "utf8",
      env: { NODE_ENV: "test", PATH: process.env.PATH, BASE_URL: "http://127.0.0.1:9", DISK_MAX_PERCENT: "100", ...env },
    });
    return res.stdout;
  }

  it("fails without a recipient, without a stamp and with a stamp for another key", () => {
    const stamp = join(dir, "restore-test.ok");
    expect(health({ RESTORE_STAMP: stamp, RESTORE_RECIPIENTS: "" })).toContain("FAIL no backup recipient configured");
    expect(health({ RESTORE_STAMP: stamp, RESTORE_RECIPIENTS: "age1new" })).toContain(
      "FAIL no passed restore test for the current backup key",
    );
    writeFileSync(stamp, `date=x\nbackup=y\nrecipients_sha256=${sha("age1old")}\n`);
    expect(health({ RESTORE_STAMP: stamp, RESTORE_RECIPIENTS: "age1new" })).toContain(
      "FAIL last restore test used a different backup key",
    );
  });

  it("accepts a fresh stamp for the current key and rejects an old one", () => {
    const stamp = join(dir, "restore-test.ok");
    writeFileSync(stamp, `date=x\nbackup=y\nrecipients_sha256=${sha("age1abc age1def")}\n`);
    const env = { RESTORE_STAMP: stamp, RESTORE_RECIPIENTS: "age1abc age1def" };
    expect(health(env)).toContain("OK   restore test passed within 8 days");
    const old = new Date(Date.now() - 10 * 86400 * 1000);
    utimesSync(stamp, old, old);
    expect(health(env)).toContain("FAIL last passed restore test older than 8 days");
  });

  it("reports a missing certificate when HTTPS is expected but not answering", () => {
    expect(health({ CERT_HOST: "127.0.0.1" })).toContain("FAIL no TLS certificate from 127.0.0.1:443");
  });

  it("leaves restore and certificate checks off unless configured", () => {
    const out = health({});
    expect(out).not.toContain("restore");
    expect(out).not.toContain("certificate");
  });
});

describe("staging cron wiring", () => {
  it("routes every job through the alert dispatcher and keeps app secrets out of ops", () => {
    const cron = readFileSync(join(ROOT, "scripts/staging-cron.sh"), "utf8");
    expect(cron).toContain('scripts/staging-alert.sh "$JOB" "$code" "$LOG"');
    expect(cron).toContain("grep -m1 '^BACKUP_AGE_RECIPIENTS='");
    expect(cron).not.toMatch(/source \.env\.staging/);
    const table = readFileSync(join(ROOT, "deploy/amanah-staging.cron"), "utf8");
    for (const job of ["health", "backup", "restore", "security"]) {
      expect(table).toContain(`scripts/staging-cron.sh ${job}`);
    }
  });
});
