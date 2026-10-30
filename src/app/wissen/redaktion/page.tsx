import Link from "next/link";
import { notFound } from "next/navigation";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import { KNOWLEDGE_AREAS, STATUS_LABELS, getEditorialQueue, getSourceCheck } from "@/modules/islamic-knowledge";

export const metadata = {
  title: "Redaktion Wissenszentrum — intern",
  robots: { index: false, follow: false },
};

/** Internal review queue. Never public: drafts are shown here for reviewers only. */
export default function KnowledgeEditorialPage() {
  if (!isInternalToolsEnabled()) notFound();
  const queue = getEditorialQueue();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary mb-2">Redaktion: Prüfstatus Wissenszentrum</h1>
      <p className="text-sm text-muted mb-8">
        Interne Vorschau. {queue.length} Einträge, davon {queue.filter((q) => q.public).length} öffentlich.
      </p>
      {KNOWLEDGE_AREAS.map((area) => (
        <section key={area.id} className="mb-10">
          <h2 className="text-lg font-bold text-primary mb-3">{area.letter}. {area.title}</h2>
          <div className="space-y-3">
            {queue
              .filter((q) => q.article.area === area.id)
              .map(({ article, missing, blockedSources, issues, public: isPublic }) => (
                <details key={article.id} className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer">
                    <span className="font-semibold">{article.title}</span>{" "}
                    <span className="text-xs text-muted">
                      [{STATUS_LABELS[article.status]}{isPublic ? " · öffentlich" : ""}] · {article.subtopicId}
                      {article.legacy?.claimedStatus ? ` · früher markiert: ${article.legacy.claimedStatus}` : ""}
                    </span>
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
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
