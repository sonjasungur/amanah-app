import { notFound } from "next/navigation";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { Card, CardTitle } from "@/components/ui/card";
import { ALWAYS_FREE_ACCOUNT_RIGHTS, featuresByTier, type PlanFeature } from "@/lib/billing/plan-matrix";
import { formatPrice, getProducts } from "@/lib/billing/products";
import { isBillingEnforced } from "@/lib/billing/config";

export const metadata = { title: "Vorsorge Plus – Abgrenzung (intern)", robots: { index: false, follow: false } };

const ENFORCEMENT_LABEL: Record<PlanFeature["enforcement"], string> = {
  never: "nie sperrbar",
  server: "serverseitig sperrbar",
  client_hint: "nur Hinweis im Browser",
};

function FeatureTable({ features }: { features: PlanFeature[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted border-b border-border">
          <th className="py-2 pr-3 font-semibold">Funktion</th>
          <th className="py-2 pr-3 font-semibold">Bereiche</th>
          <th className="py-2 font-semibold">Sperre</th>
        </tr>
      </thead>
      <tbody>
        {features.map((f) => (
          <tr key={f.id} className="border-b border-border align-top" data-testid={`plan-feature-${f.id}`}>
            <td className="py-2 pr-3">
              <span className="font-semibold">{f.title}</span>
              {f.note && <span className="block text-xs text-muted mt-1">{f.note}</span>}
            </td>
            <td className="py-2 pr-3 text-xs text-muted break-all">{f.routes.join(", ")}</td>
            <td className="py-2 text-xs">{ENFORCEMENT_LABEL[f.enforcement]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Local review of the planned free / Plus split. Not linked, not public, changes nothing. */
export default function PlusConceptPage() {
  if (!isInternalToolsEnabled()) notFound();
  const plus = getProducts().find((p) => p.id === "vorsorge_plus")!;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6" data-testid="plus-concept">
      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
        KONZEPT – intern. Sperren aktiv: <strong>{isBillingEnforced() ? "ja" : "nein"}</strong>. Preis ist ein Testpreis; Kauf nur in der
        Sandbox. Keine Änderung für bestehende Nutzer.
      </div>
      <h1 className="text-2xl font-bold text-primary-dark">Kostenlos und Vorsorge Plus</h1>

      <Card>
        <CardTitle>Kostenlos – dauerhaft</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <FeatureTable features={featuresByTier("free")} />
        </div>
        <p className="text-xs text-muted mt-3">Immer frei, unabhängig vom Paket: {ALWAYS_FREE_ACCOUNT_RIGHTS.join(" · ")}.</p>
      </Card>

      <Card>
        <CardTitle>
          Vorsorge Plus – geplanter Testpreis <span data-testid="plus-price">{formatPrice(plus.testPriceCents)}</span> einmalig
        </CardTitle>
        <div className="mt-3 overflow-x-auto">
          <FeatureTable features={featuresByTier("plus")} />
        </div>
      </Card>

      <Card>
        <CardTitle>Bestandsschutz</CardTitle>
        <ul className="list-disc pl-5 text-sm space-y-1 mt-3">
          <li>Konten, die vor dem Starttermin (<code>AMANAH_PLUS_LAUNCH_AT</code>) angelegt wurden, behalten alle Funktionen dauerhaft.</li>
          <li>Ohne Starttermin bleibt jedes Konto freigeschaltet; die Produktionsprüfung lehnt Sperren ohne Starttermin ab.</li>
          <li>Gespeicherte Daten werden nie wegen eines fehlenden Kaufs gelöscht oder unlesbar; Export und Löschung bleiben frei.</li>
          <li>Neue Nutzer sehen Plus-Bereiche als Vorschau mit Hinweis, nicht als Fehlerseite.</li>
        </ul>
      </Card>
    </div>
  );
}
