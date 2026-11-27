import Link from "next/link";
import { notFound } from "next/navigation";
import { isEditorialPreviewEnabled } from "@/lib/flags/knowledge-preview";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import { KNOWLEDGE_AREAS, STATUS_LABELS, getEditorialQueue, getSourceCheck } from "@/modules/islamic-knowledge";
import { ENTRY_ARTICLE, FULL_ARTICLES } from "@/modules/islamic-knowledge/full-articles";
import { RUBRICS, articlesInRubric } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { centreReviewState } from "@/modules/islamic-knowledge/full-articles/centre";
import { legacyCatalogCounts, legacyCatalogOverview } from "@/modules/islamic-knowledge/legacy-overview";

/** Decided per request: the preview switch is read at runtime (staging), never baked in at build time. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Redaktion Wissenszentrum — intern",
  robots: { index: false, follow: false },
};

/**
 * Internal review overview. Never public: drafts are shown here for reviewers only.
 * AP22 EA-05.7: the 33 knowledge centre articles are the main stock (with a link to the reader view); the older
 * catalog follows in its own section, marked as being replaced, with the replacing article and likely duplicates.
 */
export default function KnowledgeEditorialPage() {
  if (!isEditorialPreviewEnabled()) notFound();
  const queue = getEditorialQueue();
  const legacy = new Map(legacyCatalogOverview().map((e) => [e.id, e]));
  const counts = legacyCatalogCounts([...legacy.values()]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary mb-2">Redaktion: Prüfstatus Wissenszentrum</h1>
      <div className="mb-8 rounded-xl border border-border bg-card p-4 text-sm space-y-1" data-testid="editorial-counts">
        <p>
          <strong data-testid="centre-count">{FULL_ARTICLES.length} Beiträge im Wissenszentrum</strong> (Hauptbestand, 6 Rubriken)
          {ENTRY_ARTICLE ? " und die Einstiegsseite" : ""}. Alle Entwurf, fachliche Prüfung offen.
        </p>
        <p className="text-muted">
          Darunter getrennt: <span data-testid="legacy-count">{queue.length} Einträge im älteren Katalog</span> (wird abgelöst, nicht zusätzlich zu zählen):{" "}
          {counts.replaced} davon durch einen Beitrag des Wissenszentrums ersetzt, {counts.withDuplicates} mit möglicher Dublette (gleiches Unterthema),{" "}
          {queue.filter((q) => q.public).length} öffentlich.
        </p>
      </div>

      {/* Main stock: the knowledge centre */}
      <section aria-labelledby="hauptbestand" className="mb-14" data-testid="centre-stock">
        <h2 id="hauptbestand" className="text-xl font-bold text-primary mb-1">
          Wissenszentrum – Hauptbestand ({FULL_ARTICLES.length} Beiträge)
        </h2>
        <p className="text-sm text-muted mb-5">
          Kundenansicht: so sieht die Leserin den Beitrag (Vorschau). Prüfansicht: Absatzarten, Quellen und Prüfstand.{" "}
          <Link href="/wissen/zentrum" className="text-primary underline">
            Einstieg des Wissenszentrums öffnen
          </Link>
        </p>
        {RUBRICS.map((r) => {
          const list = articlesInRubric(r.nr);
          if (!list.length) return null;
          return (
            <div key={r.nr} className="mb-7">
              <h3 className="text-lg font-bold text-primary mb-2">
                Rubrik {r.nr}. {r.title} <span className="text-sm font-normal text-muted">({list.length})</span>
              </h3>
              <ul className="space-y-2">
                {list.map((a) => {
                  const state = centreReviewState(a);
                  return (
                    <li key={a.id} className="rounded-xl border border-border bg-card p-3" data-testid="centre-stock-article">
                      <span className="font-semibold">{a.readerQuestion ?? a.title}</span>
                      <span className="block text-xs text-muted">
                        {a.id} · Version {a.version} · Prüfstatus: {state.label} · offen: {state.openReviews.join(", ") || "nichts"}
                        {a.replacesExisting.length ? ` · ersetzt ${a.replacesExisting.length} ältere Katalogeinträge` : ""}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-4 text-sm">
                        <Link href={`/wissen/zentrum/artikel/${a.id}`} className="text-primary underline" data-testid="customer-view-link">
                          Kundenansicht
                        </Link>
                        <Link href={`/wissen/redaktion/artikel/${a.id}`} className="text-primary underline">
                          Prüfansicht
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Older catalog, being replaced */}
      <section aria-labelledby="alter-katalog" data-testid="legacy-catalog">
        <h2 id="alter-katalog" className="text-xl font-bold text-primary mb-1">
          Älterer Katalog (wird abgelöst) – {queue.length} Einträge
        </h2>
        <p className="text-sm text-muted mb-5">
          Frühere Artikel, Kulturfilter-Karten, Seitentexte und Startentwürfe. Sie sind nicht Teil des Wissenszentrums. „Ersetzt durch“ nennt den Beitrag, der den
          Eintrag ablöst; „mögliche Dublette“ nennt Einträge zum selben Unterthema.
        </p>
        {KNOWLEDGE_AREAS.map((area) => {
          const entries = queue.filter((q) => q.article.area === area.id);
          // An area without catalog entries gets no empty heading.
          if (!entries.length) return null;
          return (
            <div key={area.id} className="mb-10">
              <h3 className="text-lg font-bold text-primary mb-3">
                {area.letter}. {area.title} <span className="text-sm font-normal text-muted">({entries.length})</span>
              </h3>
              <div className="space-y-3">
                {entries.map(({ article, missing, blockedSources, issues, public: isPublic }) => {
                  const info = legacy.get(article.id);
                  return (
                    <details key={article.id} className="rounded-xl border border-border bg-card p-4" data-testid="legacy-entry">
                      <summary className="cursor-pointer">
                        <span className="font-semibold">{article.title}</span>{" "}
                        <span className="text-xs text-muted">
                          [{STATUS_LABELS[article.status]}
                          {isPublic ? " · öffentlich" : ""}] · {article.subtopicId}
                          {article.legacy?.claimedStatus ? ` · früher markiert: ${article.legacy.claimedStatus}` : ""}
                        </span>
                        {info && info.replacedBy.length > 0 && (
                          <span className="block text-xs mt-1" data-testid="legacy-replaced-by">
                            Ersetzt durch:{" "}
                            {info.replacedBy.map((a, i) => (
                              <span key={a.id}>
                                {i > 0 && ", "}
                                <Link href={`/wissen/zentrum/artikel/${a.id}`} className="text-primary underline">
                                  {a.readerQuestion ?? a.title}
                                </Link>
                              </span>
                            ))}
                          </span>
                        )}
                        {info && info.sameTopic.length > 0 && (
                          <span className="block text-xs mt-1 text-warning" data-testid="legacy-duplicate">
                            Mögliche Dublette ({info.sameTopic.length + 1}× Unterthema „{article.subtopicId}“): {info.sameTopic.map((o) => o.title).join(" · ")}
                          </span>
                        )}
                      </summary>
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="whitespace-pre-wrap">{article.body}</p>
                        {article.differingOpinions && <p className="italic">Auffassungen: {article.differingOpinions}</p>}
                        <p>
                          Quellen:{" "}
                          {article.sourceIds.length
                            ? getSourcesByIds(article.sourceIds).map((s) => s.reference).join(" · ")
                            : "keine — muss vor Quellenprüfung ergänzt werden"}
                        </p>
                        <p>Fehlende Prüfungen: {missing.length ? missing.join(", ") : "keine"}</p>
                        {issues.length > 0 && <p className="text-danger">Strukturprobleme: {issues.join(" ")}</p>}
                        {blockedSources.length > 0 && (
                          <ul className="text-danger">
                            {blockedSources.map((id) => (
                              <li key={id}>
                                {id}: {getSourceCheck(id)?.finding ?? "nicht geprüft"}
                              </li>
                            ))}
                          </ul>
                        )}
                        {article.editorialNotes?.map((n) => (
                          <p key={n} className="text-warning">Offen: {n}</p>
                        ))}
                        {article.corrections?.map((c) => (
                          <p key={c.reason} className="text-muted">Korrigiert {c.date} (Version {article.version}): {c.reason}</p>
                        ))}
                        {article.legacy && <p className="text-muted">Herkunft: {article.legacy.file} ({article.legacy.recordId})</p>}
                        <Link href={`/wissen/redaktion/paket/${article.id}`} className="text-primary underline">Prüfpaket öffnen (druckbar)</Link>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
