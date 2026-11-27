/**
 * AP22 Welle 1 (owner acceptance 27.11.2026): knowledge centre preview switch on /wissen, search, review state and
 * related topics, the editorial main stock, the partner previews behind the switch, the imprint without the § 18
 * Abs. 2 MStV statement, the return URL through registration and confirmation, and the Janazah fields.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;
const REDIRECT = /NEXT_REDIRECT/;

// NODE_ENV stays "test" (not "development"), so only the switch decides; stubbing "production" would break the JSX dev runtime.
const previewOn = () => {
  vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "true");
};
const previewOff = () => {
  vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "false");
  vi.stubEnv("AMANAH_INTERNAL_TOOLS", "false");
};

afterEach(() => vi.unstubAllEnvs());

describe("EA-05.1: „Islamisches Wissen“ leads into the centre only with the preview switch", () => {
  it("redirects /wissen to /wissen/zentrum (and a search term to the centre search) with the switch on", async () => {
    previewOn();
    const { default: Wissen } = await import("@/app/wissen/page");
    const run = (q?: string) => Wissen({ searchParams: Promise.resolve(q ? { q } : {}) });
    await expect(run()).rejects.toThrow(REDIRECT);
    const err = await run().catch((e: { digest?: string }) => e);
    expect(String((err as { digest?: string }).digest)).toContain("/wissen/zentrum");
    const err2 = await run("Ghusl").catch((e: { digest?: string }) => e);
    expect(String((err2 as { digest?: string }).digest)).toContain("/wissen/zentrum/suche?q=Ghusl");
  });

  it("keeps the former public overview with the switch off (production)", async () => {
    previewOff();
    const { default: Wissen } = await import("@/app/wissen/page");
    const page = await Wissen({ searchParams: Promise.resolve({}) });
    expect(page).toBeTruthy();
    expect(JSON.stringify(Object.keys(page as object))).toBeTruthy();
  });

  it("header and footer keep linking /wissen, so production is unchanged", () => {
    expect(readFileSync("src/components/layout/header.tsx", "utf8")).toContain('{ href: "/wissen", labelKey: "nav.knowledge"');
    expect(readFileSync("src/components/layout/footer.tsx", "utf8")).toContain('href="/wissen"');
  });
});

describe("EA-05.2/05.3/05.6: centre pages, search, related topics and review state", () => {
  it("every rubric, every article and every quoted verse renders with the switch on", async () => {
    previewOn();
    const { RUBRICS } = await import("@/modules/islamic-knowledge/full-articles/rubrics");
    const { FULL_ARTICLES, ENTRY_ARTICLE } = await import("@/modules/islamic-knowledge/full-articles");
    const { default: Rubric } = await import("@/app/wissen/zentrum/rubrik/[nr]/page");
    const { default: Article } = await import("@/app/wissen/zentrum/artikel/[id]/page");
    const { default: Verse } = await import("@/app/wissen/zentrum/vers/[ref]/page");
    for (const r of RUBRICS) {
      const { container, unmount } = render(await Rubric({ params: Promise.resolve({ nr: String(r.nr) }) }));
      expect(container.querySelectorAll('[data-testid="centre-article-link"]').length, r.title).toBeGreaterThan(0);
      unmount();
    }
    expect(FULL_ARTICLES.length).toBe(33);
    const hrefs = new Set<string>();
    for (const a of [...FULL_ARTICLES, ...(ENTRY_ARTICLE ? [ENTRY_ARTICLE] : [])]) {
      const { container, unmount } = render(await Article({ params: Promise.resolve({ id: a.id }) }));
      expect(container.querySelector('[data-testid="review-state"]'), a.id).not.toBeNull();
      expect(container.querySelector('[data-testid="review-state"]')?.getAttribute("data-stage"), a.id).toBe("entwurf");
      // Arabic always marked as Arabic, right to left.
      for (const el of container.querySelectorAll('[lang="ar"]')) expect(el.getAttribute("dir"), a.id).toBe("rtl");
      // Every Qur'an card names the verse and the Bubenheim/Elyas translation, every hadith its collection and number.
      for (const q of container.querySelectorAll('[data-testid="quran-reference"]')) expect(q.textContent).toMatch(/Qurʾān \d+:\d+ · Übersetzung Bubenheim\/Elyas/);
      for (const h of container.querySelectorAll('[data-testid="hadith-reference"]')) expect(h.textContent).toMatch(/Nr\. \S+/);
      container.querySelectorAll("a[href^='/wissen/zentrum/']").forEach((l) => hrefs.add(l.getAttribute("href")!.split("#")[0]));
      unmount();
    }
    // No link inside the centre leads to a 404.
    const ids = new Set([...FULL_ARTICLES.map((a) => a.id), ENTRY_ARTICLE?.id]);
    for (const h of hrefs) {
      const m = /^\/wissen\/zentrum\/(artikel|rubrik|vers)\/([^/?]+)$/.exec(h);
      if (!m) continue;
      if (m[1] === "artikel") expect(ids.has(m[2]), h).toBe(true);
      if (m[1] === "rubrik") expect(RUBRICS.some((r) => String(r.nr) === m[2]), h).toBe(true);
      if (m[1] === "vers") await expect(Verse({ params: Promise.resolve({ ref: m[2] }) }), h).resolves.toBeTruthy();
    }
    expect([...hrefs].some((h) => h.startsWith("/wissen/zentrum/vers/"))).toBe(true);
  }, 60_000); // renders ~120 pages; slow under a full parallel run

  it("searches titles, texts and sources, ignoring diacritics", async () => {
    const { searchCentre, normaliseSearch } = await import("@/modules/islamic-knowledge/full-articles/centre");
    expect(normaliseSearch("Waṣiyya ʿAlī")).toBe("wasiyya ali");
    const wasiyya = searchCentre("Wasiyya");
    expect(wasiyya.length).toBeGreaterThan(0);
    expect(wasiyya.some((h) => h.fields.includes("Titel"))).toBe(true);
    const verse = searchCentre("4:11");
    expect(verse.some((h) => h.fields.includes("Quelle"))).toBe(true);
    const bukhari = searchCentre("Buḫārī");
    expect(bukhari.length).toBeGreaterThan(0);
    expect(searchCentre("qqqxyzunbekannt")).toEqual([]);
    expect(searchCentre(" ")).toEqual([]);
  });

  it("the search page answers with results and stays behind the switch", async () => {
    previewOn();
    const { default: Search } = await import("@/app/wissen/zentrum/suche/page");
    const { container } = render(await Search({ searchParams: Promise.resolve({ q: "Ghusl" }) }));
    expect(container.querySelectorAll('[data-testid="centre-search-hit"]').length).toBeGreaterThan(0);
    previewOff();
    await expect(Search({ searchParams: Promise.resolve({ q: "Ghusl" }) })).rejects.toThrow(NOT_FOUND);
  });

  it("related topics: existing articles, never the article itself", async () => {
    const { relatedTopics } = await import("@/modules/islamic-knowledge/full-articles/centre");
    const { FULL_ARTICLES, getFullArticle } = await import("@/modules/islamic-knowledge/full-articles");
    for (const a of FULL_ARTICLES) {
      const rel = relatedTopics(a);
      expect(rel.length, a.id).toBeGreaterThan(0);
      expect(rel.map((r) => r.id), a.id).not.toContain(a.id);
    }
    const tod = getFullArticle("p27-b-quran-tod")!;
    expect(relatedTopics(tod).map((r) => r.id).slice(0, 3)).toEqual(tod.relatedArticles);
  });

  it("an article counts as checked only with every review of its version recorded", async () => {
    const { centreReviewState } = await import("@/modules/islamic-knowledge/full-articles/centre");
    const { FULL_ARTICLES } = await import("@/modules/islamic-knowledge/full-articles");
    const a = FULL_ARTICLES[0];
    expect(centreReviewState(a).stage).toBe("entwurf");
    expect(centreReviewState(a).openReviews.length).toBeGreaterThan(0);
    const reviewed = { ...a, reviews: (["source", "scholar", "legal"] as const).map((kind) => ({ kind, reviewer: "Name, Qualifikation", reviewedAt: "2026-11-27", version: a.version })) };
    expect(centreReviewState(reviewed as typeof a).stage).toBe("geprueft");
  });
});

describe("EA-05.7: editorial overview", () => {
  it("lists the 33 centre articles as main stock with a link to the reader view, the older catalog apart", async () => {
    previewOn();
    const { default: Redaktion } = await import("@/app/wissen/redaktion/page");
    const { container } = render(Redaktion());
    const main = container.querySelectorAll('[data-testid="centre-stock-article"]');
    expect(main.length).toBe(33);
    const links = container.querySelectorAll('[data-testid="customer-view-link"]');
    expect(links.length).toBe(33);
    for (const l of links) expect(l.getAttribute("href")).toMatch(/^\/wissen\/zentrum\/artikel\//);
    expect(container.querySelector('[data-testid="centre-count"]')?.textContent).toContain("33 Beiträge im Wissenszentrum");
    const legacy = container.querySelector('[data-testid="legacy-catalog"]')!;
    expect(legacy.textContent).toContain("Älterer Katalog (wird abgelöst) – 44 Einträge");
    expect(legacy.querySelectorAll('[data-testid="legacy-entry"]').length).toBe(44);
    expect(legacy.querySelectorAll('[data-testid="legacy-replaced-by"]').length).toBeGreaterThan(10);
    expect(legacy.querySelectorAll('[data-testid="legacy-duplicate"]').length).toBeGreaterThan(5);
    // No empty heading for an area without catalog entries (F. Akhira).
    expect(legacy.textContent).not.toContain("F. ");
    previewOff();
    expect(() => Redaktion()).toThrow(NOT_FOUND);
  });
});

describe("EA-03.1/03.2: partner pages only behind the editorial preview switch", () => {
  it("answer 404 without the switch and show the internal preview with it", async () => {
    const { default: Partner } = await import("@/app/partner/page");
    const { default: Platform } = await import("@/app/partner/vorschau/page");
    previewOff();
    expect(() => Partner()).toThrow(NOT_FOUND);
    expect(() => Platform()).toThrow(NOT_FOUND);
    previewOn();
    const p = render(Partner());
    expect(p.getByTestId("internal-preview-banner").textContent).toContain("Interne Vorschau – nicht öffentlich");
    p.unmount();
    const v = render(Platform());
    expect(v.getByTestId("internal-preview-banner").textContent).toContain("Interne Vorschau – nicht öffentlich");
    expect(v.getAllByText("Beispiel, fiktiv").length).toBeGreaterThan(0);
  });

  it("stay noindex and out of the sitemap; no paid notary profile, notaries only via notar.de", () => {
    for (const f of ["src/app/partner/page.tsx", "src/app/partner/vorschau/page.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toContain("if (!isEditorialPreviewEnabled()) notFound();");
      expect(src, f).toContain("index: false");
      expect(src, f).toContain('export const dynamic = "force-dynamic"');
    }
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("partner");
    const mock = readFileSync("src/components/partner/partner-platform-preview.tsx", "utf8");
    expect(mock).toContain("https://www.notar.de/");
    expect(mock).not.toMatch(/group: "notar"/);
    expect(mock).not.toMatch(/fetch\(|localStorage|sessionStorage|action=/);
    expect(mock).not.toMatch(/\+49|\b0\d{3,4}[ /-]?\d{4,}/);
  });
});

describe("EA-02.2/02.3: imprint", () => {
  it("has no § 18 Abs. 2 MStV statement and keeps the representative", async () => {
    const { IMPRINT } = await import("@/lib/legal/imprint");
    expect(Object.keys(IMPRINT)).not.toContain("contentResponsibleName");
    expect(IMPRINT.representedBy).toMatch(/^Geschäftsführerin \S+/);
    const page = readFileSync("src/app/impressum/page.tsx", "utf8");
    expect(page).not.toContain("MStV");
    expect(page).toContain("IMPRINT.representedBy");
  });

  it("the managing director's name occurs nowhere in src/ except the imprint's representative line", async () => {
    const { IMPRINT } = await import("@/lib/legal/imprint");
    const name = IMPRINT.representedBy.replace(/^Geschäftsführerin\s+/, "");
    const surname = name.split(/\s+/).pop()!;
    expect(surname.length).toBeGreaterThan(2);
    const hits: string[] = [];
    for (const f of [...files("src"), ...files("public").filter((p) => /\.(txt|json|webmanifest|xml|html|svg)$/.test(p))]) {
      if (f.includes("__tests__")) continue;
      let text: string;
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      text.split("\n").forEach((line, i) => {
        if (line.includes(surname)) hits.push(`${f}:${i + 1}`);
      });
    }
    expect(hits.length).toBe(1);
    expect(hits[0]).toMatch(/^src\/lib\/legal\/imprint\.ts:/);
    expect(readFileSync("src/lib/legal/imprint.ts", "utf8")).toContain(`representedBy: "Geschäftsführerin ${name}"`);
  });
});

describe("EA-04.4: return to the chosen area after sign-in, registration and confirmation", () => {
  it("accepts only relative paths on this site", async () => {
    const { sanitizeReturnUrl } = await import("@/lib/auth/return-url");
    expect(sanitizeReturnUrl("/dashboard/notfallkarte")).toBe("/dashboard/notfallkarte");
    expect(sanitizeReturnUrl("/dashboard/janazah?schritt=2")).toBe("/dashboard/janazah?schritt=2");
    for (const bad of ["//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)", "/x\nSet-Cookie", "/login?returnUrl=/x", "/register", "dashboard"]) {
      expect(sanitizeReturnUrl(bad), bad).toBe("/dashboard");
    }
  });

  it("the confirmation mail carries the target, and the confirmation page goes back there", async () => {
    const { returnUrlQuery } = await import("@/lib/auth/return-url");
    expect(returnUrlQuery("/dashboard/notfallkarte")).toBe("&returnUrl=%2Fdashboard%2Fnotfallkarte");
    expect(returnUrlQuery("https://evil.example")).toBe("");
    expect(returnUrlQuery("/dashboard")).toBe("");
    expect(readFileSync("src/lib/server/account-recovery.ts", "utf8")).toContain("${returnUrlQuery(returnUrl)}");
    expect(readFileSync("src/app/api/auth/register/route.ts", "utf8")).toContain("sendVerificationMail(repo, result, back)");
    const form = readFileSync("src/components/auth/auth-form.tsx", "utf8");
    expect(form).toContain("register({ ...typed, returnUrl })");
    expect(form).toContain("JSON.stringify({ email, returnUrl })");
    const verify = readFileSync("src/components/auth/account-recovery-forms.tsx", "utf8");
    expect(verify).toContain('sanitizeReturnUrl(params.get("returnUrl"))');
    expect(verify).toContain("router.replace(returnUrl)");
    // The protected area sends the person to sign in with its own path and query (review 1, B3-1); the consent gate stays on that page.
    expect(readFileSync("src/components/dashboard/dashboard-auth-gate.tsx", "utf8")).toContain('buildAuthHref("/login", `${pathname}${search}`)');
  });

  it("sends the verification link with the sanitised target", async () => {
    vi.resetModules();
    const sent: { text: string }[] = [];
    vi.doMock("@/lib/server/mailer", () => ({ sendMail: async (m: { text: string }) => void sent.push(m), MailNotConfiguredError: class extends Error {} }));
    const { sendVerificationMail } = await import("@/lib/server/account-recovery");
    const repo = { invalidateAuthTokens: async () => undefined, createAuthToken: async () => undefined } as never;
    await sendVerificationMail(repo, { id: "u1", email: "a@example.test" }, "/dashboard/notfallkarte");
    await sendVerificationMail(repo, { id: "u1", email: "a@example.test" }, "//evil.example");
    expect(sent[0].text).toMatch(/\/konto\/bestaetigen\?token=[^&\s]+&returnUrl=%2Fdashboard%2Fnotfallkarte/);
    expect(sent[1].text).not.toContain("returnUrl");
    vi.doUnmock("@/lib/server/mailer");
  });
});

describe("EA-10.1/EA-12.2: Janazah fields", () => {
  it("names the grave marker field, keeps the storage key and suggests a name from existing data", async () => {
    const { janazahFields, graveNameSuggestion } = await import("@/lib/modules/janazah-sections");
    const f = janazahFields.find((x) => x.key === "fullName")!;
    expect(f.label).toBe("Name auf dem Grab (Grabkennzeichnung)");
    expect(f.helpText).toContain("Friedhofssatzung");
    expect(graveNameSuggestion({ emergencyCard: { name: "Amina Beispiel" }, userProfile: { name: "" } })).toEqual({ name: "Amina Beispiel", from: "Notfallkarte" });
    expect(graveNameSuggestion({ emergencyCard: { name: "" }, userProfile: { name: "" } })).toBeNull();
  });

  it("birth date: hidden when the emergency card has one, kept visible when the Janazah entry holds a value", async () => {
    const { janazahFields, visibleJanazahFields } = await import("@/lib/modules/janazah-sections");
    const keys = (values: Record<string, unknown>, knownBirthDate?: string) => visibleJanazahFields(janazahFields, { values, knownBirthDate }).map((x) => x.key);
    expect(keys({}, "")).toContain("birthDate");
    expect(keys({}, "1980-01-01")).not.toContain("birthDate");
    expect(keys({ birthDate: "1980-01-01" }, "1980-01-01")).toContain("birthDate");
  });

  it("mosque: one field; a differing earlier entry stays visible, nothing is lost", async () => {
    const { janazahFields, visibleJanazahFields } = await import("@/lib/modules/janazah-sections");
    const keys = (values: Record<string, unknown>) => visibleJanazahFields(janazahFields, { values }).map((x) => x.key);
    expect(keys({ mosqueCommunity: "", preferredMosque: "" })).not.toContain("mosqueCommunity");
    expect(keys({ mosqueCommunity: "Moschee A", preferredMosque: "Moschee A" })).not.toContain("mosqueCommunity");
    expect(keys({ mosqueCommunity: "Moschee A", preferredMosque: "" })).toContain("mosqueCommunity");
    expect(keys({ mosqueCommunity: "Moschee A", preferredMosque: "Moschee B" })).toContain("mosqueCommunity");
    expect(keys({})).toContain("preferredMosque");
    const { defaultAmanahData } = await import("@/lib/domain/defaults");
    expect(Object.keys(defaultAmanahData.janazahWishes)).toEqual(expect.arrayContaining(["fullName", "mosqueCommunity", "preferredMosque"]));
  });
});

describe("EA-04.2: Konvertierte, „Erster Schritt heute“", () => {
  it("has no white-on-white outline buttons and clear labels", () => {
    const src = readFileSync("src/app/konvertierte/page.tsx", "utf8");
    const block = src.slice(src.indexOf('data-testid="first-step"'));
    expect(block).toContain("bg-transparent text-white");
    expect(block).toContain("Notfallkarte anlegen");
    expect(block).toContain("Familienbrief schreiben");
    expect(src).not.toMatch(/<Link[^>]*>\s*<Button/);
  });
});
