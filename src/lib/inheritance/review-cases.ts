import { calculateFaraid } from "./calculate";
import { toString as fractionText } from "./fraction";
import { SUNNI_NUCLEAR_FAMILY_V1 } from "./rulesets";
import type { FaraidCaseInput, HeirKey } from "./types";

const BASE: FaraidCaseInput = {
  deceasedGender: "male",
  wives: 0,
  husband: false,
  sons: 0,
  daughters: 0,
  father: false,
  mother: false,
  siblings: 0,
  grandparents: false,
  sonsChildren: false,
  differentReligionHeirs: false,
  nonBiologicalChildren: false,
  otherSpecialCircumstances: false,
};

const man = (over: Partial<FaraidCaseInput>): FaraidCaseInput => ({ ...BASE, ...over });
const woman = (over: Partial<FaraidCaseInput>): FaraidCaseInput => ({ ...BASE, deceasedGender: "female", ...over });

/** Concrete cases so reviewers can check what the engine does, not only what its rules say. */
export const RULE_SET_REVIEW_CASES: { label: string; input: FaraidCaseInput }[] = [
  { label: "Mann: Ehefrau, 1 Sohn, 1 Tochter", input: man({ wives: 1, sons: 1, daughters: 1 }) },
  { label: "Mann: Ehefrau, Sohn, Vater, Mutter", input: man({ wives: 1, sons: 1, father: true, mother: true }) },
  { label: "Mann: Ehefrau, 1 Tochter, Vater, Mutter", input: man({ wives: 1, daughters: 1, father: true, mother: true }) },
  { label: "Mann: Ehefrau, Vater", input: man({ wives: 1, father: true }) },
  { label: "Mann: 1 Sohn, 3 Töchter", input: man({ sons: 1, daughters: 3 }) },
  { label: "Mann: Sohn, Geschwister leben", input: man({ sons: 1, siblings: 2 }) },
  { label: "Mann: Vater, Mutter", input: man({ father: true, mother: true }) },
  { label: "Mann: nur Vater", input: man({ father: true }) },
  { label: "Frau: Ehemann, 2 Söhne", input: woman({ husband: true, sons: 2 }) },
  { label: "Frau: Ehemann, Vater", input: woman({ husband: true, father: true }) },
  { label: "Frau: Ehemann, 1 Tochter, Vater", input: woman({ husband: true, daughters: 1, father: true }) },
  { label: "Frau: 1 Tochter, Vater", input: woman({ daughters: 1, father: true }) },
  { label: "Frau: 2 Töchter, Vater, Mutter", input: woman({ daughters: 2, father: true, mother: true }) },
  { label: "Frau: Ehemann, 2 Töchter, Vater, Mutter (ʿAwl)", input: woman({ husband: true, daughters: 2, father: true, mother: true }) },
  { label: "Gesperrt: Ehefrau, Vater, Mutter ohne Kinder", input: man({ wives: 1, father: true, mother: true }) },
  { label: "Gesperrt: nur Ehefrau (Rest ohne Resterben)", input: man({ wives: 1 }) },
  { label: "Gesperrt: Mutter, 1 Tochter (Rest ohne Resterben)", input: man({ mother: true, daughters: 1 }) },
  { label: "Gesperrt: zwei Ehefrauen", input: man({ wives: 2, sons: 1 }) },
  { label: "Gesperrt: Angehörige anderer Religion", input: man({ sons: 1, differentReligionHeirs: true }) },
  { label: "Gesperrt: Adoptiv-, Stief- oder Pflegekinder", input: man({ sons: 1, nonBiologicalChildren: true }) },
  { label: "Gesperrt: Großeltern, Vater verstorben", input: man({ sons: 1, grandparents: true, mother: true }) },
  { label: "Gesperrt: Enkel über verstorbenen Sohn, kein Sohn", input: man({ daughters: 1, father: true, sonsChildren: true }) },
  { label: "Gesperrt: Geschwister, kein Sohn und kein Vater", input: man({ daughters: 1, siblings: 1, mother: true }) },
  { label: "Gesperrt: keine Erben im erfassten Kreis", input: man({}) },
];

