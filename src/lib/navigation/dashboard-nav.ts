import { moduleConfigs } from "@/lib/modules/config";
import { VORSORGE_AREAS } from "@/lib/vorsorge/areas";

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

/** The four main destinations. Desktop shows them in the sidebar, phones in the bottom bar. */
export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/dashboard/vorsorge", label: "Vorsorge" },
  { href: "/dashboard/personen", label: "Familie" },
  { href: "/dashboard/notfallpaket", label: "Notfallpaket" },
];

/** The six areas, each opening its first page. */
export const areaNavItems: NavItem[] = VORSORGE_AREAS.map((area) => ({ href: area.pages[0].path, label: area.title }));

const AREA_PATHS = new Set(VORSORGE_AREAS.flatMap((a) => a.pages.map((p) => p.path)));

/** Everything else stays reachable, folded away. */
export const moreNavItems: NavItem[] = [
  ...VORSORGE_AREAS.flatMap((a) => a.pages.slice(1).map((p) => ({ href: p.path, label: p.title }))),
  ...moduleConfigs.filter((m) => !AREA_PATHS.has(m.path)).map((m) => ({ href: m.path, label: m.title })),
  { href: "/dashboard/familiengespraech", label: "Familiengespräch" },
  { href: "/check", label: "Vorsorge-Check" },
  { href: "/dashboard/pdf", label: "Weitere Ausdrucke" },
];

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
