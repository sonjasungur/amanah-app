import { describe, expect, it } from "vitest";
import { parseReviewExport } from "@/components/knowledge/owner-review";
import { FULL_ARTICLES, paragraphReview, type FullArticle } from "@/modules/islamic-knowledge/full-articles";

describe("P2.6 owner review: export and re-import", () => {
  const exportFile = (checks: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
    JSON.stringify({ format: "amanah-quellenpruefung", version: 1, exportedAt: "2026-11-18T10:00:00.000Z", checks, ...extra });

  it("round-trips an export into an empty browser", () => {
    const checks = { "p25-a-erbverse#Q4:11": { checkedAt: "2026-11-18T09:00:00.000Z" }, "p25-a-erbverse#B6732": { checkedAt: "2026-11-18T09:05:00.000Z", note: "ok" } };
    const r = parseReviewExport(exportFile(checks), {});
    expect(r.ok && r.merged).toEqual(checks);
    expect(r.ok && [r.added, r.updated, r.skipped]).toEqual([2, 0, 0]);
  });

  it("never deletes, keeps the later date for the same source", () => {
    const current = { "a#Q1": { checkedAt: "2026-11-20T00:00:00.000Z" }, "a#Q2": { checkedAt: "2026-11-01T00:00:00.000Z" }, "a#Q3": { checkedAt: "2026-11-01T00:00:00.000Z" } };
    const r = parseReviewExport(exportFile({ "a#Q1": { checkedAt: "2026-11-10T00:00:00.000Z" }, "a#Q2": { checkedAt: "2026-11-15T00:00:00.000Z" } }), current);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.keys(r.merged).sort()).toEqual(["a#Q1", "a#Q2", "a#Q3"]);
    expect(r.merged["a#Q1"].checkedAt).toBe("2026-11-20T00:00:00.000Z");
    expect(r.merged["a#Q2"].checkedAt).toBe("2026-11-15T00:00:00.000Z");
    expect([r.added, r.updated]).toEqual([0, 1]);
  });

  it("accepts the first export format without a format field", () => {
    const r = parseReviewExport(JSON.stringify({ exportedAt: "x", checks: { "a#Q1": { checkedAt: "2026-11-18T00:00:00.000Z" } } }), {});
    expect(r.ok && r.added).toBe(1);
  });

  it("rejects foreign or broken files and skips invalid entries", () => {
    expect(parseReviewExport("kein json", {}).ok).toBe(false);
    expect(parseReviewExport(JSON.stringify({ hello: 1 }), {}).ok).toBe(false);
    expect(parseReviewExport(exportFile({}, { format: "etwas-anderes" }), {}).ok).toBe(false);
    expect(parseReviewExport(exportFile({}, { version: 2 }), {}).ok).toBe(false);
    const r = parseReviewExport(exportFile({ "ohne-raute": { checkedAt: "2026-11-18" }, "a#Q1": { checkedAt: "kein datum" }, "a#Q2": { checkedAt: "2026-11-18T00:00:00.000Z" } }), {});
    expect(r.ok && [r.added, r.skipped]).toEqual([1, 2]);
  });

  it("reports entries for sources that no longer exist but keeps them", () => {
    const r = parseReviewExport(exportFile({ "a#Q1": { checkedAt: "2026-11-18T00:00:00.000Z" }, "a#Q9": { checkedAt: "2026-11-18T00:00:00.000Z" } }), {}, new Set(["a#Q1"]));
    expect(r.ok && [r.added, r.unknown]).toEqual([2, 1]);
  });
});

describe("P2.6 paragraph review state", () => {
  const paragraphs = FULL_ARTICLES.flatMap((a) => a.sections.flatMap((s) => s.paragraphs.map((p) => ({ a, p }))));

  it("marks every paragraph of every draft as not checked in content", () => {
    expect(paragraphs.length).toBeGreaterThan(800);
    for (const { a, p } of paragraphs) {
      const r = paragraphReview(a, p);
      expect(r.contentChecked).toBe(false);
      expect(r.label).toMatch(/nicht fachlich/i);
    }
  });

  it("names the lowest source level for sourced paragraphs and flags unsourced statements", () => {
    const sourced = paragraphs.find(({ p }) => p.kind === "quran")!;
    expect(paragraphReview(sourced.a, sourced.p).detail).toMatch(/niedrigste Prüfstufe/);
    const unsourcedFiqh = paragraphs.find(({ p }) => p.kind === "fiqh" && !(p.refs ?? []).length);
    if (unsourcedFiqh) expect(paragraphReview(unsourcedFiqh.a, unsourcedFiqh.p).detail).toMatch(/ohne eigenen Beleg/);
  });

  it("law paragraphs need both the scholarly and the legal review", () => {
    const { a, p } = paragraphs.find(({ p }) => p.kind === "recht")!;
    const withScholar: FullArticle = { ...a, reviews: [{ kind: "scholar", reviewer: "X", reviewedAt: "2026-12-01", version: a.version }] as FullArticle["reviews"] };
    expect(paragraphReview(withScholar, p).contentChecked).toBe(false);
    const withBoth: FullArticle = { ...withScholar, reviews: [...withScholar.reviews, { kind: "legal", reviewer: "Y", reviewedAt: "2026-12-01", version: a.version }] as FullArticle["reviews"] };
    expect(paragraphReview(withBoth, p).contentChecked).toBe(true);
  });
});

describe("P2.6 Tafsir locations (Dār Ṭayba)", () => {
  const tafsir = FULL_ARTICLES.flatMap((a) => a.sources.tafsir);

  it("every Tafsir source names volume and page from the same edition and says it still needs the printed copy", () => {
    expect(tafsir.length).toBeGreaterThan(100);
    for (const t of tafsir) {
      expect(t.printLocator, t.ref).toBeDefined();
      expect(t.printLocator!.volume).toBeGreaterThanOrEqual(1);
      expect(t.printLocator!.volume).toBeLessThanOrEqual(8);
      expect(t.printLocator!.page).toBeGreaterThan(0);
      expect(t.printLocator!.digitalCopy).toMatch(/^https:\/\/shamela\.ws\/book\/8473\/\d+$/);
      expect(t.locator).toContain(`Bd. ${t.printLocator!.volume}, S. ${t.printLocator!.page}`);
      expect(t.locator).toContain("am Druckexemplar zu bestätigen");
      expect(t.edition).toContain("Dār Ṭayba");
    }
  });

  it("the same verse has the same location in every article", () => {
    const seen = new Map<string, string>();
    for (const t of tafsir) {
      const key = `${t.surah}:${t.ayah}`;
      const at = `${t.printLocator!.volume}/${t.printLocator!.page}`;
      expect(seen.get(key) ?? at, key).toBe(at);
      seen.set(key, at);
    }
  });
});
