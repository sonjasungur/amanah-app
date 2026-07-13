import Link from "next/link";
import type { ReactNode } from "react";
import type { KnowledgeArticle } from "@/lib/types";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { PrimarySourcesList } from "@/components/ui/primary-source-card";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, ChevronRight, FileText, Heart, HelpCircle, MapPin } from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: typeof Heart; title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-primary flex items-center gap-2 text-sm">
        <Icon size={16} className="text-accent shrink-0" aria-hidden />
        {title}
      </h4>
      <div className="text-sm text-muted leading-relaxed pl-6">{children}</div>
    </div>
  );
}

export function RichArticleCard({ article }: { article: KnowledgeArticle }) {
  const d = article.details;

  if (!d) {
    return (
      <Card className="hover:border-primary/20 transition-colors">
        <CardTitle>{article.title}</CardTitle>
        <p className="text-sm text-accent font-medium mb-3">{article.summary}</p>
        <p className="text-muted leading-relaxed">{article.content}</p>
        <PrimarySourcesList sourceIds={article.sourceIds} />
        <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
      </Card>
    );
  }

  const reflectionQuestions = [
    "Habe ich die wichtigsten Punkte schriftlich festgehalten?",
    "Weiß mindestens eine Vertrauensperson, wo die Unterlagen liegen?",
    "Habe ich mit Angehörigen ein ruhiges Gespräch geplant?",
  ];

  return (
    <Card className="hover:border-primary/20 transition-colors space-y-5">
      <div>
        <CardTitle className="text-xl">{article.title}</CardTitle>
        <p className="text-sm text-muted mt-3 leading-relaxed">{article.summary}</p>
      </div>

      <Section icon={Heart} title="Warum ist das wichtig?">
        <p>{d.whyImportant}</p>
      </Section>

      {article.sourceIds.length > 0 && (
        <Section icon={BookOpen} title="Islamische Grundlage">
          <PrimarySourcesList sourceIds={article.sourceIds} />
          <p className="text-xs text-muted mt-3">Erklärungen sind Einordnung — nicht Teil des Qur&apos;an oder Hadith.</p>
        </Section>
      )}

      <Section icon={FileText} title="Praktische Bedeutung">
        <ul className="list-disc space-y-1 pl-4">
          {d.prepareItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 font-medium text-primary text-xs">Dokumente & Nachweise</p>
        <ul className="list-disc space-y-1 pl-4 mt-1">
          {d.documents.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section icon={HelpCircle} title="Fragen zur Selbstreflexion">
        <ul className="list-disc space-y-1 pl-4">
          {reflectionQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </Section>

      <Section icon={AlertCircle} title="Mögliche Warnsignale">
        <p className="mb-2">{d.ifMissing}</p>
        <ul className="list-disc space-y-1 pl-4">
          {d.commonMistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section icon={MapPin} title="Aufbewahrung & Familie">
        <p>{d.safeStorage}</p>
        <p className="mt-2">{d.tellFamily}</p>
      </Section>

      <div className="pt-2 border-t border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href={d.nextStepHref}>
          <Button type="button">
            {d.nextStepLabel} <ChevronRight size={16} className="ml-1" />
          </Button>
        </Link>
        <p className="text-xs text-muted">Keine Rechtsberatung, keine medizinische Beratung, keine Fatwa.</p>
      </div>

      <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} hidePrimary={article.sourceIds.length > 0} />
    </Card>
  );
}
