import { getSourcesByIds } from "@/lib/knowledge/sources";
import type { KnowledgeArticleRecord, ReviewKind } from "./types";
import { SUNNI_SCHOOL_LABELS } from "./types";
import { STATUS_LABELS, allSourceIds, requiredReviews, structuralIssues } from "./workflow";
import { getSourceCheck } from "./source-verification";
import { questionsByRole } from "./review-questions";

const ROLE_TITLES: Record<ReviewKind, string> = {
  source: "Quellenprüfung",
  scholar: "Prüfung durch islamische Fachperson",
  legal: "Juristische Fachprüfung",
};

/**
 * The review package as Markdown, for sending to reviewers. Same content as the internal
 * page /wissen/redaktion/paket/<id>. Reviewer fields stay empty; nothing is pre-approved.
 */
export function reviewPackageMarkdown(article: KnowledgeArticleRecord, generatedAt: string): string {
  const questions = questionsByRole(article);
  const lines: string[] = [
    `# Prüfpaket: ${article.title}`,
    "",
    `\`${article.id}\` · Version ${article.version} · ${STATUS_LABELS[article.status]} · erstellt ${generatedAt} · **nicht zur Veröffentlichung**`,
    "",
    "## 1. Text (Entwurf)",
    "",
    `_${article.summary}_`,
    "",
    ...article.body.split(/\n\s*\n/).flatMap((p) => [p, ""]),
  ];
  if (article.germanLawNote) lines.push(`> **Deutsches Recht:** ${article.germanLawNote}`, "");

  lines.push("## 2. Quellen", "");
  for (const s of getSourcesByIds(allSourceIds(article))) {
    lines.push(`### ${s.reference}`, "", `\`${s.id}\` · Prüfregister: ${getSourceCheck(s.id)?.finding ?? "nicht geprüft"}`, "");
    if (s.arabicText) lines.push(`<div dir="rtl" lang="ar">${s.arabicText}</div>`, "");
    if (s.translationDe) lines.push(`> ${s.translationDe}`, "");
    if (s.type === "quran") lines.push(`Übersetzung: ${s.translator} · ${s.translationVersion}`, "");
    else if (s.isParaphrase) lines.push("Eigene sinngemäße Wiedergabe.", "");
    for (const g of s.gradings ?? []) lines.push(`- Einstufung ${g.grader}: ${g.grade} (${g.source})`);
    if (s.url) lines.push("", s.url);
    lines.push("");
  }

  if ((article.schoolDifferences ?? []).length > 0) {
    lines.push("## 3. Fragen an die Rechtsschulen", "");
    for (const d of article.schoolDifferences ?? []) {
      lines.push(`**${d.question}**`, "", "| Schule | Position | Beleg / Werk |", "|---|---|---|");
      for (const [school, label] of Object.entries(SUNNI_SCHOOL_LABELS)) {
        const p = d.positions.find((x) => x.schools.includes(school as keyof typeof SUNNI_SCHOOL_LABELS));
        lines.push(`| ${label} | ${p?.position ?? ""} | ${p?.reference ?? ""} |`);
      }
      lines.push("");
    }
  }

  lines.push("## 4. Offene Punkte", "");
  for (const n of [...structuralIssues(article), ...(article.editorialNotes ?? [])]) lines.push(`- ${n}`);
  lines.push("", "## 5. Konkrete Prüffragen", "");
  for (const role of requiredReviews(article)) {
    lines.push(`### ${ROLE_TITLES[role]}`, "");
    questions[role].forEach((q, i) => lines.push(`${i + 1}. ${q.question}  ☐ ja ☐ nein · Anmerkung: ____`));
    lines.push("");
  }

  lines.push("## 6. Prüfvermerke (vom Prüfer auszufüllen)", "");
  for (const role of requiredReviews(article)) {
    lines.push(
      `### ${ROLE_TITLES[role]}`,
      "",
      "- Name und Qualifikation: ______________________",
      `- Datum: __________ · Geprüfte Version: ${article.version}`,
      "- Ergebnis: ☐ freigegeben ☐ Änderungen erforderlich ☐ abgelehnt",
      "- Anmerkungen: ______________________",
      "- Unterschrift: ______________________",
      ""
    );
  }
  return lines.join("\n");
}
