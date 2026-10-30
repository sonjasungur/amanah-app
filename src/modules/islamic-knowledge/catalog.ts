import { barzakhArticles } from "@/lib/knowledge/barzakh";
import { ghuslKafanArticles } from "@/lib/knowledge/ghusl-kafan";
import { janazahArticles } from "@/lib/knowledge/janazah";
import { cultureFilterCards } from "@/lib/knowledge/kulturfilter";
import { sadaqaJariyaArticles } from "@/lib/knowledge/sadaqa-jariya";
import { resolveSourceId } from "@/lib/knowledge/sources";
import { testamentArticles } from "@/lib/knowledge/testament-erbe";
import type { CultureFilterCard, KnowledgeArticle } from "@/lib/types";
import { getKnowledgeArea } from "./structure";
import type { CatalogCorrection, KnowledgeAreaId, KnowledgeArticleRecord } from "./types";

/**
 * Existing content taken over into the review process (2026-10-30).
 * Texts are referenced, not rewritten. Legacy "reviewed" flags had no reviewer or date
 * and are therefore recorded as claimedStatus only — every record starts unpublished.
 */
type Placement = { area: KnowledgeAreaId; subtopicId: string };

/** Legacy alias IDs resolve to their canonical source so checks apply once. */
function canonicalSources(ids: string[]): string[] {
  return [...new Set(ids.map(resolveSourceId))];
}

const ARTICLE_PLACEMENT: Record<string, Placement> = {
  "janazah-what": { area: "janazah", subtopicId: "vorbereitung" },
  "janazah-hasten": { area: "janazah", subtopicId: "vorbereitung" },
  "janazah-ghusl": { area: "janazah", subtopicId: "ghusl" },
  "janazah-kafan": { area: "janazah", subtopicId: "kafan" },
  "janazah-prayer": { area: "janazah", subtopicId: "salat-al-janazah" },
  "janazah-germany": { area: "islam-und-recht", subtopicId: "bestattung-deutschland" },
  "gk-ghusl": { area: "janazah", subtopicId: "ghusl" },
  "gk-kafan": { area: "janazah", subtopicId: "kafan" },
  "barzakh-what": { area: "tod-sterben", subtopicId: "nach-dem-tod" },
  "barzakh-benefit": { area: "vorsorge", subtopicId: "sadaqa-jariya" },
  "barzakh-sadaqa": { area: "vorsorge", subtopicId: "sadaqa-jariya" },
  "barzakh-debts": { area: "faraid", subtopicId: "schulden" },
  "barzakh-forgiveness": { area: "vorsorge", subtopicId: "verantwortung" },
  "barzakh-family": { area: "tod-sterben", subtopicId: "trost-beileid" },
  "erbe-amanah": { area: "faraid", subtopicId: "grundlagen" },
  "erbe-faraid": { area: "faraid", subtopicId: "erbanteile" },
  "erbe-wasiyyah": { area: "faraid", subtopicId: "wasiyya-drittel" },
  "erbe-deutschland": { area: "islam-und-recht", subtopicId: "erbrecht-vergleich" },
  "sj-what": { area: "vorsorge", subtopicId: "sadaqa-jariya" },
  "sj-examples": { area: "vorsorge", subtopicId: "sadaqa-jariya" },
  "sj-foerderkreis": { area: "vorsorge", subtopicId: "wohltaetige-vermaechtnisse" },
};

const LEGACY_ARTICLE_FILES: [string, KnowledgeArticle[]][] = [
  ["src/lib/knowledge/janazah.ts", janazahArticles],
  ["src/lib/knowledge/ghusl-kafan.ts", ghuslKafanArticles],
  ["src/lib/knowledge/barzakh.ts", barzakhArticles],
  ["src/lib/knowledge/testament-erbe.ts", testamentArticles],
  ["src/lib/knowledge/sadaqa-jariya.ts", sadaqaJariyaArticles],
];

function fromArticle(file: string, article: KnowledgeArticle): KnowledgeArticleRecord {
  const placement = ARTICLE_PLACEMENT[article.id];
  if (!placement) throw new Error(`No placement for legacy article ${article.id}`);
  return {
    id: `ik-${article.id}`,
    slug: article.slug,
    ...placement,
    title: article.title,
    summary: article.summary,
    body: article.content,
    sourceIds: canonicalSources(article.sourceIds),
    requiresLegalReview: getKnowledgeArea(placement.area).legalReviewRequired,
    status: article.sourceIds.length > 0 ? "SOURCE_REVIEW" : "DRAFT",
    version: 1,
    reviews: [],
    relatedSlugs: [],
    legacy: { file, recordId: article.id, claimedStatus: article.reviewStatus },
  };
}

