import { pricingPlans } from "@/lib/mock/pricing";
import type { PricingPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Preise — AmanahOrdner",
  description: "Kostenlos starten — Preise für AmanahOrdner, Abos und Partner-Angebote.",
};

const categoryLabels: Record<PricingPlan["category"], { title: string; description: string }> = {
  free: {
    title: "Kostenlos",
    description: "Sofort nutzbar — ohne Verkaufsdruck.",
  },
  one_time: {
    title: "Einmalig",
    description: "PDF-Ordner und Vorsorgepakete zum einmaligen Kauf.",
  },
  subscription: {
    title: "Abo",
    description: "Laufende Funktionen für Familie und Notfallzugang.",
  },
  b2b: {
    title: "Partner & B2B",
    description: "Für Bestatter, Moscheen, Vereine und Gemeinden.",
  },
};

const categoryOrder: PricingPlan["category"][] = ["free", "one_time", "subscription", "b2b"];

function PricingCard({ plan, isB2b }: { plan: PricingPlan; isB2b: boolean }) {
  return (
    <Card className="flex flex-col h-full">
      <CardTitle>{plan.name}</CardTitle>
      <p className="text-2xl font-bold text-primary mb-4">
        {plan.price}
        {plan.period && <span className="text-base font-normal text-muted">{plan.period}</span>}
      </p>
      <ul className="space-y-2 flex-1 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="text-sm text-muted flex items-start gap-2">
            <span className="text-accent mt-0.5">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      {plan.category === "free" ? (
        <p className="text-sm text-success font-medium text-center py-2">Bereits verfügbar</p>
      ) : (
        <Button variant={isB2b ? "secondary" : "outline"} className="w-full" disabled>
          {isB2b ? "Interesse anmelden" : "Demnächst"}
        </Button>
      )}
    </Card>
  );
}

export default function PreisePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <p className="text-accent font-medium mb-2">Transparent & fair</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Preise</h1>
        <p className="text-muted max-w-2xl mx-auto leading-relaxed">
          Starte kostenlos mit Check, Notfallmodus und Basis-Wissen. Erweiterte Funktionen und
          Partner-Angebote folgen schrittweise.
        </p>
      </div>

      <div className="space-y-14">
        {categoryOrder.map((category) => {
          const plans = pricingPlans.filter((p) => p.category === category);
          const { title, description } = categoryLabels[category];
          const isB2b = category === "b2b";

          return (
            <section key={category}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary">{title}</h2>
                <p className="text-muted text-sm mt-1">{description}</p>
              </div>
              <div className={`grid gap-5 ${plans.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
                {plans.map((plan) => (
                  <PricingCard key={plan.id} plan={plan} isB2b={isB2b} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
