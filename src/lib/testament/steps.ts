import type { TestamentPreparation } from "@/lib/domain/types";

/** One question per step. Parts are kept strictly separate (wishes / Islamic model / German law facts). */
export type PreparationPart = "personalWishes" | "islamicModel" | "legalFacts";

export interface PreparationStep {
  id: string;
  part: PreparationPart;
  field: string;
  question: string;
  help?: string;
  type: "choice" | "text" | "textarea";
  options?: { value: string; label: string }[];
}

const YES_NO_UNSURE = [
  { value: "ja", label: "Ja" },
  { value: "nein", label: "Nein" },
  { value: "unsicher", label: "Weiß ich nicht" },
];

export const PART_LABELS: Record<PreparationPart, string> = {
  personalWishes: "Persönliche Wünsche",
  islamicModel: "Islamische Erbwünsche",
  legalFacts: "Angaben für das deutsche Recht",
};

export const PREPARATION_STEPS: PreparationStep[] = [
  { id: "marital", part: "legalFacts", field: "maritalStatus", question: "Wie ist dein Familienstand?", type: "choice", options: [
    { value: "ledig", label: "Ledig" }, { value: "verheiratet", label: "Verheiratet" }, { value: "geschieden", label: "Geschieden" }, { value: "verwitwet", label: "Verwitwet" },
  ] },
  { id: "regime", part: "legalFacts", field: "propertyRegime", question: "Welcher Güterstand gilt in deiner Ehe?", help: "Ohne Ehevertrag ist es in Deutschland meist die Zugewinngemeinschaft. Der Güterstand beeinflusst, was dein Ehepartner erbt.", type: "choice", options: [
    { value: "zugewinn", label: "Zugewinngemeinschaft (kein Ehevertrag)" }, { value: "guetertrennung", label: "Gütertrennung" }, { value: "guetergemeinschaft", label: "Gütergemeinschaft" }, { value: "unbekannt", label: "Weiß ich nicht" },
  ] },
  { id: "citizenship", part: "legalFacts", field: "citizenships", question: "Welche Staatsangehörigkeit(en) hast du?", help: "Wichtig, weil bei mehreren Staatsangehörigkeiten unterschiedliches Erbrecht in Frage kommen kann.", type: "text" },
  { id: "residence", part: "legalFacts", field: "habitualResidence", question: "Wo lebst du überwiegend?", help: "Für Erbfälle in der EU zählt meist der Ort, an dem man gewöhnlich lebt.", type: "choice", options: [
    { value: "deutschland", label: "In Deutschland" }, { value: "ausland", label: "Im Ausland" },
  ] },
  { id: "existingWill", part: "legalFacts", field: "existingWill", question: "Hast du schon ein Testament?", type: "choice", options: YES_NO_UNSURE },
  { id: "jointWill", part: "legalFacts", field: "jointWillWithSpouse", question: "Gibt es ein gemeinsames Testament mit deinem Ehepartner?", help: "Gemeinsame Testamente können dich binden – das sollte ein Anwalt oder Notar prüfen.", type: "choice", options: YES_NO_UNSURE },
  { id: "realEstate", part: "legalFacts", field: "realEstateGermany", question: "Besitzt du Immobilien in Deutschland?", type: "choice", options: YES_NO_UNSURE },
  { id: "abroad", part: "legalFacts", field: "assetsAbroad", question: "Hast du Vermögen oder Immobilien im Ausland?", type: "choice", options: YES_NO_UNSURE },
  { id: "abroadCountries", part: "legalFacts", field: "assetsAbroadCountries", question: "In welchen Ländern?", type: "text" },
  { id: "business", part: "legalFacts", field: "businessInterests", question: "Bist du an einem Unternehmen beteiligt?", type: "choice", options: YES_NO_UNSURE },
  { id: "religion", part: "legalFacts", field: "differentReligionRelatives", question: "Gibt es nahe Angehörige mit anderer Religion?", help: "Das kann islamrechtlich und nach deutschem Recht unterschiedliche Folgen haben.", type: "choice", options: YES_NO_UNSURE },
  { id: "islamicWish", part: "islamicModel", field: "wantsIslamicDistribution", question: "Möchtest du, dass dein Nachlass nach islamischen Erbgrundsätzen verteilt wird?", help: "Das wird nur wirksam, wenn es in einem formgültigen Testament konkret geregelt ist. Diese Frage hilft, das Gespräch mit Anwalt oder Notar vorzubereiten.", type: "choice", options: YES_NO_UNSURE },
  { id: "school", part: "islamicModel", field: "preferredSchool", question: "Folgst du einer Rechtsschule?", type: "choice", options: [
    { value: "hanafi", label: "Hanafitisch" }, { value: "maliki", label: "Malikitisch" }, { value: "shafii", label: "Schafiitisch" }, { value: "hanbali", label: "Hanbalitisch" }, { value: "unsicher", label: "Weiß ich nicht" },
  ] },
  { id: "gender", part: "islamicModel", field: "ownGender", question: "Bist du …", help: "Die Erbanteile des Ehepartners hängen davon ab.", type: "choice", options: [
    { value: "female", label: "eine Frau" }, { value: "male", label: "ein Mann" },
  ] },
  { id: "father", part: "islamicModel", field: "fatherAlive", question: "Lebt dein Vater?", type: "choice", options: YES_NO_UNSURE },
  { id: "mother", part: "islamicModel", field: "motherAlive", question: "Lebt deine Mutter?", type: "choice", options: YES_NO_UNSURE },
  { id: "grandparents", part: "islamicModel", field: "grandparentsAlive", question: "Lebt einer deiner Großeltern?", type: "choice", options: YES_NO_UNSURE },
  { id: "grandchildren", part: "islamicModel", field: "grandchildrenViaDeceasedSon", question: "Hast du Enkel von einem bereits verstorbenen Sohn?", type: "choice", options: YES_NO_UNSURE },
  { id: "wishes", part: "personalWishes", field: "wishes", question: "Was ist dir für deinen Nachlass persönlich wichtig?", help: "Zum Beispiel bestimmte Gegenstände für bestimmte Personen.", type: "textarea" },
  { id: "charity", part: "personalWishes", field: "charitableWishes", question: "Möchtest du etwas für wohltätige Zwecke bestimmen?", type: "textarea" },
];

export function readStepValue(prep: TestamentPreparation, step: PreparationStep): string {
  return String((prep[step.part] as Record<string, unknown>)[step.field] ?? "");
}

export function writeStepValue(prep: TestamentPreparation, step: PreparationStep, value: string): TestamentPreparation {
  return { ...prep, [step.part]: { ...prep[step.part], [step.field]: value } };
}

/** Steps that do not apply are skipped (e.g. property regime when not married). */
export function isStepRelevant(prep: TestamentPreparation, step: PreparationStep): boolean {
  if (step.id === "regime" || step.id === "jointWill") return prep.legalFacts.maritalStatus === "verheiratet";
  if (step.id === "abroadCountries") return prep.legalFacts.assetsAbroad === "ja";
  if (step.id === "school") return prep.islamicModel.wantsIslamicDistribution !== "nein";
  return true;
}
