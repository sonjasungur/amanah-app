import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pinned = readFileSync("deploy/production/docker-compose.pinned.yml", "utf8");

/** A wrong line here would start production on an empty volume or from an old source tree. */
describe("pinned production stack", () => {
  it("cannot build and references the image by digest only", () => {
    expect(pinned).not.toMatch(/^\s+build:/m);
    expect(pinned).not.toMatch(/^\s+context:/m);
    expect(pinned).toMatch(/image: amanah-app-app@sha256:[0-9a-f]{64}\n/);
    expect(pinned).not.toMatch(/image: amanah-app-app(:|\n)/);
    expect(pinned).toContain("pull_policy: never");
  });

  it("uses the existing data volume and network, under their exact names", () => {
    expect(pinned).toMatch(/amanah_pg_prod:\n\s+name: amanah_pg_prod\n\s+external: true/);
    expect(pinned).toMatch(/amanah_internal:\n\s+name: amanah-app_amanah_internal\n\s+external: true/);
    expect(pinned).toContain("name: amanah-app\n");
  });

  it("stays local and off the gemeinsam1 network, without a migration service", () => {
    expect(pinned).toContain('"127.0.0.1:3001:3000"');
    expect(pinned).not.toMatch(/^\s+- gemeinsam1|shared_proxy|gemeinsam1-prod_internal/m);
    expect(pinned).not.toMatch(/^ {2}migrate:/m);
  });
});
