import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getAllModuleProgress } from "@/lib/domain/validation";
import { moduleConfigs } from "@/lib/modules/config";

const DISCLAIMER =
  "\n\n---\nHinweis: Dies ist ein persönlicher Entwurf zur Vorbereitung — keine Rechtsberatung, keine medizinische Beratung, keine Fatwa. Bitte mit Vertrauensperson, Imam/Gelehrten und ggf. Anwalt/Notar fachlich prüfen lassen.";

function burialLabel(data: AmanahOrdnerData): string | null {
  const b = data.burialPreference;
  if (!b) return null;
  if (b.burialGermanyPreferred) return "Beisetzung in Deutschland bevorzugt";
  if (b.repatriationPreferred) return "Überführung ins Herkunftsland bevorzugt";
  if (b.decisionCriteria) return b.decisionCriteria;
  return null;
}

export function buildFamilyLetterTemplate(data: AmanahOrdnerData): string {
  const name = data.emergencyCard?.name || data.userProfile?.name || "[Dein Name]";
  const ec1 = data.emergencyCard?.emergencyContact1;
  const ec2 = data.emergencyCard?.emergencyContact2;
  const contact1 = ec1?.name ? `${ec1.name}${ec1.phone ? ` (${ec1.phone})` : ""}${ec1.relation ? `, ${ec1.relation}` : ""}` : null;
  const contact2 = ec2?.name ? `${ec2.name}${ec2.phone ? ` (${ec2.phone})` : ""}` : null;
  const bestatter = data.janazahWishes?.preferredFuneralDirector;
  const burial = burialLabel(data);
  const vollmacht = data.powerOfAttorney?.authorizedPerson;
  const pv = data.medicalWishes?.medicalWishes;
  const digital = data.digitalLegacy?.length ?? 0;
  const schulden = data.debtsAmanah?.length ?? 0;

  const progress = getAllModuleProgress(data);
  const openModules = progress.filter((m) => m.percent < 100).slice(0, 5);

  const lines: string[] = [
    `Liebe Familie,`,
    ``,
    `ich schreibe euch diesen Brief, damit ihr im Notfall oder nach meinem Tod nicht ratlos seid. Mit Mein Wille halte ich meine persönlichen Wünsche für Vorsorge, Janazah und Notfall fest — als Orientierung für euch, nicht als rechtsgültiges Testament.`,
    ``,
    `## Im Notfall — wen zuerst kontaktieren`,
    contact1 ? `- Hauptkontakt: ${contact1}` : `- Hauptkontakt: [bitte im Ordner ergänzen — Notfallkarte]`,
    vollmacht ? `- Vorsorgevollmacht: ${vollmacht} darf für mich entscheiden (Dokument liegt im Ordner).` : `- Vorsorgevollmacht: [noch nicht dokumentiert — bitte im Ordner prüfen]`,
    pv ? `- Medizinische Wünsche: ${pv.slice(0, 200)}${pv.length > 200 ? "…" : ""}` : `- Patientenverfügung / medizinische Wünsche: [noch offen — Ordner prüfen]`,
  ];
  if (contact2) lines.push(`- Zweitkontakt: ${contact2}`);
  lines.push(
    `## Janazah & Bestattung`,
    bestatter ? `- Bevorzugter Bestatter/Kontakt: ${bestatter}` : `- Bestatter: [noch nicht benannt — Moschee oder Ordner prüfen]`,
    burial ? `- Bestattungswunsch: ${burial}` : `- Beisetzung in Deutschland oder Überführung: [bitte im Ordner festhalten]`,
    `- Mir ist wichtig: islamische Grundsätze, zeitnahe Janazah, Würde bei Ghusl und Kafan. Keine teuren kulturellen Feiern, die euch belasten.`,
    ``,
    `## Unterlagen & digitaler Nachlass`,
    `- Alle Details, Dokumente und Kontakte stehen in Mein Wille (Dashboard / Export).`,
    digital > 0 ? `- Digitale Konten: ${digital} Einträge dokumentiert — Zugangsanweisung im Ordner.` : `- Digitaler Nachlass: [noch nicht vollständig erfasst]`,
    schulden > 0 ? `- Schulden & Amanah: ${schulden} Punkte dokumentiert — bitte fachlich klären, bevor der Nachlass verteilt wird.` : `- Schulden & Amanah: [bitte prüfen, ob noch offen]`,
    ``,
    `## Was noch offen ist`,
  );

  if (openModules.length === 0) {
    lines.push(`- Die wichtigsten Grundlagen sind vorbereitet. Bitte Export regelmäßig aktualisieren.`);
  } else {
    for (const m of openModules) {
      const title = moduleConfigs.find((c) => c.id === m.moduleId)?.title ?? m.moduleId;
      lines.push(`- ${title}: noch ${100 - m.percent}% offen`);
    }
  }

  lines.push(
    ``,
    `## Abschluss`,
    `Dieser Brief ersetzt kein Testament und keine Patientenverfügung. Er soll euch Orientierung geben. Stellt Fragen, solange ich lebe — das ist kein Abschied, sondern Entlastung.`,
    ``,
    `In Liebe und Vertrauen,`,
    name,
    DISCLAIMER
  );

  return lines.join("\n");
}
