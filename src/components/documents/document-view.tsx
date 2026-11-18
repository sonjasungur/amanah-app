import { DocumentLogoMark } from "@/components/layout/logo";
import type { DocBlock, DocModel } from "@/lib/documents/model";

export type DocVariant = "klar" | "klassisch" | "kompakt";

function Block({ block }: { block: DocBlock }) {
  if (block.kind === "text") return <p className="doc-text">{block.text}</p>;
  if (block.kind === "list") {
    return (
      <ul className="doc-list">
        {block.items.map((item, i) => (
          <li key={`${item.title}-${i}`}>
            <span className="doc-list-title">{item.title}</span>
            {item.detail && <span className="doc-list-detail">{item.detail}</span>}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="doc-rows">
      {block.rows.map((row, i) => (
        <div key={`${row.label}-${i}`}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * One designed A4 document. On screen it is a preview sheet; in print the same markup is the page.
 * Page numbers come from the print style (@page), so no browser URL or form field ever appears.
 */
export function DocumentView({
  model,
  createdAt,
  dataAsOf,
  variant = "klar",
  testId = "document-view",
}: {
  model: DocModel;
  createdAt: Date;
  /** Last confirmed save; "Stand der Angaben". */
  dataAsOf: string | null;
  variant?: DocVariant;
  testId?: string;
}) {
  const asOf = dataAsOf && !Number.isNaN(Date.parse(dataAsOf)) ? fmt(new Date(dataAsOf)) : null;
  return (
    <article className="amanah-doc" data-doc-variant={variant} data-testid={testId} lang="de">
      <table className="doc-frame" role="presentation">
        {model.pageNotice && (
          <thead>
            <tr>
              <td className="doc-page-notice" data-testid="doc-page-notice">
                {model.pageNotice}
              </td>
            </tr>
          </thead>
        )}
        <tbody>
          <tr>
            <td>
              <header className="doc-head">
                <div className="doc-brand">
                  <DocumentLogoMark size={28} />
                  <span>Amanah</span>
                </div>
                <h1 className="doc-title">{model.title}</h1>
                <p className="doc-status" data-testid="doc-status">
                  {model.status}
                </p>
                <p className="doc-meta">
                  Erstellt am {fmt(createdAt)}
                  {asOf ? ` · Stand der Angaben: ${asOf}` : ""} · Spätere Änderungen sind in diesem Ausdruck nicht enthalten.
                </p>
              </header>

              {model.warnings.length > 0 && (
                <section className="doc-callout doc-warn" data-testid="doc-warnings">
                  <h2>Bitte prüfen</h2>
                  <ul>
                    {model.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </section>
              )}

              {model.sections.map((s) => (
                <section key={s.title} className="doc-section">
                  <h2>{s.title}</h2>
                  {s.note && <p className="doc-note">{s.note}</p>}
                  {s.blocks.map((b, i) => (
                    <Block key={i} block={b} />
                  ))}
                </section>
              ))}

              {model.missing.length > 0 && (
                <section className="doc-callout doc-missing" data-testid="doc-missing">
                  <h2>Noch nicht ausgefüllt</h2>
                  <p>{model.missing.join(" · ")}</p>
                </section>
              )}

              <footer className="doc-foot">
                Bitte sicher aufbewahren: Dieses Blatt kann private Angaben enthalten. Amanah ersetzt keinen Imam, Gelehrten, Arzt,
                Anwalt oder Notar.
              </footer>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

/** Credit-card sized emergency card to cut out (85.6 × 54 mm), front and back. */
export function WalletCard({ model }: { model: DocModel }) {
  const rows = model.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === "rows" ? b.rows : [])));
  const pick = (label: string) => rows.find((r) => r.label === label)?.value;
  const health = model.sections.find((s) => s.title === "Medizinische Hinweise");
  return (
    <div className="doc-wallet" data-testid="wallet-card">
      <div className="doc-wallet-card">
        <strong>NOTFALLKARTE</strong>
        <span>{pick("Name") ?? "Name: ________________"}</span>
        {pick("Geburtsdatum") && <span>geb. {pick("Geburtsdatum")}</span>}
        <span>Im Notfall: {pick("Kontakt 1") ?? "________________"}</span>
        {pick("Kontakt 2") && <span>oder: {pick("Kontakt 2")}</span>}
      </div>
      <div className="doc-wallet-card">
        {health ? health.blocks.flatMap((b) => (b.kind === "rows" ? b.rows : [])).map((r) => <span key={r.label}>{r.label}: {r.value}</span>) : <span>Medizinische Hinweise: siehe Notfallinformationen</span>}
        {pick("Patientenverfügung") && <span>Patientenverfügung: {pick("Patientenverfügung")}</span>}
        {pick("Hausarzt") && <span>Hausarzt: {pick("Hausarzt")}</span>}
        <small>Amanah · kein rechtliches Dokument</small>
      </div>
    </div>
  );
}
