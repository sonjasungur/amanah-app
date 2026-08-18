export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const dashboardNavGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Übersicht",
    items: [{ href: "/dashboard", label: "Mein Vorsorgeplan", icon: "🏠" }],
  },
  {
    id: "prep",
    label: "Vorbereitung",
    items: [
      { href: "/check", label: "Vorsorge-Check", icon: "✓" },
      { href: "/wissen", label: "Wissen", icon: "📚" },
      { href: "/dashboard/ausfuellen", label: "Geführt ausfüllen", icon: "🧭" },
    ],
  },
  {
    id: "family",
    label: "Familie",
    items: [
      { href: "/dashboard/familiengespraech", label: "Gespräch mit Angehörigen", icon: "💬" },
      { href: "/dashboard/familie", label: "Familienbrief", icon: "✉️" },
    ],
  },
  {
    id: "personal",
    label: "Gespeicherte Angaben",
    items: [
      { href: "/dashboard/notfallkarte", label: "Notfallkarte", icon: "🆘" },
      { href: "/dashboard/pdf", label: "PDF & Export", icon: "📄" },
    ],
  },
  {
    id: "modules",
    label: "Alle Vorsorgebereiche",
    items: [],
  },
];

export const moreNavItems: NavItem[] = [
  { href: "/dashboard/krankheit", label: "Krankheit & Patientenverfügung" },
  { href: "/dashboard/vollmacht", label: "Vorsorgevollmacht" },
  { href: "/dashboard/janazah", label: "Janazah-Wünsche" },
  { href: "/dashboard/testament", label: "Testament & Erbe" },
  { href: "/dashboard/schulden-amanah", label: "Schulden & Amanah" },
  { href: "/dashboard/digitaler-nachlass", label: "Digitaler Nachlass" },
  { href: "/dashboard/sadaqa-jariya", label: "Sadaqa Jariya" },
  { href: "/dashboard/barzakh", label: "Barzakh" },
];
