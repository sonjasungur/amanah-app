import Link from "next/link";
import type { ReactNode } from "react";
import {
  HADITH_COLLECTION_LABELS,
  type FatwaSource,
  type FullArticle,
  type HadithSource,
  type LawSource,
  type Paragraph,
  type ParagraphKind,
  type QuranSource,
  type TafsirSource,
} from "@/modules/islamic-knowledge/full-articles";
import { explainLaw, shortLawTitle } from "@/lib/knowledge/law-explanations";
import { OpenDetailsOnHash } from "./open-details-on-hash";

/**
 * Reader view of the knowledge centre (P2.7). Server component only: the drafts never reach browser code.
 * Every block says what it is, so readers can tell apart the original text (Arabic), the translation,
 * a Tafsīr summary, a fatwa and the editors' own explanation.
 */

const ARABIC_FONT = { fontFamily: "var(--font-arabic), 'Noto Naskh Arabic', serif" } as const;
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arabicNumber = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
/** "Zusammenfassung (Entwurf): …" is the data's marker; the reader sees the block label instead. */
const withoutMarker = (t: string) => t.replace(/^Zusammenfassung \(Entwurf\):\s*/, "");
const AR = "\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF";
const ARABIC_RUN = new RegExp(`[${AR}](?:[${AR}\\s«»]*[${AR}])?`, "g");

/**
 * German text with Arabic quoted inside it: every Arabic run is isolated as its own right-to-left unit,
 * so verse numbers, colons and dashes around it keep their place and the run does not spill over.
 */
export function MixedText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(ARABIC_RUN)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push(
      <bdi key={m.index} lang="ar" dir="rtl" className="text-[1.15em]" style={ARABIC_FONT} data-inline-arabic="">
        {m[0]}
      </bdi>,
    );
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export const anchor = (ref: string) => `quelle-${ref.replace(/[^A-Za-z0-9-]/g, "-")}`;

const KIND: Record<ParagraphKind, { label: string; tone: string }> = {
  einleitung: { label: "Redaktionelle Erklärung", tone: "border-[var(--wz-line)]" },
  erklaerung: { label: "Redaktionelle Erklärung", tone: "border-[var(--wz-line)]" },
  praxis: { label: "Praktische Empfehlung der Redaktion", tone: "border-[var(--wz-line)]" },
  amanah: { label: "Redaktionelle Erklärung", tone: "border-[var(--wz-line)]" },
  quran: { label: "Zum Qurʾān – Erläuterung der Redaktion", tone: "border-[var(--wz-gold)]" },
  tafsir: { label: "Tafsīr Ibn Kaṯīr – Zusammenfassung", tone: "border-[var(--wz-green)]/45" },
  hadith: { label: "Zur Sunna – Erläuterung der Redaktion", tone: "border-[var(--wz-gold)]" },
  kontext: { label: "Einordnung der Redaktion", tone: "border-[var(--wz-line)]" },
  fiqh: { label: "Gelehrtenmeinungen – Zusammenfassung", tone: "border-[var(--wz-gold)]/60" },
  fatwa: { label: "Fatwa – Zusammenfassung", tone: "border-[var(--wz-gold)]/80" },
  recht: { label: "Deutsches Recht – nicht juristisch geprüft", tone: "border-[#5b7bb0]/60" },
  beispiel: { label: "Beispiel der Redaktion", tone: "border-[var(--wz-line)]" },
};

function BlockLabel({ children }: { children: ReactNode }) {
  return <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[var(--wz-gold-text)] mb-1.5">{children}</p>;
}

export function ArabicText({ text, suffix }: { text: string; suffix?: string }) {
  return (
    <p lang="ar" dir="rtl" className="wz-arabic text-right text-[1.45rem] leading-[2.2] text-[var(--wz-green-dark)]" style={ARABIC_FONT}>
      {text}
      {suffix ? <span className="whitespace-nowrap"> {suffix}</span> : null}
    </p>
  );
}

/**
 * Attribution required by the QuranEnc terms (translators as QuranEnc names them, source QuranEnc.com,
 * version number) plus the origin of the Arabic text. Owner order 23.11.2026; see the source matrix.
 */
