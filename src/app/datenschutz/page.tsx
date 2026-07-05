import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Datenschutz — AmanahOrdner",
  description: "Datenschutzerklärung für AmanahOrdner — lokale und serverseitige Speicherung, KI, Export und Löschung.",
};

export default function DatenschutzPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-3">Datenschutzerklärung</h1>
      <p className="text-muted mb-10">Stand: Juli 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-muted">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">1. Verantwortlicher</h2>
          <p className="leading-relaxed">
            Verantwortlich für die Datenverarbeitung im Rahmen von AmanahOrdner ist der Betreiber der Plattform.
            Kontakt:{" "}
            <a href="mailto:datenschutz@amanahordner.de" className="text-primary-light underline">
              datenschutz@amanahordner.de
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">2. Welche Daten gespeichert werden</h2>
          <p className="leading-relaxed mb-3">
            Amanah verarbeitet sehr sensible Vorsorgedaten. Typischerweise speicherst du unter anderem:
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Profil- und Notfallkontaktdaten</li>
            <li>Medizinische Hinweise und Dokumentenorte</li>
            <li>Vollmachts- und Vertrauenspersonen</li>
            <li>Janazah-, Testament- und Schuldenhinweise</li>
            <li>Familiennachrichten und digitale-Nachlass-Hinweise (ohne Passwörter)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">3. LocalStorage-Demo-Modus</h2>
          <p className="leading-relaxed mb-3">
            Im Standard-Modus liegen deine Daten <strong className="text-foreground">lokal in deinem Browser</strong> (Local Storage):
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Keine Übertragung sensibler Vorsorgedaten an Server, solange du nicht den API-Modus nutzt.</li>
            <li>Export als JSON oder lesbare Notfallmappe möglich.</li>
            <li>„Lokale Daten zurücksetzen“ löscht den Browser-Speicher nach Bestätigung.</li>
            <li>Beim Löschen des Browser-Speichers gehen Daten verloren — sichere regelmäßig ein Backup.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">4. API- / Postgres-Modus</h2>
          <p className="leading-relaxed mb-3">
            Wenn du dich registrierst und den Server-Modus aktivierst, werden Daten serverseitig gespeichert
            (In-Memory oder PostgreSQL). Dabei gelten:
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Speicherung nur für dein angemeldetes Konto.</li>
            <li>„Amanah-Daten löschen“ entfernt nur Vorsorgedaten — nicht dein Benutzerkonto.</li>
            <li>Session-Token werden gehasht gespeichert, keine Klartext-Passwörter in der Datenbank.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">5. Keine Passwort-Speicherung für private Konten</h2>
          <p className="leading-relaxed">
            AmanahOrdner speichert <strong className="text-foreground">keine Zugangspasswörter</strong> zu deinen
            persönlichen Konten (E-Mail, Banking, Social Media). Im Modul „Digitaler Nachlass“ dokumentierst du
            nur Hinweise, wo Zugangsdaten sicher aufbewahrt werden — nicht die Passwörter selbst.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">6. KI-Assistent</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong className="text-foreground">rules / mock:</strong> Keine externen KI-Dienste — Verarbeitung lokal bzw. regelbasiert auf dem Server.</li>
            <li><strong className="text-foreground">openai:</strong> Externe KI nur nach ausdrücklicher Zustimmung, mit Datenminimierung.</li>
            <li>Sende keine vollständigen persönlichen oder medizinischen Daten in Freitextfragen.</li>
            <li>Der Assistent ersetzt keine Beratung durch Imam, Arzt oder Anwalt.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">7. Export & Angehörige</h2>
          <p className="leading-relaxed">
            Du kannst deine Daten exportieren (JSON, lesbare Notfallmappe).{" "}
            <strong className="text-foreground">Angehörige erhalten nichts automatisch.</strong>{" "}
            Bewahre Exporte sicher auf und teile sie nur bewusst mit Vertrauenspersonen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">8. Kein Ersatz für Fachberatung</h2>
          <p className="leading-relaxed">
            Amanah bietet Orientierung und Vorbereitung — keine Rechtsberatung, keine medizinische Beratung,
            keine Fatwa und keine Garantie auf rechtliche Wirksamkeit. Fachliche Prüfung empfohlen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">9. Cookies & Analytics</h2>
          <p className="leading-relaxed">
            AmanahOrdner verwendet derzeit keine Tracking-Cookies und kein werbliches Profiling.
            Technisch notwendige Speicherung im Browser (Local Storage) ist für die Funktion erforderlich.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">10. Deine Rechte</h2>
          <p className="leading-relaxed">
            Du hast das Recht auf Auskunft, Berichtigung und Löschung. Exportiere oder lösche Daten jederzeit
            in den Speichereinstellungen. Weitere Sicherheitshinweise findest du unter{" "}
            <Link href="/sicherheit" className="text-primary-light underline">
              Sicherheit
            </Link>
            . Bei Fragen:{" "}
            <a href="mailto:datenschutz@amanahordner.de" className="text-primary-light underline">
              datenschutz@amanahordner.de
            </a>.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
    </div>
  );
}
