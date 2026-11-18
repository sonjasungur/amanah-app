import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { getKnowledgeArea } from "@/modules/islamic-knowledge";
import { fullArticleIssues, getFullArticleDraft, manualChecks, requiredFullArticleReviews } from "@/modules/islamic-knowledge/full-articles";

export const metadata = { title: "Artikelentwurf — intern", robots: { index: false, follow: false } };

const COLLECTION = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim" } as const;
const REVIEW = { source: "Quellenprüfung", scholar: "Prüfung durch islamische Fachperson", legal: "Juristische Prüfung" } as const;

function Part({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-8" aria-labelledby={`part-${n}`}>
      <h2 id={`part-${n}`} className="text-xl font-bold text-primary border-b border-border pb-1 mb-3">
        {n}. {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const Prose = ({ text, empty }: { text: string; empty: string }) =>
  text.trim() ? (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-wrap">{p}</p>
      ))}
    </>
  ) : (
    <p className="text-warning">{empty}</p>
  );

/** One full article draft in its eight parts. Internal reading view for editors and reviewers only. */
export default async function FullArticleDraftPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isInternalToolsEnabled()) notFound();
  const { id } = await params;
  const a = getFullArticleDraft(id);
  if (!a) notFound();
  const area = getKnowledgeArea(a.area);
  const issues = fullArticleIssues(a);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 leading-relaxed" lang="de">
      <p className="rounded-xl border-2 border-warning/50 bg-warning/10 p-3 text-sm font-semibold" data-testid="draft-banner">
        Entwurf – ungeprüft, nicht veröffentlicht. Keine Fatwa und keine Rechtsberatung. Nicht weitergeben.
      </p>
      <p className="text-xs text-muted mt-4">
        <Link href="/wissen/redaktion/artikel" className="underline">Alle Entwürfe</Link> · Bereich {area.letter} ({area.title}) · {a.id} · Version {a.version} · Status: Entwurf
      </p>
      <h1 className="text-3xl font-bold text-primary mt-2">{a.title}</h1>
      <p className="text-lg text-muted mt-2">{a.summary}</p>

      <Part n={1} title="Einleitung">
        {a.introduction.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Part>

      <Part n={2} title="Qur’an">
        {a.quran.length === 0 && <p className="text-warning">Keine Qur’an-Stelle zugeordnet.</p>}
        {a.quran.map((q) => (
          <div key={`${q.surah}:${q.ayah}`} className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted">
              Sure {q.surah}, Vers {q.ayah} · Bubenheim &amp; Elyas ({q.translationVersion ?? "QuranEnc"}) · abgerufen {q.fetchedAt}
            </p>
            {q.arabic && (
              <p dir="rtl" lang="ar" className="text-xl mt-2" style={{ fontFamily: "var(--font-arabic), serif" }}>
                {q.arabic}
              </p>
            )}
            <blockquote className="mt-2 border-l-4 border-emerald/40 pl-3">{q.germanVerbatim}</blockquote>
            <p className="text-sm text-muted mt-2">Warum diese Stelle: {q.why}</p>
            <a href={q.url} className="text-xs text-primary underline" rel="noreferrer">
              {q.url}
            </a>
          </div>
        ))}
      </Part>

      <Part n={3} title="Tafsir Ibn Kaṯīr (eigene Zusammenfassung)">
        {a.tafsir.length === 0 && <p className="text-warning">Kein Tafsir-Abschnitt zugeordnet.</p>}
        {a.tafsir.map((t) => (
          <div key={`${t.surah}:${t.ayah}`} className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted">
              Zu Sure {t.surah}, Vers {t.ayah} · {t.status} · Band/Seite: vom Prüfer am Druckexemplar zu ergänzen
            </p>
            <p className="mt-1">{t.summary}</p>
            <a href={t.url} className="text-xs text-primary underline" rel="noreferrer">
              {t.url}
            </a>
          </div>
        ))}
      </Part>

      <Part n={4} title="Sunnah (Sahih al-Bukhari, Sahih Muslim)">
        {a.sunnah.map((s) => (
          <div key={`${s.collection}-${s.number}`} className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted">
              {COLLECTION[s.collection]} {s.number} · Erzähler: {s.narrator} · Nummer im Spiegel {s.mirrorMatch ? "gefunden" : "NICHT gefunden"} · sunnah.com: von Hand zu prüfen
            </p>
            <p className="mt-1">{s.summary}</p>
            {s.duaArabic && (
              <p dir="rtl" lang="ar" className="text-lg mt-2" style={{ fontFamily: "var(--font-arabic), serif" }}>
                {s.duaArabic}
              </p>
            )}
            {s.duaGermanOwn && <p className="text-sm mt-1">Eigene deutsche Wiedergabe (Entwurf): {s.duaGermanOwn}</p>}
            <p className="text-sm mt-2"><span className="font-semibold">Erklärung:</span> {s.explanation}</p>
            <p className="text-sm"><span className="font-semibold">Zusammenhang:</span> {s.context}</p>
            {(s.numberingNote || s.verificationNote) && <p className="text-xs text-warning mt-1">{s.numberingNote ?? s.verificationNote}</p>}
            <p className="text-xs mt-1">
              <a href={s.sunnahComUrl} className="text-primary underline" rel="noreferrer">{s.sunnahComUrl}</a> ·{" "}
              <a href={s.mirrorUrl} className="text-primary underline" rel="noreferrer">Spiegel</a>
            </p>
          </div>
        ))}
      </Part>

      <Part n={5} title="Unterschiedliche Auffassungen">
        <Prose text={a.differingOpinions} empty="Keine belegten Unterschiede erfasst. Prüfer: Gibt es welche?" />
      </Part>

      <Part n={6} title="Praktische Bedeutung für Muslime in Deutschland">
        <Prose text={a.practical} empty="Fehlt." />
      </Part>

      <Part n={7} title="Bedeutung für Amanah">
        <Prose text={a.forAmanah} empty="Fehlt." />
        {a.germanLaw.trim() && (
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
            <p className="text-xs font-semibold text-warning">Deutsches Recht – nur allgemein, juristisch zu prüfen</p>
            <Prose text={a.germanLaw} empty="" />
          </div>
        )}
      </Part>

      <Part n={8} title="Quellen und Prüfstatus">
        <p>
          Erforderliche Prüfungen: {requiredFullArticleReviews(a).map((k) => REVIEW[k]).join(", ")}. Erfasst: {a.reviews.length ? a.reviews.map((r) => `${REVIEW[r.kind]} (${r.reviewer}, ${r.reviewedAt})`).join("; ") : "keine"}.
        </p>
        <div data-testid="manual-checks">
          <p className="font-semibold">Von Hand zu prüfen</p>
          <ul className="list-disc pl-5">
            {manualChecks(a).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        {issues.length > 0 && (
          <div>
            <p className="font-semibold text-danger">Strukturhinweise</p>
            <ul className="list-disc pl-5 text-danger">
              {issues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="font-semibold">Offene Fragen an Gelehrte und Juristen ({a.openQuestions.length})</p>
          <ol className="list-decimal pl-5">
            {a.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </div>
        {a.replacesExisting.length > 0 && <p className="text-sm text-muted">Bündelt bestehende Einträge: {a.replacesExisting.join(", ")} (diese bleiben unverändert, bis die Redaktion entscheidet).</p>}
        <p className="text-sm text-muted">Unterthemen: {a.subtopicIds.join(", ")}</p>
      </Part>
    </article>
  );
}
