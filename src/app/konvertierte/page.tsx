import Link from "next/link";
import { linkButtonClassName } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Users, HeartHandshake, FileText, Phone } from "lucide-react";
import { TopicFunctionLinks, TopicHero } from "@/components/marketing/topic-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/konvertierte");

const checklist = [
  "Muslimischer Notfallkontakt benennen",
  "Moschee / Imam / Gemeinde kontaktieren",
  "Islamischen Bestatter recherchieren",
  "Wunsch: Ghusl, Kafan, Janazah schriftlich",
  "Bestattung in Deutschland oder Überführung klären",
  "Familienbrief in einfachem Deutsch",
  "Erklärung für nicht-muslimische Angehörige",
  "Wer darf im Notfall angerufen werden?",
  "Wo liegen Dokumente physisch?",
  "Was ist religiös wichtig vs. kulturell?",
  "Was muss rechtlich (Anwalt/Notar/Arzt) geprüft werden?",
];

export default function KonvertiertePage() {
  return (
    <div>
      <TopicHero
        eyebrow="Zielgruppe"
        title="Für Konvertierte & alleinstehende Muslime"
        image="testament"
        intro={
          <p>
            Wenn deine Familie nicht muslimisch ist, du unverheiratet lebst oder niemand deine Janazah-Wünsche kennt —
            musst du deine Amanah besonders klar dokumentieren. Nicht aus Angst, sondern aus Verantwortung.
          </p>
        }
      />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="gold-frame rounded-2xl bg-card p-5 md:p-6">
          <Users className="text-accent mb-2" size={24} aria-hidden />
          <h2 className="font-semibold text-primary-dark text-lg mb-2">Nicht-muslimische Familie</h2>
          <p className="text-sm text-muted">Ghusl, Kafan und Janazah sind oft unbekannt. Ein einfacher Brief kann Leben retten — im wörtlichen Sinne deiner Würde.</p>
        </div>
        <div className="gold-frame rounded-2xl bg-card p-5 md:p-6">
          <HeartHandshake className="text-accent mb-2" size={24} aria-hidden />
          <h2 className="font-semibold text-primary-dark text-lg mb-2">Ohne Ehepartner</h2>
          <p className="text-sm text-muted">Vertrauensperson, Moschee und Bestatter sollten vorher benannt sein — sonst kennt im Ernstfall niemand deine Wünsche.</p>
        </div>
      </div>

      <div className="gold-frame rounded-2xl bg-card p-5 md:p-6 mb-10">
        <h2 className="text-section-title text-primary-dark mb-4 flex items-center gap-2">
          <FileText size={20} className="text-accent" aria-hidden /> Checkliste
        </h2>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <span className="text-accent font-bold">→</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <TopicFunctionLinks
        actions={[
          { href: "/dashboard/familie", label: "Familienbrief", text: "In einfachem Deutsch erklären, was dir islamisch wichtig ist." },
          { href: "/dashboard/notfallkarte", label: "Notfallkarte", text: "Wer im Notfall angerufen werden darf, mit muslimischem Kontakt." },
          { href: "/dashboard/janazah", label: "Janazah-Wünsche", text: "Ghusl, Kafan und Gebet schriftlich festhalten." },
          { href: "/dashboard/familiengespraech", label: "Familiengespräch", text: "Gespräche mit Angehörigen festhalten." },
        ]}
      />

      {/* AP22 EA-04.2: the light outline buttons had white text on a white face. Now: one gold main action and two
          outline links with white text on the night-blue ground (contrast well above WCAG AA 4.5:1). */}
      <section className="on-dark wasiyya-hero text-white my-10 rounded-2xl p-6 md:p-8" aria-labelledby="erster-schritt" data-testid="first-step">
        <Phone className="mb-3 text-[#F2CF6C]" size={28} aria-hidden />
        <h2 id="erster-schritt" className="text-xl font-bold mb-2 text-white">Erster Schritt heute</h2>
        <p className="text-white/85 text-sm mb-5">Starte mit dem Vorsorge-Check — er erkennt deine Situation und empfiehlt konkrete nächste Schritte.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/check" className={linkButtonClassName({ size: "lg", className: "wasiyya-cta border-0" })}>
            Vorsorge-Check starten
          </Link>
          <Link href="/dashboard/familie" className={linkButtonClassName({ size: "lg", variant: "outline", className: "bg-transparent text-white border-[#D4A537]/80 hover:bg-white/10" })}>
            Familienbrief schreiben
          </Link>
          <Link href="/dashboard/notfallkarte" className={linkButtonClassName({ size: "lg", variant: "outline", className: "bg-transparent text-white border-[#D4A537]/80 hover:bg-white/10" })}>
            Notfallkarte anlegen
          </Link>
        </div>
      </section>

      <Disclaimer type="islamic" />
      </div>
    </div>
  );
}
