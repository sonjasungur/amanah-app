export type WissenCategoryId = "notfall" | "janazah" | "vermoegen" | "akhira";

export type WissenPriorityLabel =
  | "Sofort wichtig"
  | "Frühzeitig klären"
  | "Rechtlich prüfen"
  | "Persönliche Vorbereitung"
  | "Akhira";

export interface WissenCategoryConfig {
  id: WissenCategoryId;
  label: string;
  accent: string;
  topicIds: string[];
}

export const WISSEN_CATEGORIES: WissenCategoryId[] = ["notfall", "janazah", "vermoegen", "akhira"];

export const WISSEN_CATEGORY_CONFIG: Record<WissenCategoryId, WissenCategoryConfig> = {
  notfall: {
    id: "notfall",
    label: "Notfall und Gesundheit",
    accent: "#0F766E",
    topicIds: ["w-notfall", "w-pv", "w-vollmacht", "w-betreuung"],
  },
  janazah: {
    id: "janazah",
    label: "Abschied und Janazah",
    accent: "#1E3A5F",
    topicIds: ["w-janazah", "w-ghusl", "w-bestattung", "w-familie"],
  },
  vermoegen: {
    id: "vermoegen",
    label: "Vermögen und Verantwortung",
    accent: "#64748B",
    topicIds: ["w-testament", "w-schulden", "w-digital"],
  },
  akhira: {
    id: "akhira",
    label: "Akhira und Weiterwirken",
    accent: "#166534",
    topicIds: ["w-sadaqa"],
  },
};

export const WISSEN_PRIORITY: Record<string, WissenPriorityLabel> = {
  "w-notfall": "Sofort wichtig",
  "w-pv": "Sofort wichtig",
  "w-vollmacht": "Frühzeitig klären",
  "w-betreuung": "Rechtlich prüfen",
  "w-janazah": "Frühzeitig klären",
  "w-ghusl": "Frühzeitig klären",
  "w-bestattung": "Frühzeitig klären",
  "w-familie": "Persönliche Vorbereitung",
  "w-testament": "Rechtlich prüfen",
  "w-schulden": "Frühzeitig klären",
  "w-digital": "Persönliche Vorbereitung",
  "w-sadaqa": "Akhira",
};

export function categoryForTopicId(topicId: string): WissenCategoryId {
  for (const cat of WISSEN_CATEGORIES) {
    if (WISSEN_CATEGORY_CONFIG[cat].topicIds.includes(topicId)) return cat;
  }
  return "notfall";
}
