import data from "./p26-articles.json";
import type { KnowledgeAreaId, ReviewRecord } from "../types";

/**
 * P2.6: the full knowledge articles A–F (26 reworked, 2 new) as editorial drafts, version 2.
 *
 * Every paragraph has exactly one kind, so Qur'an, Sunnah, Tafsir, school positions, German law and
 * practical advice are never mixed. Every source carries its own review state. Readable only in the
 * internal review area (/wissen/redaktion/artikel, isInternalToolsEnabled). There is no publishing
 * path: `isFullArticlePublishable` is always false. Only server components import this module (test),
 * so the texts never reach browser code. Version 1 (P2.5) is kept in ./archive for traceability.
 */
export type ParagraphKind = "einleitung" | "erklaerung" | "quran" | "tafsir" | "hadith" | "kontext" | "fiqh" | "praxis" | "amanah" | "recht";
export type SectionKey = "einleitung" | "thema" | "quran" | "tafsir" | "sunnah" | "kontext" | "auffassungen" | "praxis" | "amanah" | "recht";

/**
 * Review state of one source. Claude may set at most `inhalt_geprueft`; the owner's own check is kept
 * per browser in the review area (and exported from there), the scholars' release lives in `reviews`.
 */
export type SourceLevel = "nicht_geprueft" | "stelle_gefunden" | "wortlaut_abgeglichen" | "inhalt_geprueft" | "freigabe_offen" | "betreiberin_geprueft";

export const SOURCE_LEVEL_LABELS: Record<SourceLevel, string> = {
  nicht_geprueft: "Noch nicht überprüft",
  stelle_gefunden: "Quellenstelle gefunden",
  wortlaut_abgeglichen: "Wortlaut abgeglichen",
  inhalt_geprueft: "Inhalt und Kontext geprüft",
  freigabe_offen: "Fachliche Freigabe offen",
  betreiberin_geprueft: "Von der Betreiberin geprüft",
};

/** Levels an automatic or editorial check may reach. The last two need a person. */
export const MACHINE_LEVELS: readonly SourceLevel[] = ["nicht_geprueft", "stelle_gefunden", "wortlaut_abgeglichen", "inhalt_geprueft"];

export const PARAGRAPH_KIND_LABELS: Record<ParagraphKind, string> = {
  einleitung: "Einleitung",
  erklaerung: "Erklärung",
  quran: "Qur'an",
  tafsir: "Tafsir Ibn Kaṯīr",
  hadith: "Hadith",
  kontext: "Einordnung der Überlieferung",
  fiqh: "Rechtsschulen / Fiqh",
  praxis: "Praktische Empfehlung",
  amanah: "Bezug zu Amanah",
  recht: "Deutsches Recht",
};

export interface SourceStatus {
  level: SourceLevel;
  method: string;
  checkedAt: string;
  by: string;
}

export interface QuranSource {
  ref: string;
  surah: number;
  ayah: number;
  germanVerbatim: string;
  arabic?: string;
  edition: string;
  url: string;
  apiUrl?: string;
  status: SourceStatus;
}

export interface TafsirSource {
  ref: string;
  surah: number;
  ayah: number;
  edition: string;
  url: string;
  locator: string;
  readExtent: string;
  summary: string;
  status: SourceStatus;
}

export interface HadithSource {
  ref: string;
  collection: "bukhari" | "muslim";
  number: string;
  numberingNote?: string;
  narrator: string;
  arabicExcerpt?: string;
  summary: string;
  mirrorUrl?: string;
  sunnahComUrl: string;
  status: SourceStatus;
  [extra: string]: unknown;
}

export interface LawSource {
  ref: string;
  title: string;
  jurisdiction: string;
  url: string;
  retrievedAt: string;
  status: SourceStatus;
}

export interface Paragraph {
  kind: ParagraphKind;
  text: string;
  /** Sources of this paragraph's own kind (a Qur'an paragraph cites Qur'an, and so on). */
  refs?: string[];
  /** Cross references to another kind of source, e.g. a hadith Ibn Kathir mentions, checked on its own. */
  seeAlso?: string[];
}

export interface ArticleSection {
  key: SectionKey;
  title: string;
  paragraphs: Paragraph[];
}

export interface OpenQuestion {
  question: string;
  for: "gelehrte" | "jurist" | "redaktion";
  refs?: string[];
}