export const QURAN_TRANSLATORS = "ʿAbdullah as-Sāmit (Frank Bubenheim) und Dr. Nadim Elias";
export function quranEncVersion(edition: string): string | null {
  return edition.match(/german_bubenheim v(\d+(?:\.\d+)+)/)?.[1] ?? null;
}
export function quranAttribution(q: { edition: string; arabic?: string }): string {
  const version = quranEncVersion(q.edition);
  return (
    `Übersetzung: ${QURAN_TRANSLATORS}. Quelle: QuranEnc.com${version ? `, Version ${version}` : ""}.` +
    (q.arabic ? " Arabischer Text: QuranEnc.com (Rasm des König-Fahd-Komplexes)." : "") +
    " Unveränderte Wiedergabe."
  );
}

export function QuranCard({ q }: { q: QuranSource }) {
  return (
    <figure className="wz-verse-panel rounded-2xl px-5 py-6 sm:px-8 sm:py-7 space-y-4" data-testid="quran-card">
      {q.arabic && (
        <div>
          <BlockLabel>Originaltext (arabisch)</BlockLabel>
          <ArabicText text={q.arabic} suffix={`﴿${arabicNumber(q.ayah)}﴾`} />
        </div>
      )}
      <div>
        <BlockLabel>{q.excerpt ? "Bedeutungsübersetzung (Ausschnitt des Verses)" : "Bedeutungsübersetzung (Auszug aus der Übersetzung)"}</BlockLabel>
        <blockquote className="wz-serif text-[1.125rem] leading-relaxed text-[var(--wz-ink)]">„{q.germanVerbatim}“</blockquote>
      </div>
      <figcaption className="text-sm text-[var(--wz-muted)] border-t border-[var(--wz-line)] pt-3">
        <span className="font-semibold text-[var(--wz-ink)]" data-testid="quran-reference">
          <bdi>Qurʾān {q.surah}:{q.ayah}</bdi> · Übersetzung Bubenheim/Elyas
        </span>{" "}
        ·{" "}
        <a href={q.url} className="wz-text-link" rel="noreferrer">
          vollständige Übersetzung
        </a>{" "}
        ·{" "}
        <Link href={`/wissen/zentrum/vers/${q.surah}-${q.ayah}`} className="wz-text-link" data-testid="verse-page-link">
          Versseite
        </Link>
        <span className="block mt-1 text-xs" data-testid="quran-attribution">
          {quranAttribution(q)}
        </span>
      </figcaption>
    </figure>
  );
}

function grading(h: HadithSource): string {
  if (h.collection === "bukhari" || h.collection === "muslim") return `überliefert in ${HADITH_COLLECTION_LABELS[h.collection]} (ṣaḥīḥ)`;
  return (h.grading ?? []).map((g) => `${g.by}: ${g.grade}`).join(" · ");
}

export function HadithCard({ h }: { h: HadithSource }) {
  return (
    <div className="wz-card rounded-2xl p-5 sm:p-6 space-y-3" data-testid="hadith-card">
      <p className="text-sm font-semibold text-[var(--wz-ink)]" data-testid="hadith-reference">
        Hadith · {HADITH_COLLECTION_LABELS[h.collection]} Nr. {h.number}
      </p>
      {h.arabicExcerpt && (
        <div>
          <BlockLabel>Originaltext (arabischer Auszug)</BlockLabel>
          <ArabicText text={h.arabicExcerpt} />
        </div>
      )}
      {h.germanRendering && (
        <div>
          <BlockLabel>Deutsche Wiedergabe der Redaktion</BlockLabel>
          <p>{h.germanRendering.replace(/^Deutsche Wiedergabe der Redaktion:\s*/, "")}</p>
        </div>
      )}
      <div>
        <BlockLabel>Inhalt – Zusammenfassung der Redaktion</BlockLabel>
        <p>{withoutMarker(h.summary)}</p>
      </div>
      <p className="text-sm text-[var(--wz-muted)] border-t border-[var(--wz-line)] pt-3" data-testid="hadith-meta">
        {HADITH_COLLECTION_LABELS[h.collection]} Nr. {h.number} · Erzähler: {h.narrator} · Einstufung: {grading(h)} ·{" "}
        <a href={h.sunnahComUrl} className="wz-text-link" rel="noreferrer">
          sunnah.com
        </a>
      </p>
    </div>
  );
}

