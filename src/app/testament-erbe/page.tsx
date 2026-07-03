import { testamentArticles } from "@/lib/knowledge/testament-erbe";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Testament & Erbe — AmanahOrdner",
  description: "Islamisches Erbrecht: Farāʾiḍ, Waṣiyya und deutsches Recht für Muslime in Deutschland.",
};

export default function TestamentErbePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Wissen & Orientierung</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Testament & Erbe</h1>
        <p className="text-muted leading-relaxed">
          Im Islam ist Erbe keine bloße Formalität — es ist Amanah. Allah hat feste Erbanteile bestimmt,
          und du kannst einen begrenzten Teil frei verfügen.
        </p>
      </div>

      <div className="mb-8 rounded-2xl bg-primary text-white p-6">
        <h2 className="text-xl font-bold mb-2">Farāʾiḍ und Waṣiyya — das Wichtigste</h2>
        <p className="text-white/90 text-sm leading-relaxed mb-3">
          <strong>Farāʾiḍ</strong> sind die festen Erbanteile aus dem Quran — für Ehepartner, Eltern, Söhne,
          Töchter und weitere Angehörige. Du kannst Pflicht-Erben nicht einfach ausschließen.
        </p>
        <p className="text-white/90 text-sm leading-relaxed">
          <strong>Waṣiyya</strong> ist der frei verfügbare Teil — klassisch maximal ein Drittel des Nachlasses.
          Damit kannst du Sadaqa Jariya, Wohltätigkeit oder Nicht-Pflicht-Erben bedenken. Mehr als ein Drittel
          erfordert die Zustimmung aller Erben.
        </p>
      </div>

      <div className="space-y-6">
        {testamentArticles.map((article) => (
          <Card key={article.id}>
            <CardTitle>{article.title}</CardTitle>
            <p className="text-sm text-accent font-medium mb-3">{article.summary}</p>
            <p className="text-muted leading-relaxed">{article.content}</p>
            <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
          </Card>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        <Disclaimer type="islamic" />
        <Disclaimer type="legal" />
      </div>
    </div>
  );
}
