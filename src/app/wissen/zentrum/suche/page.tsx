import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { searchCentre } from "@/modules/islamic-knowledge/full-articles/centre";
import { RUBRICS } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { MixedText } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";
import { CentreHero, CentreSearchForm, ReviewState } from "@/components/knowledge/zentrum/centre-ui";

/**
 * AP22 EA-05.3: search over titles, texts and sources of all knowledge centre articles. Runs on the server, so
 * the drafts never reach browser code and no external service is involved. 404 unless the preview switch is on.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Suche im Wissenszentrum (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

const EXAMPLES = ["Ghusl", "Drittel", "Schulden", "4:11", "Buḫārī", "Pflichtteil", "Trauer"];

export default async function CentreSearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const raw = (await searchParams).q;
  const query = (typeof raw === "string" ? raw : "").trim().slice(0, 120);
  const hits = query ? searchCentre(query) : [];
  return (
    <div className="wz min-h-screen" data-testid="centre-search">
      <PreviewNote />
      <CentreHero
        crumbs={[{ href: "/wissen/zentrum", label: "Islamisches Wissen" }, { label: "Suche" }]}
        eyebrow="Suche im Wissenszentrum"
        title={query ? `Ergebnisse für „${query}“` : "Was möchtest du wissen?"}
        lead="Durchsucht werden Titel und Fragen, die Texte der Beiträge und ihre Quellen: Qurʾān-Stellen, Hadith-Sammlungen und Nummern, Tafsīr, Fatwas und Gesetze."
      >
        <CentreSearchForm query={query} className="mt-7" onDark />
      </CentreHero>
      <main className="mx-auto max-w-[46rem] px-5 pt-10 pb-16 space-y-6">
        {query && (
          <p className="text-[var(--wz-muted)]" role="status" data-testid="centre-search-count">
            {hits.length === 0 ? "Kein Beitrag gefunden." : `${hits.length} ${hits.length === 1 ? "Beitrag" : "Beiträge"} gefunden.`}
          </p>
        )}
        <ol className="space-y-3" data-testid="centre-search-results">
          {hits.map((h) => (
            <li key={h.article.id}>
              <Link href={`/wissen/zentrum/artikel/${h.article.id}`} className="wz-card wz-card-link block rounded-2xl p-4 sm:p-5" data-testid="centre-search-hit">
                {h.rubricTitle && <span className="wz-eyebrow block text-[0.7rem]">{h.rubricTitle}</span>}
                <span className="wz-serif mt-1 block text-[1.15rem] leading-snug text-[var(--wz-green)]">{h.article.readerQuestion ?? h.article.title}</span>
                <span className="mt-2 block text-[0.95rem] text-[var(--wz-muted)] [overflow-wrap:anywhere]">
                  <MixedText text={h.snippet} />
                </span>
                <span className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[var(--wz-muted)]">Gefunden in: {h.fields.join(", ")}</span>
                  <ReviewState article={h.article} compact />
                </span>
              </Link>
            </li>
          ))}
        </ol>
        {(!query || hits.length === 0) && (
          <section className="space-y-4" data-testid="centre-search-help">
            <p className="font-semibold text-[var(--wz-green)]">Beispiele</p>
            <p className="flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <Link key={e} href={`/wissen/zentrum/suche?q=${encodeURIComponent(e)}`} className="rounded-full border border-[var(--wz-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--wz-green)] hover:border-[var(--wz-gold)]">
                  {e}
                </Link>
              ))}
            </p>
            <p className="font-semibold text-[var(--wz-green)] pt-2">Oder eine Rubrik öffnen</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {RUBRICS.map((r) => (
                <li key={r.nr}>
                  <Link href={`/wissen/zentrum/rubrik/${r.nr}`} className="wz-text-link">
                    {r.nr}. {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