export function TafsirCard({ t }: { t: TafsirSource }) {
  return (
    <div className="wz-card rounded-2xl p-5 sm:p-6 space-y-3 border-l-4 !border-l-[var(--wz-green)]/50" data-testid="tafsir-card">
      <BlockLabel>Tafsīr Ibn Kaṯīr – Zusammenfassung der Redaktion, kein Zitat</BlockLabel>
      <p>{withoutMarker(t.summary)}</p>
      <p className="text-sm text-[var(--wz-muted)] border-t border-[var(--wz-line)] pt-3">
        Fundstelle: {t.locator}
        {t.germanEdition && (
          <>
            {" "}· Deutsche Ausgabe: {t.germanEdition.title}, Band {t.germanEdition.volume}, S. {t.germanEdition.pages} ({t.germanEdition.check})
          </>
        )}{" "}
        ·{" "}
        <a href={t.url} className="wz-text-link" rel="noreferrer">
          arabischer Text
        </a>
      </p>
    </div>
  );
}

export function FatwaCard({ f }: { f: FatwaSource }) {
  return (
    <div className="wz-card rounded-2xl p-5 sm:p-6 space-y-3 border-l-4 !border-l-[var(--wz-gold)]" data-testid="fatwa-card">
      <BlockLabel>{f.type === "fatwa" ? "Fatwa" : "Gelehrtenaussage"}: {f.author}</BlockLabel>
      <p>
        <span className="font-semibold">Ursprüngliche Frage: </span>
        {f.question}
      </p>
      {f.arabicExcerpt && (
        <div>
          <BlockLabel>Originaltext (Auszug)</BlockLabel>
          <ArabicText text={f.arabicExcerpt} />
        </div>
      )}
      <div>
        <BlockLabel>Inhalt – Zusammenfassung der Redaktion</BlockLabel>
        <p>{withoutMarker(f.summary)}</p>
      </div>
      <p className="text-sm text-[var(--wz-muted)] border-t border-[var(--wz-line)] pt-3">
        {f.work}
        {f.edition ? `, ${f.edition}` : ""} · {f.locator}
        {f.date ? ` · ${f.date}` : ""} ·{" "}
        <a href={f.url} className="wz-text-link" rel="noreferrer">
          Originalquelle
        </a>
      </p>
    </div>
  );
}

export function LawCard({ l }: { l: LawSource }) {
  return (
    <div className="wz-card rounded-2xl p-4 sm:p-5" data-testid="law-card">
      <p className="font-semibold">{l.title}</p>
      <p className="text-sm text-[var(--wz-muted)]">
        {l.jurisdiction} · abgerufen am {l.retrievedAt} ·{" "}
        <a href={l.url} className="wz-text-link" rel="noreferrer">
          amtlicher Text
        </a>
      </p>
    </div>
  );
}

type AnySource =
  | { type: "quran"; s: QuranSource }
  | { type: "tafsir"; s: TafsirSource }
  | { type: "hadith"; s: HadithSource }
  | { type: "fatwa"; s: FatwaSource }
  | { type: "law"; s: LawSource };

export function sourceIndex(a: FullArticle): Map<string, AnySource> {
  const m = new Map<string, AnySource>();
  for (const s of a.sources.quran) m.set(s.ref, { type: "quran", s });
  for (const s of a.sources.tafsir) m.set(s.ref, { type: "tafsir", s });
  for (const s of a.sources.hadith) m.set(s.ref, { type: "hadith", s });
  for (const s of a.sources.fatwa ?? []) m.set(s.ref, { type: "fatwa", s });
  for (const s of a.sources.law) m.set(s.ref, { type: "law", s });
  return m;
}

export function SourceCard({ src }: { src: AnySource }) {
  switch (src.type) {
    case "quran":
      return <QuranCard q={src.s} />;
    case "tafsir":
      return <TafsirCard t={src.s} />;
    case "hadith":
      return <HadithCard h={src.s} />;
    case "fatwa":
      return <FatwaCard f={src.s} />;
    case "law":
      return <LawCard l={src.s} />;
  }
}

