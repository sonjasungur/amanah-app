import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArticleActions } from "@/components/islamic-knowledge/article-actions";
import {
  KNOWLEDGE_CATALOG,
  getPublishedArticles,
  matchesQuery,
  normalizeSearchText,
  searchPreparedTopics,
  searchPublished,
  searchTerms,
} from "@/modules/islamic-knowledge";
import type { KnowledgeArticleRecord } from "@/modules/islamic-knowledge";

describe("knowledge search text", () => {
  it("treats diacritics, apostrophes, umlauts and their spellings alike", () => {
    expect(normalizeSearchText("Qurʾān")).toBe("quran");
    expect(normalizeSearchText("Qur'an")).toBe("quran");
    expect(normalizeSearchText("Vermächtnis")).toBe(normalizeSearchText("Vermaechtnis"));
    expect(normalizeSearchText("Straße")).toBe("strasse");
  });

  it("ignores filler words unless only filler remains", () => {
    expect(searchTerms("Was ist Ghusl?")).toEqual(["ghusl"]);
    expect(searchTerms("was ist")).toEqual(["was", "ist"]);
  });

  it.each([
    ["Dschanaza", "Salāt al-Janāza"],
    ["Cenaze", "Janazah und Bestattung"],
    ["Gusl", "Ghusl des Verstorbenen"],
    ["Kefen", "Kafan"],
    ["Koran", "Qurʾān 4:11"],
    ["Vermaechtnis", "Vermächtnisse und die Ein-Drittel-Regel"],
    ["Wasiyyah", "Vermächtnisse"],
  ])("finds %s in %s", (query, text) => {
    expect(matchesQuery(query, [text])).toBe(true);
  });

  it("requires every meaningful term and rejects unrelated text", () => {
    expect(matchesQuery("Koran Erbe", ["Qurʾān und Erbe"])).toBe(true);
    expect(matchesQuery("Koran Erbe", ["Qurʾān"])).toBe(false);
    expect(matchesQuery("Bestattung", ["Patientenverfügung"])).toBe(false);
    expect(matchesQuery("   ", ["irgendwas"])).toBe(false);
  });
});

describe("publication gate stays closed for search", () => {
  it("publishes nothing from the unreviewed catalog, whatever the query", () => {
    expect(getPublishedArticles()).toEqual([]);
    for (const q of ["Ghusl", "Erbe", "Wasiyya", "Koran", "Janazah"]) expect(searchPublished(q)).toEqual([]);
  });

  it("prepared topics show only titles from the area overview and never a draft sentence", () => {
    const hits = searchPreparedTopics("Gusl");
    expect(hits.map((h) => h.title)).toContain("Ghusl des Verstorbenen");
    expect(Object.keys(hits[0]).sort()).toEqual(["areaTitle", "id", "title"]);
    // A term that occurs only in draft bodies must not surface a topic.
    const draftOnlyTerm = "Editorialmarkerxyz";
    const catalog: KnowledgeArticleRecord[] = KNOWLEDGE_CATALOG.map((a) => ({ ...a, body: `${a.body} ${draftOnlyTerm}` }));
    expect(searchPreparedTopics(draftOnlyTerm, catalog)).toEqual([]);
  });
});

describe("article share actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("does not copy when the reader closes the share dialog", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new DOMException("x", "AbortError")) });
    render(<ArticleActions title="T" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("article-share"));
    });
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByTestId("article-share").textContent).toContain("Link teilen");
  });

  it("copies the link without share support and shows the link when copying fails", async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ArticleActions title="T" />);
    fireEvent.click(screen.getByTestId("article-share"));
    await waitFor(() => expect(screen.getByTestId("article-share").textContent).toContain("Link kopiert"));
    fireEvent.click(screen.getByTestId("article-share"));
    await waitFor(() => expect(screen.getByTestId("article-share-manual").textContent).toContain(window.location.href));
  });

  it("opens WhatsApp only on click, with title and link and nothing else", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ArticleActions title="Ghusl erklärt" />);
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("article-share-whatsapp"));
    const [url, target, features] = open.mock.calls[0];
    expect(String(url)).toBe(`https://wa.me/?text=${encodeURIComponent(`Ghusl erklärt\n${window.location.href}`)}`);
    expect(target).toBe("_blank");
    expect(features).toContain("noopener");
  });

  it("leaves the personal bookmark out on topic pages", () => {
    render(<ArticleActions title="T" />);
    expect(screen.queryByTestId("article-bookmark")).toBeNull();
  });

  it("is mounted on the general topic page", () => {
    expect(readFileSync("src/app/wissen/[slug]/page.tsx", "utf8")).toContain("<ArticleActions title={article.title} />");
  });
});
