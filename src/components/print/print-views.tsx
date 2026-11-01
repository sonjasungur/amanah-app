"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { AssetPrintEntries, ASSET_PRINT_NOTICE } from "@/components/print/asset-print-view";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({ label = "Als PDF speichern", className }: PrintButtonProps) {
  return (
    <div className={className}>
      <Button onClick={() => window.print()} variant="secondary">
        <Printer size={16} className="mr-2" /> {label}
      </Button>
      <p className="text-xs text-muted mt-2">Wähle im Druckdialog &ldquo;Als PDF speichern&rdquo;.</p>
    </div>
  );
}

export function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid-break mb-6">
      <h2 className="text-lg font-bold text-primary border-b border-primary/20 pb-2 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export function PrintField({ label, value }: { label: string; value?: string | null | boolean }) {
  const display = value === null || value === undefined || value === ""
    ? "—"
    : typeof value === "boolean"
    ? value ? "Ja" : "Nein"
    : value;
  return (
    <div className="mb-2 text-sm">
      <span className="font-medium">{label}: </span>
      <span>{display}</span>
    </div>
  );
}

export const FULL_PRINT_TITLE = "Vorsorge-Übersicht – kein Testament";

const FULL_PRINT_NOTICE = "Persönliche Übersicht: kein Testament, keine Vollmacht, keine Patientenverfügung";

