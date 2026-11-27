import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { quranAttribution } from "@/components/knowledge/zentrum/article-view";
import { ENTRY_ARTICLE, FULL_ARTICLES, HADITH_COLLECTION_LABELS, SOURCE_LEVEL_LABELS, getFullArticle, type FullArticle, type Paragraph, type QuranSource } from "@/modules/islamic-knowledge/full-articles";
import { getRubric } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { MixedText, anchor } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";
import { CentreHero } from "@/components/knowledge/zentrum/centre-ui";

/**
 * P2.7 design sample (owner feedback 21.11.): one verse set as a reading text – title and verse reference at
 * once, the Arabic verse with generous space, the German translation right below, then explanation and
 * sources under plain sub-headings, one text width, even spacing, fine rules. AP22 (EA-05.2): every verse the
 * articles quote has such a page, built only from the existing, checked texts and sources (verse, translation,
 * Ibn Kaṯīr summary where the article has one, the article's own explanation). 404 unless the preview switch is on.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Qurʾān-Vers (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

/** Verses with an editorial title and the Surah's name (the design sample). Others are named by Surah and verse. */
const SAMPLES: Record<string, { article: string; surahName: string; title: string }> = {
  "3-185": { article: "p27-b-quran-tod", surahName: "Āl ʿImrān", title: "Jede Seele wird den Tod kosten" },
};

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arabicNumber = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
const withoutMarker = (t: string) => t.replace(/^Zusammenfassung \(Entwurf\):\s*/, "");

/** Context paragraphs of the article that explain this verse (not the paragraph that only quotes it). */
function explaining(a: FullArticle, quranRef: string, tafsirRef: string): { kind: Paragraph["kind"]; text: string; refs: string[] }[] {
  return a.sections.flatMap((s) =>
    s.paragraphs
      .filter((p) => p.kind === "kontext" && [...(p.refs ?? []), ...(p.seeAlso ?? [])].some((r) => r === quranRef || r === tafsirRef))
      .map((p) => ({ kind: p.kind, text: p.text, refs: [...(p.refs ?? []), ...(p.seeAlso ?? [])] })),
  );
}

/** Every article quoting this verse; the one with the full Arabic text and an Ibn Kaṯīr summary first. */
function articlesWithVerse(surah: number, ayah: number): { article: FullArticle; verse: QuranSource }[] {
  const ref = `Q${surah}:${ayah}`;
  // The entry page quotes verses too; its verse links must lead somewhere.
  const found = [...FULL_ARTICLES, ...(ENTRY_ARTICLE ? [ENTRY_ARTICLE] : [])].flatMap((a) => {
    const verse = a.sources.quran.find((q) => q.ref === ref);
    return verse ? [{ article: a, verse }] : [];
  });
  const weight = (x: { article: FullArticle; verse: QuranSource }) =>
    (x.verse.arabic ? 4 : 0) + (x.verse.excerpt ? 0 : 2) + (x.article.sources.tafsir.some((t) => t.ref === `T${surah}:${ayah}`) ? 1 : 0);
  return found.sort((x, y) => weight(y) - weight(x));
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[var(--wz-gold-text)]">{children}</p>;
}

