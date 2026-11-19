export const BRAND = {
  name: "Amanah – Mein Wille",
  shortName: "Amanah",
  category: "Islamische Vorsorge",
  subtitle: "Islamische Vorsorge für Notfall, Janazah und Akhira",
  positioning: "Amanah – Mein Wille: Islamische Vorsorge für Notfall, Janazah und Akhira.",
  /** @deprecated use subtitle — kept for gradual migration */
  tagline: "Islamische Vorsorge für Notfall, Janazah und Akhira",
  heroEyebrow: "ISLAMISCHE VORSORGE",
  claim: "Ich entscheide heute, was später wichtig ist.",
  heroTitle: "Damit meine Familie weiß, was mir wichtig ist.",
  heroDescription:
    "Halte fest, wer für dich handeln darf und welche persönlichen und islamischen Wünsche deine Familie kennen soll.",
  heroDescriptionMobile:
    "Festhalten, wer handeln darf und welche Wünsche deine Familie kennen soll.",
  description:
    "Halte fest, wer für dich handeln darf, wo wichtige Dokumente liegen und welche persönlichen und islamischen Wünsche berücksichtigt werden sollen.",
  trustLine: "Für Muslime in Deutschland · Zur Orientierung · Vertraulich",
  metadataTitle: "Amanah – Mein Wille | Islamische Vorsorge",
  metadataDescription:
    "Islamische Vorsorge für Notfall, Janazah und Akhira. Halte heute fest, was deiner Familie später wichtig sein soll.",
  manifestName: "Amanah – Mein Wille | Islamische Vorsorge",
  manifestShortName: "Amanah",
  themeColor: "#071A16",
  ctaPrimary: "Kostenlosen Vorsorge-Check starten",
  ctaSecondary: "So funktioniert Amanah – Mein Wille",
  ctaRegister: "Konto erstellen — Vorsorge beginnen",
  ctaLogin: "Anmelden",
} as const;

export const BRAND_TRUST_ITEMS = BRAND.trustLine.split(" · ") as readonly string[];
