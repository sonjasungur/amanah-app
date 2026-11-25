import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Public, indexable pages (owner order 25.11.2026, AP4): one place for title, description and
 * canonical path, used by the pages themselves and by the sitemap. Private areas (account, folder,
 * checkout, internal tools) are never listed here; see src/lib/seo/indexing.ts.
 * Titles of pages that existed before are kept as approved; only missing descriptions were added.
 */
export const PUBLIC_PAGES = {
  "/": { title: BRAND.metadataTitle, description: BRAND.metadataDescription },
  "/check": {
    title: "Kostenloser Vorsorge-Check — Wasiyya",
    description: "In wenigen Minuten sehen, was für Notfall, Janazah und Familie schon geregelt ist und was noch fehlt. Kostenlos, ohne Konto.",
  },
  "/wissen": {
    title: "Wissen zur islamischen Vorsorge — Wasiyya",
    description: "Verständliche Orientierung zu Janazah, Testament und Erbe, Patientenverfügung und Vorsorge für Muslime in Deutschland.",
  },
  "/preise": {
    title: "Pakete — Wasiyya",
    description: "Wasiyya startet kostenlos: Vorsorge-Check, Notfallkarte und Vermögensübersicht. Vorsorge Plus ist in Vorbereitung.",
  },
  "/akuter-todesfall": {
    title: "Akuter Todesfall — Wasiyya",
    description: "Die ersten Schritte nach einem Todesfall in der Familie: Arzt, Angehörige, Bestattung und Dokumente in ruhiger Reihenfolge.",
  },
  "/barzakh": {
    title: "Barzakh — Wasiyya",
    description: "Was ist Barzakh? Orientierung zu Sadaqa Jariya, Schulden und dem Leben nach dem Tod.",
  },
  "/bestatter": {
    title: "Bestatter — Wasiyya",
    description: "Hinweis zum Bestatter-Verzeichnis. Derzeit keine geprüften Partnereinträge.",
  },
  "/islam-oder-kultur": {
    title: "Islam oder Kultur? — Wasiyya",
    description: "Unterscheide islamische Pflichten von kulturellen Gewohnheiten bei Janazah und Trauer.",
  },
  "/janazah-kompass": {
    title: "Janazah-Kompass — Wasiyya",
    description: "Islamisches Wissen zu Janazah, Ghusl, Kafan und Bestattung in Deutschland.",
  },
  "/konvertierte": {
    title: "Für Konvertierte & alleinstehende Muslime — Wasiyya",
    description: "Vorsorge für Konvertierte und alleinstehende Muslime: wer im Notfall informiert wird und wie islamische Wünsche bekannt werden.",
  },
  "/patientenverfuegung": {
    title: "Patientenverfügung — Wasiyya",
    description: "Wünsche zur medizinischen Vorsorge festhalten. Wissensartikel erscheinen erst nach fachlicher Prüfung.",
  },
  "/sadaqa-jariya": {
    title: "Sadaqa Jariya — Wasiyya",
    description: "Sadaqa Jariya verstehen: fortwirkende Wohltätigkeit und eigene Wünsche für wohltätige Vermächtnisse im Ordner festhalten.",
  },
  "/testament-erbe": {
    title: "Testament & Erbe — Wasiyya",
    description: "Islamisches Erbrecht: Farāʾiḍ, Waṣiyya und deutsches Recht für Muslime in Deutschland.",
  },
  "/datenschutz": {
    title: "Datenschutz — Wasiyya",
    description: "Datenschutzerklärung für Wasiyya: welche Daten wir verarbeiten, wie sie verschlüsselt gespeichert werden, Export, Löschung und deine Rechte.",
  },
  "/impressum": {
    title: "Impressum — Wasiyya",
    description: "Impressum und Anbieterkennzeichnung für Wasiyya: MSC Engineering GmbH, Brackenheim.",
  },
  "/sicherheit": {
    title: "Sicherheit — Wasiyya",
    description: "Wie Wasiyya deine Daten schützt: Verschlüsselung, Anmeldung, Export und Löschung.",
  },
  "/kontakt": {
    title: "Kontakt — Wasiyya",
    description: "Schreib uns: Fragen zu Wasiyya, zu deinem Konto oder zur Zusammenarbeit.",
  },
  "/partner": {
    title: "Partner werden — Wasiyya",
    description: "Partnerschaften für Bestatter, Moscheen/Vereine und Anwälte/Notare.",
  },
} as const satisfies Record<string, { title: string; description: string }>;

export type PublicPath = keyof typeof PUBLIC_PAGES;

/** Metadata for a public page: title, description, canonical and Open Graph (image from the file convention). */
export function publicPageMetadata(path: PublicPath): Metadata {
  const { title, description } = PUBLIC_PAGES[path];
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", siteName: BRAND.name, locale: "de_DE" },
    twitter: { card: "summary_large_image", title, description },
  };
}
