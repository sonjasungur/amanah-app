"use client";

import { moduleText } from "@/lib/content/module-texts";
import { useState } from "react";
import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { checkInheritance } from "@/lib/utils/progress";
import { INHERITANCE_HINT_LABELS, INHERITANCE_HINT_NOTICE, INHERITANCE_POINTS_NOTICE, inheritanceConversationPoints } from "@/lib/domain/validation";
import { isInheritanceHintsEnabled } from "@/lib/flags/inheritance-hints";
import {
  FULL_PRINT_TITLE,
  FullPrintView,
  PrintField,
  PrintSection,
} from "@/components/print/print-views";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { FileText, Printer } from "lucide-react";
import { PlusGate } from "@/components/billing/plus-gate";

function NotfallkartePrintView() {
  const d = useAmanahStore();
  return (
    <div className="print-view max-w-md mx-auto p-6 bg-white">
      <div className="text-center mb-6 border-b-2 border-primary pb-4">
        <h1 className="text-xl font-bold text-primary">Notfallkarte</h1>
        <p className="text-xs text-muted">{new Date().toLocaleDateString("de-DE")}</p>
      </div>
      <PrintSection title="Persönlich">
        <PrintField label="Name" value={d.emergencyCard.name} />
        <PrintField label="Geburtsdatum" value={d.emergencyCard.birthDate} />
        <PrintField label="Sprache" value={d.emergencyCard.language} />
      </PrintSection>
      <PrintSection title="Notfallkontakte">
        <PrintField label="Kontakt 1" value={`${d.emergencyCard.emergencyContact1.name} — ${d.emergencyCard.emergencyContact1.phone}`} />
        <PrintField label="Kontakt 2" value={`${d.emergencyCard.emergencyContact2.name} — ${d.emergencyCard.emergencyContact2.phone}`} />
        <PrintField label="Hausarzt" value={d.emergencyCard.familyDoctor} />
      </PrintSection>
      <PrintSection title="Medizinisch">
        <PrintField label="Krankheiten" value={d.emergencyCard.illnesses} />
        <PrintField label="Medikamente" value={d.emergencyCard.medications} />
        <PrintField label="Allergien" value={d.emergencyCard.allergies} />
      </PrintSection>
      <PrintSection title="Islamisch">
        <PrintField label="Moschee / Imam" value={d.emergencyCard.mosqueImam} />
        <PrintField label="Bestatter" value={d.emergencyCard.preferredFuneralDirector} />
      </PrintSection>
    </div>
  );
}

function JanazahPrintView() {
  const d = useAmanahStore();
  return (
    <div className="print-view max-w-2xl mx-auto p-8 bg-white">
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-bold text-primary">Janazah-Wünsche</h1>
        <p className="text-sm text-muted">Persönliche Wünsche, keine rechtliche Verfügung — {new Date().toLocaleDateString("de-DE")}</p>
      </div>
      <PrintSection title="Grundwünsche">
        <PrintField label="Islamische Bestattung" value={d.janazahWishes.islamicBurialDesired} />
        <PrintField label="Keine Verzögerung" value={d.janazahWishes.noUnnecessaryDelay} />
        <PrintField label="Bestatter" value={d.janazahWishes.preferredFuneralDirector} />
        <PrintField label="Moschee" value={d.janazahWishes.preferredMosque} />
        <PrintField label="Friedhof" value={d.janazahWishes.preferredCemetery} />
      </PrintSection>
      <PrintSection title="Ghusl & Kafan">
        <PrintField label="Ghusl" value={d.janazahWishes.ghusl} />
        <PrintField label="Kafan" value={d.janazahWishes.kafan} />
        <PrintField label="Janazah-Gebet" value={d.janazahWishes.janazahPrayer} />
      </PrintSection>
      <PrintSection title="Beisetzung">
        <PrintField label="Deutschland" value={d.janazahWishes.burialGermany} />
        <PrintField label="Überführung" value={d.janazahWishes.repatriation} />
      </PrintSection>
      <PrintSection title="Nachricht an Familie">
        <p className="text-sm whitespace-pre-wrap">{d.janazahWishes.messageToFamily || "—"}</p>
      </PrintSection>
    </div>
  );
}