const HEIR_LABELS: Record<HeirKey, string> = { husband: "Ehemann", wives: "Ehefrau", sons: "Söhne", daughters: "Töchter", father: "Vater", mother: "Mutter" };

/** The rule set as a review paper. Reviewer fields stay empty; nothing is pre-approved. */
export function ruleSetReviewMarkdown(generatedAt: string): string {
  const ruleSet = SUNNI_NUCLEAR_FAMILY_V1;
  const results = RULE_SET_REVIEW_CASES.map((c) => ({ label: c.label, result: calculateFaraid(c.input) }));
  const lines = [
    `# Prüfpaket: Regelwerk ${ruleSet.id} ${ruleSet.version}`,
    "",
    `Status: ${ruleSet.reviewStatus} · erstellt ${generatedAt} · **nicht zur Veröffentlichung, keine Fatwa, kein Testament**`,
    "",
    `**Umfang laut Code:** ${ruleSet.notes}`,
    "",
    `**Schulen, für die Übereinstimmung angenommen wird:** ${ruleSet.schools.join(", ")}. Diese Annahme ist selbst zu prüfen.`,
    "",
    "**Bedeutung:** Die Tabellen zeigen, was das Programm heute rechnet. Nutzer sehen davon nichts, solange die Prüfung fehlt und das Produkt-Flag aus ist.",
    "",
    "## 1. Fälle mit Ergebnis",
    "",
    "| Fall | Ergebnis des Programms | Richtig? | Anmerkung |",
    "|---|---|---|---|",
    ...results.flatMap(({ label, result }) =>
      result.status === "calculated"
        ? [`| ${label} | ${result.shares.map((s) => `${HEIR_LABELS[s.heir]}${s.count > 1 ? ` (${s.count})` : ""}: ${fractionText(s.groupShare)}${s.count > 1 ? `, je ${fractionText(s.perPerson)}` : ""}`).join("; ")}${result.awl ? " (mit ʿAwl gekürzt)" : ""} | ☐ ja ☐ nein | |`]
        : []
    ),
    "",
    "## 2. Fälle, die das Programm sperrt",
    "",
    "| Fall | Grund im Programm | Sperre richtig? | Anmerkung |",
    "|---|---|---|---|",
    ...results.flatMap(({ label, result }) =>
      result.status === "blocked" ? [`| ${label.replace("Gesperrt: ", "")} | ${result.reasons.join(" ")} | ☐ ja ☐ nein | |`] : []
    ),
    "",
    "## 3. Fragen an die Prüfenden",
    "",
    "1. Stimmen die vier sunnitischen Schulen in allen Fällen aus Abschnitt 1 überein? Wenn nicht: in welchen?",
    "2. Fehlen Sperrfälle, die heute berechnet würden?",
    "3. Das Programm geht davon aus, dass die Anteile vom Nachlass nach Bestattungskosten, Schulden und Vermächtnissen gelten. Ist das so richtig und ausreichend beschrieben?",
    "4. Darf die Rechtsschule, die jemand angibt, unberücksichtigt bleiben, solange der Umfang nur Fälle enthält, in denen die Schulen übereinstimmen?",
    "5. Vermächtniswünsche über einem Drittel oder zugunsten von Erben werden nicht bewertet, sondern nur als Frage an Gelehrte ausgegeben. Ist die Frage so richtig gestellt?",
    "6. Annahmen zu Halbgeschwistern, Adoption, mehreren Ehen und weiteren Verwandten: siehe `docs/strategy/35-testamentsprozess-deutschland.md`, Abschnitt 3.",
    "",
    "## 4. Prüfvermerk",
    "",
    "Name und Qualifikation: ______",
    "",
    "Datum: ______",
    "",
    "Ergebnis: ☐ Freigabe ☐ Freigabe mit Änderungen ☐ keine Freigabe",
    "",
    "Geprüfte Version: ______",
    "",
  ];
  return lines.join("\n");
}
