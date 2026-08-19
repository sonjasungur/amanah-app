import { IMPRINT } from "@/lib/legal/imprint";

export const metadata = {
  title: "Impressum — Mein Wille",
  description: "Impressum und Anbieterkennzeichnung für Mein Wille.",
};

export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-3">Impressum</h1>
      <p className="text-muted mb-8">Anbieterangaben nach dem Digitale-Dienste-Gesetz (DDG).</p>

      <div className="space-y-8 text-muted">
        <section className="rounded-2xl bg-card border border-primary/10 p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Anbieter</h2>
          <p className="leading-relaxed">
            {IMPRINT.operatorLegalName}
            <br />
            {IMPRINT.street}
            <br />
            {IMPRINT.city}
            <br />
            {IMPRINT.country}
          </p>
          <p className="leading-relaxed mt-4">
            Für das Produkt {IMPRINT.productName} ist die {IMPRINT.operatorLegalName} rechtlich verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Kontakt</h2>
          <p className="leading-relaxed">
            E-Mail:{" "}
            <a href={`mailto:${IMPRINT.email}`} className="text-primary-light underline">
              {IMPRINT.email}
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Vertretungsberechtigt</h2>
          <p className="leading-relaxed">{IMPRINT.representedBy}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Registereintrag</h2>
          <p className="leading-relaxed">
            Registergericht: {IMPRINT.registerCourt}
            <br />
            Handelsregisternummer: {IMPRINT.commercialRegisterNumber}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Inhaltlich verantwortlich (§ 18 Abs. 2 MStV)</h2>
          <p className="leading-relaxed">
            {IMPRINT.contentResponsibleName}
            <br />{IMPRINT.contentResponsibleAddress}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-3">Haftungsausschluss</h2>
          <p className="leading-relaxed text-sm">
            Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            Mein Wille ersetzt keine Beratung durch Imam, Gelehrte, Ärzte, Anwälte oder Notare.
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
