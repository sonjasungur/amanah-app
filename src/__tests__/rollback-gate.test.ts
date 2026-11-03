import { spawnSync } from "child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = join(process.cwd(), "deploy/production/rollback-app.sh");
const dirs: string[] = [];

/**
 * A docker that answers as told and writes down what it was asked. rows: encrypted rows per count,
 * in order. capable: exit of the look into the image. keyCheck: exit of the dry run in the image.
 */
function run({ rows = ["0"], capable = 1, keyCheck = 0, args = [] as string[], imageMissing = false }) {
  const dir = mkdtempSync(join(tmpdir(), "rollback-gate-"));
  dirs.push(dir);
  const log = join(dir, "calls");
  const counts = join(dir, "counts");
  writeFileSync(counts, rows.join("\n") + "\n");
  writeFileSync(
    join(dir, "docker"),
    `#!/usr/bin/env bash
echo "$*" >> ${log}
case "$1 $2" in
  "image inspect") exit ${imageMissing ? 1 : 0} ;;
  "inspect "*) echo healthy ;;
esac
case "$1" in
  exec) head -n1 ${counts}; if [ "$(wc -l < ${counts})" -gt 1 ]; then sed -i 1d ${counts}; fi ;;
  run) exit ${capable} ;;
  compose)
    case "$*" in
      *"config --images app"*) echo target-image:1 ;;
      *" run "*) exit ${keyCheck} ;;
    esac ;;
esac
`
  );
  chmodSync(join(dir, "docker"), 0o755);
  const env = join(dir, "env");
  writeFileSync(env, "POSTGRES_USER=amanah\nPOSTGRES_DB=amanah\n");
  const result = spawnSync("bash", [SCRIPT, "--compose", "stack.yml", "--env-file", env, ...args], {
    env: { PATH: `${dir}:${process.env.PATH}`, HEALTH_TRIES: "1", HEALTH_WAIT: "0" } as unknown as NodeJS.ProcessEnv,
    encoding: "utf8",
  });
  return { status: result.status, out: result.stdout, calls: existsSync(log) ? readFileSync(log, "utf8") : "" };
}
const changed = (calls: string) => /compose .*\bup\b|\bstop\b/.test(calls);

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("rollback-app.sh", () => {
  it("encrypted rows and an image without encryption: stops before anything changes, also with --apply", () => {
    const result = run({ rows: ["3"], capable: 1, args: ["--apply"] });
    expect(result.status).toBe(1);
    expect(result.out).toContain("ABGEBROCHEN");
    expect(changed(result.calls)).toBe(false);
  });

  it("a look into the image that fails counts as not compatible", () => {
    const result = run({ rows: ["3"], capable: 125, args: ["--apply"] });
    expect(result.status).toBe(1);
    expect(changed(result.calls)).toBe(false);
  });

  it("a compatible image whose keys do not open every row: stops", () => {
    const result = run({ rows: ["3"], capable: 0, keyCheck: 1, args: ["--apply"] });
    expect(result.status).toBe(1);
    expect(result.out).toContain("Schluessel");
    expect(changed(result.calls)).toBe(false);
  });

  it.each([
    ["the count fails", { rows: ["psql: error"] }],
    ["the image is missing", { imageMissing: true }],
  ])("%s: unknown, nothing changes", (_name, scenario) => {
    const result = run({ ...scenario, args: ["--apply"] });
    expect(result.status).toBe(2);
    expect(changed(result.calls)).toBe(false);
  });

  it("without --apply it only checks", () => {
    const result = run({ rows: ["3"], capable: 0 });
    expect(result.status).toBe(0);
    expect(result.out).toContain("ERLAUBT");
    expect(changed(result.calls)).toBe(false);
  });

  it("a compatible image starts, after a second count with the app stopped", () => {
    const result = run({ rows: ["3"], capable: 0, args: ["--apply"] });
    expect(result.status).toBe(0);
    expect(result.calls).toMatch(/stop amanah-app[\s\S]*exec amanah-postgres[\s\S]*compose .*up -d --no-deps --no-build app/);
    expect(result.out).toContain("GESUND");
  });

  it("without encrypted rows the old image is allowed", () => {
    const result = run({ rows: ["0"], capable: 1, args: ["--apply"] });
    expect(result.status).toBe(0);
    expect(result.calls).toContain("up -d --no-deps --no-build app");
  });

  it("rows written between check and stop: the old app comes back, the old image does not start", () => {
    const result = run({ rows: ["0", "1"], capable: 1, args: ["--apply"] });
    expect(result.status).toBe(1);
    expect(result.calls).toContain("start amanah-app");
    expect(result.calls).not.toMatch(/compose .*\bup\b/);
  });
});

describe("the documented way", () => {
  const plan = readFileSync("docs/release/produktionsplan.md", "utf8");
  it("names only the checked command for changing the image, no bare compose up", () => {
    expect(plan).toContain("rollback-app.sh");
    const section = plan.slice(plan.indexOf("## Wiederherstellung"), plan.indexOf("## Risiken"));
    expect(section).not.toMatch(/up -d/);
  });
});
