import { describe, it, expect, beforeEach } from "vitest";
import { GET as healthGET } from "@/app/api/health/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { GET as amanahGET, PUT as amanahPUT } from "@/app/api/amanah/route";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { resetServerRepository } from "@/lib/server/repository";

describe("API health", () => {
  beforeEach(() => {
    resetServerRepository();
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
  });

  it("returns ok status with config fields", async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.serverStorage).toBe("memory");
    expect(body.dbConfigured).toBe(false);
    expect(body.authMode).toBeDefined();
    expect(body.storageMode).toBeDefined();
  });
});

describe("API auth + amanah", () => {
  beforeEach(() => {
    resetServerRepository();
    globalThis.__amanahMemoryStore = undefined;
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
  });

  it("registers, logs in, and stores amanah data", async () => {
    const email = `api-${Date.now()}@test.de`;

    const regRes = await registerPOST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "testpass1", name: "API Test" }),
      })
    );
    expect(regRes.status).toBe(201);
    const regBody = await regRes.json();
    const token = regBody.session.token as string;

    const loginRes = await loginPOST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "testpass1" }),
      })
    );
    expect(loginRes.status).toBe(200);

    const getEmpty = await amanahGET(
      new Request("http://localhost/api/amanah", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(getEmpty.status).toBe(200);

    const putRes = await amanahPUT(
      new Request("http://localhost/api/amanah", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(demoAmanahData),
      })
    );
    expect(putRes.status).toBe(200);
    const putBody = await putRes.json();
    expect(putBody.data.userProfile.name).toBe("Ahmed Demo");

    const getRes = await amanahGET(
      new Request("http://localhost/api/amanah", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const getBody = await getRes.json();
    expect(getBody.data.userProfile.name).toBe("Ahmed Demo");
  });

  it("rejects unauthenticated amanah access", async () => {
    const res = await amanahGET(new Request("http://localhost/api/amanah"));
    expect(res.status).toBe(401);
  });
});

describe("Storage config", () => {
  it("resolveStorageProvider returns local by default", async () => {
    const { resolveStorageProvider } = await import("@/lib/storage/storage-config");
    const provider = resolveStorageProvider();
    expect(provider.constructor.name).toBe("LocalStorageProvider");
  });
});
