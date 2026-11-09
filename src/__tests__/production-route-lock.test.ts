import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const active = (text: string) => text.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#")).join("\n");

function sandbox(dockerBody = "") {
  const dir = mkdtempSync(join(tmpdir(), "route-lock-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const log = join(dir, "docker.log");
  writeFileSync(join(bin, "docker"), `#!/usr/bin/env bash\necho "$*" >> "${log}"\n${dockerBody}\n`);
  chmodSync(join(bin, "docker"), 0o755);
  return { dir, log, path: `${bin}:${process.env.PATH}`, calls: () => (existsSync(log) ? readFileSync(log, "utf8") : "") };
}

describe("the old shared proxy installer", () => {
  const source = active(readFileSync("scripts/install-shared-caddy.sh", "utf8"));

  it.each([
    ["no arguments", [], {}],
    ["the former release variable", [], { AMANAH_PRODUCTION_ROUTE_RELEASED: "yes" }],
    ["arguments that look like a switch", ["--force", "--release", "yes"], { CONFIRM: "yes", FORCE: "1" }],
  ])("refuses with %s and touches nothing", (_label, args, env) => {
    const box = sandbox();
    const gem = join(box.dir, "gem", "deploy");
    const app = join(box.dir, "app", "deploy");
    mkdirSync(gem, { recursive: true });
    mkdirSync(app, { recursive: true });
    const caddyfile = join(gem, "Caddyfile");
    writeFileSync(caddyfile, "gemeinsam1.com {\n}\n");
    writeFileSync(join(app, "Caddyfile.shared-snippet"), "route.example {\n}\n");

    const run = spawnSync("bash", ["scripts/install-shared-caddy.sh", ...(args as string[])], {
      encoding: "utf8",
      env: { ...process.env, ...env, PATH: box.path, GEM_ROOT: join(box.dir, "gem"), AMANAH_ROOT: join(box.dir, "app") },
    });

    expect(run.status).toBe(1);
    expect(run.stderr).toContain("GESPERRT");
    expect(box.calls()).toBe("");
    expect(readFileSync(caddyfile, "utf8")).toBe("gemeinsam1.com {\n}\n");
    expect(readdirSync(gem)).toEqual(["Caddyfile"]);
  });

  it("has no code path that could write, reload or be switched on", () => {
    expect(source).toMatch(/^exit 1$/m);
    expect(source).not.toMatch(/docker|caddy +reload|>>|\bcp\b|\bif\b|\[\[|\$\{?[A-Z_0-9@*]/);
  });
});

describe("the shared proxy snippet", () => {
  it("holds nothing a proxy could load", () => {
    const snippet = readFileSync("deploy/Caddyfile.shared-snippet", "utf8");
    expect(active(snippet)).toBe("");
    expect(snippet).not.toMatch(/reverse_proxy|amanahordner|amanah-app:3000/);
  });
});

describe("the shared-server deployment", () => {
  const overlay = active(readFileSync("docker-compose.prod.nocaddy.yml", "utf8"));
  const deploy = readFileSync("scripts/deploy-shared-server.sh", "utf8");

  it("keeps the app off the shared proxy network and off public ports", () => {
    expect(overlay).not.toMatch(/networks:|shared_proxy|gemeinsam1|SHARED_PROXY_NETWORK|external:/);
    const ports = overlay.match(/^\s+- "[^"]+"/gm) ?? [];
    expect(ports).toEqual(['      - "127.0.0.1:3001:3000"']);
  });

  it("no longer points at a public route", () => {
    expect(deploy).not.toMatch(/shared-snippet|install-shared-caddy|network connect/);
  });

  it("leaves the pinned production container alone", () => {
    const box = sandbox(`[[ "$1" == inspect ]] && echo /opt/amanah-prod/docker-compose.pinned.yml\nexit 0`);
    const run = spawnSync("bash", ["scripts/deploy-shared-server.sh"], { encoding: "utf8", env: { ...process.env, PATH: box.path } });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("GESPERRT");
    expect(box.calls()).not.toMatch(/^compose/m);
  });

  it.each([
    ["the proxy network", "networks:\n  shared_proxy:\n    name: gemeinsam1-prod_internal"],
    ["a public port", '    ports:\n      - published: "443"'],
  ])("stops before any change when the resolved configuration has %s", (_label, config) => {
    const box = sandbox(`[[ "$*" == *" config"* ]] && printf '%s\\n' '${config.replace(/\n/g, "' '")}'\nexit 0`);
    const env = join(box.dir, "env");
    writeFileSync(env, "");
    const run = spawnSync("bash", ["scripts/deploy-shared-server.sh"], { encoding: "utf8", env: { ...process.env, PATH: box.path, ENV_FILE: env } });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("GESPERRT");
    expect(box.calls()).not.toMatch(/\bup\b/);
  });
});
