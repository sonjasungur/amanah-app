import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Datenschutz — AmanahOrdner",
  description: "Datenschutzerklärung für AmanahOrdner — lokale Speicherung, keine Passwörter, Roadmap Verschlüsselung.",
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
          <h2 className="text-xl font-semibold text-primary mb-3">2. Lokale Speicherung — deine Daten bleiben bei dir</h2>
          <p className="leading-relaxed mb-3">
            AmanahOrdner speichert deine Vorsorgedaten primär <strong className="text-foreground">lokal in deinem Browser</strong>{" "}
            (Local Storage). Das bedeutet:
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Deine Einträge zu Janazah, Testament, Patientenverfügung und weiteren Modulen werden auf deinem Gerät gespeichert.</li>
            <li>Es werden keine sensiblen Vorsorgedaten standardmäßig an unsere Server übertragen.</li>
            <li>Du kannst deine Daten als JSON exportieren und selbst sichern.</li>
            <li>Beim Löschen des Browser-Speichers gehen die Daten verloren — sichere regelmäßig ein Backup.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">3. Keine Passwort-Speicherung</h2>
          <p className="leading-relaxed">
            AmanahOrdner speichert <strong className="text-foreground">keine Zugangspasswörter</strong> zu deinen
            persönlichen Konten (E-Mail, Banking, Social Media). Im Modul &ldquo;Digitaler Nachlass&rdquo; dokumentierst du
            nur Hinweise, wo Zugangsdaten sicher aufbewahrt werden — nicht die Passwörter selbst.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">4. KI-Assistent (optional)</h2>
          <p className="leading-relaxed">
            Wenn du den Amanah-Assistenten nutzt, werden deine Fragen an einen KI-Dienst übermittelt.
            Sende keine vollständigen persönlichen oder medizinischen Daten in Freitextfragen.
            Der Assistent ersetzt keine Beratung durch Imam, Arzt oder Anwalt.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">5. Roadmap: Ende-zu-Ende-Verschlüsselung</h2>
          <div className="rounded-xl bg-sand border border-accent/20 p-5">
            <p className="leading-relaxed">
              Für zukünftige Cloud-Synchronisation und Familienfreigabe planen wir{" "}
              <strong className="text-foreground">Ende-zu-Ende-Verschlüsselung</strong>. Das bedeutet:
              Nur du (und von dir autorisierte Personen) können die entschlüsselten Daten lesen —
              nicht einmal der Betreiber. Dieses Feature befindet sich auf der Roadmap und ist
              noch nicht verfügbar.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">6. Cookies & Analytics</h2>
          <p className="leading-relaxed">
            AmanahOrdner verwendet derzeit keine Tracking-Cookies und kein werbliches Profiling.
            Technisch notwendige Speicherung im Browser (Local Storage) ist für die Funktion erforderlich.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">7. Deine Rechte</h2>
          <p className="leading-relaxed">
            Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner Daten. Da die Daten lokal
            gespeichert werden, kannst du sie jederzeit über die Speichereinstellungen im Ordner löschen
            oder exportieren. Bei Fragen wende dich an{" "}
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
