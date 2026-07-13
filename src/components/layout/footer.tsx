import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="bg-navy text-white/90 mt-auto no-print">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-white mb-2">{BRAND.name}</h4>
            <p className="text-sm text-white/70">{BRAND.tagline}</p>
            <p className="text-sm text-white/60 mt-2">{BRAND.emotional}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Wissen</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/wissen" className="hover:text-accent">Alle Themen</Link></li>
              <li><Link href="/konvertierte" className="hover:text-accent">Für Konvertierte</Link></li>
              <li><Link href="/janazah-kompass" className="hover:text-accent">Janazah-Kompass</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/check" className="hover:text-accent">Amanah-Check</Link></li>
              <li><Link href="/preise" className="hover:text-accent">Preise</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent">Mein Ordner</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/datenschutz" className="hover:text-accent">Datenschutz</Link></li>
              <li><Link href="/sicherheit" className="hover:text-accent">Sicherheit</Link></li>
              <li><Link href="/impressum" className="hover:text-accent">Impressum</Link></li>
            </ul>
          </div>
        </div>
        <Disclaimer type="main" className="bg-white/10 border-white/20 text-white/80" />
        <p className="text-sm text-white/50 mt-4 text-center">© {new Date().getFullYear()} {BRAND.name}</p>
      </div>
    </footer>
  );
}