function fromCultureCard(card: CultureFilterCard): KnowledgeArticleRecord {
  return {
    id: `ik-${card.id}`,
    slug: card.id,
    area: "tod-sterben",
    subtopicId: "unbelegte-praktiken",
    title: card.question,
    summary: card.whatToCheck,
    body: [`Islamische Grundlage: ${card.islamicBasis}`, `Kulturelle Praxis: ${card.culturalPractice}`].join("\n\n"),
    sourceIds: canonicalSources(card.sourceIds),
    differingOpinions: card.opinionDifferences,
    requiresLegalReview: false,
    status: card.sourceIds.length > 0 ? "SOURCE_REVIEW" : "DRAFT",
    version: 1,
    reviews: [],
    relatedSlugs: [],
    legacy: { file: "src/lib/knowledge/kulturfilter.ts", recordId: card.id, claimedStatus: card.reviewStatus },
  };
}

/** Religious statements that were hard-coded in page JSX before 2026-10-30, kept verbatim. */
const PAGE_TEXT_DRAFTS: KnowledgeArticleRecord[] = [
  {
    id: "ik-page-testament-erbe-intro",
    slug: "faraid-und-wasiyya-das-wichtigste",
    area: "faraid",
    subtopicId: "grundlagen",
    title: "Farāʾiḍ und Waṣiyya — das Wichtigste",
    summary: "Im Islam ist Erbe keine bloße Formalität — es ist Amanah.",
    body: [
      "Im Islam ist Erbe keine bloße Formalität — es ist Amanah. Allah hat feste Erbanteile bestimmt, und du kannst einen begrenzten Teil frei verfügen.",
      "Farāʾiḍ sind die festen Erbanteile aus dem Quran — für Ehepartner, Eltern, Söhne, Töchter und weitere Angehörige. Du kannst Pflicht-Erben nicht einfach ausschließen.",
      "Waṣiyya ist der frei verfügbare Teil — klassisch maximal ein Drittel des Nachlasses. Damit kannst du Sadaqa Jariya, Wohltätigkeit oder Nicht-Pflicht-Erben bedenken. Mehr als ein Drittel erfordert die Zustimmung aller Erben.",
    ].join("\n\n"),
    sourceIds: [],
    requiresLegalReview: false,
    status: "DRAFT",
    version: 1,
    reviews: [],
    relatedSlugs: [],
    legacy: { file: "src/app/testament-erbe/page.tsx", recordId: "page-intro" },
  },
  {
    id: "ik-page-barzakh-intro",
    slug: "barzakh-der-zwischenzustand",
    area: "tod-sterben",
    subtopicId: "nach-dem-tod",
    title: "Barzakh — der Zwischenzustand",
    summary: "Was kann dir und deiner Familie nach dem Tod noch nützen?",
    body: [
      "Nach dem Tod beginnt für jeden Menschen der Barzakh — die Phase bis zur Auferstehung. Was kann dir und deiner Familie in dieser Zeit noch nützen? Wie bereitest du dich vor?",
      "Kein Mensch kennt das genaue Schicksal im Barzakh. Die folgenden Inhalte dienen der Vorbereitung und Orientierung — nicht als Garantie. Nur Allah entscheidet über Barmherzigkeit und Vergeltung.",
    ].join("\n\n"),
    sourceIds: [],
    requiresLegalReview: false,
    status: "DRAFT",
    version: 1,
    reviews: [],
    relatedSlugs: [],
    legacy: { file: "src/app/barzakh/page.tsx", recordId: "page-intro" },
  },
  {
    id: "ik-page-sadaqa-jariya-intro",
    slug: "sadaqa-jariya-einfuehrung",
    area: "vorsorge",
    subtopicId: "sadaqa-jariya",
    title: "Sadaqa Jariya",
    summary: "Eine Wohltat, deren Nutzen über den Tod hinausreicht.",
    body: "Sadaqa Jariya ist eine Wohltat, deren Nutzen über den Tod hinausreicht. Bereite zu Lebzeiten vor, was dir und anderen auch im Barzakh nützen kann — im zulässigen Rahmen deiner Waṣiyya.",
    sourceIds: [],
    requiresLegalReview: false,
    status: "DRAFT",
    version: 1,
    reviews: [],
    relatedSlugs: [],
    legacy: { file: "src/app/sadaqa-jariya/page.tsx", recordId: "page-intro" },
  },
];

function withRelated(records: KnowledgeArticleRecord[]): KnowledgeArticleRecord[] {
  return records.map((r) => ({
    ...r,
    relatedSlugs: records
      .filter((o) => o.id !== r.id && o.area === r.area && o.subtopicId === r.subtopicId)
      .map((o) => o.slug),
  }));
}

const CORRECTED = "2026-10-30";

/**
 * Corrections from the source check of 2026-10-30 (docs/strategy/09-quellenkorrektur.md).
 * Only unambiguous fixes; everything needing a scholarly decision is an editorial note.
 */
