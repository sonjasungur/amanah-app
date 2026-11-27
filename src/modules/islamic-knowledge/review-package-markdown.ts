import { getSourcesByIds } from "@/lib/knowledge/sources";
import type { KnowledgeArticleRecord, ReviewKind } from "./types";
import { SUNNI_SCHOOL_LABELS } from "./types";
import { STATUS_LABELS, allSourceIds, requiredReviews, structuralIssues } from "./workflow";
import { blockingSources, getSourceCheck, type SourceCheckStatus } from "./source-verification";
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

const CHECK_STATUS: Record<SourceCheckStatus, string> = {
  checked_ok: "technisch abgeglichen",
  needs_correction: "**blockiert: Korrektur nötig**",
};

/** One checklist for the scholars across all articles. Questions only; every answer field stays empty. */
export function scholarChecklistMarkdown(articles: KnowledgeArticleRecord[], generatedAt: string): string {
  const lines: string[] = [
    "# Prüfliste für islamische Fachpersonen",
    "",
    `Erzeugt ${generatedAt} mit \`npm run export:review-packages\`. **Nicht zur Veröffentlichung, keine Fatwa, nichts vorausgefüllt.**`,
    "",
    "Volltext, Quellen und Prüfvermerke stehen im Prüfpaket des jeweiligen Artikels. Es erscheint nichts, bevor Quellen- und Fachprüfung (bei deutschem Recht zusätzlich die juristische Prüfung) für genau diese Version vermerkt sind.",
    "",
    "## A. Grundsatzfragen an das Gremium",
    "",
    "1. Welche Rechtsschulen soll das Wissenszentrum darstellen, und in welchem Umfang?  ☐ festgelegt · Anmerkung: ____",
    "2. Wie sollen Punkte mit Meinungsverschiedenheit dargestellt werden, und wann darf von Übereinstimmung gesprochen werden?  ☐ festgelegt · Anmerkung: ____",
    "3. Welche Werke gelten für die Schulpositionen als Beleg (Titel, Band, Seite)?  ☐ festgelegt · Anmerkung: ____",
    "4. Wer darf Hadith-Einstufungen und Wiedergaben endgültig bestätigen?  ☐ festgelegt · Anmerkung: ____",
    "5. Wie werden Angaben wiederholt geprüft, wenn sich ein Text ändert (je Version)?  ☐ festgelegt · Anmerkung: ____",
    "",
    "## B. Artikel",
    "",
  ];
  for (const article of articles) {
    const scholar = questionsByRole(article).scholar;
    lines.push(`### ${article.title}`, "", `\`${article.id}\` · Version ${article.version} · [Prüfpaket](${article.id}.md)`, "");
    scholar.forEach((q, i) => lines.push(`${i + 1}. ${q.question}  ☐ ja ☐ nein · Anmerkung: ____`));
    lines.push("", "Ergebnis: ☐ freigegeben ☐ Änderungen erforderlich ☐ abgelehnt · Name, Qualifikation, Datum: ____", "");
  }
  return lines.join("\n");
}

/** Every source of the articles with its technical check. The check never replaces the human review. */
export function sourceOverviewMarkdown(articles: KnowledgeArticleRecord[], generatedAt: string): string {
  const usedBy = new Map<string, string[]>();
  for (const article of articles) {
    for (const id of allSourceIds(article)) usedBy.set(id, [...(usedBy.get(id) ?? []), article.id]);
  }
  const ids = [...usedBy.keys()].sort();
  const sources = getSourcesByIds(ids);
  const known = new Set(sources.map((s) => s.id));
  const lines: string[] = [
    "# Quellenübersicht der Startartikel",
    "",
    `Erzeugt ${generatedAt} mit \`npm run export:review-packages\`. **Nicht zur Veröffentlichung.**`,
    "",
    "„Technisch abgeglichen“ heißt nur: Fundstelle und Wortlaut wurden maschinell verglichen. Das ersetzt nicht die Quellenprüfung durch eine Fachperson.",
    "",
    `Quellen gesamt: ${ids.length} · blockiert oder ungeprüft: ${blockingSources(ids).length}`,
    "",
    "| Fundstelle | Art | Technischer Abgleich | Befund | Artikel | Fachprüfung (Name, Datum) |",
    "|---|---|---|---|---|---|",
  ];
  for (const s of sources) {
    const check = getSourceCheck(s.id);
    const status = check ? CHECK_STATUS[check.status] : "**nicht geprüft**";
    lines.push(`| ${s.reference} | ${s.type} | ${status} | ${check?.finding ?? "–"} | ${usedBy.get(s.id)!.join(", ")} | ____ |`);
  }
  for (const id of ids.filter((x) => !known.has(x))) {
    lines.push(`| \`${id}\` | unbekannt | **nicht im Quellenregister** | – | ${usedBy.get(id)!.join(", ")} | ____ |`);
  }
  lines.push("");
  return lines.join("\n");
}