function TestamentPrintView() {
  const d = useAmanahStore();
  // The verdict stays off until a lawyer has approved it; the sheet then only lists neutral questions.
  const result = isInheritanceHintsEnabled() ? checkInheritance(d.inheritanceProfile) : null;
  const points = inheritanceConversationPoints(d.inheritanceProfile);

  return (
    <div className="print-view max-w-2xl mx-auto p-8 bg-white">
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-bold text-primary">Erbprofil für das Gespräch</h1>
        <p className="text-sm font-semibold">Kein Testament</p>
        <p className="text-sm text-muted">
          {result && <>Erste Hinweise: {INHERITANCE_HINT_LABELS[result.status]} — </>}
          {new Date().toLocaleDateString("de-DE")}
        </p>
        <p className="text-xs text-muted mt-2">
          {result ? INHERITANCE_HINT_NOTICE : INHERITANCE_POINTS_NOTICE} Dieses Blatt ist kein Testament. {moduleText("testament-form-pdf")}
        </p>
      </div>
      <PrintSection title="Erbprofil">
        <PrintField label="Verheiratet" value={d.inheritanceProfile.married} />
        <PrintField label="Ehepartner lebt" value={d.inheritanceProfile.spouseAlive} />
        <PrintField label="Söhne" value={String(d.inheritanceProfile.sons)} />
        <PrintField label="Töchter" value={String(d.inheritanceProfile.daughters)} />
        <PrintField label="Stiefkinder" value={d.inheritanceProfile.stepchildren} />
        <PrintField label="Nicht-muslimische Angehörige" value={d.inheritanceProfile.nonMuslimRelatives} />
      </PrintSection>
      <PrintSection title="Notizen zu Waṣiyya und Sadaqa (unverbindlich)">
        <PrintField label="Notizen zur Waṣiyya" value={d.inheritanceProfile.desiredWasiyyah} />
        <PrintField label="Notizen zur Sadaqa Jariya" value={d.inheritanceProfile.desiredSadaqaJariya} />
      </PrintSection>
      {points.length > 0 && (
        <PrintSection title="Fragen für das Gespräch">
          {points.map((p) => <p key={p} className="text-sm mb-1">• {p}</p>)}
        </PrintSection>
      )}
      {result && result.warnings.length > 0 && (
        <PrintSection title="Warnungen">
          {result.warnings.map((w, i) => <p key={i} className="text-sm mb-1">• {w}</p>)}
        </PrintSection>
      )}
      {result && result.recommendations.length > 0 && (
        <PrintSection title="Empfehlungen">
          {result.recommendations.map((r, i) => <p key={i} className="text-sm mb-1">• {r}</p>)}
        </PrintSection>
      )}
    </div>
  );
}

function SchuldenPrintView() {
  const d = useAmanahStore();
  return (
    <div className="print-view max-w-2xl mx-auto p-8 bg-white">
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-bold text-primary">Schulden & Amanah</h1>
        <p className="text-sm text-muted">{new Date().toLocaleDateString("de-DE")}</p>
      </div>
      <PrintSection title="Einträge">
        {d.debtsAmanah.length === 0 ? (
          <p className="text-sm">Keine Einträge</p>
        ) : (
          d.debtsAmanah.map((item) => (
            <PrintField key={item.id} label={`${item.type} (${item.priority})`} value={`${item.description} — ${item.person}`} />
          ))
        )}
      </PrintSection>
    </div>
  );
}

function FamilienbriefPrintView() {
  const d = useAmanahStore();
  return (
    <div className="print-view max-w-2xl mx-auto p-8 bg-white">
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-bold text-primary">Familienbrief</h1>
        <p className="text-sm text-muted">{new Date().toLocaleDateString("de-DE")}</p>
      </div>
      <PrintSection title="Brief an die Familie">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{d.familyMessage.familyLetter || "—"}</p>
      </PrintSection>
      {d.familyMessage.keyWishesSummary && (
        <PrintSection title="Wichtigste Wünsche">
          <p className="text-sm whitespace-pre-wrap">{d.familyMessage.keyWishesSummary}</p>
        </PrintSection>
      )}
    </div>
  );
}

