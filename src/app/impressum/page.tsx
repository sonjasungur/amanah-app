export const metadata = {
  title: "Impressum — Amanah Vorsorge",
  description: "Impressum und Anbieterkennzeichnung für Amanah Vorsorge.",
};

export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-3">Impressum</h1>
      <p className="text-muted mb-10">Angaben gemäß § 5 TMG</p>

      <div className="space-y-8 text-muted">
        <section className="rounded-2xl bg-card border border-primary/10 p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Anbieter</h2>
          <p className="leading-relaxed">
            Amanah Vorsorge<br />
            [Firmenname / Projektname — Platzhalter]<br />
            [Straße und Hausnummer]<br />
            [PLZ Ort]<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Kontakt</h2>
          <p className="leading-relaxed">
            E-Mail:{" "}
            <a href="mailto:kontakt@amanahordner.de" className="text-primary-light underline">
              kontakt@amanahordner.de
            </a>
            <br />
            Telefon: [Platzhalter]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Vertretungsberechtigt</h2>
          <p className="leading-relaxed">[Name des Vertretungsberechtigten — Platzhalter]</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Umsatzsteuer-ID</h2>
          <p className="leading-relaxed">
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
            [DE XXX XXX XXX — Platzhalter, falls vorhanden]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)</h2>
          <p className="leading-relaxed">
            [Name]<br />
            [Adresse]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Haftungsausschluss</h2>
          <p className="leading-relaxed text-sm">
            Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            Amanah Vorsorge ersetzt keine Beratung durch Imam, Gelehrte, Ärzte, Anwälte oder Notare.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">EU-Streitschlichtung</h2>
          <p className="leading-relaxed text-sm">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-light underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  );
}