export interface FullArticle {
  id: string;
  area: KnowledgeAreaId;
  subtopicIds: string[];
  replacesExisting: string[];
  title: string;
  summary: string;
  sections: ArticleSection[];
  sources: { quran: QuranSource[]; tafsir: TafsirSource[]; hadith: HadithSource[]; law: LawSource[] };
  differingOpinions: string;
  openQuestions: OpenQuestion[];
  status: "DRAFT";
  version: number;
  reviews: ReviewRecord[];
}

/** Result of the independent check (scripts/knowledge/verify-p26-articles.mjs), stored with the data. */
export interface VerificationSummary {
  checkedAt: string;
  quran: { total: number; exact: number };
  hadith: { total: number; numberFound: number; arabicMatches: number };
}

const FILE = data as unknown as { generatedAt: string; verification?: VerificationSummary; articles: FullArticle[] };

export const FULL_ARTICLES: readonly FullArticle[] = FILE.articles;
export const VERIFICATION: VerificationSummary | undefined = FILE.verification;

/** Kept for the earlier name used by pages and tests. */
export const FULL_ARTICLE_DRAFTS = FULL_ARTICLES;

export function getFullArticle(id: string): FullArticle | undefined {
  return FULL_ARTICLES.find((a) => a.id === id);
}
export const getFullArticleDraft = getFullArticle;

export function allSources(a: FullArticle): { type: "quran" | "tafsir" | "hadith" | "law"; ref: string; status: SourceStatus }[] {
  return (["quran", "tafsir", "hadith", "law"] as const).flatMap((type) => (a.sources[type] ?? []).map((s) => ({ type, ref: s.ref, status: s.status })));
}

export function sourceLevelCounts(a: FullArticle): Record<SourceLevel, number> {
  const counts = Object.fromEntries(Object.keys(SOURCE_LEVEL_LABELS).map((k) => [k, 0])) as Record<SourceLevel, number>;
  for (const s of allSources(a)) counts[s.status.level] += 1;
  return counts;
}

export function requiredFullArticleReviews(a: FullArticle): ("source" | "scholar" | "legal")[] {
  const hasLaw = a.sources.law.length > 0 || a.sections.some((s) => s.paragraphs.some((p) => p.kind === "recht"));
  return hasLaw ? ["source", "scholar", "legal"] : ["source", "scholar"];
}

export function fullArticleReviewsComplete(a: FullArticle): boolean {
  const done = (kind: string) => a.reviews.some((r) => r.kind === kind && r.version === a.version && r.reviewer.trim() !== "" && /^\d{4}-\d{2}-\d{2}$/.test(r.reviewedAt));
  return requiredFullArticleReviews(a).every(done);
}

/**
 * Always false: there is no publishing path for these drafts. Complete reviews are a precondition,
 * not a release; publication needs an explicit owner decision and its own change. Automatic and
 * editorial checks never count as a review.
 */
export function isFullArticlePublishable(article: FullArticle): false {
  void article;
  return false;
}

const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
export function articleWords(a: FullArticle): number {
  return a.sections.reduce((n, s) => n + s.paragraphs.reduce((m, p) => m + wordCount(p.text), 0), 0);
}

