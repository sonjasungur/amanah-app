import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ChevronDown, Feather, Landmark, Scale, ScrollText, Users } from "lucide-react";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { ENTRY_ARTICLE } from "@/modules/islamic-knowledge/full-articles";
import { RUBRICS, articlesInRubric, getCentreArticle } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { ArticleBody, MixedText, OpenQuestions, SourceList } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";
import { CentreSearchForm } from "@/components/knowledge/zentrum/centre-ui";

/**
 * P2.7 knowledge centre, entry page (design sample, owner feedback 21.11.): one compact opening with the
 * question and its short answer, the three main topics right below, then the six rubrics; the eight topic
 * questions and the family examples further down. Only existing texts. 404 unless the preview switch is on.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

/** The three main topics the owner named, each leading straight to its key article. */
const MAIN_TOPICS = [
  {
    title: "Tod und Sterben",
    text: "Was der Qurʾān über den Tod sagt, wie man Sterbende begleitet und Trauernden beisteht.",
    icon: Feather,
    href: "/wissen/zentrum/vers/3-185",
    cta: "Āl ʿImrān 3:185 lesen",
  },
  {
    title: "Islamisches Testament",
    text: "Was eine Waṣiyya ist, warum ein Drittel die Grenze ist und wie ein Testament in Deutschland wirksam wird.",
    icon: ScrollText,
    href: "/wissen/zentrum/artikel/p25-a-wasiyya",
    cta: "Was ist eine Waṣiyya?",
  },
  {
    title: "Erbe",
    text: "Wer ohne Testament erbt, was die Erbverse festlegen und wo deutsches und islamisches Erbrecht auseinandergehen.",
    icon: Scale,
    href: "/wissen/zentrum/artikel/p27-a-gesetzliche-erbfolge",
    cta: "Wer erbt ohne Testament?",
  },
] as const;

const RUBRIC_ICONS = { 1: BookOpen, 2: Feather, 3: Landmark, 4: Scale, 5: ScrollText, 6: Users } as const;

function SectionTitle({ id, eyebrow, title, text }: { id: string; eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="wz-eyebrow">{eyebrow}</p>
      <h2 id={id} className="wz-serif mt-2 text-[1.75rem] leading-tight sm:text-[2rem] font-semibold text-[var(--wz-green)]">
        {title}
      </h2>
      {text && <p className="mt-2 text-[var(--wz-muted)]">{text}</p>}
    </div>
  );
}

