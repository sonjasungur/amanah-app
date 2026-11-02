/**
 * Search helpers for the knowledge centre: spelling variants and filler words only.
 * The variant groups say nothing about religious rulings; they only help people find a topic
 * however they spell it (transliteration, Turkish or German word).
 */
const VARIANT_GROUPS: string[][] = [
  ["janazah", "janaza", "dschanaza", "dschenaza", "cenaze", "totengebet"],
  ["ghusl", "gusl", "gusul", "totenwaschung", "leichenwaschung"],
  ["kafan", "kefen", "leichentuch", "totentuch"],
  ["wasiyya", "wasiyyah", "wasiya", "vasiyet", "vermachtnis"],
  ["faraid", "faraidh", "mirath", "miras"],
  ["erbanteil", "erbteil", "erbquote"],
  ["quran", "koran", "kuran"],
  ["hadith", "hadis"],
  ["sadaqa", "sadaqah", "sadaka"],
  ["jariya", "jariyah", "dschariya", "cariye"],
  ["salat", "salah", "namaz"],
  ["bestattung", "beerdigung", "beisetzung"],
  ["nachlass", "hinterlassenschaft"],
  ["uberfuhrung", "ruckfuhrung"],
];

const FILLER_WORDS = new Set(
  "was wie wer wo wann warum ist sind der die das den dem des ein eine einen einer und oder im in zu zum zur nach von vom bei mit fur ich mein meine darf muss kann man gibt es".split(" "),
);

/** Lowercase, no diacritics or apostrophes, ä/ae and ß/ss spelled alike. */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ʾʿ'’`]/g, "")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u");
}

const NORMALIZED_GROUPS = VARIANT_GROUPS.map((group) => group.map(normalizeSearchText));

/** Search terms of a query; filler words are dropped unless nothing else remains. */
export function searchTerms(query: string): string[] {
  const all = normalizeSearchText(query).split(/[\s,.;:!?()/-]+/).filter(Boolean);
  const meaningful = all.filter((t) => !FILLER_WORDS.has(t));
  return meaningful.length > 0 ? meaningful : all;
}

/** A term matches when it, or a spelling variant of it, occurs in the normalized text. */
export function termMatches(term: string, normalizedText: string): boolean {
  const group = NORMALIZED_GROUPS.find((g) => g.some((v) => term.includes(v)));
  return (group ?? [term]).some((v) => normalizedText.includes(v)) || normalizedText.includes(term);
}

/** True when every term of the query is found in at least one of the texts. */
export function matchesQuery(query: string, texts: string[]): boolean {
  const terms = searchTerms(query);
  if (terms.length === 0) return false;
  const haystack = normalizeSearchText(texts.join(" "));
  return terms.every((t) => termMatches(t, haystack));
}

export interface SearchablePublished {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  differingOpinions?: string;
}

export interface PreparedTopic {
  id: string;
  title: string;
  areaTitle: string;
}

/** Full-text search in the given articles. The caller decides what may be searched: published ones only. */
export function rankPublished<T extends SearchablePublished>(query: string, articles: T[]): T[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  return articles
    .map((a) => {
      const title = normalizeSearchText(a.title);
      const text = normalizeSearchText(`${a.summary} ${a.body} ${a.differingOpinions ?? ""}`);
      const score = terms.reduce((s, t) => s + (termMatches(t, title) ? 3 : 0) + (termMatches(t, text) ? 1 : 0), 0);
      return { a, score, all: terms.every((t) => termMatches(t, title) || termMatches(t, text)) };
    })
    .filter((r) => r.all)
    .sort((x, y) => y.score - x.score)
    .map((r) => r.a);
}
