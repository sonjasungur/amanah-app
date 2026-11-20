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
  einleitung: { label: "Redaktionelle Erklärung", tone: "border-border" },
  erklaerung: { label: "Redaktionelle Erklärung", tone: "border-border" },
  praxis: { label: "Praktische Empfehlung der Redaktion", tone: "border-border" },
  amanah: { label: "Redaktionelle Erklärung", tone: "border-border" },
  quran: { label: "Zum Qurʾān – Erläuterung der Redaktion", tone: "border-emerald/50" },
  tafsir: { label: "Tafsīr Ibn Kaṯīr – Zusammenfassung", tone: "border-primary/40" },
  hadith: { label: "Zur Sunna – Erläuterung der Redaktion", tone: "border-emerald/50" },
  kontext: { label: "Einordnung der Redaktion", tone: "border-border" },
  fiqh: { label: "Gelehrtenmeinungen – Zusammenfassung", tone: "border-amber-400/60" },
  fatwa: { label: "Fatwa – Zusammenfassung", tone: "border-amber-500/70" },
  recht: { label: "Deutsches Recht – nicht juristisch geprüft", tone: "border-sky-500/50" },
  beispiel: { label: "Beispiel der Redaktion", tone: "border-border" },
};

function BlockLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">{children}</p>;
}

export function ArabicText({ text, suffix }: { text: string; suffix?: string }) {
  return (
    <p lang="ar" dir="rtl" className="text-right text-xl leading-[2.1] text-foreground" style={ARABIC_FONT}>
      {text}
      {suffix ? <span className="whitespace-nowrap"> {suffix}</span> : null}
    </p>
  );
}

export function QuranCard({ q }: { q: QuranSource }) {
  return (
    <div className="rounded-xl bg-accent-soft/50 p-4 space-y-2" data-testid="quran-card">
      {q.arabic && (
        <div>
          <BlockLabel>Originaltext (arabisch)</BlockLabel>
          <ArabicText text={q.arabic} suffix={`﴿${arabicNumber(q.ayah)}﴾`} />
        </div>
      )}
      <div>
        <BlockLabel>{q.excerpt ? "Bedeutungsübersetzung (Ausschnitt des Verses)" : "Bedeutungsübersetzung (Auszug aus der Übersetzung)"}</BlockLabel>
        <p className="text-foreground">„{q.germanVerbatim}“</p>
      </div>
      <p className="text-xs text-muted">
        <bdi>Sure {q.surah}, Vers {q.ayah}</bdi> · Übersetzung: ʿAbdullāh Frank Bubenheim und Nadeem Elyas ·{" "}
        <a href={q.url} className="text-primary underline" rel="noreferrer">
          vollständige Übersetzung
        </a>
      </p>
    </div>
  );
}

function grading(h: HadithSource): string {
  if (h.collection === "bukhari" || h.collection === "muslim") return `überliefert in ${HADITH_COLLECTION_LABELS[h.collection]} (ṣaḥīḥ)`;
  return (h.grading ?? []).map((g) => `${g.by}: ${g.grade}`).join(" · ");
}

export function HadithCard({ h }: { h: HadithSource }) {
  return (
    <div className="rounded-xl bg-accent-soft/50 p-4 space-y-2" data-testid="hadith-card">
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
        <p className="text-sm">{withoutMarker(h.summary)}</p>
      </div>
      <p className="text-xs text-muted" data-testid="hadith-meta">
        {HADITH_COLLECTION_LABELS[h.collection]} Nr. {h.number} · Erzähler: {h.narrator} · Einstufung: {grading(h)} ·{" "}
        <a href={h.sunnahComUrl} className="text-primary underline" rel="noreferrer">
          sunnah.com
        </a>
      </p>
    </div>
  );
}

export function TafsirCard({ t }: { t: TafsirSource }) {
  return (
    <div className="rounded-xl bg-muted/5 border border-border p-4 space-y-2" data-testid="tafsir-card">
      <BlockLabel>Tafsīr Ibn Kaṯīr – Zusammenfassung der Redaktion, kein Zitat</BlockLabel>
      <p className="text-sm">{withoutMarker(t.summary)}</p>
      <p className="text-xs text-muted">
        Fundstelle: {t.locator}
        {t.germanEdition && (
          <>
            {" "}· Deutsche Ausgabe: {t.germanEdition.title}, Band {t.germanEdition.volume}, S. {t.germanEdition.pages} ({t.germanEdition.check})
          </>
        )}{" "}
        ·{" "}
        <a href={t.url} className="text-primary underline" rel="noreferrer">
          arabischer Text
        </a>
      </p>
    </div>
  );
}