export default function KnowledgeCentrePage() {
  if (!isKnowledgePreviewEnabled()) notFound();
  const entry = ENTRY_ARTICLE;
  // The existing short answer of the entry article: its first paragraph opens the page, the rest stays in the full answer.
  const answer = entry?.sections.find((s) => s.key === "einleitung")?.paragraphs[0]?.text ?? "";
  // Phones show the first two sentences at once and the rest on request, so the first topic stays in view.
  const cut = answer.split(/(?<=\.)\s+/);
  const answerLead = cut.slice(0, 2).join(" ");
  const answerRest = cut.slice(2).join(" ");
  return (
    <div className="wz min-h-screen" data-testid="knowledge-centre">
      <PreviewNote />

      {/* Opening: question, short answer and the three main topics together */}
      <section className="wz-hero border-b border-[var(--wz-line)]" aria-labelledby="frage">
        <div className="mx-auto max-w-6xl px-5 pt-6 pb-10 sm:pt-14 sm:pb-14">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:items-start">
            <div>
              <p className="wz-eyebrow">
                Islamisches Wissenszentrum<span className="hidden sm:inline"> · kostenlos, ohne Anmeldung</span>
              </p>
              <h1 id="frage" className="wz-serif mt-3 text-[1.95rem] leading-[1.15] sm:text-[2.75rem] sm:leading-[1.1] font-semibold text-[var(--wz-green)] [text-wrap:balance]">
                {entry?.readerQuestion ?? "Was passiert, wenn ich in Deutschland nichts geregelt habe?"}
              </h1>
              <div className="wz-rule mt-5 hidden lg:block" aria-hidden />
            </div>
            <div className="lg:pt-8">
              <p className="hidden sm:block text-[1.0625rem] leading-relaxed text-[var(--wz-ink)]" data-testid="entry-answer">
                <MixedText text={answer} />
              </p>
              <div className="sm:hidden text-[1.0625rem] leading-relaxed text-[var(--wz-ink)]" data-testid="entry-answer-phone">
                <p>
                  <MixedText text={answerLead} />
                </p>
                {answerRest && (
                  <details className="mt-1">
                    <summary className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-[var(--wz-green)]">
                      Weiterlesen <ChevronDown size={15} aria-hidden />
                    </summary>
                    <p>
                      <MixedText text={answerRest} />
                    </p>
                  </details>
                )}
              </div>
              <a href="#fragen" className="mt-3 hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--wz-green)] wz-text-link">
                Was das für Muslime bedeutet <ChevronDown size={15} aria-hidden />
              </a>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 md:grid-cols-3" data-testid="main-topics">
            {MAIN_TOPICS.map((t) => (
              <Link key={t.title} href={t.href} className="wz-card wz-card-link wz-topic p-4 sm:p-6 flex items-start gap-4 md:flex-col md:gap-3" data-testid="main-topic">
                <span className="wz-icon" aria-hidden>
                  <t.icon size={22} />
                </span>
                <span className="min-w-0 flex flex-col gap-1.5 md:gap-2">
                  <span className="wz-serif text-xl font-semibold text-[var(--wz-green)]">{t.title}</span>
                  <span className="hidden sm:block text-[0.975rem] text-[var(--wz-muted)]">{t.text}</span>
                  <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-[var(--wz-green)]">
                    {t.cta} <ArrowRight size={16} aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          {/* AP22 EA-05.3: search over all articles and their sources */}
          <CentreSearchForm className="mt-6 sm:mt-8 max-w-2xl" onDark />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-14 space-y-16">
        {/* The six rubrics */}
        <section aria-labelledby="rubriken" data-testid="rubric-list" className="space-y-6">
          <SectionTitle id="rubriken" eyebrow="Übersicht" title="Alle Themen in sechs Rubriken" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RUBRICS.map((r) => {
              const Icon = RUBRIC_ICONS[r.nr as keyof typeof RUBRIC_ICONS];
              return (
                <Link key={r.nr} href={`/wissen/zentrum/rubrik/${r.nr}`} className="wz-card wz-card-link p-5 flex gap-4" data-testid="rubric-link">
                  <span className="wz-icon" aria-hidden>
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[1.0625rem] text-[var(--wz-green)]">{r.title}</span>
                    <span className="block mt-1 text-[0.9375rem] leading-snug text-[var(--wz-muted)]">{r.description}</span>
                    <span className="block mt-2 text-sm font-semibold text-[var(--wz-gold-text)]">{articlesInRubric(r.nr).length} Beiträge</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <hr className="wz-hairline" />

        {/* The eight topic questions */}
        {entry?.topics && entry.topics.length > 0 && (
          <section id="fragen" aria-labelledby="fragen-titel" data-testid="entry-topics" className="scroll-mt-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14">
            <div className="space-y-4">
              <SectionTitle id="fragen-titel" eyebrow="Thema für Thema" title="Was ohne Regelung geschieht – und dein nächster Schritt" />
              {entry.sections
                .find((s) => s.key === "einleitung")
                ?.paragraphs.slice(1, 2)
                .map((p, i) => (
                  <p key={i} className="text-[0.975rem] text-[var(--wz-muted)]">
                    <MixedText text={p.text} />
                  </p>
                ))}
            </div>
            <div className="wz-card divide-y divide-[var(--wz-line)]">
              {entry.topics.map((t) => (
                <details key={t.title} className="group px-5 py-4">
                  <summary className="flex items-center justify-between gap-3 min-h-[44px]">
                    <h3 className="font-semibold text-[var(--wz-ink)]">{t.title}</h3>
                    <ChevronDown size={20} className="shrink-0 text-[var(--wz-gold-text)] transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="mt-2 space-y-2 text-[0.975rem]">
                    <p>
                      <span className="font-semibold">Ohne Regelung: </span>
                      {t.withoutRegulation}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--wz-green)]">Nächster Schritt: </span>
                      {t.nextStep}
                    </p>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {t.articleIds.slice(0, 2).map((id) => {
                        const a = getCentreArticle(id);
                        return a ? (
                          <Link key={id} href={`/wissen/zentrum/artikel/${id}`} className="wz-text-link">
                            {a.readerQuestion ?? a.title}
                          </Link>
                        ) : null;
                      })}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Family examples and the full answer with sources */}
        {entry && (
          <section aria-labelledby="ausfuehrlich-titel">
            <details className="wz-card p-5 sm:p-8" data-testid="entry-full">
              <summary className="flex items-center justify-between gap-3 min-h-[44px]">
                <span>
                  <span className="wz-eyebrow block">Familienbeispiele</span>
                  <h2 id="ausfuehrlich-titel" className="wz-serif mt-1 text-xl sm:text-2xl font-semibold text-[var(--wz-green)]">
                    Die ausführliche Antwort mit fünf Familien und allen Quellen
                  </h2>
                </span>
                <ChevronDown size={22} className="shrink-0 text-[var(--wz-gold-text)]" aria-hidden />
              </summary>
              <div className="mt-6 space-y-10 rounded-xl bg-white p-4 sm:p-6">
                <ArticleBody article={entry} />
                <SourceList article={entry} />
                <OpenQuestions article={entry} />
              </div>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}