export default async function VerseSamplePage({ params }: { params: Promise<{ ref: string }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const { ref } = await params;
  const m = /^(\d{1,3})-(\d{1,3})$/.exec(ref);
  if (!m) notFound();
  const surah = Number(m[1]);
  const ayah = Number(m[2]);
  const sample = SAMPLES[ref];
  const quoting = articlesWithVerse(surah, ayah);
  const sampleArticle = sample ? getFullArticle(sample.article) : undefined;
  const main = sampleArticle ? quoting.find((x) => x.article.id === sampleArticle.id) : quoting[0];
  if (!main) notFound();
  const { article, verse } = main;
  const quranRef = `Q${surah}:${ayah}`;
  const tafsirRef = `T${surah}:${ayah}`;
  const tafsir = article.sources.tafsir.find((t) => t.ref === tafsirRef);
  const surahLabel = sample ? `${sample.surahName} ${surah}:${ayah}` : `Sure ${surah}, Vers ${ayah}`;
  const context = explaining(article, quranRef, tafsirRef);
  // Further sources the explanation names, listed with a link into the full article.
  const named = [...new Set(context.flatMap((p) => p.refs))].filter((r) => r !== quranRef && r !== tafsirRef);
  const hadith = named.map((r) => article.sources.hadith.find((h) => h.ref === r)).filter((h) => !!h);
  const verses = named.map((r) => article.sources.quran.find((q) => q.ref === r)).filter((q) => !!q);
  const rubric = article.rubric ? getRubric(article.rubric) : undefined;

  return (
    <div className="wz min-h-screen" data-testid="verse-sample" lang="de">
      <PreviewNote />
      <CentreHero
        crumbs={[
          { href: "/wissen/zentrum", label: "Islamisches Wissen" },
          ...(rubric ? [{ href: `/wissen/zentrum/rubrik/${rubric.nr}`, label: rubric.title }] : []),
          { label: `Qurʾān ${surah}:${ayah}` },
        ]}
        eyebrow={<span data-testid="verse-reference">Qurʾān · {surahLabel}</span>}
        title={sample?.title ?? `Qurʾān ${surah}:${ayah}`}
        lead={`Sure ${surah}${sample ? ` (${sample.surahName})` : ""}, Vers ${ayah} – mit Übersetzung Bubenheim/Elyas${tafsir ? ", Einordnung nach Ibn Kaṯīr" : ""} und Quellen.`}
      />
      <article className="px-5 pb-16">
        {/* Arabic verse with generous space, translation directly below */}
        <section className="mt-10 sm:mt-12" aria-label="Vers und Übersetzung" data-testid="sample-arabic">
          <figure className="wz-verse-panel mx-auto max-w-[46rem] rounded-2xl px-5 py-8 sm:px-12 sm:py-12">
            {verse.arabic ? (
              <p lang="ar" dir="rtl" className="wz-arabic wz-verse text-center" data-testid="verse-arabic">
                {verse.arabic}
                <span className="wz-verse-end"> ﴿{arabicNumber(ayah)}﴾</span>
              </p>
            ) : null}
            <div className="mx-auto mt-8 max-w-[34rem] border-t border-[var(--wz-line)] pt-6" data-testid="sample-translation">
              <p className="text-center text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[var(--wz-gold-text)] mb-3">
                {verse.excerpt ? "Bedeutungsübersetzung (Ausschnitt des Verses)" : "Bedeutungsübersetzung"}
              </p>
              <blockquote className="wz-serif text-center text-[1.2rem] leading-relaxed sm:text-[1.35rem] text-[var(--wz-ink)]">„{verse.germanVerbatim}“</blockquote>
              <figcaption className="mt-4 text-center text-sm text-[var(--wz-muted)]">
                <span className="block font-semibold text-[var(--wz-ink)]" data-testid="quran-reference">
                  Qurʾān {surah}:{ayah} · Übersetzung Bubenheim/Elyas
                </span>
                <a href={verse.url} className="wz-text-link" rel="noreferrer">
                  vollständige Übersetzung
                </a>
                <span className="block mt-1 text-xs" data-testid="quran-attribution">
                  {quranAttribution(verse)}
                </span>
              </figcaption>
            </div>
          </figure>
        </section>

        <div className="wz-prose">
          {/* Explanation */}
          {(tafsir || context.length > 0) && (
            <section className="mt-12 sm:mt-14" aria-labelledby="einordnung" data-testid="sample-explanation">
              <h2 id="einordnung" className="wz-serif text-[1.7rem] text-[var(--wz-green)]">
                Einordnung
              </h2>
              {tafsir && (
                <div className="mt-6 space-y-3">
                  <Label>Was Ibn Kaṯīr erklärt · Zusammenfassung, kein Zitat</Label>
                  <p>{withoutMarker(tafsir.summary)}</p>
                </div>
              )}
              {context.length > 0 && (
                <div className="mt-8 space-y-3">
                  <Label>Erläuterung der Redaktion</Label>
                  {context.map((p, i) => (
                    <p key={i}>
                      <MixedText text={p.text} />
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="mt-10 border-l-2 border-[var(--wz-gold)] pl-4 text-[var(--wz-muted)] space-y-2" data-testid="verse-articles">
            <p>Dieser Vers wird in {quoting.length === 1 ? "diesem Beitrag" : `diesen ${quoting.length} Beiträgen`} zitiert:</p>
            <ul className="space-y-1">
              {quoting.map((x) => (
                <li key={x.article.id}>
                  <Link href={`/wissen/zentrum/artikel/${x.article.id}#${anchor(quranRef)}`} className="wz-text-link font-semibold">
                    „{x.article.readerQuestion ?? x.article.title}“
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <hr className="wz-hairline my-12 sm:my-14" />

          {/* Sources */}
          <section aria-labelledby="quellen" data-testid="sample-sources">
            <h2 id="quellen" className="wz-serif text-[1.7rem] text-[var(--wz-green)]">
              Quellen
            </h2>
            <dl className="mt-6 divide-y divide-[var(--wz-line)] border-y border-[var(--wz-line)] text-[0.975rem]">
              <div className="py-4 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6" id={anchor(quranRef)}>
                <dt className="font-semibold">Qurʾān</dt>
                <dd className="mt-1 sm:mt-0 text-[var(--wz-muted)]">
                  {surahLabel}. {verse.arabic ? "Arabischer Text und " : ""}Übersetzung Bubenheim/Elyas nach QuranEnc ({verse.edition}).{" "}
                  <a href={verse.url} className="wz-text-link" rel="noreferrer">
                    QuranEnc
                  </a>
                </dd>
              </div>
              {tafsir && (
                <div className="py-4 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6" id={anchor(tafsirRef)}>
                  <dt className="font-semibold">Tafsīr</dt>
                  <dd className="mt-1 sm:mt-0 text-[var(--wz-muted)] space-y-1">
                    <span className="block">
                      Ibn Kaṯīr, arabische Ausgabe Dār Ṭayba (hg. as-Salāma):{" "}
                      {tafsir.printLocator ? `Bd. ${tafsir.printLocator.volume}, S. ${tafsir.printLocator.page} (nach dem Digitalisat, am Druck zu bestätigen)` : tafsir.locator}.
                    </span>
                    {tafsir.germanEdition && (
                      <span className="block">
                        Deutsche Ausgabe: {tafsir.germanEdition.title}, Band {tafsir.germanEdition.volume}, S. {tafsir.germanEdition.pages} ({tafsir.germanEdition.check}).
                      </span>
                    )}
                    <a href={tafsir.url} className="wz-text-link" rel="noreferrer">
                      Arabischer Text
                    </a>
                  </dd>
                </div>
              )}
              {hadith.length > 0 && (
                <div className="py-4 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-semibold">Hadithe</dt>
                  <dd className="mt-1 sm:mt-0 text-[var(--wz-muted)]">
                    <ul className="space-y-2">
                      {hadith.map((h) => (
                        <li key={h.ref}>
                          <Link href={`/wissen/zentrum/artikel/${article.id}#${anchor(h.ref)}`} className="wz-text-link">
                            {HADITH_COLLECTION_LABELS[h.collection]} Nr. {h.number}
                          </Link>
                          <span>
                            {" "}
                            – {h.narrator}
                            {h.grading?.length ? `; Einstufung: ${h.grading.map((g) => `${g.by}: ${g.grade}`).join(", ")}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {verses.length > 0 && (
                <div className="py-4 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-semibold">Weitere Verse</dt>
                  <dd className="mt-1 sm:mt-0 flex flex-wrap gap-x-3 gap-y-1">
                    {verses.map((q) => (
                      <Link key={q.ref} href={`/wissen/zentrum/vers/${q.surah}-${q.ayah}`} className="wz-text-link">
                        {q.surah}:{q.ayah}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-sm text-[var(--wz-muted)]">
              Entwurf · Qurʾān-Stelle redaktionell: {SOURCE_LEVEL_LABELS[verse.status.level]}
              {tafsir ? ` · Tafsīr-Zusammenfassung redaktionell: ${SOURCE_LEVEL_LABELS[tafsir.status.level]}` : ""} · fachliche Prüfung durch Gelehrte steht aus.
            </p>
          </section>

          <nav className="mt-12 flex flex-wrap justify-between gap-3" aria-label="Weiter">
            <Link href="/wissen/zentrum" className="wz-button wz-button-ghost" data-testid="sample-back">
              <ArrowLeft size={16} aria-hidden /> Zum Wissenszentrum
            </Link>
            <Link href={`/wissen/zentrum/artikel/${article.id}`} className="wz-button wz-button-primary">
              Ganzer Beitrag <ArrowRight size={16} aria-hidden />
            </Link>
          </nav>
        </div>
      </article>
    </div>
  );
}
