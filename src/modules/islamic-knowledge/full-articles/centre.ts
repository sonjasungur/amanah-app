import { HADITH_COLLECTION_LABELS, SOURCE_LEVEL_LABELS, allSources, fullArticleReviewsComplete, requiredFullArticleReviews, sourceLevelCounts, type FullArticle, type SourceLevel } from "./index";
import { FULL_ARTICLES } from "./index";
import { getCentreArticle, getRubric } from "./rubrics";
import { STATUS_LABELS } from "../workflow";

/**
 * Knowledge centre helpers (AP22 Welle 1, EA-05.3/05.6/05.7). Server only, like the articles themselves:
 * nothing here may be imported by a client component.
 */

// ---------------------------------------------------------------------------------------------------------------
// EA-05.6: review state per article, from the values the data already carries (status, source levels, reviews).
// ---------------------------------------------------------------------------------------------------------------

export type CentreReviewStage = "entwurf" | "quellen_in_pruefung" | "geprueft";

export const CENTRE_REVIEW_STAGES: { stage: CentreReviewStage; label: string }[] = [
  { stage: "entwurf", label: STATUS_LABELS.DRAFT },
  { stage: "quellen_in_pruefung", label: STATUS_LABELS.SOURCE_REVIEW },
  { stage: "geprueft", label: "Fachlich geprüft" },
];

const REVIEW_KIND_LABELS = { source: "Quellenprüfung", scholar: "islamische Fachprüfung", legal: "juristische Prüfung" } as const;

export interface CentreReviewState {
  stage: CentreReviewStage;
  label: string;
  /** Source levels as counted in the data, e.g. "Inhalt und Kontext geprüft: 20". Editorial, never a release. */
  sources: { level: SourceLevel; label: string; count: number }[];
  sourceTotal: number;
  /** Reviews a qualified person still has to record for this version. */
  openReviews: string[];
}

/**
 * "geprüft" only with every required review recorded for this version (fullArticleReviewsComplete). The article
 * status decides between "Entwurf" and "Quellen in Prüfung"; source levels set by the editors never move an article
 * forward on their own.
 */
