import { existsSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// E-mail channel of the staging alerts, tested against a local fake SMTP server with simulated
// answers (scripts/testing/fake_smtp_server.py). Nothing leaves 127.0.0.1.

const ROOT = process.cwd();
const ALERT = join(ROOT, "scripts/staging-alert.sh");
const MAILER = join(ROOT, "scripts/staging-alert-mail.py");
const FAKE = join(ROOT, "scripts/testing/fake_smtp_server.py");
const PASSWORD = "dummy-smtp-key-not-real-123";

let certDir: string;
let dir: string;
let server: ChildProcess | undefined;

type Session = { tls: boolean; auth_user: string | null; auth_pass_ok: boolean; mail_from: string | null; rcpt: string[]; data: string | null };

beforeAll(() => {
  certDir = mkdtempSync(join(tmpdir(), "amanah-smtp-cert-"));
  const res = spawnSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=127.0.0.1",
    "-addext", "subjectAltName=IP:127.0.0.1", "-keyout", join(certDir, "k.pem"), "-out", join(certDir, "c.pem"),
  ]);
  expect(res.status).toBe(0);
});

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "amanah-mail-"));
});

afterEach(() => {
  server?.kill();
  server = undefined;
});

async function startServer(behavior = "ok", tls = true): Promise<number> {
  const args = ["-I", FAKE, "--out", join(dir, "sessions.jsonl"), "--behavior", behavior, "--expect-pass", PASSWORD];
  if (tls) args.push("--cert", join(certDir, "c.pem"), "--key", join(certDir, "k.pem"));
  server = spawn("python3", args, { stdio: ["ignore", "pipe", "ignore"] });
  return new Promise((resolve, reject) => {
    server!.stdout!.once("data", (d) => resolve(Number(String(d).trim())));
    server!.once("exit", () => reject(new Error("fake smtp exited")));
  });
}

// Sessions are written when the connection closes; give the server a moment.
async function sessions(): Promise<Session[]> {
  const file = join(dir, "sessions.jsonl");
  for (let i = 0; i < 40 && !existsSync(file); i++) await new Promise((r) => setTimeout(r, 50));
  await new Promise((r) => setTimeout(r, 100));
  return existsSync(file) ? readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
}

function mailEnv(port: number, extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    PATH: process.env.PATH ?? "",
    ALERT_CONFIG: join(dir, "none.env"),
    ALERT_STATE_DIR: join(dir, "state"),
    ALERT_LOG: join(dir, "alerts.log"),
    ALERT_EXTERNAL: "true",
    ALERT_MAIL: "true",
    ALERT_SMTP_HOST: "127.0.0.1",
    ALERT_SMTP_PORT: String(port),
    ALERT_SMTP_USER: "monitoring-login",
    ALERT_SMTP_PASSWORD: PASSWORD,
    ALERT_MAIL_FROM: "monitoring@ops.invalid",
    ALERT_MAIL_TO: "owner@ops.invalid",
    ALERT_SMTP_CAFILE: join(certDir, "c.pem"),
    ALERT_SMTP_TIMEOUT: "3",
    ...extra,
  };
}

function alert(check: string, code: number, lines: string, env: NodeJS.ProcessEnv) {
  const log = join(dir, `${check}.log`);
  writeFileSync(log, lines);
  return spawnSync("bash", [ALERT, check, String(code), log], { encoding: "utf8", env, timeout: 60_000 });
}
const alertLog = () => (existsSync(join(dir, "alerts.log")) ? readFileSync(join(dir, "alerts.log"), "utf8") : "");

