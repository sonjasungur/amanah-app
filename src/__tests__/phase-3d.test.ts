import { describe, it, expect, beforeEach } from "vitest";
import { GET as healthGET } from "@/app/api/health/route";
import { DELETE as amanahDELETE, GET as amanahGET, PUT as amanahPUT } from "@/app/api/amanah/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { resetServerRepository } from "@/lib/server/repository";
import {
  sanitizeForExport,
  buildReadableEmergencyHtml,
  buildReadableEmergencyMarkdown,
} from "@/lib/export/readable-emergency-export";
import { getSkippedQuestionDetails, unskipQuestion } from "@/lib/guided-flow/flow-engine";

describe("Health endpoint extended fields", () => {
  beforeEach(() => {
    resetServerRepository();
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
  });

  it("includes knowledge and guided flow counts without secrets", async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(body.knowledgeEntriesCount).toBeGreaterThanOrEqual(10);
    expect(body.guidedFlowQuestionsCount).toBeGreaterThanOrEqual(20);
    expect(body.aiEnabled).toBeDefined();
    expect(body.aiProvider).toBeDefined();
    expect(body.storageMode).toBeDefined();
    expect(body.serverStorage).toBeDefined();
    expect(JSON.stringify(body)).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    expect(JSON.stringify(body)).not.toMatch(/password/i);
  });
});

describe("DELETE /api/amanah", () => {
  beforeEach(() => {
    resetServerRepository();
    globalThis.__amanahMemoryStore = undefined;
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
  });

  it("deletes amanah data but keeps user session valid", async () => {
    const email = `del-${Date.now()}@test.de`;
    const regRes = await registerPOST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "testpass1", name: "Delete Test" }),
      })
    );
    const { session } = await regRes.json();
    const token = session.token as string;

    await amanahPUT(
      new Request("http://localhost/api/amanah", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(demoAmanahData),
      })
    );

    const delRes = await amanahDELETE(
      new Request("http://localhost/api/amanah", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.success).toBe(true);

    const getRes = await amanahGET(
      new Request("http://localhost/api/amanah", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.userProfile.name).toBe("");
  });

  it("rejects unauthenticated delete", async () => {
    const res = await amanahDELETE(new Request("http://localhost/api/amanah", { method: "DELETE" }));
    expect(res.status).toBe(401);
  });
});

describe("Readable emergency export", () => {
  it("sanitizes sensitive keys", () => {
    const out = sanitizeForExport({
      name: "Ahmed",
      passwordHash: "secret",
      token: "abc",
      nested: { id: "x", value: "ok" },
    }) as Record<string, unknown>;
    expect(out.passwordHash).toBeUndefined();
    expect(out.token).toBeUndefined();
    expect((out.nested as Record<string, unknown>).id).toBeUndefined();
    expect((out.nested as Record<string, unknown>).value).toBe("ok");
  });

  it("builds HTML without token-like content from demo data", () => {
    const html = buildReadableEmergencyHtml(demoAmanahData);
    expect(html).toContain("Amanah Notfallmappe");
    expect(html).toContain("Orientierung und Vorbereitung");
    expect(html).not.toMatch(/passwordHash/i);
    expect(html).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
  });

  it("builds markdown with disclaimer", () => {
    const md = buildReadableEmergencyMarkdown(demoAmanahData);
    expect(md).toContain("# Amanah Notfallmappe");
    expect(md).toContain("Fachliche Prüfung");
    expect(md).not.toContain("passwordHash");
  });
});

describe("Guided flow skip retry", () => {
  it("lists skipped question details", () => {
    const skipped = getSkippedQuestionDetails(["gf-ec1-name"]);
    expect(skipped.length).toBe(1);
    expect(skipped[0].id).toBe("gf-ec1-name");
  });

  it("unskips a question id", () => {
    expect(unskipQuestion("gf-ec1-name", ["gf-ec1-name", "gf-ec1-phone"])).toEqual(["gf-ec1-phone"]);
  });
});

describe("Privacy pages metadata", () => {
  it("datenschutz and sicherheit modules exist", async () => {
    const datenschutz = await import("@/app/datenschutz/page");
    const sicherheit = await import("@/app/sicherheit/page");
    expect(datenschutz.metadata.title).toContain("Datenschutz");
    expect(sicherheit.metadata.title).toContain("Sicherheit");
  });
});

describe("Export does not leak store internals", () => {
  it("default data export has no saveStatus", () => {
    const out = sanitizeForExport({ ...defaultAmanahData, saveStatus: "saved" }) as Record<string, unknown>;
    expect(out.saveStatus).toBeUndefined();
  });
});