export function FullPrintView() {
  const d = useAmanahStore();

  return (
    <div className="print-view max-w-3xl mx-auto p-8 bg-white" data-testid="full-print-view">
      {/* A table head repeats on every printed page, so no single page can pass for a legal document. */}
      <table className="w-full" role="presentation">
        <thead>
          <tr>
            <td className="pb-3 text-xs font-semibold text-center" data-testid="full-print-page-notice">{FULL_PRINT_NOTICE}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-bold text-primary">Vorsorge-Übersicht</h1>
        <p className="text-sm text-muted">Erstellt am {new Date().toLocaleDateString("de-DE")}</p>
        <p className="text-xs text-muted mt-2">
          Diese Übersicht sammelt deine Angaben zum Nachschlagen. Sie hat keine rechtliche Wirkung und ersetzt keine Dokumente. Ein eigenhändiges
          Testament muss vollständig von Hand geschrieben und unterschrieben sein (§ 2247 BGB). Vollmacht und Patientenverfügung brauchen eigene, unterschriebene Dokumente.
        </p>
      </div>

      <PrintSection title="1. Notfallkontakte">
        <PrintField label="Name" value={d.emergencyCard.name} />
        <PrintField label="Geburtsdatum" value={d.emergencyCard.birthDate} />
        <PrintField label="Notfallkontakt 1" value={`${d.emergencyCard.emergencyContact1.name} (${d.emergencyCard.emergencyContact1.phone})`} />
        <PrintField label="Notfallkontakt 2" value={`${d.emergencyCard.emergencyContact2.name} (${d.emergencyCard.emergencyContact2.phone})`} />
        <PrintField label="Hausarzt" value={d.emergencyCard.familyDoctor} />
        <PrintField label="Krankheiten" value={d.emergencyCard.illnesses} />
        <PrintField label="Medikamente" value={d.emergencyCard.medications} />
        <PrintField label="Allergien" value={d.emergencyCard.allergies} />
      </PrintSection>

      <PrintSection title="2. Wünsche zur medizinischen Behandlung (keine Patientenverfügung)">
        <PrintField label="Medizinische Wünsche" value={d.medicalWishes.medicalWishes} />
        <PrintField label="Religiöse Wünsche" value={d.medicalWishes.religiousWishes} />
        <PrintField label="Dokumentenort" value={d.medicalWishes.documentLocation} />
      </PrintSection>

      <PrintSection title="3. Angaben zur Vollmacht (keine Vollmacht)">
        <PrintField label="Vorgesehene Person" value={d.powerOfAttorney.authorizedPerson} />
        <PrintField label="Ersatzperson" value={d.powerOfAttorney.substitutePerson} />
      </PrintSection>

      <PrintSection title="4. Wünsche zur Betreuung (keine Betreuungsverfügung)">
        <PrintField label="Gewünschter Betreuer" value={d.careDirective.preferredGuardian} />
        <PrintField label="Nicht gewünscht" value={d.careDirective.excludedGuardian} />
      </PrintSection>

      <PrintSection title="5. Janazah-Wünsche">
        <PrintField label="Islamische Bestattung" value={d.janazahWishes.islamicBurialDesired} />
        <PrintField label="Keine Verzögerung" value={d.janazahWishes.noUnnecessaryDelay} />
        <PrintField label="Bestatter" value={d.janazahWishes.preferredFuneralDirector} />
        <PrintField label="Moschee" value={d.janazahWishes.preferredMosque} />
        <PrintField label="Nachricht an Familie" value={d.janazahWishes.messageToFamily} />
      </PrintSection>

      <PrintSection title="6. Ghusl & Kafan">
        <PrintField label="Anwesend" value={d.ghuslKafan.whoMayBePresent} />
        <PrintField label="Schamgrenzen" value={d.ghuslKafan.dignityBoundaries} />
      </PrintSection>

      <PrintSection title="7. Bestattung / Überführung">
        <PrintField label="Deutschland bevorzugt" value={d.burialPreference.burialGermanyPreferred} />
        <PrintField label="Überführung bevorzugt" value={d.burialPreference.repatriationPreferred} />
        <PrintField label="Stadt/PLZ" value={d.burialPreference.cityPlz} />
      </PrintSection>

      <PrintSection title="8. Erbprofil und Notizen (kein Testament)">
        <PrintField label="Verheiratet" value={d.inheritanceProfile.married} />
        <PrintField label="Söhne" value={String(d.inheritanceProfile.sons)} />
        <PrintField label="Töchter" value={String(d.inheritanceProfile.daughters)} />
        <PrintField label="Notizen zur Waṣiyya" value={d.inheritanceProfile.desiredWasiyyah} />
      </PrintSection>

      <PrintSection title="9. Schulden & Amanah">
        {d.debtsAmanah.length === 0 ? <p className="text-sm">Keine Einträge</p> : d.debtsAmanah.map((item) => (
          <PrintField key={item.id} label={item.type} value={`${item.description} — ${item.person}`} />
        ))}
      </PrintSection>

      <PrintSection title="10. Digitaler Nachlass">
        {d.digitalLegacy.length === 0 ? <p className="text-sm">Keine Einträge (keine Passwörter gespeichert)</p> : d.digitalLegacy.map((item) => (
          <PrintField key={item.id} label={item.type} value={`${item.description} — Hinweis: ${item.locationHint}`} />
        ))}
      </PrintSection>

      <PrintSection title="11. Barzakh-Plan">
        <PrintField label="Familie soll prüfen" value={d.barzakhPlan.familyFirstCheck} />
        <PrintField label="Gewünschte Duas" value={d.barzakhPlan.desiredDuas} />
      </PrintSection>

      <PrintSection title="12. Sadaqa Jariya">
        <PrintField label="Bevorzugter Topf" value={d.sadaqaJariya.preferredPot} />
        <PrintField label="Vertrauensperson" value={d.sadaqaJariya.personToVerify} />
      </PrintSection>

      <PrintSection title="13. Familienbrief">
        <p className="text-sm whitespace-pre-wrap">{d.familyMessage.familyLetter || "—"}</p>
      </PrintSection>

      <PrintSection title="14. Vermögensübersicht (Bestandsaufnahme, kein Testament)">
        <p className="text-xs text-muted mb-2">{ASSET_PRINT_NOTICE}</p>
        <AssetPrintEntries assets={d.assets} />
      </PrintSection>

      <PrintSection title="15. Hinweis">
        <p className="text-xs text-muted">
          Diese Plattform ersetzt keinen Imam, Gelehrten, Arzt, Anwalt oder Notar. Allah entscheidet.
          Diese Übersicht hilft nur bei bewusster Vorbereitung. Keine Garantie für Richtigkeit oder Vollständigkeit.
        </p>
      </PrintSection>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
