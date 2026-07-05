import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalAuthProvider } from "@/lib/auth/local-auth-provider";
import { getAuthMode, getStorageMode } from "@/lib/auth/config";
import { hashPasswordSync } from "@/lib/auth/hash";
import {
  registerUser,
  authenticateUser,
  createSession,
  getSessionByToken,
  saveAmanahData,
  getAmanahData,
  patchAmanahData,
  getDatabaseStatus,
} from "@/lib/server/memory-store";
import { demoAmanahData } from "@/lib/domain/demo-data";

describe("Auth config", () => {
  it("defaults to local auth and storage mode", () => {
    expect(getAuthMode()).toBe("local");
    expect(getStorageMode()).toBe("local");
  });
});

describe("LocalAuthProvider", () => {
  const mockStorage = new Map<string, string>();

  beforeEach(() => {
    mockStorage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => { mockStorage.set(key, value); },
      removeItem: (key: string) => { mockStorage.delete(key); },
    });
    vi.stubGlobal("window", { localStorage });
  });

  it("registers and logs in a user", async () => {
    const provider = new LocalAuthProvider();
    const reg = await provider.register({ email: "test@example.com", password: "secret12", name: "Test" });
    expect(reg.success).toBe(true);
    expect(reg.session?.user.email).toBe("test@example.com");

    await provider.logout();
    const login = await provider.login({ email: "test@example.com", password: "secret12" });
    expect(login.success).toBe(true);
    expect(login.session?.user.name).toBe("Test");
  });

  it("rejects invalid login", async () => {
    const provider = new LocalAuthProvider();
    await provider.register({ email: "a@b.de", password: "password1", name: "A" });
    await provider.logout();
    const login = await provider.login({ email: "a@b.de", password: "wrongpass" });
    expect(login.success).toBe(false);
  });

  it("logout clears session", async () => {
    const provider = new LocalAuthProvider();
    await provider.register({ email: "x@y.de", password: "password1", name: "X" });
    await provider.logout();
    const session = await provider.getSession();
    expect(session).toBeNull();
  });
});

describe("Server memory store", () => {
  beforeEach(() => {
    globalThis.__amanahMemoryStore = undefined;
  });

  it("registers and authenticates users", async () => {
    const user = await registerUser("server@test.de", "pass1234", "Server User");
    expect("error" in user).toBe(false);
    if ("error" in user) return;

    const authed = await authenticateUser("server@test.de", "pass1234");
    expect(authed?.email).toBe("server@test.de");
    expect(hashPasswordSync("pass1234")).toBe(user.passwordHash);
  });

  it("creates and validates sessions", async () => {
    const user = await registerUser("sess@test.de", "pass1234", "S");
    if ("error" in user) throw new Error("register failed");
    const session = createSession(user.id);
    expect(getSessionByToken(session.token)?.userId).toBe(user.id);
  });

  it("saves and patches amanah data per user", async () => {
    const user = await registerUser("data@test.de", "pass1234", "D");
    if ("error" in user) throw new Error("register failed");

    saveAmanahData(user.id, demoAmanahData);
    const loaded = getAmanahData(user.id);
    expect(loaded?.userProfile.name).toBe("Ahmed Demo");

    patchAmanahData(user.id, { userProfile: { ...demoAmanahData.userProfile, name: "Patched" } });
    expect(getAmanahData(user.id)?.userProfile.name).toBe("Patched");
  });

  it("reports database status from env", () => {
    expect(getDatabaseStatus()).toBe("not_configured");
  });
});
