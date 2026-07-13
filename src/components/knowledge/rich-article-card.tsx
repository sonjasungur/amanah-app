import Link from "next/link";
import type { ReactNode } from "react";
import type { KnowledgeArticle } from "@/lib/types";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { PrimarySourcesList } from "@/components/ui/primary-source-card";
import { Card, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Target, Users } from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
        <Icon size={18} className="text-primary shrink-0" aria-hidden />
        {title}
      </h4>
      <div className="text-body text-muted leading-relaxed pl-7">{children}</div>
    </section>
  );
}

export function RichArticleCard({ article }: { article: KnowledgeArticle }) {
  const d = article.details;
  const shortIntro = article.wissenMeta?.shortAnswer ?? article.summary;

  if (!d) {
    return (
      <Card className="space-y-5">
        <CardTitle>{article.title}</CardTitle>
        <Section icon={BookOpen} title="Kurz erklärt">
          <p>{shortIntro}</p>
        </Section>
        <PrimarySourcesList sourceIds={article.sourceIds} title="Qur'an und authentische Sunnah" />
        <p className="text-body text-muted">{article.content}</p>
        <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
      </Card>
    );
  }

  const familyQuestions = [
    "Wo finde ich deine Unterlagen im Ernstfall?",
    "Wer ist deine Vertrauensperson für Entscheidungen?",
    "Welche Wünsche sind dir persönlich und islamisch besonders wichtig?",
  ];

  return (
    <Card className="space-y-8">
      <div>
        <CardTitle className="text-page-title">{article.title}</CardTitle>
      </div>

      <Section icon={BookOpen} title="Kurz erklärt">
        <p>{shortIntro}</p>
        <p className="mt-3">{d.whyImportant}</p>
      </Section>

      {article.sourceIds.length > 0 && (
        <Section icon={BookOpen} title="Qur'an und authentische Sunnah">
          <PrimarySourcesList sourceIds={article.sourceIds} title="" />
          <p className="text-sm text-muted mt-4">
            Die Übersetzungen sind sinngemäß. Erklärungen sind Einordnung — nicht Teil des Qur&apos;an oder Hadith.
          </p>
        </Section>
      )}

      <Section icon={FileText} title="Praktische Bedeutung">
        <ul className="list-disc space-y-2 pl-4">
          {d.prepareItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {d.documents.length > 0 && (
          <>
            <p className="mt-4 font-semibold text-foreground text-sm">Dokumente & Nachweise</p>
            <ul className="list-disc space-y-1 pl-4 mt-2">
              {d.documents.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section icon={Users} title="Was sollte ich mit meiner Familie klären?">
        <p>{d.tellFamily}</p>
        <ul className="list-disc space-y-2 pl-4 mt-3">
          {familyQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </Section>

      <Section icon={Target} title="Mein nächster Schritt">
        <p>{d.ifMissing}</p>
        <ul className="list-disc space-y-2 pl-4 mt-3">
          {d.commonMistakes.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm">{d.safeStorage}</p>
      </Section>

      <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} hidePrimary={article.sourceIds.length > 0} />

      <p className="text-sm text-muted border-t border-border pt-4">
        Keine Rechtsberatung, keine medizinische Beratung, keine Fatwa.
      </p>
    </Card>
  );
}

/** Form CTA block — always after knowledge content on detail pages */
export function WissenFormCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-emerald/30 bg-accent-soft p-6 md:p-8">
      <h2 className="text-section-title font-bold text-foreground mb-3">Jetzt festhalten</h2>
      <p className="text-body text-muted mb-5 leading-relaxed">
        Wenn du bereit bist, kannst du deine Wünsche Schritt für Schritt in deinem persönlichen Ordner dokumentieren.
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl font-semibold bg-emerald text-white hover:bg-primary-hover px-7 py-3.5 text-lg min-h-[48px] transition-all"
      >
        {label}
      </Link>
    </div>
  );
}
