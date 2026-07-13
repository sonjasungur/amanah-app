import { patientenverfuegungArticles } from "@/lib/knowledge/patientenverfuegung";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Patientenverfügung — Amanah Vorsorge",
  description: "Patientenverfügung, Vorsorgevollmacht und religiöse Wünsche für muslimische Familien.",
};

export default function PatientenverfuegungPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Medizinische Vorsorge</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Patientenverfügung</h1>
        <p className="text-muted leading-relaxed">
          Wenn du nicht mehr für dich sprechen kannst, braucht deine Familie Klarheit — medizinisch und
          religiös. Eine Patientenverfügung schützt dich und entlastet deine Angehörigen.
        </p>
      </div>

      <div className="space-y-6">
        {patientenverfuegungArticles.map((article) => (
          <Card key={article.id}>
            <CardTitle>{article.title}</CardTitle>
            <p className="text-sm text-accent font-medium mb-3">{article.summary}</p>
            <p className="text-muted leading-relaxed">{article.content}</p>
            <SourcesSection sourceIds={article.sourceIds} reviewStatus={article.reviewStatus} />
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Disclaimer type="legal" />
      </div>
    </div>
  );
}
