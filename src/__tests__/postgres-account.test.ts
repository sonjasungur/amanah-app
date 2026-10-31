import { describe, expect, it } from "vitest";
import { hashSessionToken } from "@/lib/server/crypto";

/** Throwaway Postgres only (DATABASE_URL + AMANAH_SERVER_STORAGE=postgres); synthetic data. */
const runIntegration = Boolean(process.env.DATABASE_URL && process.env.AMANAH_SERVER_STORAGE === "postgres");

async function setup() {
  const { PostgresRepository } = await import("@/lib/server/repository/postgres-repository");
  const repo = new PostgresRepository();
  const user = await repo.registerUser(`pgacc-${crypto.randomUUID()}@test.invalid`, "testpass1", "PG Acc");
  if ("error" in user) throw new Error(user.error);
  return { repo, user };
}

describe.runIf(runIntegration)("Postgres: accounts, tokens and consent", () => {
  it("new users start unverified and can be verified once", async () => {
    const { repo, user } = await setup();
    expect(user.emailVerifiedAt).toBeNull();
    await repo.markEmailVerified(user.id);
    const verifiedAt = (await repo.getUserById(user.id))?.emailVerifiedAt;
    expect(verifiedAt).toBeTruthy();
    await repo.markEmailVerified(user.id);
    expect((await repo.getUserById(user.id))?.emailVerifiedAt).toBe(verifiedAt);
    expect((await repo.findUserByEmail(user.email.toUpperCase()))?.id).toBe(user.id);
    await repo.deleteUser(user.id);
  });

  it("a token can be consumed only once, even concurrently", async () => {
    const { repo, user } = await setup();
    const hash = hashSessionToken(`tok-${crypto.randomUUID()}`);
    await repo.createAuthToken(user.id, "reset_password", hash, new Date(Date.now() + 60_000));
    const results = await Promise.all([repo.consumeAuthToken(hash, "reset_password"), repo.consumeAuthToken(hash, "reset_password")]);
    expect(results.filter(Boolean)).toEqual([user.id]);
    expect(await repo.consumeAuthToken(hash, "reset_password")).toBeNull();
    await repo.deleteUser(user.id);
  });

  it("rejects expired, wrong-purpose and invalidated tokens", async () => {
    const { repo, user } = await setup();
    const expired = hashSessionToken(`e-${crypto.randomUUID()}`);
    await repo.createAuthToken(user.id, "verify_email", expired, new Date(Date.now() - 1));
    expect(await repo.consumeAuthToken(expired, "verify_email")).toBeNull();

    const other = hashSessionToken(`o-${crypto.randomUUID()}`);
    await repo.createAuthToken(user.id, "verify_email", other, new Date(Date.now() + 60_000));
    expect(await repo.consumeAuthToken(other, "reset_password")).toBeNull();
    await repo.invalidateAuthTokens(user.id, "verify_email");
    expect(await repo.consumeAuthToken(other, "verify_email")).toBeNull();
    await repo.deleteUser(user.id);
  });

  it("updatePassword revokes all sessions", async () => {
    const { repo, user } = await setup();
    const s1 = await repo.createSession(user.id);
    const s2 = await repo.createSession(user.id);
    await repo.updatePassword(user.id, "neues-passwort-1");
    expect(await repo.getSessionByToken(s1.token)).toBeNull();
    expect(await repo.getSessionByToken(s2.token)).toBeNull();
    expect(await repo.authenticateUser(user.email, "neues-passwort-1")).not.toBeNull();
    expect(await repo.authenticateUser(user.email, "testpass1")).toBeNull();
    await repo.deleteUser(user.id);
  });

  it("keeps consent history with grant and revoke times; deleteUser removes it", async () => {
    const { repo, user } = await setup();
    await repo.grantConsent(user.id, "sensitive_folder_storage", "v1");
    await repo.revokeConsent(user.id, "sensitive_folder_storage");
    await repo.grantConsent(user.id, "sensitive_folder_storage", "v2");
    const history = await repo.listConsents(user.id);
    expect(history.map((c) => [c.textVersion, Boolean(c.revokedAt)])).toEqual([["v1", true], ["v2", false]]);
    await repo.deleteUser(user.id);
    const { prisma } = await import("@/lib/server/prisma");
    expect(await prisma.consentRecord.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.authToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it("purchases: conditional transitions, idempotent events, anonymised on account deletion", async () => {
    const { repo, user } = await setup();
    const ref = `sbx_${crypto.randomUUID()}`;
    await repo.createPurchase({ userId: user.id, productId: "vorsorge_plus", provider: "sandbox", providerRef: ref, status: "pending", amountCents: 2900, currency: "EUR" });
    expect(await repo.transitionPurchase(ref, ["paid"], "refunded")).toBe(false);
    expect(await repo.transitionPurchase(ref, ["pending"], "paid")).toBe(true);
    expect((await repo.listPurchases(user.id))[0].status).toBe("paid");

    const eventId = `evt_${crypto.randomUUID()}`;
    expect(await repo.recordPaymentEvent(eventId, "sandbox", "payment_succeeded", ref)).toBe(true);
    expect(await repo.recordPaymentEvent(eventId, "sandbox", "payment_succeeded", ref)).toBe(false);

    await repo.deleteUser(user.id);
    const kept = await repo.getPurchaseByRef(ref);
    expect(kept?.userId).toBeNull();
    expect(kept?.status).toBe("paid");
  });
});

describe.runIf(runIntegration)("Postgres: confirming a legacy account", () => {
  it("the confirmation response already reports the confirmed state", async () => {
    const { POST: verifyPOST } = await import("@/app/api/auth/verify-email/route");
    const { resetServerRepository } = await import("@/lib/server/repository");
    const { prisma } = await import("@/lib/server/prisma");
    const { browserRequest } = await import("./session-helpers");
    resetServerRepository();
    const { repo, user } = await setup();
    await prisma.user.update({ where: { id: user.id }, data: { emailVerificationLegacyAt: new Date() } });
    const token = `tok-${crypto.randomUUID()}`;
    await repo.createAuthToken(user.id, "verify_email", hashSessionToken(token), new Date(Date.now() + 60_000));
    const res = await verifyPOST(
      browserRequest("http://localhost/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).session.user.emailVerification.status).toBe("verified");
    await repo.deleteUser(user.id);
  });
});
