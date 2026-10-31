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
    expect(health(env)).toContain("OK   restore test passed within 2 days");
    const old = new Date(Date.now() - 3 * 86400 * 1000);
    utimesSync(stamp, old, old);
    expect(health(env)).toContain("FAIL last passed restore test older than 2 days");
  });

  it("tracks the owner's own restore test separately with its own age limit", () => {
    const auto = join(dir, "restore-test.ok");
    const owner = join(dir, "owner-restore.ok");
    const line = `recipients_sha256=${sha("age1abc")}\n`;
    writeFileSync(auto, line);
    const env = { RESTORE_STAMP: auto, OWNER_RESTORE_STAMP: owner, RESTORE_RECIPIENTS: "age1abc" };
    let out = health(env);
    expect(out).toContain("OK   restore test passed within 2 days");
    expect(out).toContain("FAIL no passed owner restore test for the current backup key");
    writeFileSync(owner, line);
    const old = new Date(Date.now() - 20 * 86400 * 1000);
    utimesSync(owner, old, old);
    out = health(env);
    expect(out).toContain("OK   owner restore test passed within 35 days");
    expect(health({ OWNER_RESTORE_STAMP: owner, RESTORE_RECIPIENTS: "age1abc" })).not.toMatch(/^.*restore test passed within 2/m);
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

describe("owner backup key and alert channel setup", () => {
  const PUB = `age1${"q".repeat(58)}`;
  const PUB2 = `age1${"p".repeat(58)}`;

  // Mirror of /opt/amanah-staging: scripts/ next to .env.staging, ops.env and alert.env.
  function stagingTree(): string {
    const root = join(dir, "srv");
    spawnSync("mkdir", ["-p", join(root, "scripts")]);
    for (const f of ["staging-set-recipient.sh", "staging-alert-channel.sh", "staging-alert.sh"]) {
      spawnSync("cp", [join(ROOT, "scripts", f), join(root, "scripts", f)]);
    }
    writeFileSync(join(root, ".env.staging"), "POSTGRES_PASSWORD=pw\nBACKUP_AGE_RECIPIENTS=\nOTHER=1\n");
    writeFileSync(join(root, "ops.env"), `RESTORE_CHECK_RECIPIENT=${PUB2}\n`);
    return root;
  }
  const run = (root: string, script: string, args: string[], input: string, env: Record<string, string> = {}) =>
    spawnSync("bash", [join(root, "scripts", script), ...args], {
      input,
      encoding: "utf8",
      env: {
        NODE_ENV: "test",
        PATH: `${fakeCurl()}:${process.env.PATH}`,
        ALERT_STATE_DIR: join(dir, "state"),
        ALERT_LOG: join(dir, "alerts.log"),
        ...env,
      },
    });

  it("sets only a public owner key, keeps the rest of the env file and leaves a rollback copy", () => {
    const root = stagingTree();
    const res = run(root, "staging-set-recipient.sh", [], `# public key: ${PUB}\n${PUB}\n`);
    expect(res.status).toBe(0);
    expect(res.stdout).not.toContain(PUB);
    expect(res.stdout).toContain(createHash("sha256").update(PUB).digest("hex").slice(0, 16));
    const env = readFileSync(join(root, ".env.staging"), "utf8");
    expect(env).toContain(`BACKUP_AGE_RECIPIENTS=${PUB}\n`);
    expect(env).toContain("POSTGRES_PASSWORD=pw\n");
    expect(spawnSync("ls", ["-A", join(root, "rollback")], { encoding: "utf8" }).stdout).toMatch(/\.env\.staging\.\d+_\d+/);
  });

  it("refuses private keys, malformed input and the server's own restore-check key", () => {
    const root = stagingTree();
    const priv = run(root, "staging-set-recipient.sh", [], "AGE-SECRET-KEY-1QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ\n");
    expect(priv.status).toBe(1);
    expect(priv.stderr).toContain("PRIVATE key");
    expect(priv.stdout + priv.stderr).not.toContain("AGE-SECRET-KEY-1QQ");
    expect(run(root, "staging-set-recipient.sh", [], "age1short\n").status).toBe(1);
    expect(run(root, "staging-set-recipient.sh", [], `${PUB2}\n`).stderr).toContain("restore-check key");
    expect(readFileSync(join(root, ".env.staging"), "utf8")).toContain("BACKUP_AGE_RECIPIENTS=\n");
  });

  it("stores the ntfy channel switched off and never prints topic or token", () => {
    const root = stagingTree();
    const url = "https://ntfy.invalid/amanah-0123456789abcdefABCDEF";
    const set = run(root, "staging-alert-channel.sh", ["set"], `${url}\ntk_abcdefghijklmnopqrstuvwxyz\n`);
    expect(set.status).toBe(0);
    const conf = readFileSync(join(root, "alert.env"), "utf8");
    expect(conf).toContain("ALERT_EXTERNAL=false");
    expect(conf).toContain(`ALERT_NTFY_URL=${url}`);
    const status = run(root, "staging-alert-channel.sh", ["status"], "");
    expect(status.stdout).toContain("external delivery: OFF");
    expect(status.stdout + set.stdout).not.toMatch(/amanah-0123|tk_abc/);
    expect(curlCalls()).toBe("");
    expect(run(root, "staging-alert-channel.sh", ["set"], "http://ntfy.invalid/short\n\n").status).toBe(1);
  });

  it("enables delivery only on request and sends exactly one test alarm and all-clear", () => {
    const root = stagingTree();
    run(root, "staging-alert-channel.sh", ["set"], "https://ntfy.invalid/amanah-0123456789abcdefABCDEF\n\n");
    const res = run(root, "staging-alert-channel.sh", ["enable"], "", { ALERT_CONFIG: join(root, "alert.env") });
    expect(res.status).toBe(0);
    expect(readFileSync(join(root, "alert.env"), "utf8")).toContain("ALERT_EXTERNAL=true");
    const titles = curlCalls().match(/Title: [A-Z]+ amanah-staging channel-test/g);
    expect(titles).toEqual(["Title: ALARM amanah-staging channel-test", "Title: OK amanah-staging channel-test"]);
    run(root, "staging-alert-channel.sh", ["disable"], "");
    expect(readFileSync(join(root, "alert.env"), "utf8")).toContain("ALERT_EXTERNAL=false");
  });

  it("owner helper creates the key with mode 600 outside repositories and sends only the public key", () => {
    const bin = join(dir, "ownerbin");
    spawnSync("mkdir", ["-p", bin]);
    // age-keygen stand-in: -o writes a fake identity, -y prints the matching public key.
    writeFileSync(
      join(bin, "age-keygen"),
      `#!/usr/bin/env bash\nif [[ "$1" == "-o" ]]; then echo "# public key: ${PUB}" > "$2"; echo "AGE-SECRET-KEY-1FAKEFAKE" >> "$2"; echo "Public key: ${PUB}" >&2; else echo "${PUB}"; fi\n`,
    );
    writeFileSync(join(bin, "ssh"), `#!/usr/bin/env bash\necho "SSH $*" >> "${dir}/ssh.calls"\ncat >> "${dir}/ssh.calls"\n`);
    chmodSync(join(bin, "age-keygen"), 0o755);
    chmodSync(join(bin, "ssh"), 0o755);
    const owner = (args: string[]) =>
      spawnSync("bash", [join(ROOT, "scripts/owner-backup-key.sh"), ...args], {
        encoding: "utf8",
        env: { NODE_ENV: "test", PATH: `${bin}:${process.env.PATH}`, HOME: join(dir, "home") },
      });

    const created = owner(["create"]);
    expect(created.status).toBe(0);
    const key = join(dir, "home/amanah-keys/amanah-staging-backup.key");
    expect((spawnSync("stat", ["-c", "%a", key], { encoding: "utf8" }).stdout || "").trim()).toBe("600");
    expect(created.stdout + created.stderr).not.toContain("AGE-SECRET-KEY");
    expect(owner(["create"]).status).toBe(1);

    spawnSync("mkdir", ["-p", join(dir, "repo/.git")]);
    expect(owner(["create", join(dir, "repo/keys/k.key")]).stderr).toContain("Git repository");
    expect(owner(["create", join(dir, "home/Nextcloud/k.key")]).stderr).toContain("cloud folder");

    expect(owner(["install-recipient"]).status).toBe(0);
    const calls = readFileSync(join(dir, "ssh.calls"), "utf8");
    expect(calls).toContain("/opt/amanah-staging/scripts/staging-set-recipient.sh");
    expect(calls).toContain(PUB);
    expect(calls).not.toContain("AGE-SECRET-KEY");
  });
});
