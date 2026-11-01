import type { AmanahOrdnerData } from "@/lib/domain/types";
import type { FaraidCaseInput } from "@/lib/inheritance";

/**
 * Builds the input for the (locked) farāʾiḍ prototype from existing answers.
 * Unknown answers are reported as missing instead of guessed.
 */
export function toFaraidInput(
  data: Pick<AmanahOrdnerData, "testamentPreparation" | "inheritanceProfile">
): { input: FaraidCaseInput } | { missing: string[] } {
  const { islamicModel: i, legalFacts: f } = data.testamentPreparation;
  const p = data.inheritanceProfile;
  const missing: string[] = [];
  if (!i.ownGender) missing.push("Eigenes Geschlecht");
  if (i.fatherAlive !== "ja" && i.fatherAlive !== "nein") missing.push("Lebt der Vater?");
  if (i.motherAlive !== "ja" && i.motherAlive !== "nein") missing.push("Lebt die Mutter?");
  if (i.grandparentsAlive !== "ja" && i.grandparentsAlive !== "nein") missing.push("Leben Großeltern?");
  if (i.grandchildrenViaDeceasedSon !== "ja" && i.grandchildrenViaDeceasedSon !== "nein") missing.push("Enkel von einem verstorbenen Sohn?");
  if (!f.maritalStatus) missing.push("Familienstand");
  if (p.siblings === null) missing.push("Geschwister (im Erbprofil)");
  if (f.differentReligionRelatives === "unsicher" || f.differentReligionRelatives === "") missing.push("Angehörige mit anderer Religion");
  if (i.halfSiblings !== "ja" && i.halfSiblings !== "nein") missing.push("Halbgeschwister?");
  if (i.adoptedChildren !== "ja" && i.adoptedChildren !== "nein") missing.push("Adoptierte Kinder?");
  if (f.maritalStatus === "verheiratet" && i.moreThanOneSpouse !== "ja" && i.moreThanOneSpouse !== "nein") missing.push("Mehr als eine Ehe?");
  if (p.sons === 0 && i.otherRelatives !== "ja" && i.otherRelatives !== "nein") missing.push("Weitere männliche Verwandte?");
  if (missing.length) return { missing };

  const married = f.maritalStatus === "verheiratet" && p.spouseAlive !== false;
  const severalSpouses = married && i.moreThanOneSpouse === "ja";
  return {
    input: {
      deceasedGender: i.ownGender as "male" | "female",
      wives: i.ownGender === "male" && married ? (severalSpouses ? 2 : 1) : 0,
      husband: i.ownGender === "female" && married,
      sons: p.sons,
      daughters: p.daughters,
      father: i.fatherAlive === "ja",
      mother: i.motherAlive === "ja",
      siblings: p.siblings || i.halfSiblings === "ja" ? 1 : 0,
      grandparents: i.grandparentsAlive === "ja",
      sonsChildren: i.grandchildrenViaDeceasedSon === "ja",
      differentReligionHeirs: f.differentReligionRelatives === "ja" || Boolean(p.nonMuslimRelatives),
      nonBiologicalChildren: Boolean(p.stepchildren || p.fosterChildren) || i.adoptedChildren === "ja",
      // Outside the narrow rule set: blocked, never calculated.
      otherSpecialCircumstances: (i.ownGender === "female" && severalSpouses) || (p.sons === 0 && i.otherRelatives === "ja"),
    },
  };
}
