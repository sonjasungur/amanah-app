/**
 * Planned split between the free offer and Vorsorge Plus (owner proposal of 2026-10-31).
 * CONCEPT ONLY: nothing is locked while AMANAH_BILLING_ENFORCE is off, and existing
 * accounts keep everything they can use today (see plus-access.ts).
 */
export type PlanTier = "free" | "plus";

/** How a lock could be enforced. Client-only features cannot be locked reliably. */
export type Enforcement = "never" | "server" | "client_hint";

export interface PlanFeature {
  id: string;
  title: string;
  tier: PlanTier;
  routes: string[];
  enforcement: Enforcement;
  note?: string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    id: "knowledge_centre",
    title: "Islamisches Wissenszentrum",
    tier: "free",
    routes: ["/wissen"],
    enforcement: "never",
    note: "Sadaqa Jariya: dauerhaft frei, ohne Registrierung, nie Teil eines Pakets.",
  },
  {
    id: "inheritance_janazah_info",
    title: "Informationen zu Erbrecht und Janazah",
    tier: "free",
    routes: ["/testament-erbe", "/janazah-kompass", "/akuter-todesfall", "/patientenverfuegung", "/konvertierte", "/islam-oder-kultur", "/barzakh", "/sadaqa-jariya"],
    enforcement: "never",
  },
  {
    id: "vorsorge_check",
    title: "Grundlegender Vorsorge-Check",
    tier: "free",
    routes: ["/check"],
    enforcement: "never",
  },
  {
    id: "vorsorge_start",
    title: "Einstieg in persönliche Vorsorge",
    tier: "free",
    routes: ["/dashboard", "/dashboard/notfallkarte"],
    enforcement: "never",
    note: "Übersicht und Notfallkarte; Ansicht aller Bereiche als Vorschau.",
  },
  {
    id: "persistent_folder",
    title: "Dauerhaft nutzbarer persönlicher Vorsorgeordner (verschlüsselt im Konto)",
    tier: "plus",
    routes: ["/api/amanah"],
    enforcement: "server",
    note: "Einzige Leistung, die serverseitig wirksam gesperrt werden kann.",
  },
  {
    id: "family_people",
    title: "Familien- und Vertrauenspersonenverwaltung",
    tier: "plus",
    routes: ["/dashboard/personen", "/dashboard/familie", "/dashboard/familiengespraech"],
    enforcement: "client_hint",
  },
  {
    id: "documents_overview",
    title: "Dokumentenübersicht",
    tier: "plus",
    routes: ["/dashboard/dokumente"],
    enforcement: "client_hint",
  },
  {
    id: "estate_debts",
    title: "Strukturierte Nachlass- und Schuldeninformationen",
    tier: "plus",
    routes: ["/dashboard/schulden-amanah", "/dashboard/digitaler-nachlass", "/dashboard/testament"],
    enforcement: "client_hint",
    note: "Die Testamentsvorbereitung bleibt unabhängig davon gesperrt.",
  },
  {
    id: "personal_wishes",
    title: "Persönliche Vorsorge- und Janazah-Wünsche",
    tier: "plus",
    routes: [
      "/dashboard/janazah",
      "/dashboard/ghusl-kafan",
      "/dashboard/bestattung",
      "/dashboard/krankheit",
      "/dashboard/vollmacht",
      "/dashboard/betreuung",
      "/dashboard/barzakh",
      "/dashboard/sadaqa-jariya",
    ],
    enforcement: "client_hint",
  },
  {
    id: "pdf_exports",
    title: "PDF-Exporte",
    tier: "plus",
    routes: ["/dashboard/pdf"],
    enforcement: "client_hint",
    note: "Druck entsteht im Browser; der Konto-Export (Art. 15/20 DSGVO) bleibt immer frei.",
  },
];

/** Never paid, whatever the plan: data subject rights and account control. */
export const ALWAYS_FREE_ACCOUNT_RIGHTS = [
  "Datenexport (Art. 15/20 DSGVO)",
  "Löschen von Daten und Konto (Art. 17 DSGVO)",
  "Einwilligung widerrufen",
  "E-Mail bestätigen, Passwort zurücksetzen",
];

export function featuresByTier(tier: PlanTier): PlanFeature[] {
  return PLAN_FEATURES.filter((f) => f.tier === tier);
}

/** The plan feature that covers a route, matched by the longest prefix. */
export function featureForRoute(pathname: string): PlanFeature | null {
  let best: { feature: PlanFeature; length: number } | null = null;
  for (const feature of PLAN_FEATURES) {
    for (const route of feature.routes) {
      const matches = pathname === route || pathname.startsWith(`${route}/`);
      if (matches && (!best || route.length > best.length)) best = { feature, length: route.length };
    }
  }
  return best?.feature ?? null;
}
