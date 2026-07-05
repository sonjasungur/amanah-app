import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPasswordServer,
  verifyPasswordServer,
  hashSessionToken,
  generateSessionToken,
  normalizeEmail,
} from "@/lib/server/crypto";
import { getServerStorageMode, isDbConfigured, isPostgresStorage } from "@/lib/server/config";
import { MemoryRepository } from "@/lib/server/repository/memory-repository";
import { resetServerRepository } from "@/lib/server/repository";

describe("Server crypto", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPasswordServer("securepass123");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(await verifyPasswordServer("securepass123", hash)).toBe(true);
    expect(await verifyPasswordServer("wrong", hash)).toBe(false);
  });

  it("hashes session tokens deterministically with secret", () => {
    process.env.SESSION_SECRET = "test-secret";
    const token = "abc123";
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
  });

  it("generates unique session tokens", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
  });

  it("normalizes email", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });
});

describe("Server config", () => {
  beforeEach(() => {
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
    resetServerRepository();
  });

  it("defaults to memory storage", () => {
    expect(getServerStorageMode()).toBe("memory");
    expect(isPostgresStorage()).toBe(false);
  });

  it("selects postgres when configured", () => {
    process.env.AMANAH_SERVER_STORAGE = "postgres";
    process.env.DATABASE_URL = "postgresql://localhost/test";
    resetServerRepository();
    expect(getServerStorageMode()).toBe("postgres");
    expect(isDbConfigured()).toBe(true);
  });
});

describe("MemoryRepository", () => {
  beforeEach(() => {
    globalThis.__amanahMemoryStore = undefined;
    resetServerRepository();
  });

  const repo = new MemoryRepository();

  it("registers user and saves amanah data", async () => {
    const user = await repo.registerUser("repo@test.de", "pass1234", "Repo Test");
    expect("error" in user).toBe(false);
    if ("error" in user) return;

    const session = await repo.createSession(user.id);
    const loaded = await repo.getSessionByToken(session.token);
    expect(loaded?.userId).toBe(user.id);

    const { demoAmanahData } = await import("@/lib/domain/demo-data");
    await repo.saveAmanahData(user.id, demoAmanahData);
    const data = await repo.getAmanahData(user.id);
    expect(data?.userProfile.name).toBe("Ahmed Demo");
  });

  it("deletes session on logout", async () => {
    const user = await repo.registerUser("logout@test.de", "pass1234", "L");
    if ("error" in user) throw new Error("register failed");
    const session = await repo.createSession(user.id);
    await repo.deleteSession(session.token);
    expect(await repo.getSessionByToken(session.token)).toBeNull();
  });
});

describe("Postgres integration", () => {
  const runIntegration = process.env.DATABASE_URL && process.env.AMANAH_SERVER_STORAGE === "postgres";

  it.runIf(runIntegration)("registers and persists amanah data in postgres", async () => {
    resetServerRepository();
    const { getServerRepository } = await import("@/lib/server/repository");
    const repo = getServerRepository();
    const email = `pg-${Date.now()}@test.de`;
    const user = await repo.registerUser(email, "pass1234", "PG Test");
    expect("error" in user).toBe(false);
    if ("error" in user) return;

    const session = await repo.createSession(user.id);
    const { demoAmanahData } = await import("@/lib/domain/demo-data");
    await repo.saveAmanahData(user.id, demoAmanahData);
    const loaded = await repo.getAmanahData(user.id);
    expect(loaded?.userProfile.name).toBe("Ahmed Demo");
    expect(await repo.getSessionByToken(session.token)).not.toBeNull();
    await repo.deleteSession(session.token);
  });
});
