import type { KnowledgeArticle } from "@/lib/types";

export const patientenverfuegungArticles: KnowledgeArticle[] = [
  {
    id: "pv-what",
    slug: "was-ist-patientenverfuegung",
    title: "Was ist eine Patientenverfügung?",
    summary: "Eine Patientenverfügung legt fest, welche medizinischen Maßnahmen du wünschst oder ablehnst.",
    content:
      "Wenn du nicht mehr entscheidungsfähig bist, braucht deine Familie Klarheit. Eine Patientenverfügung dokumentiert deine medizinischen Wünsche — z. B. Reanimation, Beatmung, künstliche Ernährung.",
    sourceIds: ["official-patientenverfuegung"],
    reviewStatus: "reviewed",
    category: "patientenverfuegung",
  },
  {
    id: "pv-muslim",
    slug: "warum-wichtig-fuer-muslime",
    title: "Warum ist sie für muslimische Familien wichtig?",
    summary: "Ohne Dokumentation entscheiden Ärzte oder Fremde — nicht deine Familie.",
    content:
      "Ohne Patientenverfügung und Vorsorgevollmacht kann im Krankenhaus nicht klar sein, wer entscheidet und welche religiösen Wünsche gelten. Dokumentiere medizinische UND religiöse Wünsche.",
    sourceIds: ["official-patientenverfuegung", "official-vorsorgevollmacht"],
    reviewStatus: "reviewed",
    category: "patientenverfuegung",
  },
  {
    id: "pv-religious",
    slug: "religioese-wuensche",
    title: "Religiöse Wünsche dokumentieren",
    summary: "Imam/Seelsorge, Schamgrenzen, Pflegewünsche — alles festhalten.",
    content:
      "Muslimische Patienten haben oft spezielle Wünsche: Imam-Besuch, Gebetszeiten, Schamgrenzen bei Pflege, Halal-Ernährung. Diese Wünsche sollten in der Patientenverfügung oder einem Begleitdokument stehen.",
    sourceIds: ["official-patientenverfuegung"],
    reviewStatus: "reviewed",
    category: "patientenverfuegung",
  },
  {
    id: "pv-vollmacht",
    slug: "vorsorgevollmacht-betreuung",
    title: "Vorsorgevollmacht und Betreuungsverfügung",
    summary: "Wer darf im Namen handeln? Wer soll Betreuer werden?",
    content:
      "Die Vorsorgevollmacht bestimmt, wer für dich handelt. Die Betreuungsverfügung legt fest, wer Betreuer werden soll (und wer nicht). Beides ergänzt die Patientenverfügung.",
    sourceIds: ["official-vorsorgevollmacht"],
    reviewStatus: "reviewed",
    category: "testament",
  },
];
