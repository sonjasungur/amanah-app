import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Sicherheit — Amanah Vorsorge",
  description: "Sicherheitshinweise für Amanah Vorsorge — Speicherung, Export, KI und Beta-Status.",
};

export default function SicherheitPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-3">Sicherheit & Vertrauen</h1>
      <p className="text-muted mb-10">Stand: Juli 2026 · Beta-Orientierung</p>

      <div className="prose prose-sm max-w-none space-y-8 text-muted">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Beta-Hinweis</h2>
          <div className="rounded-xl bg-sand border border-accent/20 p-5">
            <p className="leading-relaxed">
              Amanah Vorsorge befindet sich in aktiver Entwicklung. Funktionen werden schrittweise gehärtet.
              Für verbindliche Entscheidungen ist eine <strong className="text-foreground">fachliche Prüfung</strong>{" "}
              durch Anwalt, Notar, Arzt oder qualifizierte Gelehrte empfohlen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Welche Daten Amanah speichert</h2>
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
          <h2 className="text-xl font-semibold text-primary mb-3">Speicher-Modi</h2>
          <h3 className="font-semibold text-foreground mb-2">LocalStorage-Demo</h3>
          <p className="leading-relaxed mb-4">
            Im Standard-Modus bleiben Daten <strong className="text-foreground">lokal in deinem Browser</strong>.
            Du kannst sie exportieren oder mit „Lokale Daten zurücksetzen“ löschen.
          </p>
          <h3 className="font-semibold text-foreground mb-2">API / Postgres</h3>
          <p className="leading-relaxed">
            Im Server-Modus werden Daten über die API gespeichert (Memory oder Postgres).
            Mit „Amanah-Daten löschen“ werden nur deine Vorsorgedaten entfernt — dein Benutzerkonto bleibt bestehen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">KI-Modus</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong className="text-foreground">rules / mock:</strong> Keine externen KI-Dienste — Hilfe auf dem Gerät oder Server.</li>
            <li><strong className="text-foreground">openai:</strong> Externe KI nur nach ausdrücklicher Zustimmung, mit Datenminimierung.</li>
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
            <li>Lokale Daten zurücksetzen oder Server-Amanah-Daten löschen</li>
            <li>KI-Einwilligung widerrufen</li>
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
