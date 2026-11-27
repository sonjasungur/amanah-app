import { ENTRY_ARTICLE, FULL_ARTICLES, type FullArticle } from "./index";

/** The six rubrics of the knowledge centre (P2.7), under the entry page. */
export interface Rubric {
  nr: number;
  title: string;
  description: string;
}

export const RUBRICS: readonly Rubric[] = [
  { nr: 1, title: "Allgemeines Wissen", description: "Vorsorge als Amanah, und was Familienbrief, Bestattungswunsch, Vollmacht und Testament jeweils leisten." },
  { nr: 2, title: "Tod, Sterben und Trauer", description: "Qurʾān und Sunna über den Tod, die Begleitung Sterbender, Bittgebete und Beistand für Angehörige." },
  { nr: 3, title: "Islamische Bestattung in Deutschland", description: "Waschung, Leichentuch, Totengebet, Beisetzung und die Vorbereitung mit Moschee, Bestatter und Friedhof." },
  { nr: 4, title: "Islamisches Erbe und deutsches Erbrecht", description: "Gesetzliche Erbfolge, islamische Erbanteile, Pflichtteil und nachvollziehbare Familienbeispiele." },
  { nr: 5, title: "Waṣiyya, Schulden und Vermächtnisse", description: "Die Ein-Drittel-Regel, offene Verpflichtungen, Spenden und Vermächtnisse an Erbberechtigte." },
  { nr: 6, title: "Fatwas und häufige Fragen", description: "Thematisch geordnete Antworten, mit Fatwas und Gelehrtenaussagen samt ursprünglicher Frage." },
];

export function getRubric(nr: number): Rubric | undefined {
  return RUBRICS.find((r) => r.nr === nr);
}

/** Articles of one rubric, in the order of the list (the rubric's key articles first). */
const ORDER = [
  "p27-a-vorsorge-dokumente",
  "p27-b-quran-tod",
  "p27-c-bestattungswuensche",
  "p27-a-gesetzliche-erbfolge",
  "p25-e-testament-form-international",
  "p25-a-wasiyya",
  "p27-f-fatwas",
];
export function articlesInRubric(nr: number): FullArticle[] {
  const rank = (a: FullArticle) => (ORDER.includes(a.id) ? ORDER.indexOf(a.id) : ORDER.length);
  return FULL_ARTICLES.filter((a) => a.rubric === nr).sort((x, y) => rank(x) - rank(y));
}

/** Any article of the centre, the entry page included. */
export function getCentreArticle(id: string): FullArticle | undefined {
  if (ENTRY_ARTICLE?.id === id) return ENTRY_ARTICLE;
  return FULL_ARTICLES.find((a) => a.id === id);
}

/** Fatwa answers (rubric 6) that name this article, so articles link straight to the relevant fatwas. */
export function relatedFatwaAnswers(id: string): { question: string; articleId: string; refs: string[] }[] {
  return FULL_ARTICLES.flatMap((a) => (a.faq ?? []).filter((f) => f.relatedArticleIds.includes(id) && a.id !== id).map((f) => ({ question: f.question, articleId: a.id, refs: f.refs })));
}
