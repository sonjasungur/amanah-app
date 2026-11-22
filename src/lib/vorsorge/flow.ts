import type { FieldConfig } from "@/components/modules/module-form";
import type { AmanahOrdnerData, VorsorgeAreaId } from "@/lib/domain/types";
import { emergencyCardFields, ghuslKafanFields, medicalFields } from "@/lib/modules/fields";
import { janazahFields } from "@/lib/modules/janazah-sections";
import { getAllAreaStates } from "@/lib/vorsorge/areas";

/**
 * One guided path through the six areas. Every step reuses the fields and editors of the existing
 * pages, so a value entered here is the same value on the page and vice versa. No step is required.
 */
export type FlowStepKind = "fields" | "people" | "contacts" | "attorney" | "documents" | "assets" | "debts" | "digital";

export interface FlowStep {
  id: string;
  area: VorsorgeAreaId;
  title: string;
  help: string;
  kind: FlowStepKind;
  section?: keyof AmanahOrdnerData;
  fields?: FieldConfig[];
}

/** Fields of an existing page, in the given order, with simpler labels where it helps. */
function pick(source: FieldConfig[], keys: string[], labels: Record<string, string> = {}): FieldConfig[] {
  return keys.map((key) => {
    const field = source.find((f) => f.key === key);
    if (!field) throw new Error(`Feld ${key} fehlt`);
    return labels[key] ? { ...field, label: labels[key] } : field;
  });
}

export const FLOW_STEPS: readonly FlowStep[] = [
  {
    id: "ich",
    area: "notfall",
    title: "Wer bist du?",
    help: "Diese Angaben stehen oben auf deiner Notfallkarte.",
    kind: "fields",
    section: "emergencyCard",
    fields: pick(emergencyCardFields, ["name", "birthDate", "language"], { name: "Dein Name", language: "Deine Sprache" }),
  },
  {
    id: "familie",
    area: "familie",
    title: "Wer gehört zu deiner Familie?",
    help: "Trage jede Person nur einmal ein. Danach kannst du sie für Notfallkarte und Vollmacht auswählen.",
    kind: "people",
  },
  {
    id: "notfallkontakte",
    area: "notfall",
    title: "Wen soll man im Notfall anrufen?",
    help: "Wähle Personen aus deiner Familie oder trage jemanden direkt ein.",
    kind: "contacts",
  },
  {
    id: "aerzte",
    area: "notfall",
    title: "Was sollten Ärzte im Notfall wissen?",
    help: "Alles freiwillig. Gesundheitsangaben kommen nur ins Notfallpaket, wenn du sie dort selbst auswählst.",
    kind: "fields",
    section: "emergencyCard",
    fields: pick(emergencyCardFields, ["familyDoctor", "allergies", "medications", "illnesses"], {
      familyDoctor: "Hausarzt oder Hausärztin",
    }),
  },
  {
    id: "krankheit",
    area: "gesundheit",
    title: "Was ist dir bei schwerer Krankheit wichtig?",
    help: "Schreibe in eigenen Worten. Das ist keine Patientenverfügung, hilft aber beim Gespräch mit Ärzten und Familie.",
    kind: "fields",
    section: "medicalWishes",
    fields: pick(medicalFields, ["medicalWishes", "religiousWishes", "imamSeelsorge"], {
      medicalWishes: "Deine Wünsche zur Behandlung",
      religiousWishes: "Deine religiösen Wünsche",
      imamSeelsorge: "Imam oder Seelsorge, die gerufen werden soll",
    }),
  },
  {
    id: "vollmacht",
    area: "gesundheit",
    title: "Wer soll für dich handeln, wenn du es nicht kannst?",
    help: "Hier hältst du nur fest, wen du vorgesehen hast und ob es die Dokumente gibt. Eine Vertrauensperson ist dadurch nicht rechtlich bevollmächtigt.",
    kind: "attorney",
  },
  {
    id: "janazah",
    area: "janazah",
    title: "Wie soll deine Janazah ablaufen?",
    help: "Deine persönlichen Wünsche für die Familie. Sie sind keine rechtliche Verfügung.",
    kind: "fields",
    section: "janazahWishes",
    fields: pick(janazahFields, ["islamicBurialDesired", "noUnnecessaryDelay", "preferredMosque", "preferredFuneralDirector"]),
  },
  {
    id: "beisetzung",
    area: "janazah",
    title: "Wo möchtest du beigesetzt werden?",
    help: "Wenn du dir noch nicht sicher bist, wähle „unsicher“ oder lass das Feld leer.",
    kind: "fields",
    section: "janazahWishes",
    fields: pick(janazahFields, ["burialGermany", "repatriation", "preferredCemetery"]),
  },
  {
    id: "ghusl",
    area: "janazah",
    title: "Wer darf bei Waschung und Abschied dabei sein?",
    help: "Freiwillig. Du kannst das auch später auf der Seite „Ghusl & Kafan“ ergänzen.",
    kind: "fields",
    section: "ghuslKafan",
    fields: pick(ghuslKafanFields, ["whoMayBePresent", "preferredGhuslTeam", "familyFarewell"]),
  },
  {
    id: "dokumente",
    area: "dokumente",
    title: "Wo liegen deine wichtigsten Dokumente?",
    help: "Halte fest, ob es ein Dokument gibt und wo das Original liegt. Wasiyya speichert keine Dateien.",
    kind: "documents",
  },
  {
    id: "vermoegen",
    area: "vermoegen",
    title: "Was gibt es an Vermögen?",
    help: "Eine Bestandsaufnahme für deine Familie. Sie regelt nicht, wer etwas erhält.",
    kind: "assets",
  },
  {
    id: "schulden",
    area: "vermoegen",
    title: "Gibt es Schulden oder Anvertrautes?",
    help: "Auch Geliehenes, offene Zakat oder Versprechen. Wenn es nichts gibt, gehe einfach weiter.",
    kind: "debts",
  },
  {
    id: "digital",
    area: "vermoegen",
    title: "Welche Online-Konten sollte deine Familie kennen?",
    help: "Nur Hinweise, wo etwas zu finden ist. Speichere hier niemals Passwörter.",
    kind: "digital",
  },
];

