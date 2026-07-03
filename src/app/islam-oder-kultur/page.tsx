import { cultureFilterCards } from "@/lib/knowledge/kulturfilter";
import { SourcesSection, ReviewBadge } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Islam oder Kultur? — AmanahOrdner",
  description: "Unterscheide islamische Pflichten von kulturellen Gewohnheiten bei Janazah und Trauer.",
};

export default function IslamOderKulturPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Kulturfilter</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Islam oder Kultur?</h1>
        <p className="text-muted leading-relaxed mb-4">
          Viele muslimische Familien in Deutschland vermischen islamische Vorgaben mit kulturellen Traditionen —
          oft ohne es zu wissen. Der Kulturfilter hilft dir, beides zu trennen: Was ist islamisch belegt oder
          empfohlen? Was ist kulturelle Gewohnheit aus der Heimat?
        </p>
        <p className="text-muted leading-relaxed">
          Das Ziel ist nicht, Kultur abzuwerten, sondern Klarheit zu schaffen — damit du bewusst entscheiden
          kannst und deine Familie nicht unter finanziellen oder emotionalen Druck gerät.
        </p>
      </div>

      <div className="space-y-4">
        {cultureFilterCards.map((card) => (
          <details
            key={card.id}
            className="group rounded-2xl bg-card border border-primary/10 overflow-hidden open:shadow-sm open:border-primary/20 transition-all"
          >
            <summary className="cursor-pointer list-none px-6 py-5 flex items-start justify-between gap-4 hover:bg-sand/50 transition-colors">
              <span className="font-semibold text-primary leading-snug">{card.question}</span>
              <span className="flex-shrink-0 text-accent text-xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 space-y-4 border-t border-primary/5 pt-5">
              <div className="flex items-center gap-2 mb-2">
                <ReviewBadge status={card.reviewStatus} />
              </div>

              <div className="rounded-xl bg-primary/5 p-4">
                <h3 className="text-sm font-semibold text-primary mb-1">Islamische Grundlage</h3>
                <p className="text-sm text-muted leading-relaxed">{card.islamicBasis}</p>
              </div>

              <div className="rounded-xl bg-sand p-4">
                <h3 className="text-sm font-semibold text-primary mb-1">Kulturelle Praxis</h3>
                <p className="text-sm text-muted leading-relaxed">{card.culturalPractice}</p>
              </div>

              <div className="rounded-xl bg-accent/10 border border-accent/20 p-4">
                <h3 className="text-sm font-semibold text-primary mb-1">Was du prüfen solltest</h3>
                <p className="text-sm text-muted leading-relaxed">{card.whatToCheck}</p>
              </div>

              {card.opinionDifferences && (
                <p className="text-sm text-muted italic">
                  <span className="font-medium text-foreground not-italic">Meinungsunterschiede: </span>
                  {card.opinionDifferences}
                </p>
              )}

              <SourcesSection sourceIds={card.sourceIds} reviewStatus={card.reviewStatus} />
            </div>
          </details>
        ))}
      </div>

      <div className="mt-10">
        <Disclaimer type="islamic" />
      </div>
    </div>
  );
}
