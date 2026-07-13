export const BRAND = {
  name: "Mein Wille",
  shortName: "Mein Wille",
  category: "Islamische Vorsorge",
  subtitle: "Islamische Vorsorge für Notfall, Janazah und Akhira",
  /** @deprecated use subtitle — kept for gradual migration */
  tagline: "Islamische Vorsorge für Notfall, Janazah und Akhira",
  claim: "Ich entscheide heute, was später wichtig ist.",
  heroTitle: "Damit meine Familie weiß, was mir wichtig ist.",
  description:
    "Halte fest, wer für dich handeln darf, wo wichtige Dokumente liegen und welche persönlichen und islamischen Wünsche berücksichtigt werden sollen.",
  trustLine: "Für Muslime in Deutschland · Quellenbasiert · Vertraulich",
  metadataTitle: "Mein Wille – Islamische Vorsorge",
  metadataDescription:
    "Islamische Vorsorge für Notfall, Janazah und Akhira. Halte heute fest, was deiner Familie später wichtig sein soll.",
  manifestName: "Mein Wille – Islamische Vorsorge",
  manifestShortName: "Mein Wille",
  themeColor: "#0B1511",
  ctaPrimary: "Kostenlos prüfen, was noch fehlt",
  ctaSecondary: "Direkt geführt ausfüllen",
} as const;

export const BRAND_TRUST_ITEMS = BRAND.trustLine.split(" · ") as readonly string[];
