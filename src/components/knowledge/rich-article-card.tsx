import Link from "next/link";
import type { ReactNode } from "react";
import type { KnowledgeArticle } from "@/lib/types";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { PrimarySourcesList } from "@/components/ui/primary-source-card";
import { Card, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BookOpen, FileText, Scale, Target, Users } from "lucide-react";

function Section({
  icon: Icon,
  title,
  children,
  variant = "default",
}: {
  icon: typeof BookOpen;
  title: string;
  children: ReactNode;
  variant?: "default" | "legal" | "risk";
}) {
  const bg =
    variant === "legal"
      ? "rounded-2xl border-2 border-cat-vermoegen/25 bg-[#FDF8F0] p-5 md:p-6"
      : variant === "risk"
        ? "rounded-2xl border-2 border-warning/30 bg-warning/5 p-5 md:p-6"
        : "space-y-3";
  return (
    <section className={bg}>
      <h4 className="font-bold text-primary-dark flex items-center gap-2 text-base md:text-lg">
        <Icon size={18} className="text-primary shrink-0" aria-hidden />
        {title}
      </h4>
      <div className={`text-body text-muted leading-relaxed ${variant === "default" ? "pl-7" : "mt-3"}`}>{children}</div>
    </section>
  );
}

export function RichArticleCard({ article }: { article: KnowledgeArticle }) {
  const d = article.details;
  const shortIntro = article.wissenMeta?.shortAnswer ?? article.summary;
  const hasPrimarySources = article.sourceIds.some((id) => {
    const resolved = id;
    return resolved.startsWith("quran-") || resolved.startsWith("hadith-");
  });

  if (!d) {
    return (
      <Card className="space-y-5 border-2 border-border">
        <CardTitle>{article.title}</CardTitle>
        <Section icon={BookOpen} title="In 30 Sekunden">
          <p>{shortIntro}</p>
        </Section>
        <PrimarySourcesList sourceIds={article.sourceIds} defaultCollapsed />
        <p className="text-body text-muted">{article.content}</p>
        <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} defaultCollapsed />
      </Card>
    );
  }

  const todayActions = d.todayActions ?? d.prepareItems.slice(0, 4);
  const familyQuestions = [
    "Wo finde ich deine Unterlagen im Ernstfall?",
    "Wer ist deine Vertrauensperson für Entscheidungen?",
    "Welche Wünsche sind dir persönlich und islamisch besonders wichtig?",
  ];

  return (
    <Card className="space-y-8 border-2 border-border shadow-sm">
      <div>
        <CardTitle className="text-page-title text-primary-dark">{article.title}</CardTitle>
      </div>

      <Section icon={BookOpen} title="In 30 Sekunden">
        <p className="font-medium text-foreground">{shortIntro}</p>
        <p className="mt-3">{d.whyImportant}</p>
      </Section>

      <Section icon={FileText} title="Was bedeutet das praktisch?">
        <ul className="list-disc space-y-2 pl-4">
          {d.prepareItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section icon={Target} title="Was du heute erledigen kannst">
        <ul className="list-disc space-y-2 pl-4">
          {todayActions.map((item) => (
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
        <p className="mt-3 text-sm">{d.safeStorage}</p>
      </Section>

      <Section icon={Users} title="Was du mit deiner Familie klären solltest">
        <p>{d.tellFamily}</p>
        <ul className="list-disc space-y-2 pl-4 mt-3">
          {familyQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </Section>

      {(d.legalNotes?.length ?? 0) > 0 && (
        <Section icon={Scale} title="Deutschland: Dokumente und rechtliche Hinweise" variant="legal">
          <ul className="list-disc space-y-2 pl-4">
            {d.legalNotes!.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {d.janazahChecklist && d.janazahChecklist.length > 0 && (
        <Section icon={FileText} title="Janazah-Checkliste">
          <ul className="list-disc space-y-2 pl-4">
            {d.janazahChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {hasPrimarySources && (
        <Section icon={BookOpen} title="Qur'an und authentische Sunnah">
          <PrimarySourcesList sourceIds={article.sourceIds} title="" defaultCollapsed />
          <p className="text-sm text-muted mt-4 pl-0">
            Übersetzungen aus Bubenheim/Elyas (Qur&apos;an) bzw. sinngemäße Wiedergabe (Hadith). Einordnung — nicht Teil des Originaltextes.
          </p>
        </Section>
      )}

      <Section icon={AlertTriangle} title="Was passiert, wenn es ungeklärt bleibt?" variant="risk">
        <p>{d.ifMissing}</p>
        <ul className="list-disc space-y-2 pl-4 mt-3">
          {d.commonMistakes.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <SourcesSection
        sourceIds={article.sourceIds}
        reviewStatus={article.reviewStatus}
        hidePrimary={hasPrimarySources}
        defaultCollapsed
      />

      <p className="text-sm text-muted border-t-2 border-border pt-4">
        Keine Rechtsberatung, keine medizinische Beratung, keine Fatwa.
      </p>
    </Card>
  );
}

/** Form CTA block — section H */
export function WissenFormCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-10 rounded-2xl border-2 border-emerald/40 bg-accent-soft p-6 md:p-8 shadow-sm">
      <h2 className="text-section-title font-bold text-primary-dark mb-3">Jetzt in Mein Wille festhalten</h2>
      <p className="text-body text-muted mb-5 leading-relaxed">
        Wenn du bereit bist, kannst du deine Wünsche Schritt für Schritt in deinem persönlichen Ordner dokumentieren.
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl font-bold bg-emerald text-white hover:bg-primary-hover px-7 py-3.5 text-lg min-h-[48px] transition-all shadow-md"
      >
        {label}
      </Link>
    </div>
  );
}