describe("staging alert e-mail channel", () => {
  it("sends nothing while ALERT_MAIL or ALERT_EXTERNAL is off", async () => {
    const port = await startServer();
    alert("health", 1, "FAIL status not ok\n", mailEnv(port, { ALERT_MAIL: "false" }));
    alert("backup", 1, "x\n", mailEnv(port, { ALERT_EXTERNAL: "false" }));
    expect(alertLog().match(/ALARM/g)).toHaveLength(2);
    expect(await sessions()).toEqual([]);
  });

  it("delivers alarm, reminder and all-clear over STARTTLS with neutral subjects and scrubbed content", async () => {
    const port = await startServer();
    const env = mailEnv(port);
    const res = alert("health", 1, "OK   status ok\nFAIL disk / 91% over 85%\nFAIL x user@staging.invalid token=abc123 age1" + "q".repeat(58) + "\n", env);
    expect(res.status).toBe(0);
    alert("health", 1, "FAIL disk / 92% over 85%\nFAIL x user@staging.invalid token=abc123 age1" + "q".repeat(58) + "\n", env);
    const state = join(dir, "state/health.state");
    const old = new Date(Date.now() - 25 * 3600 * 1000);
    utimesSync(state, old, old);
    alert("health", 1, "FAIL disk / 92% over 85%\nFAIL x user@staging.invalid token=abc123 age1" + "q".repeat(58) + "\n", env);
    alert("health", 0, "OK   all\n", env);

    const s = await sessions();
    expect(s).toHaveLength(3);
    for (const x of s) {
      expect(x.tls).toBe(true);
      expect(x.auth_user).toBe("monitoring-login");
      expect(x.auth_pass_ok).toBe(true);
      expect(x.mail_from).toBe("monitoring@ops.invalid");
      expect(x.rcpt).toEqual(["owner@ops.invalid"]);
    }
    const subjects = s.map((x) => x.data!.match(/^Subject: (.*)$/m)![1]);
    expect(subjects).toEqual([
      "[Monitoring] ALARM: staging / health",
      "[Monitoring] Erinnerung: staging / health",
      "[Monitoring] Entwarnung: staging / health",
    ]);
    const all = s.map((x) => x.data).join("\n");
    expect(all).toContain("FAIL disk / 91% over 85%");
    expect(all).not.toMatch(/user@staging|abc123|age1q{20}|amanah|Amanah/);
    expect(alertLog()).not.toContain(PASSWORD);
    expect(alertLog()).not.toContain("DELIVERY");
  });

  it("logs a refused login, keeps the job green, retries after the interval and clears the marker", async () => {
    let port = await startServer("auth_fail");
    let res = alert("backup", 1, "pg_dump failed\n", mailEnv(port));
    expect(res.status).toBe(0);
    expect(alertLog()).toMatch(/DELIVERY \[backup\] mail failed: auth_failed \(535\)/);
    expect(alertLog()).not.toContain(PASSWORD);
    const marker = join(dir, "state/backup.state.undelivered");
    expect(existsSync(marker)).toBe(true);

    // Within the retry interval nothing is sent again.
    alert("backup", 1, "pg_dump failed\n", mailEnv(port));
    expect((await sessions()).length).toBe(1);

    server!.kill();
    port = await startServer("ok");
    const old = new Date(Date.now() - 31 * 60 * 1000);
    utimesSync(marker, old, old);
    res = alert("backup", 1, "pg_dump failed\n", mailEnv(port));
    expect(res.status).toBe(0);
    expect(existsSync(marker)).toBe(false);
    const delivered = (await sessions()).filter((x) => x.data);
    expect(delivered).toHaveLength(1);
    expect(delivered[0].data).toMatch(/^Subject: \[Monitoring\] ALARM: staging \/ backup$/m);
    expect(delivered[0].data).toContain("backup job exited with code 1");
    expect(delivered[0].data).not.toContain("pg_dump");
  });

  it.each([
    ["rcpt_reject", "recipient_refused"],
    ["data_reject", "rejected (554)"],
    ["no_starttls", "starttls_not_supported"],
  ])("reports %s as %s without credentials", async (behavior, code) => {
    const port = await startServer(behavior);
    const res = alert("restore", 1, "FAIL restore test failed\n", mailEnv(port));
    expect(res.status).toBe(0);
    expect(alertLog()).toContain(`mail failed: ${code}`);
    expect(alertLog()).not.toContain(PASSWORD);
  });

  it("never authenticates in plain text when the server offers no STARTTLS", async () => {
    const port = await startServer("no_starttls");
    alert("security", 1, "FAIL csp missing\n", mailEnv(port));
    const s = await sessions();
    expect(s[0].auth_user).toBeNull();
    expect(s[0].data).toBeNull();
  });

  it("gives up after the timeout on a hanging server and on a closed port", async () => {
    const port = await startServer("hang");
    const started = Date.now();
    const res = alert("health", 1, "FAIL status not ok\n", mailEnv(port, { ALERT_SMTP_TIMEOUT: "2" }));
    expect(res.status).toBe(0);
    expect(Date.now() - started).toBeLessThan(15_000);
    expect(alertLog()).toContain("mail failed: timeout");
    server!.kill();
    alert("backup", 1, "x\n", mailEnv(1, {}));
    expect(alertLog()).toContain("mail failed: connection_failed");
  });

  it("skips cleanly when the configuration is missing or still a placeholder", () => {
    const env = mailEnv(2525, { ALERT_SMTP_PASSWORD: "HIER_SMTP_SCHLUESSEL_EINTRAGEN", ALERT_MAIL_TO: "" });
    const res = alert("health", 1, "FAIL status not ok\n", env);
    expect(res.status).toBe(0);
    expect(alertLog()).toMatch(/mail skipped: not configured \(ALERT_SMTP_PASSWORD, ALERT_MAIL_TO\)/);
  });

  it("refuses unencrypted SMTP to anything but loopback", () => {
    const res = spawnSync("python3", ["-I", MAILER, "--kind", "ALARM", "--check", "health"], {
      input: "FAIL x",
      encoding: "utf8",
      env: { ...mailEnv(587), ALERT_SMTP_HOST: "smtp-relay.brevo.com", ALERT_SMTP_TLS: "none" },
    });
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("ALERT_SMTP_TLS (none is only allowed towards 127.0.0.1)");
  });
});

