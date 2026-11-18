"use client";

import { ModulePage } from "@/components/modules/module-page";
import { PersonPicker } from "@/components/vorsorge/person-picker";
import { Card, CardTitle } from "@/components/ui/card";
import { emergencyCardFields } from "@/lib/modules/fields";
import { PrintButton, PrintField, PrintSection } from "@/components/print/print-views";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { formatDisplayDate } from "@/lib/utils/date-input";

function NotfallkartePrintView() {
  const d = useAmanahStore();

  return (
    <div className="print-view max-w-md mx-auto p-6 bg-white">
      <div className="text-center mb-6 border-b-2 border-primary pb-4">
        <h1 className="text-xl font-bold text-primary">Notfallkarte</h1>
        <p className="text-xs text-muted">Amanah – Mein Wille — {new Date().toLocaleDateString("de-DE")}</p>
      </div>
      <PrintSection title="Persönliche Daten">
        <PrintField label="Name" value={d.emergencyCard.name} />
        <PrintField label="Geburtsdatum" value={formatDisplayDate(d.emergencyCard.birthDate)} />
        <PrintField label="Sprache" value={d.emergencyCard.language} />
      </PrintSection>
      <PrintSection title="Notfallkontakte">
        <PrintField label="Kontakt 1" value={`${d.emergencyCard.emergencyContact1.name} — ${d.emergencyCard.emergencyContact1.phone} (${d.emergencyCard.emergencyContact1.relation})`} />
        <PrintField label="Kontakt 2" value={`${d.emergencyCard.emergencyContact2.name} — ${d.emergencyCard.emergencyContact2.phone}`} />
        <PrintField label="Hausarzt" value={d.emergencyCard.familyDoctor} />
      </PrintSection>
      <PrintSection title="Medizinisch">
        <PrintField label="Krankheiten" value={d.emergencyCard.illnesses} />
        <PrintField label="Medikamente" value={d.emergencyCard.medications} />
        <PrintField label="Allergien" value={d.emergencyCard.allergies} />
      </PrintSection>
      <PrintSection title="Islamisch / Bestattung">
        <PrintField label="Moschee / Imam" value={d.emergencyCard.mosqueImam} />
        <PrintField label="Bestatter" value={d.emergencyCard.preferredFuneralDirector} />
        <PrintField label="Patientenverfügung" value={d.emergencyCard.hasPatientenverfuegung} />
        <PrintField label="Vorsorgevollmacht" value={d.emergencyCard.hasVorsorgevollmacht} />
        <PrintField label="Janazah-Wünsche" value={d.emergencyCard.hasJanazahWishes} />
      </PrintSection>
    </div>
  );
}

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
      <Card className="mt-6 no-print">
        <p className="text-sm text-muted mb-4">
          Drucke deine Notfallkarte und bewahre sie im Portemonnaie, am Kühlschrank oder im Auto auf.
        </p>
        <PrintButton label="Notfallkarte als PDF speichern" />
      </Card>
      <div className="print-only">
        <NotfallkartePrintView />
      </div>
    </ModulePage>
  );
}
