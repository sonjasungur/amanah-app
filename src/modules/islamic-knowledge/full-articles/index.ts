import drafts from "./p25-drafts.json";
import type { KnowledgeAreaId, ReviewRecord } from "../types";

/**
 * P2.5-E: full knowledge articles A–F as editorial drafts.
 *
 * Eight parts per article: introduction, Qur'an, Tafsir Ibn Kathir, Sunnah, differing views,
 * practical meaning, meaning for Amanah, sources and review status. Readable only in the internal
 * editorial view (/wissen/redaktion/artikel, isInternalToolsEnabled). There is deliberately no
 * public route and no publishing path: `isFullArticlePublishable` is always false. Recorded reviews by
 * qualified scholars (and lawyers for German-law parts) are a precondition only; publication needs
 * its own owner decision and code change. Only server components may import this module (test p25-knowledge.test.ts), so the texts never reach browser code.
 */
export interface FullArticleQuran {
  surah: number;
  ayah: number;
  why: string;
  /** Verbatim Bubenheim & Elyas (QuranEnc), unchanged. */
  germanVerbatim: string;
  arabic?: string;
  url: string;
  apiUrl?: string;
  fetchedAt: string;
  translationVersion?: string;
  translation?: string;
}

export interface FullArticleTafsir {
  surah: number;
  ayah: number;
  url: string;
  /** Own summary of the Arabic text, labelled "Zusammenfassung (Entwurf)". Never a quote. */
  summary: string;
  status: string;
  edition?: string;
  readAt?: string;
}

export interface FullArticleSunnah {
  collection: "bukhari" | "muslim";
  number: string;
  narrator: string;
  summary: string;
  explanation: string;
  context: string;
  mirrorUrl: string;
  mirrorMatch: boolean;
  sunnahComUrl: string;
  numberingNote?: string;
  verificationNote?: string;
  verification?: string;
  duaArabic?: string;
  duaGermanOwn?: string;
  duaSource?: string;
}

export interface FullArticleDraft {
  id: string;
  area: KnowledgeAreaId;
  subtopicIds: string[];
  replacesExisting: string[];
  title: string;
  summary: string;
  introduction: string[];
  quran: FullArticleQuran[];
  tafsir: FullArticleTafsir[];
  sunnah: FullArticleSunnah[];
  differingOpinions: string;
  practical: string;
  forAmanah: string;
  germanLaw: string;
  openQuestions: string[];
  status: "DRAFT";
  version: number;
  reviews: ReviewRecord[];
}

export const FULL_ARTICLE_DRAFTS: readonly FullArticleDraft[] = (drafts as unknown as { articles: FullArticleDraft[] }).articles;

export function getFullArticleDraft(id: string): FullArticleDraft | undefined {
  return FULL_ARTICLE_DRAFTS.find((a) => a.id === id);
}

/** Reviews an article needs before anyone may even consider publishing it. */
export function requiredFullArticleReviews(a: FullArticleDraft): ("source" | "scholar" | "legal")[] {
  return a.germanLaw.trim() ? ["source", "scholar", "legal"] : ["source", "scholar"];
}

/** Whether every required review is recorded for the current version (named reviewer, ISO date). */
export function fullArticleReviewsComplete(a: FullArticleDraft): boolean {
  const done = (kind: string) => a.reviews.some((r) => r.kind === kind && r.version === a.version && r.reviewer.trim() !== "" && /^\d{4}-\d{2}-\d{2}$/.test(r.reviewedAt));
  return requiredFullArticleReviews(a).every(done);
}

/**
 * Always false in P2.5: there is no publishing path for these drafts at all. Complete reviews are
 * a precondition, not a release; publication needs an explicit owner decision and its own change.
 * Automatic source and structure checks never count as a review.
 */
export function isFullArticlePublishable(article: FullArticleDraft): false {
  void article;
  return false;
}

/** Structural problems an editor must fix before handing the draft to reviewers. */
export function fullArticleIssues(a: FullArticleDraft): string[] {
  const issues: string[] = [];
  if (a.introduction.join("").trim().length < 400) issues.push("Einleitung zu kurz");
  if (!a.practical.trim()) issues.push("Praktische Bedeutung fehlt");
  if (!a.forAmanah.trim()) issues.push("Bedeutung für Amanah fehlt");
  if (!a.quran.length && !a.sunnah.length) issues.push("Weder Qur'an noch Sunnah belegt");
  for (const q of a.quran) {
    if (!q.germanVerbatim.trim()) issues.push(`Qur'an ${q.surah}:${q.ayah}: kein Wortlaut`);
    if (!q.url.includes("german_bubenheim")) issues.push(`Qur'an ${q.surah}:${q.ayah}: nicht Bubenheim/Elyas`);
  }
  for (const t of a.tafsir) if (!t.summary.startsWith("Zusammenfassung (Entwurf")) issues.push(`Tafsir ${t.surah}:${t.ayah}: nicht als Zusammenfassung gekennzeichnet`);
  for (const s of a.sunnah) {
    if (s.collection !== "bukhari" && s.collection !== "muslim") issues.push(`Hadith ${s.number}: Sammlung nicht zugelassen`);
    if (!s.mirrorMatch || !s.mirrorUrl) issues.push(`Hadith ${s.collection} ${s.number}: Nummer nicht gegengeprüft`);
    if (!s.narrator.trim()) issues.push(`Hadith ${s.collection} ${s.number}: Erzähler fehlt`);
    if (!s.summary.startsWith("Zusammenfassung (Entwurf")) issues.push(`Hadith ${s.collection} ${s.number}: nicht als Zusammenfassung gekennzeichnet`);
  }
  return issues;
}

/** What a reviewer must still confirm by hand, per article. Never empty for a draft. */
export function manualChecks(a: FullArticleDraft): string[] {
  const checks = [
    "Inhalt und Einordnung durch qualifizierte Gelehrte prüfen",
    `${a.sunnah.length} Hadith-Stellen auf sunnah.com von Hand prüfen (Nummer, Erzähler, Inhalt); automatische Abrufe sind dort gesperrt`,
  ];
  if (a.tafsir.length) checks.push(`${a.tafsir.length} Tafsir-Zusammenfassungen am Druckexemplar Ibn Kaṯīr (Dār Ṭayba) prüfen und Band/Seite ergänzen`);
  if (a.sunnah.some((s) => s.collection === "muslim")) checks.push("Muslim-Nummern (Buchstaben a, b …) sind aus dem Spiegel abgeleitet: auf sunnah.com bestätigen");
  if (a.germanLaw.trim()) checks.push("Abschnitt „Deutsches Recht“ durch Juristen prüfen");
  if (!a.differingOpinions.trim()) checks.push("Unterschiedliche Auffassungen: nicht belegt erfasst – prüfen, ob es welche gibt");
  return checks;
}