export function flowStepIndex(id: string | null | undefined): number {
  const index = FLOW_STEPS.findIndex((s) => s.id === id);
  return index < 0 ? 0 : index;
}

export function firstStepOfArea(area: VorsorgeAreaId): FlowStep {
  return FLOW_STEPS.find((s) => s.area === area) ?? FLOW_STEPS[0];
}

export function flowHref(stepId: string): string {
  return `/dashboard/vorsorge?schritt=${encodeURIComponent(stepId)}`;
}

export const COMPLETION_PATH = "/dashboard/vorsorge/abschluss";

export interface VorsorgeNextStep {
  kind: "resume" | "review" | "area" | "done";
  title: string;
  reason: string;
  href: string;
  cta: string;
}

/** One clear next step for the dashboard: resume where paused, then what needs a look, then gaps. */
export function getVorsorgeNextStep(data: AmanahOrdnerData, now: Date = new Date()): VorsorgeNextStep {
  const paused = data.vorsorgeMeta.flowStep;
  if (paused && FLOW_STEPS.some((s) => s.id === paused)) {
    const index = flowStepIndex(paused);
    return {
      kind: "resume",
      title: FLOW_STEPS[index].title,
      reason: `Hier hast du pausiert: Schritt ${index + 1} von ${FLOW_STEPS.length}.`,
      href: flowHref(paused),
      cta: "Fortsetzen",
    };
  }
  const states = getAllAreaStates(data, now);
  const review = states.find((s) => s.status === "pruefen");
  if (review) {
    return {
      kind: "review",
      title: `${review.area.title} prüfen`,
      reason: review.reviewReasons[0],
      href: review.area.pages[0].path,
      cta: "Jetzt prüfen",
    };
  }
  const open = states.find((s) => s.status !== "vollstaendig");
  if (open) {
    return {
      kind: "area",
      title: open.area.title,
      reason: open.status === "nicht_begonnen" ? open.area.description : `Es fehlt noch: ${open.missing[0]}.`,
      href: flowHref(firstStepOfArea(open.area.id).id),
      cta: open.status === "nicht_begonnen" ? "Jetzt beginnen" : "Weiter ausfüllen",
    };
  }
  return {
    kind: "done",
    title: "Deine Angaben sind vollständig erfasst",
    reason: "Sieh dir die Zusammenfassung an und stelle dein Notfallpaket zusammen.",
    href: COMPLETION_PATH,
    cta: "Zur Zusammenfassung",
  };
}
