import { chmodSync, mkdtempSync, readFileSync, utimesSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
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
    // Built at runtime so secret scanners do not flag this obviously fake private key.
    const fakePrivate = ["AGE", "SECRET", "KEY", `1${"Q".repeat(58)}`].join("-");
    const priv = run(root, "staging-set-recipient.sh", [], `${fakePrivate}\n`);
    expect(priv.status).toBe(1);
    expect(priv.stderr).toContain("PRIVATE key");
    expect(priv.stdout + priv.stderr).not.toContain(fakePrivate);
    expect(run(root, "staging-set-recipient.sh", [], "age1short\n").status).toBe(1);
    expect(run(root, "staging-set-recipient.sh", [], `${PUB2}\n`).stderr).toContain("restore-check key");
    expect(readFileSync(join(root, ".env.staging"), "utf8")).toContain("BACKUP_AGE_RECIPIENTS=\n");
  });

  const SMTP_KEY = "xsmtpsib-dummy-key-not-real-0123456789";
  const mailSet = (root: string, login: string, key: string, from: string, to: string) =>
    run(root, "staging-alert-channel.sh", ["mail-set"], `${login}\n${key}\n${from}\n${to}\n`, { ALERT_CONFIG: join(root, "alert.env") });

  it("stores the e-mail channel switched off, keeps ntfy off and never prints login or key", () => {
    const root = stagingTree();
    writeFileSync(join(root, "alert.env"), "ALERT_EXTERNAL=false\nALERT_REPEAT_HOURS=24\n");
    const set = mailSet(root, "monitor-login@smtp-brevo.invalid", SMTP_KEY, "monitoring@ops.invalid", "owner@ops.invalid, second@ops.invalid");
    expect(set.status).toBe(0);
    const conf = readFileSync(join(root, "alert.env"), "utf8");
    expect(conf).toContain("ALERT_EXTERNAL=false");
    expect(conf).toContain("ALERT_REPEAT_HOURS=24");
    expect(conf).toContain("ALERT_SMTP_HOST='smtp-relay.brevo.com'");
    expect(conf).toContain("ALERT_SMTP_PORT='587'");
    expect(conf).toContain(`ALERT_SMTP_PASSWORD='${SMTP_KEY}'`);
    expect(conf).toContain("ALERT_MAIL_TO='owner@ops.invalid,second@ops.invalid'");
    expect(conf).toContain("ALERT_NTFY_URL=''");
    expect(spawnSync("stat", ["-c", "%a", join(root, "alert.env")], { encoding: "utf8" }).stdout.trim()).toBe("600");
    const status = run(root, "staging-alert-channel.sh", ["status"], "", { ALERT_CONFIG: join(root, "alert.env") });
    expect(status.stdout).toContain("sending: OFF");
    expect(status.stdout).toContain("smtp key: set");
    expect(status.stdout).toContain("recipients: 2");
    expect(status.stdout).toContain("ntfy: off");
    expect(status.stdout + set.stdout + set.stderr).not.toMatch(/xsmtpsib|monitor-login|owner@/);
    expect(curlCalls()).toBe("");
    // The stored file is valid bash and yields the exact values.
    const sourced = spawnSync("bash", ["-c", `set -a; . "${join(root, "alert.env")}"; printf '%s|%s' "$ALERT_SMTP_PASSWORD" "$ALERT_MAIL"`], { encoding: "utf8" });
    expect(sourced.stdout).toBe(`${SMTP_KEY}|true`);
  });

  it("refuses incomplete or malformed mail settings and does not enable without a channel", () => {
    const root = stagingTree();
    expect(mailSet(root, "login", "short", "monitoring@ops.invalid", "owner@ops.invalid").status).toBe(1);
    expect(mailSet(root, "login", SMTP_KEY, "not-an-address", "owner@ops.invalid").status).toBe(1);
    expect(mailSet(root, "login", SMTP_KEY, "monitoring@ops.invalid", "owner@ops.invalid,x").status).toBe(1);
    expect(mailSet(root, "lo'gin", SMTP_KEY, "monitoring@ops.invalid", "owner@ops.invalid").status).toBe(1);
    const en = run(root, "staging-alert-channel.sh", ["enable"], "", { ALERT_CONFIG: join(root, "alert.env") });
    expect(en.status).toBe(1);
    expect(en.stderr).toContain("No e-mail channel configured");
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

describe("staging-https.sh: the way back changes only the address", () => {
  it("keeps a release set while the access was on, and restores the two lines", () => {
    const dir = mkdtempSync(join(tmpdir(), "https-env-"));
    try {
      mkdirSync(join(dir, "rollback"));
      const env = join(dir, ".env.staging");
      writeFileSync(env, "AMANAH_RELEASE=alt\nAMANAH_PUBLIC_BASE_URL=http://127.0.0.1:3201\nNEXT_PUBLIC_SITE_URL=http://127.0.0.1:3201\nANDERES=1\n");
      const script = 'source <(sed -n "/^set_base_url() {/,/^app_up()/p" scripts/staging-https.sh | sed \'$d\'); set_base_url https://test.invalid; sed -i "s/^AMANAH_RELEASE=.*/AMANAH_RELEASE=neu/" "$ENVF"; set_base_url https://test2.invalid; restore_base_url';
      const result = spawnSync("bash", ["-c", script], { encoding: "utf8", env: { ...process.env, ROOT: dir, ENVF: env } });
      expect(result.status, result.stderr).toBe(0);
      const after = readFileSync(env, "utf8");
      expect(after).toContain("AMANAH_RELEASE=neu");
      expect(after).toContain("AMANAH_PUBLIC_BASE_URL=http://127.0.0.1:3201");
      expect(after).toContain("NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3201");
      expect(after).toContain("ANDERES=1");
      expect(after).not.toContain("test.invalid");
      expect(existsSync(join(dir, "rollback/base-url.vor-https"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("staging-https.sh: the shared proxy", () => {
  const script = readFileSync("scripts/staging-https.sh", "utf8");

  it("never loads the container's stale file, which holds the closed production route", () => {
    expect(script).not.toMatch(/caddy reload[^\n]*\/etc\/caddy\/Caddyfile/);
    expect(script).toMatch(/caddy reload --config \/dev\/stdin --adapter caddyfile < "\$CADDYFILE"/);
  });

  it("checks the running configuration for the production route after every reload", () => {
    expect(script).toMatch(/amanah-app:3000\|amanahordner/);
  });
});

describe("caddy-route-policy.py: what may run on the shared proxy", () => {
  const policy = (config: unknown, ...denied: string[]) =>
    spawnSync("python3", ["scripts/caddy-route-policy.py", ...denied], {
      input: typeof config === "string" ? config : JSON.stringify(config),
      encoding: "utf8",
    });
  const proxy = (dial: string) => ({ handler: "reverse_proxy", upstreams: [{ dial }] });
  const auth = { handler: "authentication", providers: { http_basic: {} } };
  const site = (host: string, ...routes: object[]) => ({
    match: [{ host: [host] }],
    handle: [{ handler: "subroute", routes }],
    terminal: true,
  });
  const gemeinsam1 = site("gemeinsam1.com", { handle: [proxy("frontend:3000")] });
  const staging = (dial = "amanah-staging-app:3000", ...before: object[]) =>
    site("amanah-test.mscisystems.com", ...before, { handle: [proxy(dial)] });
  const config = (...routes: object[]) => ({ apps: { http: { servers: { srv0: { routes } } } } });
  const protectedStaging = staging(undefined, { handle: [auth] });

  it("accepts gemeinsam1 with or without the protected staging route", () => {
    expect(policy(config(gemeinsam1, protectedStaging)).stdout.trim()).toBe("ok");
    expect(policy(config(gemeinsam1)).status).toBe(0);
  });

  it.each([
    ["an added production route", config(gemeinsam1, protectedStaging, site("amanahordner.de", { handle: [proxy("amanah-app:3000")] })), "amanah-host"],
    ["the staging host on the production app", config(staging("amanah-app:3000", { handle: [auth] })), "staging-wrong-upstream"],
    ["the staging host on a foreign address", config(staging("10.0.0.5:3000", { handle: [auth] })), "staging-wrong-upstream"],
    ["staging without a password", config(staging()), "staging-without-password"],
    ["a password only for one path", config(staging(undefined, { match: [{ path: ["/x"] }], handle: [auth] })), "staging-without-password"],
    ["another site's password", config(site("gemeinsam1.com", { handle: [auth] }), staging()), "staging-without-password"],
    ["a foreign host on the staging upstream", config(site("offen.example.org", { handle: [proxy("amanah-staging-app:3000")] })), "foreign-host-to-amanah"],
    ["a foreign host on the production port", config(site("offen.example.org", { handle: [proxy("host.docker.internal:3001")] })), "foreign-host-to-amanah"],
    ["a route without host to the production app", config({ handle: [proxy("amanah-app:3000")] }), "foreign-host-to-amanah"],
    ["a redirect to the old domain", config(site("gemeinsam1.com", { handle: [{ handler: "static_response", headers: { Location: ["https://amanahordner.de"] } }] })), "amanah-mention"],
    ["a certificate policy for the old domain", { ...config(gemeinsam1), apps: { ...config(gemeinsam1).apps, tls: { automation: { policies: [{ subjects: ["amanahordner.de"] }] } } } }, "amanah-mention"],
  ])("rejects %s", (_name, sample, reason) => {
    const result = policy(sample);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(reason);
  });

  it("rejects a dial to a denied address, and names no configuration value", () => {
    const result = policy(config(site("gemeinsam1.com", { handle: [proxy("172.18.0.9:3000")] })), "172.18.0.9");
    expect(result.stdout.trim()).toBe("denied-address");
  });

  it.each([["empty input", ""], ["broken JSON", "{"], ["an empty object", {}], ["no routes", config()], ["null", "null"]])(
    "fails closed on %s",
    (_name, input) => {
      const result = policy(input);
      expect(result.status).toBe(1);
      expect(result.stdout.trim()).toBe("config-unreadable");
    },
  );
});

describe("the shared proxy cannot quietly go back to the old file", () => {
  const verify = readFileSync("scripts/verify-production-image.sh", "utf8");
  const install = readFileSync("scripts/install-shared-caddy.sh", "utf8");
  const restart = readFileSync("scripts/shared-caddy-restart.sh", "utf8");

  it("the production check reads the running configuration and compares container, host file and running state", () => {
    expect(verify).toMatch(/wget -qO- http:\/\/127\.0\.0\.1:2019\/config\//);
    expect(verify).toContain('check "proxy container sees the host file"');
    expect(verify).toContain('check "proxy runs the host file"');
    expect(verify).toContain('[ -n "$adapted" ]');
  });

  it("the old installer refuses without the owner's release and never loads the container's file", () => {
    const blocked = spawnSync("bash", ["scripts/install-shared-caddy.sh"], { encoding: "utf8", env: { ...process.env, AMANAH_PRODUCTION_ROUTE_RELEASED: "", CONFIRM_SHARED_RESTART: "" } });
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toContain("gesperrt");
    expect(install).not.toMatch(/--config \/etc\/caddy\/Caddyfile/);
  });

  it("the restart needs the owner's go, keeps the container and stops before it on a failed check", () => {
    const blocked = spawnSync("bash", ["scripts/shared-caddy-restart.sh", "run"], { encoding: "utf8", env: { ...process.env, AMANAH_PRODUCTION_ROUTE_RELEASED: "", CONFIRM_SHARED_RESTART: "" } });
    expect(blocked.status).toBe(2);
    expect(restart).toContain("docker restart -t 5");
    expect(restart).not.toMatch(/^\s*docker compose/m);
    expect(restart).toMatch(/config_checks\n\s+\[ "\$failed" = 0 \]/);
  });
});
