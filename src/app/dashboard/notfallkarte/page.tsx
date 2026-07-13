"use client";

import { ModulePage } from "@/components/modules/module-page";
import { emergencyCardFields } from "@/lib/modules/fields";
import { PrintButton, PrintField, PrintSection } from "@/components/print/print-views";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { Card } from "@/components/ui/card";

function NotfallkartePrintView() {
  const d = useAmanahStore();

  return (
    <div className="print-view max-w-md mx-auto p-6 bg-white">
      <div className="text-center mb-6 border-b-2 border-primary pb-4">
        <h1 className="text-xl font-bold text-primary">Notfallkarte</h1>
        <p className="text-xs text-muted">Amanah Vorsorge — {new Date().toLocaleDateString("de-DE")}</p>
      </div>
      <PrintSection title="Persönliche Daten">
        <PrintField label="Name" value={d.emergencyCard.name} />
        <PrintField label="Geburtsdatum" value={d.emergencyCard.birthDate} />
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