/** Structural rules every draft must meet before it goes to reviewers. Empty means fine. */
export function fullArticleIssues(a: FullArticle): string[] {
  const issues: string[] = [];
  const refs = new Set(allSources(a).map((s) => s.ref));
  const kinds = new Set(Object.keys(PARAGRAPH_KIND_LABELS));
  const needRefs: ParagraphKind[] = ["quran", "tafsir", "hadith"];
  for (const s of a.sections) {
    for (const p of s.paragraphs) {
      if (!kinds.has(p.kind)) issues.push(`Unbekannte Absatzart ${p.kind}`);
      if (!p.text.trim()) issues.push(`Leerer Absatz in ${s.title}`);
      if (needRefs.includes(p.kind) && !(p.refs ?? []).length) issues.push(`${PARAGRAPH_KIND_LABELS[p.kind]}-Absatz ohne Quelle in „${s.title}“`);
      for (const r of [...(p.refs ?? []), ...(p.seeAlso ?? [])]) if (!refs.has(r)) issues.push(`Verweis ${r} ohne Quelle`);
      const own: Partial<Record<ParagraphKind, string[]>> = { quran: ["quran"], tafsir: ["tafsir", "quran"], hadith: ["hadith"], recht: ["law"] };
      const typeOf = (r: string) => allSources(a).find((x) => x.ref === r)?.type;
      if (own[p.kind]) for (const r of p.refs ?? []) if (!own[p.kind]!.includes(typeOf(r) ?? "")) issues.push(`${PARAGRAPH_KIND_LABELS[p.kind]}-Absatz verweist auf fremde Quellenart ${r}`);
    }
  }
  // An FAQ answers question by question (sources inside each answer); the chapter rule does not apply.
  const isFaq = a.subtopicIds.includes("faq");
  const required: SectionKey[] = isFaq ? ["einleitung", "amanah"] : ["einleitung", "sunnah", "praxis", "amanah"];
  if (!isFaq && a.sources.quran.length) required.push("quran");
  if (!isFaq && a.sources.tafsir.length) required.push("tafsir");
  for (const key of required) if (!a.sections.some((s) => s.key === key)) issues.push(`Pflichtteil fehlt: ${key}`);
  for (const q of a.sources.quran) {
    if (!q.germanVerbatim.trim()) issues.push(`${q.ref}: kein Wortlaut`);
    if (!q.url.includes("german_bubenheim")) issues.push(`${q.ref}: nicht Bubenheim/Elyas`);
  }
  for (const t of a.sources.tafsir) {
    if (!t.summary.startsWith("Zusammenfassung (Entwurf")) issues.push(`${t.ref}: nicht als Zusammenfassung gekennzeichnet`);
    if (t.status.level === "wortlaut_abgeglichen") issues.push(`${t.ref}: Tafsir wird nie wörtlich abgeglichen (kein Zitat)`);
  }
  for (const h of a.sources.hadith) {
    if (h.collection !== "bukhari" && h.collection !== "muslim") issues.push(`${h.ref}: Sammlung nicht zugelassen`);
    if (!h.narrator?.trim()) issues.push(`${h.ref}: Erzähler fehlt`);
    if (!h.summary.startsWith("Zusammenfassung (Entwurf")) issues.push(`${h.ref}: nicht als Zusammenfassung gekennzeichnet`);
  }
  for (const s of allSources(a)) {
    if (!MACHINE_LEVELS.includes(s.status.level)) issues.push(`${s.ref}: Stufe ${s.status.level} darf nur ein Mensch setzen`);
    if (!s.status.method?.trim()) issues.push(`${s.ref}: Prüfweg nicht beschrieben`);
  }
  return issues;
}

/** What a person must still confirm, per article. Never empty for a draft. */
export function manualChecks(a: FullArticle): string[] {
  const muslim = a.sources.hadith.filter((h) => h.collection === "muslim").length;
  const checks = [
    "Inhalt, Gewichtung und Einordnung durch qualifizierte islamische Fachpersonen prüfen",
    `${a.sources.hadith.length} Hadith-Stellen von Hand auf sunnah.com prüfen (Nummer, Erzähler, Inhalt); automatische Abrufe sind dort gesperrt`,
  ];
  if (muslim) checks.push(`${muslim} Muslim-Nummern mit Buchstaben (a, b …) sind aus dem Spiegel abgeleitet: auf sunnah.com bestätigen`);
  if (a.sources.tafsir.length) checks.push(`${a.sources.tafsir.length} Tafsir-Zusammenfassungen am Druckexemplar (Dār Ṭayba) prüfen und Band/Seite ergänzen`);
  if (requiredFullArticleReviews(a).includes("legal")) checks.push("Absätze „Deutsches Recht“ und Gesetzesangaben durch Juristen prüfen");
  if (!a.differingOpinions.trim()) checks.push("Unterschiedliche Auffassungen: keine belegten erfasst – prüfen, ob es welche gibt");
  return checks;
}

/**
 * Editorial task list: subtopics that still have neither an entry nor a draft. Since P2.6 FAQ and
 * Bestattungsrecht have drafts (p26-c-faq, p26-e-bestattungsrecht), so the list is empty unless the
 * structure grows; a test keeps it in sync.
 */
export interface EditorialTask {
  area: KnowledgeAreaId;
  subtopicId: string;
  title: string;
  needs: string;
  status: "offen";
}
export const OPEN_EDITORIAL_TASKS: readonly EditorialTask[] = [];
