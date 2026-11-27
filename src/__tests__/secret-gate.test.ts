import { spawnSync } from "child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { afterEach, describe, expect, it } from "vitest";

const REPO = process.cwd();
const dirs: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), "secret-gate-"));
  dirs.push(dir);
  return dir;
};
const executable = (path: string, body: string) => {
  writeFileSync(path, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(path, 0o755);
};
const BASH = spawnSync("bash", ["-c", "command -v bash"], { encoding: "utf8" }).stdout.trim();

/** A PATH with the basic tools and a gitleaks that behaves as told; no docker to fall back to. */
function pathWith(gitleaks: string | null) {
  const bin = scratch();
  for (const tool of ["bash", "git", "dirname", "tr", "head", "wc", "basename"]) {
    const found = spawnSync("bash", ["-c", `command -v ${tool}`], { encoding: "utf8" }).stdout.trim();
    if (found) symlinkSync(realpathSync(found), join(bin, tool));
  }
  if (gitleaks !== null) executable(join(bin, "gitleaks"), gitleaks);
  return bin;
}

const run = (script: string, args: string[], bin: string, input = "") =>
  spawnSync(BASH, [join(REPO, script), ...args], { cwd: REPO, env: { PATH: bin, HOME: tmpdir() } as unknown as NodeJS.ProcessEnv, encoding: "utf8", input });

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const FINDING = 'case "$1" in version) echo 8.24.3;; *) exit 1;; esac';
const CRASH = 'case "$1" in version) echo 8.24.3;; *) exit 134;; esac';
const CLEAN = 'case "$1" in version) echo 8.24.3;; *) exit 0;; esac';

describe("secret scan stops the flow", () => {
  it.each([
    ["--staged", FINDING, 1],
    ["--staged", CRASH, 134],
    ["--history", FINDING, 1],
    ["--all", FINDING, 1],
    ["--all", CRASH, 134],
  ])("%s fails on a finding or a broken scanner", (mode, gitleaks, status) => {
    expect(run("scripts/security/check-secrets.sh", [mode], pathWith(gitleaks)).status).toBe(status);
  });

  it("--all does not ignore a finding that only the staged part reports", () => {
    const staged = 'case "$1" in version) echo 8.24.3;; protect) [[ " $* " == *" --staged "* ]] && exit 1; exit 0;; *) exit 0;; esac';
    expect(run("scripts/security/check-secrets.sh", ["--all"], pathWith(staged)).status).toBe(1);
  });

  it("fails when no scanner is available", () => {
    expect(run("scripts/security/check-secrets.sh", ["--staged"], pathWith(null)).status).toBe(2);
  });

  it("passes only on a clean scan", () => {
    expect(run("scripts/security/check-secrets.sh", ["--staged"], pathWith(CLEAN)).status).toBe(0);
  });

  it.each([
    ["finding", FINDING, 1],
    ["broken scanner", CRASH, 134],
  ])("the push hook stops on a %s", (_name, gitleaks, status) => {
    const update = `refs/heads/a ${"1".repeat(40)} refs/heads/a ${"2".repeat(40)}\n`;
    expect(run(".githooks/pre-push", [], pathWith(gitleaks), update).status).toBe(status);
  });

  it("the push hook scans what is new, and a branch deletion needs no scan", () => {
    const log = join(scratch(), "calls");
    const logging = `case "$1" in version) echo 8.24.3;; *) echo "$*" >> ${log}; exit 0;; esac`;
    const zero = "0".repeat(40);
    const input = `refs/heads/a ${"1".repeat(40)} refs/heads/a ${"2".repeat(40)}\nrefs/heads/n ${"3".repeat(40)} refs/heads/n ${zero}\n(delete) ${zero} refs/heads/d ${"4".repeat(40)}\n`;
    expect(run(".githooks/pre-push", [], pathWith(logging), input).status).toBe(0);
    const calls = readFileSync(log, "utf8").trim().split("\n");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain(`${"2".repeat(40)}..${"1".repeat(40)}`);
    expect(calls[1]).toContain(`${"3".repeat(40)} --not --remotes`);
  });

  const realScanner = spawnSync("bash", ["-c", "command -v gitleaks"], { encoding: "utf8" }).stdout.trim();
  it.runIf(realScanner)("real scanner, real git: the commit with a token does not happen, a clean one does", () => {
    const repo = scratch();
    const git = (...args: string[]) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@test.invalid", ...args], { cwd: repo, encoding: "utf8", env: { ...process.env, GIT_CONFIG_COUNT: "0" } });
    git("init", "-q");
    for (const file of [".githooks/pre-commit", "scripts/security/check-secrets.sh", "scripts/security/check-tracked-sensitive-files.sh", ".gitleaks.toml"]) {
      mkdirSync(dirname(join(repo, file)), { recursive: true });
      cpSync(join(REPO, file), join(repo, file));
    }
    git("config", "core.hooksPath", ".githooks");
    git("add", "-A");
    expect(git("commit", "-qm", "tools").status).toBe(0);

    // Built at runtime, so that this file itself stays clean. Not a real token.
    const fake = ["ghp", "_", "Zx9", "Qw3Rt7Yu1Io5Pa8Sd2Fg6Hj0Kl4Mn7Bv3Cx1"].join("");
    writeFileSync(join(repo, "config.ts"), `export const token = "${fake}";\n`);
    git("add", "config.ts");
    const blocked = git("commit", "-qm", "with token");
    expect(blocked.status).not.toBe(0);
    expect(git("rev-list", "--count", "HEAD").stdout.trim()).toBe("1");
    expect(`${blocked.stdout}${blocked.stderr}`).not.toContain(fake);

    writeFileSync(join(repo, "config.ts"), "export const token = process.env.TOKEN;\n");
    git("add", "config.ts");
    expect(git("commit", "-qm", "clean").status).toBe(0);
  }, 60_000);
});
