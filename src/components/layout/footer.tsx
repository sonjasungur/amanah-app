import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";
import { BRAND } from "@/lib/brand";
import { CHECK_LABELS } from "@/lib/design-tokens";

export function Footer() {
  return (
    <footer className="bg-navy text-white/90 mt-auto no-print">
      <div className="max-w-6xl mx-auto px-4 py-14 md:py-16">
        <div className="grid md:grid-cols-4 gap-10 md:gap-12 mb-10">
          <div className="md:col-span-1">
            <p className="font-bold text-[clamp(1.125rem,2.5vw,1.375rem)] leading-none mb-4">
              <span className="text-white/85 font-semibold">Mein </span>
              <span className="text-emerald">Wille</span>
            </p>
            <p className="text-sm md:text-base text-white/75 leading-relaxed">{BRAND.subtitle}</p>
            <p className="text-sm text-white/60 mt-3 italic">{BRAND.claim}</p>
          </div>
          <div>
            <h4 className="font-bold text-white text-base mb-4">Wissen</h4>
            <ul className="space-y-3 text-sm md:text-base">
              <li>
                <Link href="/wissen" className="text-white/75 hover:text-emerald transition-colors">
                  Alle Themen
                </Link>
              </li>
              <li>
                <Link href="/konvertierte" className="text-white/75 hover:text-emerald transition-colors">
                  Für Konvertierte
                </Link>
              </li>
              <li>
                <Link href="/janazah-kompass" className="text-white/75 hover:text-emerald transition-colors">
                  Janazah-Kompass
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-base mb-4">Service</h4>
            <ul className="space-y-3 text-sm md:text-base">
              <li>
                <Link href="/check" className="text-white/75 hover:text-emerald transition-colors">
                  {CHECK_LABELS.nav}
                </Link>
              </li>
              <li>
                <Link href="/preise" className="text-white/75 hover:text-emerald transition-colors">
                  Preise
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/75 hover:text-emerald transition-colors">
                  Mein Ordner
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-base mb-4">Rechtliches</h4>
            <ul className="space-y-3 text-sm md:text-base">
              <li>
                <Link href="/datenschutz" className="text-white/75 hover:text-emerald transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/sicherheit" className="text-white/75 hover:text-emerald transition-colors">
                  Sicherheit
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-white/75 hover:text-emerald transition-colors">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Disclaimer type="main" className="bg-white/8 border-white/15 text-white/80 text-sm" />
        <p className="text-sm text-white/50 mt-6 text-center">© {new Date().getFullYear()} {BRAND.name}</p>
      </div>
    </footer>
  );
}
