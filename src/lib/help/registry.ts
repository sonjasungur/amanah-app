import { ghuslKafanArticles } from "@/lib/knowledge/ghusl-kafan";
import { islamicSources } from "@/lib/knowledge/sources";
import { HELP_TOPICS } from "@/lib/content/help-topics";
import type { FieldHelpEntry, FieldHelpId, FieldHelpReview, FieldHelpSource, FieldHelpView } from "./types";
import { FIELD_HELP_IDS } from "./types";

/**
 * Server-only registry of the field help texts (AP22 EA-01.3). Client code must not import this
 * file (see knowledge-client-bundle test); it reads /api/help/[id].
 *
 * The first three entries reuse texts that already exist, word for word, and add nothing:
 * - the Ghusl/Kafan knowledge articles (lib/knowledge/ghusl-kafan.ts),
 * - the source "fiqh-ghusl-kafan" (lib/knowledge/sources.ts),
 * - the neutral help topics (lib/content/help-topics.ts) for term and "Was du entscheidest".
 * Empty parts (no existing text) stay empty and are not shown. Researched texts replace them later
 * through parseFieldHelpFile() (recherche/hilfetexte-*.json).
 */

const ghuslArticle = ghuslKafanArticles.find((a) => a.id === "gk-ghusl")!;
const fiqhSource = islamicSources["fiqh-ghusl-kafan"];

/** First sentences of the Ghusl article: what it says about the washing itself. */
const GHUSL_GUIDANCE = ghuslArticle.content.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
const GHUSL_SOURCES: FieldHelpSource[] = [{ text: `${fiqhSource.title}: ${fiqhSource.reference}` }];
const CENTRE_ARTICLE = "p25-c-ghusl-kafan";
const HERKUNFT = "lib/knowledge/ghusl-kafan.ts (gk-ghusl), lib/knowledge/sources.ts (fiqh-ghusl-kafan), lib/content/help-topics.ts";

const ENTRIES: Record<FieldHelpId, FieldHelpEntry> = {
  "ghusl-waschung": {
    id: "ghusl-waschung",
    begriff: HELP_TOPICS.ghusl.meaning,
    vorgabe: `${GHUSL_GUIDANCE} ${fiqhSource.translationDe ?? ""}`.trim(),
    auffassungen: fiqhSource.note,
    entscheidung: HELP_TOPICS.ghusl.enter,
    quellen: GHUSL_SOURCES,
    artikelSlug: CENTRE_ARTICLE,
    pruefstatus: "ungeprueft",
    herkunft: HERKUNFT,
  },
  "ghusl-anwesende": {
    id: "ghusl-anwesende",
    begriff: HELP_TOPICS["ghusl-personen"].meaning,
    vorgabe: ghuslArticle.content,
    auffassungen: fiqhSource.note,
    entscheidung: HELP_TOPICS["ghusl-personen"].enter,
    quellen: GHUSL_SOURCES,
    artikelSlug: CENTRE_ARTICLE,
    pruefstatus: "ungeprueft",
    herkunft: HERKUNFT,
  },
  "ghusl-wuerde": {
    id: "ghusl-wuerde",
    begriff: HELP_TOPICS.schamgrenzen.meaning,
    vorgabe: GHUSL_GUIDANCE,
    entscheidung: HELP_TOPICS.schamgrenzen.enter,
    quellen: GHUSL_SOURCES,
    artikelSlug: CENTRE_ARTICLE,
    pruefstatus: "ungeprueft",
    herkunft: HERKUNFT,
  },
};

export function getFieldHelp(id: FieldHelpId): FieldHelpEntry {
  return ENTRIES[id];
}

export function allFieldHelp(): FieldHelpEntry[] {
  return FIELD_HELP_IDS.map((id) => ENTRIES[id]);
}

const safeHref = (href: unknown): string | undefined =>
  typeof href === "string" && (/^https:\/\/[^\s]+$/.test(href) || /^\/[a-z0-9/_\-#.?=&]*$/i.test(href)) ? href : undefined;
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/**
 * Reads a research file (recherche/hilfetexte-*.json: an array of entries or { eintraege: [...] }).
 * Unknown keys are ignored, links must be https or internal, and the review status stays
 * "ungeprueft" unless the file says "geprueft" explicitly. Invalid entries are skipped and reported.
 */
export function parseFieldHelpFile(raw: unknown, herkunft: string): { entries: FieldHelpEntry[]; errors: string[] } {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray((raw as { eintraege?: unknown }).eintraege) ? (raw as { eintraege: unknown[] }).eintraege : null;
  if (!list) return { entries: [], errors: ["Datei enthält keine Liste von Einträgen"] };
  const entries: FieldHelpEntry[] = [];
  const errors: string[] = [];
  list.forEach((item, i) => {
    if (!item || typeof item !== "object") return void errors.push(`Eintrag ${i + 1}: kein Objekt`);
    const r = item as Record<string, unknown>;
    const id = str(r.id);
    const begriff = str(r.begriff);
    if (!id || !begriff) return void errors.push(`Eintrag ${i + 1}: id und begriff sind Pflicht`);
    const quellen = (Array.isArray(r.quellen) ? r.quellen : []).flatMap((q) => {
      const text = str((q as Record<string, unknown>)?.text);
      if (!text) return [];
      const href = safeHref((q as Record<string, unknown>).href ?? (q as Record<string, unknown>).link);
      return [{ text, ...(href ? { href } : {}) }];
    });
    const pruefstatus: FieldHelpReview = r.pruefstatus === "geprueft" ? "geprueft" : "ungeprueft";
    entries.push({
      id,
      begriff,
      vorgabe: str(r.vorgabe),
      auffassungen: str(r.auffassungen),
      spielraum: str(r.spielraum),
      entscheidung: str(r.entscheidung),
      quellen,
      artikelSlug: str(r.artikelSlug),
      pruefstatus,
      herkunft,
    });
  });
  return { entries, errors };
}

/**
 * What may leave the server. Religious parts and sources only when reviewed or in the preview
 * (staging behind password, local development). The article link only when the article is reachable.
 */
export function toFieldHelpView(entry: FieldHelpEntry, options: { preview: boolean; availableArticles: ReadonlySet<string> }): FieldHelpView {
  const full = entry.pruefstatus === "geprueft" || options.preview;
  const artikelHref = entry.artikelSlug && options.availableArticles.has(entry.artikelSlug) ? `/wissen/zentrum/artikel/${entry.artikelSlug}` : undefined;
  return {
    id: entry.id,
    begriff: entry.begriff,
    entscheidung: entry.entscheidung,
    pruefstatus: entry.pruefstatus,
    restricted: !full,
    quellen: full ? entry.quellen : [],
    ...(full ? { vorgabe: entry.vorgabe, auffassungen: entry.auffassungen, spielraum: entry.spielraum } : {}),
    ...(artikelHref ? { artikelHref } : {}),
  };
}
