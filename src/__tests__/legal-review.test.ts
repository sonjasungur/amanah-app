import { describe, expect, it } from "vitest";
import { ReviewDenied, STATE_LABELS, apply, can, createDraft, listForFirm, read, type Actor } from "@/lib/legal-review/workflow";

/** Synthetic actors only — no real firms or mandates. */
const user: Actor = { kind: "user", userId: "u1" };
const otherUser: Actor = { kind: "user", userId: "u2" };
const firm: Actor = { kind: "firm", firmId: "sandbox-kanzlei" };
const otherFirm: Actor = { kind: "firm", firmId: "andere-kanzlei" };
const t0 = new Date("2026-11-01T10:00:00Z");
const day = (n: number) => new Date(t0.getTime() + n * 86_400_000);

function submitted() {
  return apply(createDraft("r1", "u1", "sandbox-kanzlei", "Gesprächsunterlage v1", t0), user, "submit", { releaseConfirmed: true }, t0);
}

describe("legal review workflow", () => {
  it("runs the full path with versions, messages and audit", () => {
    let r = submitted();
    r = apply(r, firm, "accept", {}, day(1));
    r = apply(r, firm, "start_review", {}, day(1));
    r = apply(r, firm, "ask_question", { text: "Gibt es Auslandsvermögen?" }, day(2));
    r = apply(r, user, "answer_question", { text: "Ja, eine Wohnung in der Türkei." }, day(3));
    r = apply(r, firm, "provide_feedback", { text: "Unsere Rückmeldung …" }, day(4));
    r = apply(r, firm, "close", {}, day(5));
    expect(r.state).toBe("closed");
    expect(r.documents.map((d) => d.version)).toEqual([1, 2]);
    expect(r.messages.map((m) => m.author)).toEqual(["firm", "user", "firm"]);
    expect(r.audit.map((a) => a.action)).toEqual(["read", "submit", "accept", "start_review", "ask_question", "answer_question", "provide_feedback", "close"]);
    expect(r.deleteFirmCopyAfter).toBe(day(35).toISOString());
  });

  it("requires an explicit release to submit", () => {
    expect(() => apply(createDraft("r", "u1", "sandbox-kanzlei", "x", t0), user, "submit", {}, t0)).toThrow(ReviewDenied);
  });

  it("firms see only their own cases, only while released, never drafts", () => {
    const draft = createDraft("d", "u1", "sandbox-kanzlei", "x", t0);
    const r = submitted();
    expect(can(firm, "read", draft, t0)).toBe(false);
    expect(can(firm, "read", r, day(1))).toBe(true);
    expect(can(otherFirm, "read", r, day(1))).toBe(false);
    expect(can(firm, "read", r, day(61))).toBe(false);
    expect(listForFirm([draft, r], "sandbox-kanzlei", day(1)).map((x) => x.id)).toEqual(["r1"]);
    expect(listForFirm([draft, r], "andere-kanzlei", day(1))).toEqual([]);
  });

  it("withdrawal revokes the release immediately and schedules deletion of the firm copy", () => {
    const r = apply(submitted(), user, "withdraw", {}, day(1));
    expect(r.state).toBe("withdrawn");
    expect(can(firm, "read", r, day(1))).toBe(false);
    expect(r.deleteFirmCopyAfter).toBeTruthy();
  });

  it("denies wrong actors and wrong order, and audits denied reads", () => {
    const r = submitted();
    expect(() => apply(r, otherUser, "withdraw", {}, day(1))).toThrow(ReviewDenied);
    expect(() => apply(r, user, "accept", {}, day(1))).toThrow(ReviewDenied);
    expect(() => apply(r, firm, "provide_feedback", { text: "x" }, day(1))).toThrow(ReviewDenied);
    expect(() => apply(r, otherFirm, "accept", {}, day(1))).toThrow(ReviewDenied);
    const denied = read(r, otherFirm, day(1));
    expect(denied.visible).toBeNull();
    expect(denied.request.audit.at(-1)).toMatchObject({ action: "denied", actor: "firm:andere-kanzlei" });
  });

  it("never labels a state as legally valid", () => {
    expect(Object.values(STATE_LABELS).join(" ")).not.toMatch(/rechtsgültig|rechtssicher|wirksam|freigegeben/i);
  });
});