export function sourceTitle(src: AnySource): string {
  switch (src.type) {
    case "quran":
      return `Qurʾān, Sure ${src.s.surah}, Vers ${src.s.ayah}`;
    case "tafsir":
      return `Tafsīr Ibn Kaṯīr zu ${src.s.surah}:${src.s.ayah}`;
    case "hadith":
      return `${HADITH_COLLECTION_LABELS[src.s.collection]} Nr. ${src.s.number}`;
    case "fatwa":
      return `${src.s.author}, ${src.s.locator}`;
    case "law":
      return src.s.title;
  }
}

/** Sources shown in full right under the paragraph: the original texts and summaries of its own kind. */
const INLINE: Partial<Record<ParagraphKind, AnySource["type"][]>> = {
  quran: ["quran"],
  hadith: ["hadith"],
  tafsir: ["tafsir"],
  fatwa: ["fatwa"],
};

function ParagraphBlock({ p, index, shown }: { p: Paragraph; index: Map<string, AnySource>; shown: Set<string> }) {
  const meta = KIND[p.kind] ?? KIND.erklaerung;
  const inline = (p.refs ?? []).map((r) => index.get(r)).filter((s): s is AnySource => !!s && (INLINE[p.kind] ?? []).includes(s.type));
  const fresh = inline.filter((s) => !shown.has(s.s.ref));
  fresh.forEach((s) => shown.add(s.s.ref));
  const chips = [...(p.refs ?? []), ...(p.seeAlso ?? [])].filter((r) => index.has(r));
  return (
    <div className={`border-l-2 pl-4 sm:pl-5 py-1 space-y-4 ${meta.tone}`} data-kind={p.kind}>
      <div>
        <BlockLabel>{meta.label}</BlockLabel>
        <p className="whitespace-pre-line [overflow-wrap:anywhere]">
          <MixedText text={p.text} />
        </p>
        {chips.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm" data-testid="paragraph-refs">
            <span className="text-[var(--wz-muted)]">Belege:</span>
            {chips.map((r) => (
              <a key={r} href={`#${anchor(r)}`} className="wz-text-link">
                {sourceTitle(index.get(r)!)}
              </a>
            ))}
          </p>
        )}
      </div>
      {fresh.map((s) => (
        <SourceCard key={s.s.ref} src={s} />
      ))}
    </div>
  );
}

export function ArticleBody({ article }: { article: FullArticle }) {
  const index = sourceIndex(article);
  const shown = new Set<string>();
  return (
    <div className="space-y-12">
      {article.leadAnswer && (
        <section className="wz-card wz-topic rounded-2xl p-5 sm:p-7" data-testid="lead-answer">
          <h2 className="wz-serif text-[1.35rem] font-semibold text-[var(--wz-green)] mb-2">Kurz beantwortet</h2>
          <BlockLabel>Redaktionelle Zusammenfassung des Artikels</BlockLabel>
          <p className="leading-relaxed">{article.leadAnswer}</p>
        </section>
      )}
      {article.sections.map((s, i) => (
        <section key={`${s.key}-${i}`} className="space-y-6" data-section={s.key}>
          <h2 className="wz-serif text-[1.55rem] sm:text-[1.7rem] leading-tight font-semibold text-[var(--wz-green)] [text-wrap:balance]">{s.title}</h2>
          {s.paragraphs.map((p, j) => (
            <ParagraphBlock key={j} p={p} index={index} shown={shown} />
          ))}
        </section>
      ))}
      {article.nextStep && (
        <section className="rounded-2xl bg-[var(--wz-green)] text-white p-5 sm:p-7" data-testid="next-step">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#F2CF6C] mb-1.5">Für deine Vorsorge</p>
          <h2 className="wz-serif text-[1.35rem] font-semibold mb-1">Dein nächster Schritt</h2>
          <p>{article.nextStep}</p>
        </section>
      )}
    </div>
  );
}

/** All sources with stable anchors, so every "Belege" link and every fatwa link from another article lands here. */
const SOURCE_GROUPS: { type: AnySource["type"]; label: string }[] = [
  { type: "quran", label: "Qurʾān" },
  { type: "tafsir", label: "Tafsīr" },
  { type: "hadith", label: "Hadithe" },
  { type: "fatwa", label: "Fatwas und Gelehrte" },
  { type: "law", label: "Deutsches Recht" },
];

