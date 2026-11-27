/**
 * staging-https.sh password (owner 24.11.2026): the owner sets a short staging password herself.
 * After the incident of 24.11.2026 a test run must never reach the shared Caddy.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SCRIPT = "scripts/staging-https.sh";
const run = (env: Record<string, string | undefined>) =>
  spawnSync("bash", [SCRIPT, "password"], {
    input: "w\nkurz12\nkurz12\n",
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", ...env } as unknown as NodeJS.ProcessEnv,
  });

describe("staging-https.sh password", () => {
  it("refuses a test run that would use the shared Caddy, before doing anything", () => {
    for (const env of [{ CADDYFILE: "/nonexistent/test.Caddyfile" }, { PASSWORD_CHECK_BASE: "https://x.invalid" }, { CADDY: "pwtest", CADDYFILE: "/nonexistent/test.Caddyfile" }]) {
      const r = run(env);
      expect(r.status, JSON.stringify(env)).toBe(1);
      expect(r.stderr).toContain("Testlauf gegen den gemeinsamen Caddy abgelehnt");
    }
  });

  it("only changes the user line inside the staging block, validates first and rolls back on failure", () => {
    const s = readFileSync(SCRIPT, "utf8");
    expect(s).toContain('CADDY="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"');
    expect(s).toMatch(/grep -c '\^\[<>\]'\)" = 2 \]/);
    expect(s).toContain("caddy validate --adapter caddyfile --config /tmp/Caddyfile.new");
    expect(s).toContain('undo; echo "FAIL Pruefung, altes Passwort gilt weiter"');
    expect(s).not.toMatch(/echo[^\n]*\$P1/);
  });
});