describe("channel setup end to end (fake SMTP)", () => {
  // Mirror of /opt/amanah-staging with the channel, dispatcher and mailer scripts.
  function tree(): string {
    const root = join(dir, "srv");
    spawnSync("mkdir", ["-p", join(root, "scripts")]);
    for (const f of ["staging-alert-channel.sh", "staging-alert.sh", "staging-alert-mail.py"]) {
      spawnSync("cp", [join(ROOT, "scripts", f), join(root, "scripts", f)]);
    }
    writeFileSync(join(root, "alert.env"), "ALERT_EXTERNAL=false\n");
    return root;
  }
  const channel = (root: string, args: string[], input: string, port: number, extra: Record<string, string> = {}) =>
    spawnSync("bash", [join(root, "scripts/staging-alert-channel.sh"), ...args], {
      input,
      encoding: "utf8",
      timeout: 60_000,
      env: {
        NODE_ENV: "test",
        PATH: process.env.PATH ?? "",
        ALERT_CONFIG: join(root, "alert.env"),
        ALERT_STATE_DIR: join(dir, "state"),
        ALERT_LOG: join(dir, "alerts.log"),
        ALERT_SMTP_HOST: "127.0.0.1",
        ALERT_SMTP_PORT: String(port),
        ...extra,
      } as NodeJS.ProcessEnv,
    });

  it("mail-set sends nothing; enable sends exactly one test alarm and one all-clear", async () => {
    const port = await startServer();
    const root = tree();
    const set = channel(root, ["mail-set"], `monitoring-login\n${PASSWORD}\nmonitoring@ops.invalid\nowner@ops.invalid\n`, port);
    expect(set.status).toBe(0);
    expect(await sessions()).toEqual([]);
    // Local test only: trust the throw-away certificate of the fake server.
    writeFileSync(join(root, "alert.env"), readFileSync(join(root, "alert.env"), "utf8") + `ALERT_SMTP_CAFILE='${join(certDir, "c.pem")}'\n`);
    const en = channel(root, ["enable"], "", port);
    expect(en.status).toBe(0);
    const s = await sessions();
    expect(s.map((x) => x.data!.match(/^Subject: (.*)$/m)![1])).toEqual([
      "[Monitoring] ALARM: staging / channel-test",
      "[Monitoring] Entwarnung: staging / channel-test",
    ]);
    expect(s.every((x) => x.tls && x.auth_pass_ok)).toBe(true);
    expect(en.stdout + en.stderr + alertLog()).not.toContain(PASSWORD);
  });

  it("enable reports a failed test mail instead of claiming success", async () => {
    const port = await startServer("auth_fail");
    const root = tree();
    channel(root, ["mail-set"], `monitoring-login\n${PASSWORD}\nmonitoring@ops.invalid\nowner@ops.invalid\n`, port);
    writeFileSync(join(root, "alert.env"), readFileSync(join(root, "alert.env"), "utf8") + `ALERT_SMTP_CAFILE='${join(certDir, "c.pem")}'\n`);
    const en = channel(root, ["enable"], "", port);
    expect(en.status).toBe(1);
    expect(en.stderr).toContain("Test mail NOT delivered");
    expect(alertLog()).toContain("mail failed: auth_failed (535)");
  });
});
