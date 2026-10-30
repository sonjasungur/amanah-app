import type { AmanahOrdnerData } from "@/lib/domain/types";

/**
 * Questions to take to a lawyer or notary — derived deterministically from the answers.
 * These are questions, never legal answers. Norm references point to the topic, not to a result.
 */
export interface LawyerQuestion {
  id: string;
  question: string;
  reference?: string;
}

export function buildLawyerQuestions(data: Pick<AmanahOrdnerData, "testamentPreparation" | "inheritanceProfile" | "familyMembers">): LawyerQuestion[] {
  const { legalFacts: f, islamicModel: i } = data.testamentPreparation;
  const p = data.inheritanceProfile;
  const hasChildren = p.sons + p.daughters > 0 || data.familyMembers.some((m) => m.relationType === "kind");
  const minorChildren = data.familyMembers.some((m) => m.relationType === "kind" && isMinor(m.birthDate));
  const q: LawyerQuestion[] = [];

  q.push({ id: "form", question: "Welche Form ist für mein Testament die richtige – eigenhändig oder notariell?", reference: "§§ 2231, 2232, 2247 BGB" });
  if (i.wantsIslamicDistribution === "ja" || i.wantsIslamicDistribution === "unsicher") {
    q.push({ id: "islamic", question: "Wie kann mein Wunsch nach islamischer Verteilung in konkrete, wirksame Regelungen übersetzt werden?", reference: "Testierfreiheit; Bestimmtheit; § 2065 BGB" });
    q.push({ id: "pflichtteil", question: "Welche Pflichtteilsansprüche könnten bei einer islamischen Verteilung entstehen?", reference: "§§ 2303 ff. BGB" });
  }
  if (f.maritalStatus === "verheiratet") {
    q.push({ id: "regime", question: "Wie wirkt sich unser Güterstand auf den Erbteil meines Ehepartners aus?", reference: "§§ 1371, 1931 BGB" });
    if (f.jointWillWithSpouse !== "nein") q.push({ id: "joint", question: "Bindet mich ein gemeinsames Testament mit meinem Ehepartner?", reference: "§§ 2265 ff., 2270, 2271 BGB" });
  }
  if (f.existingWill !== "nein") q.push({ id: "existing", question: "Was passiert mit meinem bisherigen Testament, und wie widerrufe ich es?", reference: "§§ 2253 ff. BGB" });
  if (f.habitualResidence === "ausland" || f.citizenships.split(/[,;/]| und /).filter((c) => c.trim()).length > 1 || (f.citizenships && !/deutsch/i.test(f.citizenships))) {
    q.push({ id: "international", question: "Welches Erbrecht gilt für mich, und ist eine Rechtswahl sinnvoll?", reference: "EU-Erbrechtsverordnung Art. 21, 22" });
  }
  if (f.assetsAbroad === "ja") q.push({ id: "abroad", question: `Welche Regeln gelten für mein Vermögen im Ausland${f.assetsAbroadCountries ? ` (${f.assetsAbroadCountries})` : ""}?`, reference: "Nachlassspaltung, Staatsverträge" });
  if (f.businessInterests === "ja") q.push({ id: "business", question: "Was muss für meine Unternehmensbeteiligung geregelt werden?", reference: "Gesellschaftsvertrag" });
  if (f.differentReligionRelatives === "ja" || p.nonMuslimRelatives) {
    q.push({ id: "religion", question: "Wie werden Angehörige mit anderer Religion nach deutschem Recht und nach meinen Wünschen berücksichtigt?", reference: "Pflichtteil; ordre public (Art. 35 EuErbVO)" });
  }
  if (p.stepchildren || p.fosterChildren) q.push({ id: "step", question: "Wie kann ich Stief- oder Pflegekinder bedenken?", reference: "Vermächtnis §§ 2147 ff. BGB" });
  if (minorChildren || (hasChildren && data.familyMembers.some((m) => m.roles?.includes("vormund_wunsch")))) {
    q.push({ id: "guardian", question: "Wie benenne ich wirksam einen Vormund für meine minderjährigen Kinder?", reference: "§ 1782 BGB" });
  }
  if (data.testamentPreparation.personalWishes.charitableWishes.trim()) {
    q.push({ id: "charity", question: "Wie setze ich ein Vermächtnis an eine gemeinnützige Organisation um?", reference: "§§ 2147 ff. BGB; Erbschaftsteuer" });
  }
  q.push({ id: "storage", question: "Soll mein Testament amtlich verwahrt werden?", reference: "§ 2248 BGB, Zentrales Testamentsregister" });
  return q;
}

function isMinor(birthDate?: string): boolean {
  if (!birthDate) return false;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return false;
  const eighteen = new Date(born);
  eighteen.setFullYear(born.getFullYear() + 18);
  return eighteen > new Date();
}
