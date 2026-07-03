import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";

export function Footer() {
  return (
    <footer className="bg-primary text-white/90 mt-auto no-print">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-white mb-3">AmanahOrdner</h4>
            <p className="text-sm text-white/70">Für Krankheit. Für Janazah. Für Barzakh. Für deine Familie.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Wissen</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/janazah-kompass" className="hover:text-accent">Janazah-Kompass</Link></li>
              <li><Link href="/barzakh" className="hover:text-accent">Barzakh</Link></li>
              <li><Link href="/testament-erbe" className="hover:text-accent">Testament & Erbe</Link></li>
              <li><Link href="/islam-oder-kultur" className="hover:text-accent">Islam oder Kultur</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/check" className="hover:text-accent">Amanah-Check</Link></li>
              <li><Link href="/akuter-todesfall" className="hover:text-accent">Akuter Todesfall</Link></li>
              <li><Link href="/bestatter" className="hover:text-accent">Bestatter</Link></li>
              <li><Link href="/preise" className="hover:text-accent">Preise</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/datenschutz" className="hover:text-accent">Datenschutz</Link></li>
              <li><Link href="/impressum" className="hover:text-accent">Impressum</Link></li>
              <li><Link href="/partner" className="hover:text-accent">Partner</Link></li>
            </ul>
          </div>
        </div>
        <Disclaimer type="main" className="bg-white/10 border-white/20 text-white/80" />
        <p className="text-xs text-white/50 mt-4 text-center">© {new Date().getFullYear()} AmanahOrdner — Allah entscheidet. Wir helfen bei bewusster Vorbereitung.</p>
      </div>
    </footer>
  );
}
