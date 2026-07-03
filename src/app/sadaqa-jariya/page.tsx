import Link from "next/link";
import { sadaqaJariyaArticles } from "@/lib/knowledge/sadaqa-jariya";
import { sadaqaProjects } from "@/lib/mock/sadaqa-projects";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Sadaqa Jariya — AmanahOrdner",
  description: "Fortlaufende Wohltätigkeit für den Barzakh — Wissen und Projekte über Gemeinsam1 e.V.",
};

export default function SadaqaJariyaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Barzakh-Vorsorge</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Sadaqa Jariya</h1>
        <p className="text-muted leading-relaxed">
          Sadaqa Jariya ist eine Wohltat, deren Nutzen über den Tod hinausreicht. Bereite zu Lebzeiten vor,
          was dir und anderen auch im Barzakh nützen kann — im zulässigen Rahmen deiner Waṣiyya.
        </p>
      </div>

      <div className="space-y-6 mb-12">
        {sadaqaJariyaArticles.map((article) => (
          <Card key={article.id}>
            <CardTitle>{article.title}</CardTitle>
            <p className="text-sm text-accent font-medium mb-3">{article.summary}</p>
            <p className="text-muted leading-relaxed">{article.content}</p>
            <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Projekte über Gemeinsam1 e.V.</h2>
        <p className="text-muted text-sm mb-6">
          Ausgewählte Sadaqa-Jariya-Projekte — Spenden laufen direkt über den Verein, nicht über AmanahOrdner.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {sadaqaProjects.map((project) => {
            const progress = Math.round((project.raisedAmount / project.targetAmount) * 100);
            return (
              <Card key={project.id} className="flex flex-col">
                <span className="inline-block self-start text-xs font-medium bg-accent/20 text-accent px-3 py-1 rounded-full mb-3">
                  {project.badge}
                </span>
                <CardTitle>{project.title}</CardTitle>
                <p className="text-xs text-muted mb-2">{project.category} · {project.sadaqaJariyaType}</p>
                <p className="text-sm text-muted leading-relaxed flex-1 mb-4">{project.description}</p>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{project.raisedAmount.toLocaleString("de-DE")} € gesammelt</span>
                    <span>{progress}% von {project.targetAmount.toLocaleString("de-DE")} €</span>
                  </div>
                  <div className="h-2 rounded-full bg-sand overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <a href={project.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">Projekt bei Gemeinsam1 ansehen</Button>
                </a>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-sand border border-accent/30 p-6 mb-10">
        <h3 className="font-semibold text-primary mb-2">Trennung: AmanahOrdner & Gemeinsam1</h3>
        <p className="text-sm text-muted leading-relaxed">
          AmanahOrdner ist ein digitales Vorsorgeprodukt zur Dokumentation deiner Wünsche und Pläne.
          Spenden und Projekte laufen ausschließlich über{" "}
          <a href="https://gemeinsam1.de" target="_blank" rel="noopener noreferrer" className="text-primary-light underline">
            Gemeinsam1 e.V.
          </a>{" "}
          — getrennt von AmanahOrdner. Wir verknüpfen nur, damit du deine Sadaqa-Jariya-Vorsorge planen kannst.
        </p>
      </div>

      <Link href="/dashboard/sadaqa-jariya">
        <Button>Sadaqa-Jariya-Plan im Ordner</Button>
      </Link>

      <div className="mt-8">
        <Disclaimer type="islamic" />
      </div>
    </div>
  );
}
