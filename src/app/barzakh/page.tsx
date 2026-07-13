import { barzakhArticles } from "@/lib/knowledge/barzakh";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Barzakh — Mein Wille",
  description: "Was ist Barzakh? Orientierung zu Sadaqa Jariya, Schulden und dem Leben nach dem Tod.",
};

export default function BarzakhPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Wissen & Orientierung</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Barzakh — der Zwischenzustand</h1>
        <p className="text-muted leading-relaxed">
          Nach dem Tod beginnt für jeden Menschen der Barzakh — die Phase bis zur Auferstehung. Was kann dir
          und deiner Familie in dieser Zeit noch nützen? Wie bereitest du dich vor?
        </p>
      </div>

      <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/15 p-6 text-center">
        <p className="text-lg font-semibold text-primary mb-1">Allah entscheidet</p>
        <p className="text-sm text-muted leading-relaxed max-w-lg mx-auto">
          Kein Mensch kennt das genaue Schicksal im Barzakh. Die folgenden Inhalte dienen der Vorbereitung
          und Orientierung — nicht als Garantie. Nur Allah entscheidet über Barmherzigkeit und Vergeltung.
        </p>
      </div>

      <div className="space-y-6">
        {barzakhArticles.map((article) => (
          <Card key={article.id}>
            <CardTitle>{article.title}</CardTitle>
            <p className="text-sm text-accent font-medium mb-3">{article.summary}</p>
            <p className="text-muted leading-relaxed">{article.content}</p>
            <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Disclaimer type="islamic" />
      </div>
    </div>
  );
}
