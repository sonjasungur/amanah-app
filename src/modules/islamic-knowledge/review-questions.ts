import type { IslamicSource } from "@/lib/types";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import type { KnowledgeArticleRecord, ReviewKind } from "./types";
import { allSourceIds, requiredReviews } from "./workflow";

/**
 * Concrete questions for each reviewer role, derived deterministically from the article:
 * its sources, its open editorial markers and its open school questions. Questions only —
 * answers come from the reviewers and are never pre-filled.
 */
export interface ReviewQuestion {
  role: ReviewKind;
  question: string;
  /** What the question refers to (source id, marker, school question). */
  ref?: string;
}

const MARKER = /\[(Redaktion|Juristische Prüfung):\s*([^\]]+)\]/g;

function sourceQuestions(source: IslamicSource): string[] {
  if (source.type === "quran") {
    return [
      `${source.reference}: Stimmt der arabische Text mit dem Uthmani-Text (Tanzil 1.1) und die Übersetzung wörtlich mit QuranEnc ${source.translationVersion ?? ""} überein?`.replace(/\s+\?/, "?"),
    ];
  }
  if (source.type === "hadith") {
    const questions = [`${source.reference}: Stimmt die Nummer mit der genannten Zählung (sunnah.com) und einer gedruckten Ausgabe überein? Bitte Ausgabe nennen.`];
    if (source.isParaphrase) questions.push(`${source.reference}: Gibt die eigene sinngemäße Wiedergabe den Inhalt ohne Zuspitzung oder Auslassung wieder?`);
    if (source.gradings?.length) {
      questions.push(`${source.reference}: Sind die angegebenen Einstufungen (${source.gradings.map((g) => g.grader).join(", ")}) in den gedruckten Werken belegbar?`);
    }
    return questions;
  }
  return [`„${source.title}“ (${source.reference}): Welches konkrete Werk (Titel, Band, Seite) belegt diese Aussage?`];
}

export function reviewQuestions(article: KnowledgeArticleRecord): ReviewQuestion[] {
  const roles = new Set(requiredReviews(article));
  const questions: ReviewQuestion[] = [];

  for (const source of getSourcesByIds(allSourceIds(article))) {
    for (const question of sourceQuestions(source)) questions.push({ role: "source", question, ref: source.id });
  }
  questions.push({ role: "source", question: "Fehlen Belege für Aussagen im Text, oder stützt eine Quelle eine Aussage nicht?" });

  const texts = [article.body, article.summary, article.germanLawNote ?? "", article.differingOpinions ?? ""].join("\n");
  for (const match of texts.matchAll(MARKER)) {
    const role: ReviewKind = match[1] === "Redaktion" ? "scholar" : "legal";
    questions.push({ role, question: `Offener Punkt: ${match[2].trim()}`, ref: match[0].slice(0, 40) });
  }
  for (const d of article.schoolDifferences ?? []) {
    if (d.positions.length === 0) {
      questions.push({ role: "scholar", question: `${d.question} – Position je Rechtsschule (Ḥanafī, Mālikī, Shāfiʿī, Ḥanbalī) mit Werk und Stelle.`, ref: d.question });
    }
  }
  questions.push(
    { role: "scholar", question: "Ist eine Aussage als einzige Meinung dargestellt, obwohl die Rechtsschulen abweichen?" },
    { role: "scholar", question: "Ist der Text für Laien in Deutschland verständlich, ohne eine individuelle Fatwa zu ersetzen?" }
  );
  if (roles.has("legal")) {
    questions.push(
      { role: "legal", question: "Sind alle Aussagen zum deutschen Recht zutreffend und die Normen richtig zitiert?" },
      { role: "legal", question: "Bleibt der Text allgemeine Information ohne Rechtsdienstleistung im Einzelfall (§ 2 RDG)?" },
      { role: "legal", question: "Ist klar getrennt, was religiöse Lehre und was in Deutschland rechtlich wirksam ist?" }
    );
  }
  return questions;
}

export function questionsByRole(article: KnowledgeArticleRecord): Record<ReviewKind, ReviewQuestion[]> {
  const grouped: Record<ReviewKind, ReviewQuestion[]> = { source: [], scholar: [], legal: [] };
  for (const q of reviewQuestions(article)) grouped[q.role].push(q);
  return grouped;
}
