import Link from "next/link";

/**
 * Navigation between the editorial review pages and the knowledge centre preview (owner 26.11.2026).
 * Only rendered on pages that are themselves behind the preview switch, so it never appears publicly.
 */
const LINKS = [
  { href: "/wissen/redaktion/artikel", label: "Alle Artikel (Redaktion)" },
  { href: "/wissen/redaktion", label: "Themen und Prüfpakete" },
  { href: "/wissen/zentrum", label: "Wissenszentrum (Vorschau)" },
] as const;

export function EditorialNav() {
  return (
    <nav className="on-dark bg-navy text-white border-b border-[#D4A537]/45" aria-label="Redaktion" data-testid="editorial-nav">
      <ul className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <li className="text-[#F2CF6C] font-semibold uppercase tracking-[0.14em] text-xs self-center">Redaktion · nicht öffentlich</li>
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-white/85 hover:text-white hover:underline decoration-[#D4A537] underline-offset-4"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
