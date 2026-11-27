import type { AmanahOrdnerData, YesNoUnsure } from "@/lib/domain/types";
import type { FaraidCaseInput } from "@/lib/inheritance";

const answered = (v: YesNoUnsure | undefined): boolean => v === "ja" || v === "nein";

/**
 * Builds the input for the (locked) farāʾiḍ prototype from existing answers.
 * Unknown answers are reported as missing instead of guessed. Contradictions between the
 * inheritance profile, the questionnaire and "Familie & Kontakte" are reported as missing too.
 */
export function toFaraidInput(
  data: Pick<AmanahOrdnerData, "testamentPreparation" | "inheritanceProfile"> & Partial<Pick<AmanahOrdnerData, "familyMembers">>
): { input: FaraidCaseInput } | { missing: string[] } {
  const { islamicModel: i, legalFacts: f } = data.testamentPreparation;
  const p = data.inheritanceProfile;
  const missing: string[] = [];
  const profileChildren = (Number(p.sons) || 0) + (Number(p.daughters) || 0);
  const listedChildren = (data.familyMembers ?? []).filter((m) => m.relationType === "kind").length;
  const married = f.maritalStatus === "verheiratet";

  if (!i.ownGender) missing.push("Eigenes Geschlecht");
  // The child counts default to 0, so 0 alone never means "no children".
  if (!answered(i.hasChildren)) missing.push("Hast du lebende Kinder?");
  else if (i.hasChildren === "ja" && profileChildren === 0) missing.push("Anzahl der Söhne und Töchter (im Erbprofil)");
  else if (i.hasChildren === "nein" && profileChildren > 0) missing.push("Widerspruch: im Erbprofil sind Kinder eingetragen, in der Vorbereitung „keine Kinder“");
  if (listedChildren > 0 && profileChildren === 0 && i.hasChildren !== "ja") {
    missing.push(`Widerspruch: in „Familie & Kontakte“ ${listedChildren === 1 ? "ist 1 Kind" : `sind ${listedChildren} Kinder`} eingetragen, im Erbprofil keine`);
  }
  if (!answered(i.fatherAlive)) missing.push("Lebt der Vater?");
  if (!answered(i.motherAlive)) missing.push("Lebt die Mutter?");
  if (!answered(i.grandparentsAlive)) missing.push("Leben Großeltern?");
  if (!answered(i.grandchildrenViaDeceasedSon)) missing.push("Enkel von einem verstorbenen Sohn?");
  if (!f.maritalStatus) missing.push("Familienstand");
  if (married && p.spouseAlive === null) missing.push("Lebt dein Ehepartner? (im Erbprofil)");
  if (married && (p.spouseAlive === false || p.married === false)) {
    missing.push("Widerspruch: Familienstand „verheiratet“, im Erbprofil aber nicht verheiratet oder Ehepartner verstorben");
  }
  if (p.siblings === null) missing.push("Geschwister (im Erbprofil)");
  if (p.stepchildren === null || p.fosterChildren === null) missing.push("Stief- oder Pflegekinder (im Erbprofil)");
  if (f.differentReligionRelatives === "unsicher" || f.differentReligionRelatives === "") missing.push("Angehörige mit anderer Religion");
  if (!answered(i.halfSiblings)) missing.push("Halbgeschwister?");
  if (!answered(i.adoptedChildren)) missing.push("Adoptierte Kinder?");
  if (married && !answered(i.moreThanOneSpouse)) missing.push("Mehr als eine Ehe?");
  if (p.sons === 0 && !answered(i.otherRelatives)) missing.push("Weitere männliche Verwandte?");
  if (!answered(i.expectedChild)) missing.push("Wird ein Kind erwartet?");
  if (!answered(i.unclearParentage)) missing.push("Kind außerhalb der Ehe oder ungeklärte Abstammung?");
  if (!answered(i.missingRelative)) missing.push("Verschollene Angehörige?");
  if (!answered(i.otherSpecialCircumstances)) missing.push("Weitere besondere Umstände?");
  if (missing.length) return { missing };

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
      // Outside the narrow rule set: blocked, never calculated
      // (unborn child, child outside marriage / unclear parentage, missing person, simultaneous death, homicide, khunthā).
      otherSpecialCircumstances:
        (i.ownGender === "female" && severalSpouses) ||
        (p.sons === 0 && i.otherRelatives === "ja") ||
        i.expectedChild === "ja" ||
        i.unclearParentage === "ja" ||
        i.missingRelative === "ja" ||
        i.otherSpecialCircumstances === "ja",
    },
  };
}
