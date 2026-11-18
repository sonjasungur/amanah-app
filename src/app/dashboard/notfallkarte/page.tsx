"use client";

import { ModulePage } from "@/components/modules/module-page";
import { PersonPicker } from "@/components/vorsorge/person-picker";
import { Card, CardTitle } from "@/components/ui/card";
import { emergencyCardFields } from "@/lib/modules/fields";
import { DocumentPanel } from "@/components/documents/document-panel";

export default function NotfallkartePage() {
  return (
    <ModulePage
      title="Notfallkarte"
      description="Wichtige Infos für den Notfall — immer griffbereit für Familie, Pflege und Rettungsdienst."
      section="emergencyCard"
      fields={emergencyCardFields}
      intro={
        <Card className="mb-6 p-5" data-testid="person-pickers">
          <CardTitle className="text-base">Aus Familie &amp; Kontakte übernehmen</CardTitle>
          <p className="text-sm text-muted mb-3">Gewählte Personen bleiben verbunden: Änderst du sie in „Familie &amp; Kontakte“, ändert sich der Eintrag hier mit.</p>
          <div className="grid gap-4 sm:grid-cols-2">
          <PersonPicker field="emergencyContact1" label="Notfallkontakt 1" />
          <PersonPicker field="emergencyContact2" label="Notfallkontakt 2" />
          </div>
        </Card>
      }
    >
      <Card className="mt-6" data-testid="notfallkarte-document">
        <CardTitle className="text-base">Notfallkarte ansehen und drucken</CardTitle>
        <p className="text-sm text-muted mb-4 no-print">
          Eine Seite für Kühlschrank oder Ordner, dazu eine Karte zum Ausschneiden fürs Portemonnaie.
        </p>
        <DocumentPanel id="notfallkarte" />
      </Card>
    </ModulePage>
  );
}