/** One line per norm: number and title, what it is about, link to the official text (owner acceptance 27.11.2026). */
function LawRow({ l }: { l: LawSource }) {
  const explanation = explainLaw(l.title);
  return (
    <li id={anchor(l.ref)} className="scroll-mt-24 py-3 border-b border-[var(--wz-line)] last:border-b-0" data-testid="law-row">
      <p className="font-semibold text-[var(--wz-ink)]">{shortLawTitle(l.title)}</p>
      {explanation && <p className="text-[0.95rem] text-[var(--wz-ink)]/85 mt-0.5">{explanation}</p>}
      <p className="text-xs text-[var(--wz-muted)] mt-1">
        {l.jurisdiction} · abgerufen am {l.retrievedAt} ·{" "}
        <a href={l.url} className="wz-text-link" rel="noreferrer">
          Gesetzestext
        </a>
      </p>
    </li>
  );
}

export function SourceList({ article }: { article: FullArticle }) {
  const index = sourceIndex(article);
  if (!index.size) return null;
  const all = [...index.values()];
  return (
    <section className="space-y-3" aria-labelledby="quellen-titel" data-testid="source-list">
      <OpenDetailsOnHash />
      <h2 id="quellen-titel" className="wz-serif text-[1.55rem] sm:text-[1.7rem] font-semibold text-[var(--wz-green)]">
        Quellen dieses Artikels
      </h2>
      <p className="text-sm text-[var(--wz-muted)]">Nach Art geordnet. Zum Aufklappen auf eine Gruppe tippen.</p>
      {SOURCE_GROUPS.map(({ type, label }) => {
        const items = all.filter((s) => s.type === type);
        if (!items.length) return null;
        return (
          <details key={type} className="wz-card rounded-2xl p-4 sm:p-5" data-testid={`source-group-${type}`}>
            <summary className="cursor-pointer font-semibold text-[var(--wz-green)]">
              {label} <span className="font-normal text-[var(--wz-muted)]">({items.length})</span>
            </summary>
            {type === "law" ? (
              <ul className="mt-2">
                {items.map((src) => (
                  <LawRow key={src.s.ref} l={src.s as LawSource} />
                ))}
              </ul>
            ) : (
              <div className="mt-4 space-y-5">
                {items.map((src) => (
                  <div key={src.s.ref} id={anchor(src.s.ref)} className="scroll-mt-24 space-y-2">
                    <p className="text-sm font-semibold text-[var(--wz-ink)]">{sourceTitle(src)}</p>
                    <SourceCard src={src} />
                  </div>
                ))}
              </div>
            )}
          </details>
        );
      })}
    </section>
  );
}

export function OpenQuestions({ article }: { article: FullArticle }) {
  if (!article.openQuestions.length) return null;
  const FOR = { gelehrte: "Gelehrte", jurist: "Juristen", redaktion: "Redaktion" } as const;
  return (
    <details className="wz-card rounded-2xl p-4 sm:p-5 text-[0.975rem]" data-testid="open-questions">
      <summary className="font-semibold cursor-pointer text-[var(--wz-green)]">Noch offen: {article.openQuestions.length} Punkte zur fachlichen Prüfung</summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        {article.openQuestions.map((q, i) => (
          <li key={i}>
            {q.question} <span className="text-[var(--wz-muted)]">({FOR[q.for]})</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function DraftBanner() {
  return (
    <div className="rounded-xl border-2 border-amber-500/60 bg-amber-50 p-3 text-sm" role="note" data-testid="draft-banner">
      <strong>Vorschau, nicht veröffentlicht.</strong> Entwurf des Wissenszentrums; die fachliche Prüfung durch islamische
      Fachpersonen und Juristen steht aus. Keine Fatwa und keine Rechtsberatung.
    </div>
  );
}

export function ArticleLink({ a, badge }: { a: FullArticle; badge?: ReactNode }) {
  return (
    <Link href={`/wissen/zentrum/artikel/${a.id}`} className="wz-card wz-card-link block rounded-2xl p-4 sm:p-5" data-testid="centre-article-link">
      <span className="wz-serif text-[1.15rem] leading-snug text-[var(--wz-green)]">{a.readerQuestion ?? a.title}</span>
      <span className="block text-[0.95rem] text-[var(--wz-muted)] mt-1.5">{a.summary}</span>
      {badge && <span className="block mt-3">{badge}</span>}
    </Link>
  );
}
