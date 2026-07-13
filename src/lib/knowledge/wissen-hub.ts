import {
  WISSEN_CATEGORIES,
  WISSEN_CATEGORY_CONFIG,
  WISSEN_PRIORITY,
  categoryForTopicId,
  type WissenCategoryId,
} from "@/lib/knowledge/wissen-categories";

/** Recommended entry topics on first visit */
export const WISSEN_ENTRY_TOPIC_IDS = ["w-notfall", "w-vollmacht", "w-janazah"] as const;

export type WissenSourceLabel =
  | "Qur'an & Sahih"
  | "Deutsche Rechtsquelle"
  | "Orientierung & Familie"
  | "Praxis & Digital";

export const WISSEN_SOURCE_LABEL: Record<string, WissenSourceLabel> = {
  "w-janazah": "Qur'an & Sahih",
  "w-ghusl": "Qur'an & Sahih",
  "w-bestattung": "Deutsche Rechtsquelle",
  "w-pv": "Deutsche Rechtsquelle",
  "w-vollmacht": "Deutsche Rechtsquelle",
  "w-betreuung": "Deutsche Rechtsquelle",
  "w-testament": "Deutsche Rechtsquelle",
  "w-schulden": "Qur'an & Sahih",
  "w-digital": "Praxis & Digital",
  "w-sadaqa": "Qur'an & Sahih",
  "w-familie": "Orientierung & Familie",
  "w-notfall": "Praxis & Digital",
};

export const WISSEN_READ_MINUTES: Record<string, number> = {
  "w-notfall": 4,
  "w-pv": 6,
  "w-vollmacht": 5,
  "w-betreuung": 5,
  "w-janazah": 7,
  "w-ghusl": 6,
  "w-bestattung": 8,
  "w-familie": 5,
  "w-testament": 9,
  "w-schulden": 6,
  "w-digital": 5,
  "w-sadaqa": 5,
};

export function getUrgentTopicIds(): string[] {
  return Object.entries(WISSEN_PRIORITY)
    .filter(([, p]) => p === "Sofort wichtig")
    .map(([id]) => id);
}

export function getSourceLabel(topicId: string): WissenSourceLabel {
  return WISSEN_SOURCE_LABEL[topicId] ?? "Orientierung & Familie";
}

export function getReadMinutes(topicId: string): number {
  return WISSEN_READ_MINUTES[topicId] ?? 5;
}

export type WissenNavSection = "all" | "urgent" | WissenCategoryId;

export const WISSEN_SECTION_ID = {
  entry: "wissen-section-entry",
  urgent: "wissen-section-urgent",
  notfall: "wissen-section-notfall",
  janazah: "wissen-section-janazah",
  vermoegen: "wissen-section-vermoegen",
  akhira: "wissen-section-akhira",
} as const;

export const WISSEN_SIDEBAR_ITEMS: { id: WissenNavSection; label: string; sectionId: string }[] = [
  { id: "all", label: "Alle Themen", sectionId: WISSEN_SECTION_ID.entry },
  { id: "urgent", label: "Sofort wichtig", sectionId: WISSEN_SECTION_ID.urgent },
  { id: "notfall", label: "Notfall und Gesundheit", sectionId: WISSEN_SECTION_ID.notfall },
  { id: "janazah", label: "Abschied und Janazah", sectionId: WISSEN_SECTION_ID.janazah },
  { id: "vermoegen", label: "Vermögen und Verantwortung", sectionId: WISSEN_SECTION_ID.vermoegen },
  { id: "akhira", label: "Akhira und Weiterwirken", sectionId: WISSEN_SECTION_ID.akhira },
];

export function sectionIdForCategory(catId: WissenCategoryId): string {
  return WISSEN_SECTION_ID[catId];
}

export function topicsForCategory(topicIds: string[], catId: WissenCategoryId): string[] {
  const allowed = new Set(WISSEN_CATEGORY_CONFIG[catId].topicIds);
  return topicIds.filter((id) => allowed.has(id));
}

export { WISSEN_CATEGORIES, categoryForTopicId };
