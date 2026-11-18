"use client";

import { moduleText } from "@/lib/content/module-texts";
import { ModulePage } from "@/components/modules/module-page";
import { PersonPicker } from "@/components/vorsorge/person-picker";
import { Card, CardTitle } from "@/components/ui/card";
import { powerOfAttorneyFields } from "@/lib/modules/fields";

export default function VollmachtPage() {
  return (
    <ModulePage
      help="vorsorgevollmacht"
      title="Vorsorgevollmacht"
      description={moduleText("vollmacht-intro")}
      section="powerOfAttorney"
      fields={powerOfAttorneyFields}
      disclaimerType="legal"
      intro={
        <Card className="mb-6 p-5" data-testid="person-pickers">
          <CardTitle className="text-base">Aus Familie &amp; Kontakte übernehmen</CardTitle>
          <p className="text-sm text-muted mb-3">Gewählte Personen bleiben verbunden: Änderst du sie in „Familie &amp; Kontakte“, ändert sich der Eintrag hier mit.</p>
          <div className="grid gap-4 sm:grid-cols-2">
          <PersonPicker field="authorizedPerson" label="Vorgesehene Person" />
          <PersonPicker field="substitutePerson" label="Ersatzperson" />
          </div>
        </Card>
      }
    />
  );
}
