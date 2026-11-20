import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { KNOWLEDGE_AREAS } from "@/modules/islamic-knowledge";
import {
  FULL_ARTICLES,
  OPEN_EDITORIAL_TASKS,
  SOURCE_LEVEL_LABELS,
  VERIFICATION,
  allSources,
  articleWords,
  fullArticleIssues,
  sourceLevelCounts,
  type SourceLevel,
} from "@/modules/islamic-knowledge/full-articles";
import { OwnerReviewExport, OwnerReviewImport, OwnerReviewSummary } from "@/components/knowledge/owner-review";

export const metadata = { title: "Prüfbereich Wissensartikel — intern", robots: { index: false, follow: false } };

const SHOWN: SourceLevel[] = ["inhalt_geprueft", "wortlaut_abgeglichen", "stelle_gefunden", "nicht_geprueft"];

/** P2.6 review area: all drafts by area A–F with their source states. Internal only; nothing is public. */
export default async function FullArticleDraftsPage() {
  // Decide per request: the flag is read at runtime, never baked into a prerendered page.
  await connection();
  if (!isInternalToolsEnabled()) notFound();
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="rounded-xl border-2 border-warning/50 bg-warning/10 p-3 text-sm font-semibold mb-6" data-testid="draft-banner">
        Redaktionsentwürfe – ungeprüft, nicht veröffentlicht. Nur für die Prüfung durch die Betreiberin, Gelehrte und Juristen.
      </p>
      <h1 className="text-2xl font-bold text-primary mb-2">Prüfbereich: Wissensartikel A–F</h1>
      <p className="text-sm text-muted mb-3">
        {FULL_ARTICLES.length} Artikel. Qur’an wörtlich nach Bubenheim &amp; Elyas (QuranEnc), Tafsir Ibn Kaṯīr als eigene
        Zusammenfassung des arabischen Textes, Hadithe nur aus Sahih al-Bukhari und Sahih Muslim. Jeder Absatz ist einer Kategorie
        zugeordnet; jede Quelle hat ihren Prüfstand. „Inhalt und Kontext geprüft“ heißt: redaktionell durch Claude, keine
        fachliche Freigabe.
      </p>
      {VERIFICATION && (
        <p className="text-sm mb-6" data-testid="verification-summary">
          Unabhängige Gegenprüfung ({VERIFICATION.checkedAt.slice(0, 10)}): Qur’an {VERIFICATION.quran.exact} von {VERIFICATION.quran.total} zeichengleich mit QuranEnc;
          Hadith-Nummern {VERIFICATION.hadith.numberFound} von {VERIFICATION.hadith.total} im Spiegel, arabischer Auszug {VERIFICATION.hadith.arabicMatches} von {VERIFICATION.hadith.total} wörtlich gefunden.
        </p>
      )}
      <div className="mb-8 flex flex-wrap items-start gap-3" data-testid="owner-review-tools">
        <OwnerReviewExport />
        <OwnerReviewImport knownKeys={FULL_ARTICLES.flatMap((a) => allSources(a).map((s) => `${a.id}#${s.ref}`))} />
        <p className="basis-full text-xs text-muted">
          Ihr Prüfstand liegt nur in diesem Browser. Bitte nach jeder Sitzung exportieren; „Prüfung aus Datei laden“ führt eine
          Exportdatei wieder zusammen, ohne etwas zu löschen.
        </p>
      </div>
      {OPEN_EDITORIAL_TASKS.length > 0 && (
        <section className="mb-8 rounded-xl border border-border bg-card p-4" data-testid="editorial-tasks">
          <h2 className="text-lg font-bold text-primary mb-2">Redaktionelle Aufgaben (noch ohne Entwurf)</h2>
          <ul className="space-y-2 text-sm">
            {OPEN_EDITORIAL_TASKS.map((t) => (
              <li key={t.subtopicId}>
                <span className="font-semibold">{t.title}</span> <span className="block text-muted">{t.needs}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {KNOWLEDGE_AREAS.map((area) => {
        const list = FULL_ARTICLES.filter((a) => a.area === area.id);
        if (!list.length) return null;
        return (
          <section key={area.id} className="mb-8">
            <h2 className="text-lg font-bold text-primary mb-2">
              {area.letter}. {area.title}
            </h2>
            <ul className="space-y-2">
              {list.map((a) => {
                const counts = sourceLevelCounts(a);
                const issues = fullArticleIssues(a).length;
                return (
                  <li key={a.id} className="rounded-xl border border-border bg-card p-3" data-testid="review-article">
                    <Link href={`/wissen/redaktion/artikel/${a.id}`} className="font-semibold text-primary underline">
                      {a.title}
                    </Link>
                    <span className="block text-xs text-muted">
                      {a.id} · Entwurf v{a.version} · {articleWords(a).toLocaleString("de-DE")} Wörter · {a.openQuestions.length} offene Fragen
                      {issues ? ` · ${issues} Strukturhinweise` : ""}
                    </span>
                    <span className="block text-xs mt-1">
                      {SHOWN.filter((l) => counts[l]).map((l) => `${SOURCE_LEVEL_LABELS[l]}: ${counts[l]}`).join(" · ")} · Fachliche Freigabe: offen
                    </span>
                    <span className="block text-xs text-muted">
                      <OwnerReviewSummary articleId={a.id} refs={allSources(a).map((s) => s.ref)} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