const CORRECTIONS: Record<string, CatalogCorrection> = {
  "ik-barzakh-what": {
    date: CORRECTED,
    reason: "Arabische Schreibung korrigiert; die Aussage zu fortwirkenden Taten stammt aus Muslim 1631, nicht aus 23:99–100.",
    bodyReplacements: [["بارزخ", "برزخ"]],
    sourceIds: ["quran-al-muminun-23-99", "hadith-sadaqa-jariya"],
  },
  "ik-erbe-deutschland": {
    date: CORRECTED,
    reason: "Quelle zur Vorsorgevollmacht belegt kein Erbrecht; Rechtsquellen fehlen noch.",
    sourceIds: [],
  },
  "ik-kultur-7-40-52": {
    date: CORRECTED,
    reason: "Hadith zur Beschleunigung der Bestattung belegt keine Aussage zu Gedenktagen.",
    sourceIds: [],
  },
  "ik-kultur-traueressen": {
    date: CORRECTED,
    reason: "Muslim 1631 hat keinen Bezug zu Traueressen oder Taʿziya.",
    sourceIds: [],
  },
  "ik-kultur-quran-geld": {
    date: CORRECTED,
    reason: "Muslim 1631 hat keinen Bezug zu bezahlten Qurʾān-Lesungen.",
    sourceIds: [],
  },
  "ik-kultur-familie-belasten": {
    date: CORRECTED,
    reason: "Hadith zur Beschleunigung ersetzt durch Bukhari 2289 (Schulden); Beleg zu isrāf fehlt weiterhin.",
    sourceIds: ["hadith-debts-deceased"],
  },
};

const EDITORIAL_NOTES: Record<string, string[]> = {
  "ik-janazah-hasten": ["Aussage zu 7./40./52. Tag wird vom Hadith zur Beschleunigung nicht getragen — belegen oder entfernen."],
  "ik-erbe-faraid": ["„Stiefkinder und Pflegekinder nicht automatisch Pflicht-Erben“ ist ein Fiqh-Schluss ohne zitierten Beleg."],
  "ik-erbe-wasiyyah": [
    "„für Nicht-Pflicht-Erben“ und „mehr als ein Drittel nur mit Zustimmung der Erben“ stehen nicht in Bukhari 2742/Muslim 1628a.",
    "Beleg für das Vermächtnisverbot an Erben (z. B. Abū Dāwūd 2870 / at-Tirmidhī 2120) mit Gradierung ergänzen; Schulpositionen erfassen.",
  ],
  "ik-erbe-deutschland": ["Rechtsaussagen (Form, Pflichtteil) brauchen Normzitate und juristische Prüfung."],
  "ik-kultur-lautes-klagen": ["Prophetenaussage ohne Hadithreferenz — konkrete, verifizierte Fundstelle ergänzen oder Aussage umformulieren."],
  "ik-kultur-ueberfuehrung": ["„keine religiöse Pflicht“ ist Fiqh — Schulpositionen mit Werkangabe ergänzen."],
  "ik-barzakh-sadaqa": ["Beispiele (Brunnen, Schulen …) stehen nicht im Hadith — als Erläuterung kennzeichnen."],
  "ik-sj-what": ["Beispiele stehen nicht in Muslim 1631 — als Erläuterung kennzeichnen."],
  "ik-sj-examples": ["Beispiele stehen nicht in Muslim 1631 — als Erläuterung kennzeichnen."],
  "ik-sj-foerderkreis": ["Partnerbezug (Gemeinsam1) gehört nicht in religiöse Lehrinhalte — Trennung prüfen."],
};

function applyCorrections(record: KnowledgeArticleRecord): KnowledgeArticleRecord {
  const correction = CORRECTIONS[record.id];
  const notes = EDITORIAL_NOTES[record.id];
  if (!correction) return notes ? { ...record, editorialNotes: notes } : record;

  const body = (correction.bodyReplacements ?? []).reduce((text, [from, to]) => text.split(from).join(to), record.body);
  const sourceIds = correction.sourceIds ?? record.sourceIds;
  return {
    ...record,
    body,
    sourceIds,
    status: sourceIds.length > 0 ? record.status : "DRAFT",
    version: record.version + 1,
    corrections: [correction],
    editorialNotes: notes,
    legacy: record.legacy && { ...record.legacy, originalBody: record.body, originalSourceIds: record.sourceIds },
  };
}

export const KNOWLEDGE_CATALOG: KnowledgeArticleRecord[] = withRelated(
  [
    ...LEGACY_ARTICLE_FILES.flatMap(([file, articles]) => articles.map((a) => fromArticle(file, a))),
    ...cultureFilterCards.map(fromCultureCard),
    ...PAGE_TEXT_DRAFTS,
  ].map(applyCorrections)
);
