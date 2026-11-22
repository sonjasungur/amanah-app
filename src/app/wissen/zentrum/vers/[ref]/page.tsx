import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { HADITH_COLLECTION_LABELS, getFullArticle, type FullArticle, type Paragraph } from "@/modules/islamic-knowledge/full-articles";
import { MixedText, anchor } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";

/**
 * P2.7 design sample (owner feedback 21.11.): one verse set as a reading text – title and verse reference at
 * once, the Arabic verse with generous space, the German translation right below, then explanation and
 * sources under plain sub-headings, one text width, even spacing, fine rules. Built only from the existing,
 * checked texts and sources of "Was sagt der Qurʾān über den Tod?". 404 unless the preview switch is on.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Āl ʿImrān 3:185 (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

/** The sample verses available as reading pages, with the article their texts come from. */
const SAMPLES: Record<string, { article: string; surah: number; ayah: number; surahName: string; surahArabic: string }> = {
  "3-185": { article: "p27-b-quran-tod", surah: 3, ayah: 185, surahName: "Āl ʿImrān", surahArabic: "آل عمران" },
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

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[var(--wz-gold-text)]">{children}</p>;
}

export default async function VerseSamplePage({ params }: { params: Promise<{ ref: string }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const { ref } = await params;
  const sample = SAMPLES[ref];
  const article = sample ? getFullArticle(sample.article) : undefined;
  if (!sample || !article) notFound();
  const quranRef = `Q${sample.surah}:${sample.ayah}`;
  const tafsirRef = `T${sample.surah}:${sample.ayah}`;
  const verse = article.sources.quran.find((q) => q.ref === quranRef);
  const tafsir = article.sources.tafsir.find((t) => t.ref === tafsirRef);
  if (!verse || !tafsir) notFound();
  const context = explaining(article, quranRef, tafsirRef);
  // Further sources the explanation names, listed with a link into the full article.
  const named = [...new Set(context.flatMap((p) => p.refs))].filter((r) => r !== quranRef && r !== tafsirRef);
  const hadith = named.map((r) => article.sources.hadith.find((h) => h.ref === r)).filter((h) => !!h);
  const verses = named.map((r) => article.sources.quran.find((q) => q.ref === r)).filter((q) => !!q);

  return (
    <div className="wz min-h-screen" data-testid="verse-sample" lang="de">
      <PreviewNote />
      <article className="px-5 pt-6 pb-16 sm:pt-10">
        <div className="mx-auto max-w-[46rem]">
          <nav className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--wz-muted)]" aria-label="Brotkrumen">
            <Link href="/wissen" className="wz-text-link">
              Islamisches Wissen
            </Link>
            <span aria-hidden>›</span>
            <Link href="/wissen/zentrum" className="wz-text-link" data-testid="back-to-centre">
              Wissenszentrum
            </Link>
            <span aria-hidden>›</span>
            <Link href="/wissen/zentrum/rubrik/2" className="wz-text-link">
              Tod, Sterben und Trauer
            </Link>
          </nav>

        </div>
        {/* Title and verse reference, recognisable at once; as wide as the verse panel so it fits one line on desktop. */}
        <div className="mx-auto max-w-[46rem]">
          <header className="mt-8 sm:mt-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--wz-gold-soft)] px-3 py-1 text-sm font-semibold text-[var(--wz-gold-text)]" data-testid="verse-reference">
              Qurʾān · {sample.surahName} {sample.surah}:{sample.ayah}
            </p>
            <h1 className="wz-serif mt-4 text-[2.1rem] leading-[1.12] sm:text-[2.6rem] font-semibold text-[var(--wz-green)] [text-wrap:pretty]">
              Jede Seele wird den Tod kosten
            </h1>
            <p className="mt-3 text-[var(--wz-muted)]">
              Sure {sample.surah} ({sample.surahName}), Vers {sample.ayah} – mit Übersetzung, Einordnung nach Ibn Kaṯīr und Quellen.
            </p>
          </header>
        </div>

        {/* Arabic verse with generous space, translation directly below */}
        <section className="mt-10 sm:mt-12" aria-label="Vers und Übersetzung" data-testid="sample-arabic">
          <figure className="wz-verse-panel mx-auto max-w-[46rem] rounded-2xl px-5 py-8 sm:px-12 sm:py-12">
            <p lang="ar" dir="rtl" className="wz-arabic wz-verse text-center" data-testid="verse-arabic">
              {verse.arabic}
              <span className="wz-verse-end"> ﴿{arabicNumber(sample.ayah)}﴾</span>
            </p>
            <div className="mx-auto mt-8 max-w-[34rem] border-t border-[var(--wz-line)] pt-6" data-testid="sample-translation">
              <blockquote className="wz-serif text-center text-[1.2rem] leading-relaxed sm:text-[1.35rem] text-[var(--wz-ink)]">„{verse.germanVerbatim}“</blockquote>
              <figcaption className="mt-4 text-center text-sm text-[var(--wz-muted)]">
                Bedeutungsübersetzung: ʿAbdullāh Frank Bubenheim und Nadeem Elyas ·{" "}
                <a href={verse.url} className="wz-text-link" rel="noreferrer">
                  vollständige Übersetzung
                </a>
              </figcaption>
            </div>
          </figure>
        </section>

        <div className="wz-prose">
          {/* Explanation */}
          <section className="mt-12 sm:mt-14" aria-labelledby="einordnung" data-testid="sample-explanation">
            <h2 id="einordnung" className="wz-serif text-[1.7rem] font-semibold text-[var(--wz-green)]">
              Einordnung
            </h2>
            <div className="mt-6 space-y-3">
              <Label>Was Ibn Kaṯīr erklärt · Zusammenfassung, kein Zitat</Label>
              <p>{withoutMarker(tafsir.summary)}</p>
            </div>
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
            <p className="mt-8 border-l-2 border-[var(--wz-gold)] pl-4 text-[var(--wz-muted)]">
              Weiterlesen: Der Beitrag{" "}
              <Link href={`/wissen/zentrum/artikel/${article.id}`} className="wz-text-link font-semibold">
                „{article.readerQuestion ?? article.title}“
              </Link>{" "}
              stellt {article.sources.quran.length} Verse und {article.sources.hadith.length} Hadithe zum Tod zusammen.
            </p>
          </section>

          <hr className="wz-hairline my-12 sm:my-14" />

          {/* Sources */}
          <section aria-labelledby="quellen" data-testid="sample-sources">
            <h2 id="quellen" className="wz-serif text-[1.7rem] font-semibold text-[var(--wz-green)]">
              Quellen
            </h2>
            <dl className="mt-6 divide-y divide-[var(--wz-line)] border-y border-[var(--wz-line)] text-[0.975rem]">
              <div className="py-4 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6" id={anchor(quranRef)}>
                <dt className="font-semibold">Qurʾān</dt>
                <dd className="mt-1 sm:mt-0 text-[var(--wz-muted)]">
                  {sample.surahName} {sample.surah}:{sample.ayah}. Arabischer Text und Übersetzung Bubenheim/Elyas nach QuranEnc ({verse.edition}).{" "}
                  <a href={verse.url} className="wz-text-link" rel="noreferrer">
                    QuranEnc
                  </a>
                </dd>
              </div>
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
                      <Link key={q.ref} href={`/wissen/zentrum/artikel/${article.id}#${anchor(q.ref)}`} className="wz-text-link">
                        {q.surah}:{q.ayah}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-sm text-[var(--wz-muted)]">Entwurf · Quellen gefunden und abgeglichen · fachliche Prüfung durch Gelehrte steht aus.</p>
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