export function FatwaCard({ f }: { f: FatwaSource }) {
  return (
    <div className="rounded-xl border-2 border-amber-500/40 bg-amber-50/40 p-4 space-y-2" data-testid="fatwa-card">
      <BlockLabel>{f.type === "fatwa" ? "Fatwa" : "Gelehrtenaussage"}: {f.author}</BlockLabel>
      <p className="text-sm">
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
        <p className="text-sm">{withoutMarker(f.summary)}</p>
      </div>
      <p className="text-xs text-muted">
        {f.work}
        {f.edition ? `, ${f.edition}` : ""} · {f.locator}
        {f.date ? ` · ${f.date}` : ""} ·{" "}
        <a href={f.url} className="text-primary underline" rel="noreferrer">
          Originalquelle
        </a>
      </p>
    </div>
  );
}

export function LawCard({ l }: { l: LawSource }) {
  return (
    <div className="rounded-xl border border-sky-500/30 p-3 text-sm" data-testid="law-card">
      <p className="font-semibold">{l.title}</p>
      <p className="text-xs text-muted">
        {l.jurisdiction} · abgerufen am {l.retrievedAt} ·{" "}
        <a href={l.url} className="text-primary underline" rel="noreferrer">
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
    <div className={`border-l-4 pl-4 py-1 space-y-3 ${meta.tone}`} data-kind={p.kind}>
      <div>
        <BlockLabel>{meta.label}</BlockLabel>
        <p className="leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
          <MixedText text={p.text} />
        </p>
        {chips.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs" data-testid="paragraph-refs">
            <span className="text-muted">Belege:</span>
            {chips.map((r) => (
              <a key={r} href={`#${anchor(r)}`} className="text-primary underline">
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
    <div className="space-y-8">
      {article.leadAnswer && (
        <section className="rounded-2xl border-2 border-emerald/40 bg-accent-soft/40 p-5" data-testid="lead-answer">
          <h2 className="text-lg font-bold text-primary-dark mb-2">Kurz beantwortet</h2>
          <BlockLabel>Redaktionelle Zusammenfassung des Artikels</BlockLabel>
          <p className="leading-relaxed">{article.leadAnswer}</p>
        </section>
      )}
      {article.sections.map((s, i) => (
        <section key={`${s.key}-${i}`} className="space-y-4" data-section={s.key}>
          <h2 className="text-xl font-bold text-primary-dark">{s.title}</h2>
          {s.paragraphs.map((p, j) => (
            <ParagraphBlock key={j} p={p} index={index} shown={shown} />
          ))}
        </section>
      ))}
      {article.nextStep && (
        <section className="rounded-2xl border-2 border-primary/30 bg-white p-5" data-testid="next-step">
          <h2 className="text-lg font-bold text-primary-dark mb-1">Dein nächster Schritt</h2>
          <p>{article.nextStep}</p>
        </section>
      )}
    </div>
  );
}

/** All sources with stable anchors, so every "Belege" link and every fatwa link from another article lands here. */
export function SourceList({ article }: { article: FullArticle }) {
  const index = sourceIndex(article);
  if (!index.size) return null;
  return (
    <section className="space-y-3" aria-labelledby="quellen-titel" data-testid="source-list">
      <h2 id="quellen-titel" className="text-xl font-bold text-primary-dark">
        Quellen dieses Artikels
      </h2>
      {[...index.values()].map((src) => (
        <div key={src.s.ref} id={anchor(src.s.ref)} className="scroll-mt-24 space-y-1">
          <p className="text-sm font-semibold">{sourceTitle(src)}</p>
          <SourceCard src={src} />
        </div>
      ))}
    </section>
  );
}

export function OpenQuestions({ article }: { article: FullArticle }) {
  if (!article.openQuestions.length) return null;
  const FOR = { gelehrte: "Gelehrte", jurist: "Juristen", redaktion: "Redaktion" } as const;
  return (
    <details className="rounded-xl border border-border p-4 text-sm" data-testid="open-questions">
      <summary className="font-semibold cursor-pointer">Noch offen: {article.openQuestions.length} Punkte zur fachlichen Prüfung</summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        {article.openQuestions.map((q, i) => (
          <li key={i}>
            {q.question} <span className="text-muted">({FOR[q.for]})</span>
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

export function ArticleLink({ a }: { a: FullArticle }) {
  return (
    <Link href={`/wissen/zentrum/artikel/${a.id}`} className="block rounded-xl border border-border p-4 hover:border-primary/50" data-testid="centre-article-link">
      <span className="font-semibold text-primary-dark">{a.readerQuestion ?? a.title}</span>
      <span className="block text-sm text-muted mt-1">{a.summary}</span>
    </Link>
  );
}
