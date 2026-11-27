import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/sicherheit");

export default function SicherheitPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-3">Sicherheit & Vertrauen</h1>
      <p className="text-muted mb-10">Stand: November 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-muted">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Wofür Wasiyya da ist</h2>
          <div className="rounded-xl bg-sand border border-accent/20 p-5">
            <p className="leading-relaxed">
              Wasiyya hilft dir, Wünsche und Informationen geordnet festzuhalten. Es ersetzt keine Beratung.
              Für verbindliche Entscheidungen wende dich an Anwalt, Notar, Ärztin oder Arzt oder an qualifizierte
              Gelehrte. Wir entwickeln Wasiyya laufend weiter und informieren über wichtige Änderungen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Welche Daten Wasiyya speichert</h2>
          <p className="leading-relaxed mb-3">Typischerweise dokumentierst du unter anderem:</p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Notfallkontakte und medizinische Hinweise</li>
            <li>Vertrauenspersonen und Vollmachtshinweise</li>
            <li>Janazah- und Bestattungswünsche</li>
            <li>Testament-, Schulden- und Familiennachrichten</li>
            <li>Hinweise zu digitalem Nachlass (ohne Passwörter)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Wo deine Daten liegen</h2>
          <h3 className="font-semibold text-foreground mb-2">Mit Konto</h3>
          <p className="leading-relaxed mb-4">
            Deine Vorsorgedaten werden in deinem Konto auf unserem Server gespeichert,{" "}
            <strong className="text-foreground">verschlüsselt</strong> und nur nach Anmeldung abrufbar.
            Mit „Vorsorgedaten löschen“ werden nur deine Vorsorgedaten entfernt — dein Benutzerkonto bleibt bestehen.
          </p>
          <h3 className="font-semibold text-foreground mb-2">Vorsorge-Check ohne Konto</h3>
          <p className="leading-relaxed">
            Antworten im kostenlosen Vorsorge-Check bleiben nur in deinem Browser, solange der Tab geöffnet ist.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Keine KI-Dienste</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Wasiyya nutzt derzeit keine Dienste künstlicher Intelligenz. Der Assistent ist abgeschaltet.</li>
            <li>Ausfüllhilfe und Vorsorge-Check arbeiten nach festen Regeln, ohne Weitergabe an Dritte.</li>
            <li>Keine Rechtsberatung, keine medizinische Beratung, keine Fatwa.</li>
            <li>Kein automatischer Versand an Angehörige.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Export sicher aufbewahren</h2>
          <p className="leading-relaxed">
            JSON- und lesbare Notfallmappe-Exporte enthalten sensible Angaben. Bewahre sie verschlüsselt oder physisch sicher auf.
            Angehörige erhalten <strong className="text-foreground">nichts automatisch</strong> — du entscheidest bewusst, wann und wie du teilst.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Deine Kontrolle</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Daten exportieren (JSON, lesbare Notfallmappe)</li>
            <li>Vorsorgedaten im Konto löschen oder das ganze Konto löschen</li>
          </ul>
          <p className="mt-4">
            <Link href="/datenschutz" className="text-primary-light underline">
              Zur Datenschutzerklärung →
            </Link>
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
    </div>
  );
}
