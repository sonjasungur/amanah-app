/**
 * Owner decisions of 27.11.2026: emergency card, simple asset overview, family conversation, knowledge centre
 * and Vorsorge-Check stay free for private customers and are never content of a paid package; no promise of
 * legal accompaniment "bis zur Beurkundung" / "bis zum Notar"; Premium keeps its name, no all-inclusive offer;
 * the FAQ on inheritance shares matches the planned orientation comparison in Wasiyya Komplett.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { planFeature } from "@/lib/billing/plan-matrix";
import {
  START_BASIS,
  START_KOMPLETT_PLANNED,
  START_PLUS_PLANNED,
  START_PREMIUM_PLANNED,
  START_PREMIUM_SUMMARY,
} from "@/lib/billing/start-offer";
import { TOPIC_IMAGES } from "@/lib/content/topic-images";

const read = (p: string) => readFileSync(p, "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe("package statements (owner 27.11.2026)", () => {
  it("Basis names emergency card, simple asset overview and family conversation, each backed by a free plan feature", () => {
    const titles = START_BASIS.map((i) => i.title).join(" | ");
    expect(titles).toContain("Notfallkarte");
    expect(titles).toContain("Vermögensübersicht");
    expect(titles).toContain("Familiengespräch");
    for (const id of ["vorsorge_start", "asset_overview", "family_conversation_record"]) {
      expect(START_BASIS.some((i) => i.features.includes(id)), id).toBe(true);
      expect(planFeature(id)?.tier, id).toBe("free");
    }
  });

  it("no paid package lists a free service as its content", () => {
    const paid = [...START_PLUS_PLANNED, ...START_KOMPLETT_PLANNED, ...START_PREMIUM_PLANNED, START_PREMIUM_SUMMARY].join(" ");
    expect(paid).not.toMatch(/Notfallkarte|Vermögensübersicht|Familiengespräch|Vorsorge-Check|Wissenszentrum/);
    expect(START_PLUS_PLANNED[0]).toContain("vollständiger Vorsorgeordner");
  });

  it("Premium promises no legal accompaniment, appointments or cost takeover and announces no all-inclusive offer", () => {
    const premium = [...START_PREMIUM_PLANNED, START_PREMIUM_SUMMARY].join(" ");
    expect(premium).toContain("Umfang nach rechtlicher Prüfung");
    expect(premium).toContain("Persönliche Rechtshandlungen nimmst du selbst vor");
    expect(premium).not.toMatch(/Begleitung|Beurkundung|Termine? vereinbar|Notar suchen|Kosten übernehm|Gesamtkosten/i);
    for (const file of ["src/app/preise/page.tsx", "src/app/page.tsx"]) {
      const src = read(file);
      expect(src, file).toContain("Premium – Rundum-sorglos");
      expect(src, file).toContain("START_PREMIUM_SUMMARY");
      expect(src, file).toContain("Später · individuell");
      expect(src, file).not.toMatch(/all[- ]inclusive/i);
    }
  });

  it("no page or library text promises accompaniment up to the notarisation or the notary", () => {
    const offenders = [...sourceFiles("src/app"), ...sourceFiles("src/lib")].filter((f) =>
      /bis zur Beurkundung|Begleitet bis zum Notar|Vorsorge Plus ist in Vorbereitung/.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("the FAQ keeps binding inheritance design with lawyer or notary and announces the comparison only as orientation", () => {
    const preise = read("src/app/preise/page.tsx");
    expect(preise).not.toContain("die Berechnung von Erbanteilen gehören zu Anwalt");
    expect(preise).toContain("Gegenüberstellung islamischer und deutscher Erbquoten zur Orientierung");
    expect(preise).toContain("rechtsverbindliche Gestaltung bleiben bei Anwalt oder Notar");
    expect(START_KOMPLETT_PLANNED.join(" ")).toMatch(/Später: Gegenüberstellung islamischer und deutscher Erbquoten.*nicht rechtsverbindlich/);
    expect(preise).toContain("Familiengespräch");
  });

  it("dashboard hints name the package Wasiyya Vorsorge, not Vorsorge Plus", () => {
    for (const file of ["src/components/billing/plus-area-notice.tsx", "src/app/dashboard/familiengespraech/page.tsx", "src/app/dashboard/pdf/page.tsx", "src/lib/seo/public-pages.ts"]) {
      const src = read(file);
      expect(src.replace(/^\s*(\*|\/\/).*$/gm, ""), file).not.toContain("Vorsorge Plus");
    }
  });
});

describe("page images (owner 27.11.2026)", () => {
  it("/konvertierte shows the lanterns and /janazah-kompass the path with cypresses; other pages keep their images", () => {
    expect(TOPIC_IMAGES.konvertierte).toEqual({ src: "/images/wasiyya/konvertierte.jpg", alt: "Goldene Laternen in der Nacht – Licht und Gemeinschaft" });
    expect(TOPIC_IMAGES.janazahKompass).toEqual({ src: "/images/wasiyya/janazah-kompass.jpg", alt: "Weg mit Zypressen ins Abendlicht" });
    for (const img of [TOPIC_IMAGES.konvertierte, TOPIC_IMAGES.janazahKompass]) expect(existsSync(`public${img.src}`)).toBe(true);
    expect(read("src/app/konvertierte/page.tsx")).toContain('image="konvertierte"');
    expect(read("src/app/janazah-kompass/page.tsx")).toContain('image="janazahKompass"');
    expect(TOPIC_IMAGES.janazah.src).toBe("/images/wasiyya/janazah.jpg");
    expect(TOPIC_IMAGES.testament.src).toBe("/images/wasiyya/testament.jpg");
    expect(read("src/app/bestatter/page.tsx")).not.toMatch(/image="(konvertierte|janazahKompass)"/);
  });
  it("states that Wasiyya plans and records but never carries out burial or repatriation (owner 27.11.2026)", () => {
    const offer = readFileSync("src/lib/billing/start-offer.ts", "utf8");
    expect(offer).toContain("Wasiyya führt keine Bestattung, Überführung, Waschung oder Behördengänge durch");
    expect(offer).toContain("planen und festhalten");
    expect(offer).not.toContain('"Janazah, Ghusl und Kafan, Bestattung oder Überführung"');
    expect(readFileSync("src/app/preise/page.tsx", "utf8")).toContain("START_SCOPE_NOTE");
    expect(readFileSync("src/app/page.tsx", "utf8")).toContain("START_SCOPE_NOTE");
  });
});
