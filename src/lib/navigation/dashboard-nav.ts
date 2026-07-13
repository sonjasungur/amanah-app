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
    items: [{ href: "/dashboard", label: "Dashboard", icon: "🏠" }],
  },
  {
    id: "prep",
    label: "Vorbereitung",
    items: [
      { href: "/check", label: "Amanah-Check", icon: "✓" },
      { href: "/wissen", label: "Wissen", icon: "📚" },
      { href: "/dashboard/ausfuellen", label: "Geführt ausfüllen", icon: "🧭" },
    ],
  },
  {
    id: "kennenlernen",
    label: "Kennenlernen",
    items: [
      { href: "/dashboard/familiengespraech", label: "Familiengespräch", icon: "💬" },
      { href: "/dashboard/familie", label: "Brief für Familie", icon: "✉️" },
    ],
  },
  {
    id: "personal",
    label: "Persönlicher Bereich",
    items: [
      { href: "/dashboard/notfallkarte", label: "Notfallkarte", icon: "🆘" },
      { href: "/dashboard/pdf", label: "PDF & Export", icon: "📄" },
      { href: "/dashboard/assistent", label: "Assistent", icon: "🤖" },
    ],
  },
  {
    id: "modules",
    label: "Module",
    items: [], // filled from moduleConfigs in layout
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
