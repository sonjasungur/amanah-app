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
