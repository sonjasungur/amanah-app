import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { accept, accessWithLog, canAccess, confirmSensitive, createGrant, describeGrant, invite, revoke, MIN_WAITING_HOURS } from "@/lib/access/emergency-access";

const T0 = new Date("2026-11-18T10:00:00Z");
const later = (h: number) => new Date(T0.getTime() + h * 3_600_000);
const grantee = { id: "acc-yusuf", emailVerified: true, secondFactor: true };
const base = () => createGrant({ id: "g1", ownerId: "acc-amina", granteeName: "Yusuf", areas: ["notfallkarte", "gesundheit"], mode: "sofort", now: T0 });
const active = () => accept(invite(base(), true, T0), grantee, T0);

describe("P2.4 emergency access prototype", () => {
  it("is never active by itself: draft → owner invites → person accepts with a verified account and second factor", () => {
    const g = base();
    expect(g.status).toBe("entwurf");
    expect(canAccess(g, "acc-yusuf", "notfallkarte", T0).allowed).toBe(false);
    expect(invite(g, false, T0).status).toBe("entwurf");
    const invited = invite(g, true, T0);
    expect(canAccess(invited, "acc-yusuf", "notfallkarte", T0).allowed).toBe(false);
    expect(accept(invited, { ...grantee, secondFactor: false }, T0).status).toBe("eingeladen");
    expect(accept(invited, { ...grantee, emailVerified: false }, T0).status).toBe("eingeladen");
    expect(accept(invited, { id: "acc-amina", emailVerified: true, secondFactor: true }, T0).status).toBe("eingeladen");
    expect(active().status).toBe("aktiv");
  });

  it("separates areas and keeps health closed until it is confirmed on its own", () => {
    const g = active();
    expect(canAccess(g, "acc-yusuf", "notfallkarte", T0).allowed).toBe(true);
    expect(canAccess(g, "acc-yusuf", "janazah", T0).reason).toBe("Bereich nicht freigegeben.");
    expect(canAccess(g, "acc-yusuf", "gesundheit", T0).reason).toBe("Sensibler Bereich nicht gesondert bestätigt.");
    expect(canAccess(confirmSensitive(g, "gesundheit"), "acc-yusuf", "gesundheit", T0).allowed).toBe(true);
    expect(canAccess(g, "acc-fremd", "notfallkarte", T0).reason).toBe("Nicht die freigegebene Person.");
  });

  it("revoking and expiry end access at once", () => {
    expect(canAccess(revoke(active(), later(1)), "acc-yusuf", "notfallkarte", later(1)).allowed).toBe(false);
    const expiring = accept(invite(createGrant({ id: "g2", ownerId: "acc-amina", granteeName: "Yusuf", areas: ["notfallkarte"], mode: "sofort", now: T0, expiresAt: later(2).toISOString() }), true, T0), grantee, T0);
    expect(canAccess(expiring, "acc-yusuf", "notfallkarte", later(1)).allowed).toBe(true);
    expect(canAccess(expiring, "acc-yusuf", "notfallkarte", later(3)).reason).toBe("Freigabe ist abgelaufen.");
  });

  it("'after emergency request' opens only after the waiting period, and the owner's objection stops it", () => {
    const g = accept(invite(createGrant({ id: "g3", ownerId: "acc-amina", granteeName: "Yusuf", areas: ["janazah"], mode: "nach_notfallanfrage", now: T0, waitingHours: 1 }), true, T0), grantee, T0);
    expect(g.waitingHours).toBe(MIN_WAITING_HOURS);
    const request = { grantId: "g3", requestedAt: T0.toISOString() };
    expect(canAccess(g, "acc-yusuf", "janazah", later(1)).allowed).toBe(false);
    expect(canAccess(g, "acc-yusuf", "janazah", later(23), request).allowed).toBe(false);
    expect(canAccess(g, "acc-yusuf", "janazah", later(25), request).allowed).toBe(true);
    expect(canAccess(g, "acc-yusuf", "janazah", later(25), { ...request, objectedAt: later(2).toISOString() }).allowed).toBe(false);
  });

  it("logs every attempt without content", () => {
    let log = accessWithLog([], active(), "acc-yusuf", "notfallkarte", T0).log;
    log = accessWithLog(log, active(), "acc-fremd", "gesundheit", T0).log;
    expect(log.map((e) => [e.actorAccountId, e.area, e.allowed])).toEqual([["acc-yusuf", "notfallkarte", true], ["acc-fremd", "gesundheit", false]]);
    expect(Object.keys(log[0]).sort()).toEqual(["actorAccountId", "allowed", "area", "at", "grantId", "reason"]);
  });

  it("describes the state in plain words", () => {
    expect(describeGrant(base(), T0)).toContain("kein Zugriff");
    expect(describeGrant(active(), T0)).toContain("Gesundheitsangaben (noch nicht bestätigt)");
  });

  it("stays a prototype: nothing outside the module and its test uses it, and it has no links or QR codes", () => {
    const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
    const users = walk("src").filter((f) => !f.includes("__tests__") && !f.endsWith("emergency-access.ts") && readFileSync(f, "utf8").includes("access/emergency-access"));
    expect(users).toEqual([]);
    expect(readFileSync("src/lib/access/emergency-access.ts", "utf8")).not.toMatch(/https?:\/\/|qrcode|token=/i);
  });
});
