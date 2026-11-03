import { spawnSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { demoAmanahData } from "@/lib/domain/demo-data";

/**
 * Runs only against a throwaway Postgres. The reference is global per database, so this file creates
 * its own database. Synthetic data only; keys are generated for the test run.
 */
const baseUrl = process.env.DATABASE_URL;
const runIntegration = Boolean(baseUrl && process.env.AMANAH_SERVER_STORAGE === "postgres");
const keyA = Buffer.alloc(32, 11).toString("base64");
const keyB = Buffer.alloc(32, 12).toString("base64");
const wrong = Buffer.alloc(32, 13).toString("base64");
const name = `keyref_${crypto.randomUUID().replace(/-/g, "")}`;

describe.runIf(runIntegration)("key reference, one database per environment", () => {
  let url = "";
  let db: pg.Client;

  const admin = async (sql: string) => {
    const client = new pg.Client({ connectionString: baseUrl });
    await client.connect();
    await client.query(sql);
    await client.end();
  };
  const useKeys = (keys: string, active: string) => {
    vi.stubEnv("AMANAH_DATA_KEYS", keys);
    vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", active);
  };
  const tool = (args: string[], keys: string, active: string, env: Record<string, string> = {}) => {
    const result = spawnSync("node", ["scripts/key-reference.mjs", ...args], {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: url, AMANAH_DATA_ENCRYPTION: "required", AMANAH_DATA_KEYS: keys, AMANAH_DATA_KEY_ACTIVE: active, AMANAH_KEY_REFERENCE_CONFIRM: "yes", ...env },
    });
    return { status: result.status, out: `${result.stdout}${result.stderr}` };
  };
  const reference = async () => JSON.stringify((await db.query("SELECT kid, data, retired_at FROM data_key_references ORDER BY kid")).rows);
  const folderRows = async () => (await db.query("SELECT count(*)::int AS n FROM amanah_data")).rows[0].n as number;
  const repository = async () => {
    const { PostgresRepository } = await import("@/lib/server/repository/postgres-repository");
    return new PostgresRepository();
  };
  const newUser = async () => {
    const repo = await repository();
    const user = await repo.registerUser(`keyref-${crypto.randomUUID()}@test.invalid`, "testpass1", "Key Ref");
    if ("error" in user) throw new Error(user.error);
    return { repo, id: user.id };
  };

  beforeAll(async () => {
    await admin(`CREATE DATABASE ${name}`);
    const parsed = new URL(baseUrl!);
    parsed.pathname = `/${name}`;
    url = parsed.toString();
    const migrated = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: url } });
    expect(migrated.status, migrated.stderr).toBe(0);
    db = new pg.Client({ connectionString: url });
    await db.connect();
    // Before the first import of the Prisma client, which reads it once.
    process.env.DATABASE_URL = url;
  }, 90_000);

  afterAll(async () => {
    const { prisma } = await import("@/lib/server/prisma");
    await prisma.$disconnect();
    await db.end();
    process.env.DATABASE_URL = baseUrl;
    await admin(`DROP DATABASE ${name} WITH (FORCE)`);
  });

  beforeEach(async () => {
    vi.stubEnv("AMANAH_KEY_REFERENCE_IN_TESTS", "true");
    vi.stubEnv("AMANAH_DATA_ENCRYPTION", "required");
    await db.query("TRUNCATE users CASCADE");
    await db.query("DELETE FROM data_key_references");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("not initialized: nothing is saved, and only the explicit command initialises", async () => {
    useKeys(`a:${keyA}`, "a");
    const { DataEncryptionError } = await import("@/lib/server/data-encryption");
    const { repo, id } = await newUser();
    expect(tool(["check"], `a:${keyA}`, "a").out).toContain("not_initialized");
    await expect(repo.saveAmanahData(id, demoAmanahData)).rejects.toBeInstanceOf(DataEncryptionError);
    expect(await folderRows()).toBe(0);
    expect(await reference()).toBe("[]");

    expect(tool(["init"], `a:${keyA}`, "a", { AMANAH_KEY_REFERENCE_CONFIRM: "" }).status).toBe(2);
    expect(await reference()).toBe("[]");
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
    expect(tool(["check"], `a:${keyA}`, "a").status).toBe(0);
    await repo.saveAmanahData(id, demoAmanahData);
    expect((await repo.getAmanahData(id))?.userProfile.name).toBe("Ahmed Demo");
  });

  it.each([
    ["wrong key under the same id", `a:${wrong}`, "a", "wrong_key"],
    ["no key", "", "", "missing_key"],
    ["other key id, the referenced one gone", `b:${keyB}`, "b", "missing_key"],
    ["broken configuration", "a:zu-kurz", "a", "invalid_config"],
  ])("empty database, %s: found before the first save, reference untouched", async (_name, keys, active, status) => {
    useKeys(`a:${keyA}`, "a");
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
    const before = await reference();
    const { repo, id } = await newUser();
    expect(await folderRows()).toBe(0);

    useKeys(keys, active);
    const check = tool(["check"], keys, active);
    expect(check.status).toBe(1);
    expect(check.out).toContain(status);
    for (const secret of [keyA, keyB, wrong]) expect(check.out).not.toContain(secret);

    const { DataEncryptionError } = await import("@/lib/server/data-encryption");
    await expect(repo.getAmanahData(id)).rejects.toBeInstanceOf(DataEncryptionError);
    await expect(repo.saveAmanahData(id, demoAmanahData)).rejects.toBeInstanceOf(DataEncryptionError);
    await expect(repo.patchAmanahData(id, { lastSaved: "x" } as never)).rejects.toBeInstanceOf(DataEncryptionError);
    expect(await folderRows()).toBe(0);

    // No command takes over: neither init nor add replaces what exists.
    if (keys) {
      expect(tool(["init"], keys, active).status).not.toBe(0);
      expect(tool(["add"], keys, active).status).not.toBe(0);
    }
    expect(await reference()).toBe(before);

    useKeys(`a:${keyA}`, "a");
    await repo.saveAmanahData(id, demoAmanahData);
    expect(await folderRows()).toBe(1);
  });

  it("a plaintext row is no longer sealed with a wrong key", async () => {
    useKeys(`a:${keyA}`, "a");
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
    const { repo, id } = await newUser();
    await db.query("INSERT INTO amanah_data (id, user_id, schema_version, data, updated_at) VALUES ($1, $2, 1, $3, now())", [crypto.randomUUID(), id, JSON.stringify({ userProfile: { name: "Alt" } })]);
    const before = JSON.stringify((await db.query("SELECT data FROM amanah_data")).rows);
    useKeys(`a:${wrong}`, "a");
    await expect(repo.saveAmanahData(id, demoAmanahData)).rejects.toThrow();
    expect(JSON.stringify((await db.query("SELECT data FROM amanah_data")).rows)).toBe(before);
  });

  it("init with data: a key that cannot open it does not become the reference", async () => {
    useKeys(`a:${keyA}`, "a");
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
    const { repo, id } = await newUser();
    await repo.saveAmanahData(id, demoAmanahData);
    await db.query("DELETE FROM data_key_references"); // as after restoring an older backup

    const refused = tool(["init"], `a:${wrong}`, "a");
    expect(refused.status).toBe(1);
    expect(refused.out).toContain("cannot be opened");
    expect(await reference()).toBe("[]");
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
  });

  it("controlled key change: add, switch, re-encrypt, retire", async () => {
    const both = `a:${keyA},b:${keyB}`;
    useKeys(`a:${keyA}`, "a");
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
    const { repo, id } = await newUser();
    await repo.saveAmanahData(id, demoAmanahData);

    // A new key without its reference is refused as active key; a wrong old key cannot add anything.
    useKeys(both, "b");
    expect(tool(["check"], both, "b").out).toContain("active_key_without_reference");
    await expect(repo.saveAmanahData(id, demoAmanahData)).rejects.toThrow();
    expect(tool(["add"], `a:${wrong},b:${keyB}`, "b").status).toBe(1);

    expect(tool(["add"], both, "b").status).toBe(0);
    expect(tool(["check"], both, "b").status).toBe(0);
    expect((await repo.getAmanahData(id))?.userProfile.name).toBe("Ahmed Demo");

    expect(tool(["retire", "a"], both, "b").out).toContain("still use this key");
    expect(tool(["retire", "b"], both, "b").out).toContain("active key");
    const rotate = spawnSync("node", ["scripts/reencrypt-amanah-data.mjs", "--apply"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: url, AMANAH_REENCRYPT_CONFIRM: "yes", AMANAH_DATA_KEYS: both, AMANAH_DATA_KEY_ACTIVE: "b" } });
    expect(rotate.status, rotate.stderr).toBe(0);
    expect(tool(["retire", "a"], both, "b").status).toBe(0);

    // The old key may leave now, and without retiring it would not have been allowed to.
    useKeys(`b:${keyB}`, "b");
    expect(tool(["check"], `b:${keyB}`, "b").status).toBe(0);
    expect((await repo.getAmanahData(id))?.userProfile.name).toBe("Ahmed Demo");
    await repo.saveAmanahData(id, demoAmanahData);
  });

  it("removing a key that was not retired stays a failure", async () => {
    const both = `a:${keyA},b:${keyB}`;
    expect(tool(["init"], `a:${keyA}`, "a").status).toBe(0);
    expect(tool(["add"], both, "a").status).toBe(0);
    const check = tool(["check"], `a:${keyA}`, "a");
    expect(check.status).toBe(1);
    expect(check.out).toContain("missing_key");
  });

  it("the application itself has no way to write a reference", () => {
    const files = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? files(path) : [path];
    });
    for (const file of [...files("src/lib"), ...files("src/app")]) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/dataKeyReference\.(create|update|upsert|delete)|data_key_references/);
    }
  });
});
