import { readFileSync } from "fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArticleActions } from "@/components/islamic-knowledge/article-actions";
import { ArticlePrintSource } from "@/components/islamic-knowledge/article-print-source";
import { ReadingSizeToggle } from "@/components/islamic-knowledge/reading-size-toggle";
import { matchesQuery } from "@/modules/islamic-knowledge";

describe("reading size", () => {
  afterEach(() => {
    const button = screen.queryByTestId("article-reading-size");
    if (button?.getAttribute("aria-pressed") === "true") fireEvent.click(button);
    vi.restoreAllMocks();
  });

  it("is a labelled toggle that marks the page and is remembered in this browser", () => {
    render(<ReadingSizeToggle />);
    const button = screen.getByRole("button", { name: "Große Schrift" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    act(() => fireEvent.click(button));
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.dataset.readingSize).toBe("large");
    expect(localStorage.getItem("amanah-reading-size")).toBe("large");
    act(() => fireEvent.click(button));
    expect(document.documentElement.dataset.readingSize).toBeUndefined();
  });

  it("still works when the browser blocks storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ReadingSizeToggle />);
    const button = screen.getByTestId("article-reading-size");
    act(() => fireEvent.click(button));
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("belongs to the article actions, which never print", () => {
    render(<ArticleActions title="T" />);
    expect(screen.getByTestId("article-reading-size").closest(".no-print")).not.toBeNull();
    expect(screen.getByTestId("article-print").closest(".no-print")).not.toBeNull();
  });
});

describe("printed articles", () => {
  it("name their source and only on paper", () => {
    render(<ArticlePrintSource url="https://example.test/wissen/x" status="Version 2" />);
    const source = screen.getByTestId("article-print-source");
    expect(source.classList.contains("print-only")).toBe(true);
    expect(source.textContent).toContain("https://example.test/wissen/x");
    expect(source.textContent).toContain("Version 2");
  });

  it("use black text, keep headings with their text, show link targets, ignore the reading size", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const print = css.slice(css.indexOf("@media print"), css.indexOf('[data-reading-size="large"]'));
    expect(print).toContain("zoom: 1 !important");
    expect(print).toContain("break-after: avoid");
    expect(print).toContain('attr(href)');
    expect(print).toContain("color: #000");
  });

  it("topic pages hide navigation and calls to action on paper", () => {
    const page = readFileSync("src/app/wissen/[slug]/page.tsx", "utf8");
    expect(page).toContain('<nav className="no-print');
    expect(page).toContain('<div className="no-print">');
    expect(page).toContain("reading-content");
  });
});

describe("search words", () => {
  it("finds a text under other common words, without saying anything about rulings", () => {
    expect(matchesQuery("Beerdigung", ["Ablauf der Bestattung"])).toBe(true);
    expect(matchesQuery("Beisetzung", ["Beerdigung in Deutschland"])).toBe(true);
    expect(matchesQuery("Rückführung", ["Überführung ins Ausland"])).toBe(true);
    expect(matchesQuery("Nachlass", ["Ablauf der Bestattung"])).toBe(false);
  });
});
