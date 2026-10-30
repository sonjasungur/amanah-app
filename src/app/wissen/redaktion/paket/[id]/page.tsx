import { notFound } from "next/navigation";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import {
  KNOWLEDGE_CATALOG,
  STATUS_LABELS,
  SUNNI_SCHOOL_LABELS,
  allSourceIds,
  getKnowledgeArea,
  getSourceCheck,
  requiredReviews,
  structuralIssues,
} from "@/modules/islamic-knowledge";

export const metadata = { title: "Prüfpaket — intern", robots: { index: false, follow: false } };

const REVIEW_TITLES = { source: "Quellenprüfung", scholar: "Prüfung durch islamische Fachperson", legal: "Juristische Fachprüfung" } as const;

/** Printable review package for scholars and lawyers. Internal only; reviewer fields stay empty. */
export default async function ReviewPackagePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isInternalToolsEnabled()) notFound();
  const { id } = await params;
  const article = KNOWLEDGE_CATALOG.find((a) => a.id === id);
  if (!article) notFound();

  const area = getKnowledgeArea(article.area);
  const sources = getSourcesByIds(allSourceIds(article));
  const issues = structuralIssues(article);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 text-sm leading-relaxed print:px-0">
      <header className="border-b border-border pb-4 mb-6">
        <p className="text-xs text-muted">Prüfpaket · nicht zur Veröffentlichung · {new Date().toLocaleDateString("de-DE")}</p>
        <h1 className="text-2xl font-bold text-primary mt-1">{article.title}</h1>
        <p className="text-muted">
          {article.id} · Version {article.version} · {STATUS_LABELS[article.status]} · Bereich {area.letter} ({area.title}) ·{" "}
          {article.requiresLegalReview ? "mit juristischer Prüfung" : "ohne juristische Prüfung"}
        </p>
      </header>

      <section className="mb-6">
        <h2 className="font-bold mb-2">1. Text (Entwurf)</h2>
        <p className="italic mb-2">{article.summary}</p>
        {article.body.split(/\n\s*\n/).map((p, i) => (
          <p key={i} className="mb-2">{p}</p>
        ))}
        {article.germanLawNote && (
          <div className="mt-3 border border-border p-3">
            <p className="font-semibold">Kasten „Deutsches Recht“</p>
            <p>{article.germanLawNote}</p>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-bold mb-2">2. Quellen ({sources.length})</h2>
        {sources.map((s) => (
          <div key={s.id} className="border border-border p-3 mb-3 break-inside-avoid">
            <p className="font-semibold">{s.reference}</p>
            <p className="text-xs text-muted">
              {s.id} · Prüfregister: {getSourceCheck(s.id)?.finding ?? "nicht geprüft"}
            </p>
            {s.arabicText && <p lang="ar" dir="rtl" className="text-base mt-2">{s.arabicText}</p>}
            {s.translationDe && <p className="mt-2">{s.translationDe}</p>}
            <p className="text-xs text-muted mt-1">
              {s.type === "quran" ? `Übersetzung: ${s.translator} · ${s.translationVersion}` : s.isParaphrase ? "Eigene sinngemäße Wiedergabe" : ""}
            </p>
            {s.gradings?.map((g) => (
              <p key={g.grader} className="text-xs">Einstufung {g.grader}: {g.grade} ({g.source})</p>
            ))}
            {s.url && <p className="text-xs break-all">{s.url}</p>}
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="font-bold mb-2">3. Fragen an die Rechtsschulen</h2>
        {(article.schoolDifferences ?? []).length === 0 && <p className="text-muted">Keine Streitfragen erfasst – bitte prüfen, ob welche fehlen.</p>}
        {(article.schoolDifferences ?? []).map((d) => (
          <table key={d.question} className="w-full border border-border mb-3 text-xs">
            <caption className="text-left font-semibold py-1">{d.question}</caption>
            <thead>
              <tr>
                <th className="border border-border p-1 text-left w-28">Schule</th>
                <th className="border border-border p-1 text-left">Position</th>
                <th className="border border-border p-1 text-left w-40">Beleg / Werk</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SUNNI_SCHOOL_LABELS).map(([school, label]) => {
                const position = d.positions.find((p) => p.schools.includes(school as keyof typeof SUNNI_SCHOOL_LABELS));
                return (
                  <tr key={school}>
                    <td className="border border-border p-1">{label}</td>
                    <td className="border border-border p-1 h-10">{position?.position ?? ""}</td>
                    <td className="border border-border p-1">{position?.reference ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="font-bold mb-2">4. Offene Punkte</h2>
        <ul className="list-disc pl-5">
          {[...issues, ...(article.editorialNotes ?? [])].map((n) => (
            <li key={n}>{n}</li>
          ))}
          {article.corrections?.map((c) => (
            <li key={c.reason}>Korrektur {c.date}: {c.reason}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">5. Prüfvermerke (vom Prüfer auszufüllen)</h2>
        {requiredReviews(article).map((kind) => (
          <div key={kind} className="border border-border p-3 mb-3 break-inside-avoid">
            <p className="font-semibold">{REVIEW_TITLES[kind]}</p>
            <p>Name und Qualifikation: ______________________________________________</p>
            <p>Datum: ________________ Geprüfte Version: {article.version}</p>
            <p>Ergebnis: ☐ freigegeben ☐ Änderungen erforderlich ☐ abgelehnt</p>
            <p>Anmerkungen: ________________________________________________________</p>
            <p className="mt-4">Unterschrift: ______________________________________</p>
          </div>
        ))}
      </section>
    </article>
  );
}
