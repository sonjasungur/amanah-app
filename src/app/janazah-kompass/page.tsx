import Link from "next/link";
import { janazahArticles } from "@/lib/knowledge/janazah";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Janazah-Kompass — AmanahOrdner",
  description: "Islamisches Wissen zu Janazah, Ghusl, Kafan und Bestattung in Deutschland.",
};

export default function JanazahKompassPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Wissen & Orientierung</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Janazah-Kompass</h1>
        <p className="text-muted leading-relaxed">
          Alles Wichtige zur islamischen Bestattung — von Ghusl und Kafan bis zur Beisetzung in Deutschland
          oder Überführung. Orientierung für dich und deine Familie.
        </p>
      </div>

      <div className="space-y-6">
        {janazahArticles.map((article) => (
          <Card key={article.id} className="hover:border-primary/20 transition-colors">
            <CardTitle>{article.title}</CardTitle>
            <p className="text-sm text-accent font-medium mb-3">{article.summary}</p>
            <p className="text-muted leading-relaxed">{article.content}</p>
            <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary/5 to-sand border border-primary/10 p-8 text-center">
        <h2 className="text-xl font-bold text-primary mb-2">Eigene Janazah-Wünsche dokumentieren</h2>
        <p className="text-sm text-muted mb-5 max-w-md mx-auto">
          Im AmanahOrdner kannst du deine Wünsche zu Ghusl, Kafan, Beisetzung und Familienbotschaft festhalten —
          damit deine Angehörigen im schwersten Moment Klarheit haben.
        </p>
        <Link href="/dashboard/janazah">
          <Button size="lg">Janazah-Modul im Ordner öffnen</Button>
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        <Disclaimer type="islamic" />
      </div>
    </div>
  );
}