type PrintTarget = "full" | "notfallkarte" | "janazah" | "testament" | "schulden" | "familienbrief";

const exportOptions: { id: PrintTarget; title: string; description: string; icon: string }[] = [
  { id: "full", title: "Gesamtübersicht als PDF speichern", description: "Alle deine Angaben zum Nachschlagen. Kein Testament, keine Vollmacht, keine Patientenverfügung.", icon: "📁" },
  { id: "notfallkarte", title: "Notfallkarte", description: "Kompakte Karte für den Notfall", icon: "🆘" },
  { id: "janazah", title: "Janazah-Bericht", description: "Islamische Bestattungswünsche", icon: "🕌" },
  { id: "testament", title: "Erbprofil für das Gespräch", description: "Deine Angaben und Fragen für Gelehrte, Anwalt oder Notar (kein Testament)", icon: "📜" },
  { id: "schulden", title: "Schulden & Amanah", description: "Liste offener Rechte und Pflichten", icon: "⚖️" },
  { id: "familienbrief", title: "Familienbrief", description: "Brief an deine Familie", icon: "👨‍👩‍👧‍👦" },
];

export default function PdfPage() {
  const [activePrint, setActivePrint] = useState<PrintTarget>("full");

  const handlePrint = (target: PrintTarget) => {
    setActivePrint(target);
    setTimeout(() => {
      // The browser suggests the page title as file name; this one must not read like a will.
      const title = document.title;
      if (target === "full") document.title = FULL_PRINT_TITLE;
      window.print();
      document.title = title;
    }, 150);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8 no-print">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <FileText size={28} /> PDF & Export
        </h1>
        <p className="text-muted">
          Speichere deine Angaben als PDF — zum Ausdrucken, Teilen oder Aufbewahren.
        </p>
      </div>

      <Disclaimer />

      <div className="rounded-xl bg-sand border border-accent/30 px-4 py-3 text-sm text-muted">
        <span className="text-accent mr-1">💡</span>
        Es wird nichts automatisch übertragen. Du kannst das Dokument über den Browser als PDF speichern oder drucken.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {exportOptions.map((opt) => (
          <Card key={opt.id} id={`export-${opt.id}`} data-testid={`export-${opt.id}`} className="hover:border-primary/30 transition-all">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <CardTitle className="text-base">{opt.title}</CardTitle>
                <p className="text-sm text-muted mb-4">{opt.description}</p>
                {opt.id === "full" ? (
                  <PlusGate feature="pdf_exports">
                    <Button variant="secondary" size="sm" onClick={() => handlePrint(opt.id)}>
                      <Printer size={16} className="mr-2" /> Als PDF speichern oder drucken
                    </Button>
                  </PlusGate>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handlePrint(opt.id)}>
                    <Printer size={16} className="mr-2" /> Als PDF speichern oder drucken
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        <Card id="export-vermoegen" data-testid="export-vermoegen" className="hover:border-primary/30 transition-all">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🗂️</span>
            <div className="flex-1">
              <CardTitle className="text-base">Vermögensübersicht</CardTitle>
              <p className="text-sm text-muted mb-4">Was es gibt und wo die Unterlagen liegen (kein Testament). Der einfache Ausdruck liegt direkt dort und gehört nicht zu Vorsorge Plus.</p>
              <Link href="/dashboard/vermoegen" className="text-sm font-semibold text-primary hover:underline inline-flex items-center min-h-[44px]" data-testid="export-vermoegen-link">
                Zur Vermögensübersicht
              </Link>
            </div>
          </div>
        </Card>
      </div>
      </div>

      <div className="print-only">
        {activePrint === "full" && <FullPrintView />}
        {activePrint === "notfallkarte" && <NotfallkartePrintView />}
        {activePrint === "janazah" && <JanazahPrintView />}
        {activePrint === "testament" && <TestamentPrintView />}
        {activePrint === "schulden" && <SchuldenPrintView />}
        {activePrint === "familienbrief" && <FamilienbriefPrintView />}
      </div>
    </div>
  );
}
