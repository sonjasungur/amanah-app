import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { KNOWLEDGE_AREAS } from "@/modules/islamic-knowledge";
import { FULL_ARTICLE_DRAFTS, OPEN_EDITORIAL_TASKS, fullArticleIssues } from "@/modules/islamic-knowledge/full-articles";

export const metadata = { title: "Artikelentwürfe A–F — intern", robots: { index: false, follow: false } };

/** P2.5-E: list of the full article drafts. Internal only; nothing here is public or reviewed. */
export default async function FullArticleDraftsPage() {
  // Decide per request: the flag is read at runtime, never baked into a prerendered page.
  await connection();
  if (!isInternalToolsEnabled()) notFound();
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="rounded-xl border-2 border-warning/50 bg-warning/10 p-3 text-sm font-semibold mb-6" data-testid="draft-banner">
        Redaktionsentwürfe – ungeprüft, nicht veröffentlicht. Nur für Prüferinnen und Prüfer.
      </p>
      <h1 className="text-2xl font-bold text-primary mb-2">Vollständige Artikel A–F (Entwürfe)</h1>
      <p className="text-sm text-muted mb-8">
        {FULL_ARTICLE_DRAFTS.length} Entwürfe. Qur’an wörtlich nach Bubenheim &amp; Elyas (QuranEnc), Tafsir Ibn Kaṯīr als eigene
        Zusammenfassung, Hadithe nur aus Bukhari und Muslim. Jede Stelle braucht noch die Prüfung von Hand.
      </p>
      <section className="mb-8 rounded-xl border border-border bg-card p-4" data-testid="editorial-tasks">
        <h2 className="text-lg font-bold text-primary mb-2">Redaktionelle Aufgaben (noch ohne Entwurf)</h2>
        <ul className="space-y-2 text-sm">
          {OPEN_EDITORIAL_TASKS.map((t) => (
            <li key={t.subtopicId}>
              <span className="font-semibold">{t.title}</span> <span className="text-xs text-muted">({t.area} · {t.subtopicId} · {t.status})</span>
              <span className="block text-muted">{t.needs}</span>
            </li>
          ))}
        </ul>
      </section>
      {KNOWLEDGE_AREAS.map((area) => {
        const list = FULL_ARTICLE_DRAFTS.filter((a) => a.area === area.id);
        if (!list.length) return null;
        return (
          <section key={area.id} className="mb-8">
            <h2 className="text-lg font-bold text-primary mb-2">
              {area.letter}. {area.title}
            </h2>
            <ul className="space-y-2">
              {list.map((a) => (
                <li key={a.id} className="rounded-xl border border-border bg-card p-3">
                  <Link href={`/wissen/redaktion/artikel/${a.id}`} className="font-semibold text-primary underline">
                    {a.title}
                  </Link>
                  <span className="block text-xs text-muted">
                    {a.id} · Entwurf v{a.version} · {a.quran.length} Verse · {a.tafsir.length} Tafsir · {a.sunnah.length} Hadithe · {a.openQuestions.length} offene Fragen
                    {fullArticleIssues(a).length ? ` · ${fullArticleIssues(a).length} Strukturhinweise` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