export function centreReviewState(a: FullArticle): CentreReviewState {
  const counts = sourceLevelCounts(a);
  const status = a.status as string;
  const stage: CentreReviewStage = fullArticleReviewsComplete(a) ? "geprueft" : status === "DRAFT" ? "entwurf" : "quellen_in_pruefung";
  const done = (kind: string) => a.reviews.some((r) => r.kind === kind && r.version === a.version);
  return {
    stage,
    label: CENTRE_REVIEW_STAGES.find((s) => s.stage === stage)!.label,
    sources: (Object.keys(SOURCE_LEVEL_LABELS) as SourceLevel[]).filter((l) => counts[l] > 0).map((l) => ({ level: l, label: SOURCE_LEVEL_LABELS[l], count: counts[l] })),
    sourceTotal: allSources(a).length,
    openReviews: requiredFullArticleReviews(a).filter((k) => !done(k)).map((k) => REVIEW_KIND_LABELS[k]),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// EA-05.3: related topics from the relations the data already has.
// ---------------------------------------------------------------------------------------------------------------

const sourceKeys = (a: FullArticle) =>
  new Set([
    ...a.sources.quran.map((q) => `q${q.surah}:${q.ayah}`),
    ...a.sources.hadith.map((h) => `h${h.collection}${h.number}`),
  ]);

/**
 * Ranked: the article's own "relatedArticles", articles its FAQ or other FAQs name together with it, articles
 * sharing sub-topics, Qur'an verses or hadith, then the same rubric. Never the article itself.
 */
export function relatedTopics(a: FullArticle, limit = 4): FullArticle[] {
  const score = new Map<string, number>();
  const add = (id: string, n: number) => {
    if (id === a.id || !getCentreArticle(id)) return;
    score.set(id, (score.get(id) ?? 0) + n);
  };
  // The article's own list keeps its order and always comes first.
  (a.relatedArticles ?? []).forEach((id, i) => add(id, 10_000 - i * 1_000));
  for (const f of a.faq ?? []) for (const id of f.relatedArticleIds) add(id, 20);
  for (const other of FULL_ARTICLES) {
    for (const f of other.faq ?? []) if (f.relatedArticleIds.includes(a.id)) for (const id of f.relatedArticleIds) add(id, 10);
  }
  const mine = sourceKeys(a);
  const subs = new Set(a.subtopicIds);
  for (const other of FULL_ARTICLES) {
    if (other.id === a.id || other.subtopicIds.includes("faq")) continue;
    const shared = [...sourceKeys(other)].filter((k) => mine.has(k)).length;
    const sharedSubs = other.subtopicIds.filter((s) => subs.has(s)).length;
    if (shared) add(other.id, Math.min(shared, 5) * 3);
    if (sharedSubs) add(other.id, sharedSubs * 4);
    if (other.rubric === a.rubric) add(other.id, 2);
  }
  return [...score.entries()]
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
    .slice(0, limit)
    .map(([id]) => getCentreArticle(id)!)
    .filter(Boolean);
}

// ---------------------------------------------------------------------------------------------------------------
// EA-05.3: search over titles, texts and sources. Runs on the server (GET form), no external service.
// ---------------------------------------------------------------------------------------------------------------

/** Lower case, without diacritics and without the transliteration marks ʿ ʾ ' ’, so "Wasiyya" finds "Waṣiyya". */
export function normaliseSearch(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ʿʾ'’`´]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

export type SearchField = "Titel" | "Text" | "Quelle";
export interface CentreSearchHit {
  article: FullArticle;
  rubricTitle?: string;
  fields: SearchField[];
  snippet: string;
  score: number;
}

function sourceTexts(a: FullArticle): string[] {
  return [
    ...a.sources.quran.flatMap((q) => [`Qurʾān ${q.surah}:${q.ayah}`, `Sure ${q.surah} Vers ${q.ayah}`, q.germanVerbatim]),
    ...a.sources.hadith.flatMap((h) => [`${HADITH_COLLECTION_LABELS[h.collection]} ${h.number}`, `${h.collection} ${h.number}`, h.narrator, h.summary, h.germanRendering ?? ""]),
    ...a.sources.tafsir.flatMap((t) => [`Tafsīr Ibn Kaṯīr ${t.surah}:${t.ayah}`, t.summary]),
    ...(a.sources.fatwa ?? []).flatMap((f) => [f.author, f.work, f.question, f.summary]),
    ...a.sources.law.map((l) => l.title),
  ].filter(Boolean);
}

function articleTexts(a: FullArticle): string[] {
  return [
    a.summary,
    a.leadAnswer ?? "",
    a.nextStep ?? "",
    a.differingOpinions,
    ...a.sections.flatMap((s) => [s.title, ...s.paragraphs.map((p) => p.text)]),
    ...(a.faq ?? []).flatMap((f) => [f.question, f.answer]),
  ].filter(Boolean);
}

function snippetOf(text: string, terms: string[]): string {
  const plain = text.replace(/^Zusammenfassung \(Entwurf\):\s*/, "");
  const norm = normaliseSearch(plain);
  const at = Math.min(...terms.map((t) => norm.indexOf(t)).filter((i) => i >= 0));
  if (!Number.isFinite(at)) return plain.slice(0, 180);
  // NFD folding keeps the length of Latin text close enough to cut a readable window around the hit.
  const start = Math.max(0, at - 70);
  const cut = plain.slice(start, start + 200).trim();
  return `${start > 0 ? "… " : ""}${cut}${start + 200 < plain.length ? " …" : ""}`;
}

export function searchCentre(query: string, articles: readonly FullArticle[] = FULL_ARTICLES): CentreSearchHit[] {
  const terms = normaliseSearch(query)
    .split(" ")
    .filter((t) => t.length >= 2);
  if (!terms.length) return [];
  const hits: CentreSearchHit[] = [];
  for (const a of articles) {
    const title = [a.title, a.readerQuestion ?? ""].join(" ");
    const texts = articleTexts(a);
    const sources = sourceTexts(a);
    const nTitle = normaliseSearch(title);
    const nTexts = texts.map(normaliseSearch);
    const nSources = sources.map(normaliseSearch);
    // Every term must occur somewhere in the article (title, text or sources).
    const all = `${nTitle} ${nTexts.join(" ")} ${nSources.join(" ")}`;
    if (!terms.every((t) => all.includes(t))) continue;
    const fields: SearchField[] = [];
    let score = 0;
    if (terms.some((t) => nTitle.includes(t))) {
      fields.push("Titel");
      score += 10 * terms.filter((t) => nTitle.includes(t)).length;
    }
    const textIdx = nTexts.findIndex((t) => terms.some((term) => t.includes(term)));
    if (textIdx >= 0) {
      fields.push("Text");
      score += 3;
    }
    const srcIdx = nSources.findIndex((t) => terms.some((term) => t.includes(term)));
    if (srcIdx >= 0) {
      fields.push("Quelle");
      score += 2;
    }
    const snippetSource = textIdx >= 0 ? texts[textIdx] : srcIdx >= 0 ? sources[srcIdx] : a.summary;
    hits.push({ article: a, rubricTitle: a.rubric ? getRubric(a.rubric)?.title : undefined, fields, snippet: snippetOf(snippetSource, terms), score });
  }
  return hits.sort((x, y) => y.score - x.score || (x.article.readerQuestion ?? x.article.title).localeCompare(y.article.readerQuestion ?? y.article.title, "de"));
}
