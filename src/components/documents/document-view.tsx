import {
  AlertTriangle,
  BookOpen,
  Building2,
  Droplets,
  FileText,
  HandHeart,
  HeartPulse,
  HelpCircle,
  Info,
  Laptop,
  Layers,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  Scale,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DocumentLogoMark } from "@/components/layout/logo";
import type { DocBlock, DocIcon, DocModel, WalletCardData } from "@/lib/documents/model";

/**
 * P2.5 design directions, chosen per printout by attribute only (same markup):
 * - "klinisch": register strip with numbered markers, sans serif, emergency-first (direction A)
 * - "editorial": serif headings, cover page with contents, tinted cards (direction B)
 * - "praktisch": checklists with boxes, heavy section bars, write-in friendly (direction C)
 */
export type DocVariant = "klinisch" | "editorial" | "praktisch";
export const DEFAULT_DOC_VARIANT: DocVariant = "klinisch";

const ICONS: Record<DocIcon, LucideIcon> = {
  person: User,
  phone: Phone,
  health: HeartPulse,
  documents: FileText,
  mosque: Building2,
  water: Droplets,
  layers: Layers,
  prayer: HandHeart,
  place: MapPin,
  message: Mail,
  question: HelpCircle,
  steps: ListChecks,
  legal: Scale,
  people: Users,
  wallet: Wallet,
  digital: Laptop,
  info: Info,
  book: BookOpen,
};

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "text":
      return <p className="doc-text">{block.text}</p>;
    case "subhead":
      return <h3 className="doc-subhead">{block.text}</h3>;
    case "callout":
      return (
        <p className={`doc-inline-callout doc-inline-${block.tone}`}>
          <Info size={14} aria-hidden className="doc-inline-icon" />
          <span>{block.text}</span>
        </p>
      );
    case "list":
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
    case "steps":
      return (
        <ol className="doc-steps">
          {block.items.map((item, i) => (
            <li key={`${item.title}-${i}`}>
              <span className="doc-step-box" aria-hidden />
              <span className="doc-step-num" aria-hidden>
                {i + 1}
              </span>
              <span className="doc-step-body">
                <span className="doc-step-title">{item.title}</span>
                {item.detail && <span className="doc-step-detail">{item.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      );
    case "contacts":
      return (
        <ul className="doc-contacts">
          {block.items.map((c, i) => (
            <li key={`${c.name}-${i}`} className="doc-contact">
              <span className="doc-contact-role">{c.role}</span>
              <span className="doc-contact-name">{c.name}</span>
              {c.phone && (
                <span className="doc-contact-phone">
                  <Phone size={12} aria-hidden /> {c.phone}
                </span>
              )}
              {c.note && <span className="doc-contact-note">{c.note}</span>}
            </li>
          ))}
        </ul>
      );
    default:
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
}

const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * One designed A4 document. On screen it is a preview sheet; in print the same markup is the page.
 * Page numbers come from the print style (@page); the table head repeats the person's name and the
 * legal notice on every printed page. No browser URL or form field ever appears.
 */
export function DocumentView({
  model,
  createdAt,
  dataAsOf,
  variant = DEFAULT_DOC_VARIANT,
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
  const running = [model.identity && model.title, model.identity].filter(Boolean).join(" · ");
  const showCover = Boolean(model.cover && model.hasContent);
  return (
    <article className="amanah-doc" data-doc-variant={variant} data-doc-id={model.id} data-testid={testId} lang="de">
      <table className="doc-frame" role="presentation">
        {(model.pageNotice || running) && (
          <thead>
            <tr>
              <td className="doc-running">
                {running && <span className="doc-running-id">{running}</span>}
                {model.pageNotice && (
                  <span className="doc-page-notice" data-testid="doc-page-notice">
                    {model.pageNotice}
                  </span>
                )}
              </td>
            </tr>
          </thead>
        )}
        <tbody>
          <tr>
            <td>
              <header className={showCover ? "doc-head doc-cover" : "doc-head"}>
                <div className="doc-brand">
                  <DocumentLogoMark size={28} />
                  <span>Amanah</span>
                  {model.audience && <span className="doc-audience">{model.audience}</span>}
                </div>
                <h1 className="doc-title">{model.title}</h1>
                {model.identity && <p className="doc-identity">{model.identity}</p>}
                <p className="doc-status" data-testid="doc-status">
                  {model.status}
                </p>
                <p className="doc-meta">
                  Erstellt am {fmt(createdAt)}
                  {asOf ? ` · Stand der Angaben: ${asOf}` : ""} · Spätere Änderungen sind in diesem Ausdruck nicht enthalten.
                </p>
                {showCover && (
                  <nav className="doc-toc" aria-label="Inhalt">
                    <p className="doc-toc-title">Inhalt</p>
                    <ol>
                      {model.sections.map((s, i) => (
                        <li key={s.title}>
                          <span className="doc-toc-num">{i + 1}</span>
                          <span>{s.title}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="doc-toc-hint">Bitte sicher aufbewahren. Diese Übersicht enthält private Angaben.</p>
                  </nav>
                )}
              </header>

              {model.keyMessage && (
                <p className="doc-key" data-testid="doc-key-message">
                  <AlertTriangle size={18} aria-hidden />
                  <span>{model.keyMessage}</span>
                </p>
              )}

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

              {model.sections.map((s, i) => {
                const Icon = s.icon ? ICONS[s.icon] : null;
                return (
                  <section key={s.title} className="doc-section" data-section-icon={s.icon}>
                    <h2>
                      <span className="doc-num" aria-hidden>
                        {i + 1}
                      </span>
                      {Icon && <Icon size={18} aria-hidden className="doc-icon" />}
                      <span className="doc-h2-text">{s.title}</span>
                    </h2>
                    <div className="doc-section-body">
                      {s.note && <p className="doc-note">{s.note}</p>}
                      {s.blocks.map((b, j) => (
                        <Block key={j} block={b} />
                      ))}
                    </div>
                  </section>
                );
              })}

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

function CardFace({ card }: { card: WalletCardData }) {
  return (
    <>
      <div className="doc-card-face doc-card-front">
        <div className="doc-card-band">
          <span>NOTFALLKARTE</span>
          <span className="doc-card-band-sub">Im Notfall · In case of emergency</span>
        </div>
        <div className="doc-card-body">
          <span className="doc-card-name">{card.name ?? "Name: ____________________"}</span>
          {card.birthDate && <span>geb. {card.birthDate}</span>}
          <span className="doc-card-label">Bitte anrufen</span>
          {card.contacts.length ? (
            card.contacts.map((c, i) => (
              <span key={i} className={i === 0 ? "doc-card-contact doc-card-first" : "doc-card-contact"}>
                {c.name}
                {c.detail ? ` (${c.detail})` : ""}
                {c.phone ? ` · ${c.phone}` : ""}
              </span>
            ))
          ) : (
            <span>____________________ · ____________</span>
          )}
        </div>
      </div>
      <div className="doc-card-face doc-card-back">
        <div className="doc-card-body">
          {card.language && <span>Sprache: {card.language}</span>}
          {card.doctor && <span>Hausarzt: {card.doctor}</span>}
          {card.health.length ? card.health.map((r) => <span key={r.label}>{r.label}: {r.value}</span>) : <span>Medizinische Angaben: siehe Notfallblatt (A4)</span>}
          {card.documents.map((r) => (
            <span key={r.label}>
              {r.label}: {r.value}
            </span>
          ))}
          {card.mosque && <span>Im Todesfall bitte informieren: {card.mosque}</span>}
          <small>Amanah · kein rechtliches Dokument · Notruf 112</small>
        </div>
      </div>
    </>
  );
}

/**
 * The fold card on its own sheet: front and back side by side (85.6 × 54 mm each), cut along the
 * marks, fold in the middle. Two copies: one for the wallet, one for a trusted person.
 */
export function WalletCard({ model, variant = DEFAULT_DOC_VARIANT }: { model: DocModel; variant?: DocVariant }) {
  if (!model.card) return null;
  return (
    <section className="doc-wallet" data-doc-variant={variant} data-testid="wallet-card" lang="de" aria-label="Notfallkarte zum Ausschneiden">
      <h2 className="doc-wallet-title">
        <span>Notfallkarte zum Ausschneiden</span>
      </h2>
      <p className="doc-wallet-hint">
        An den Ecken ausschneiden, in der Mitte falten und ins Portemonnaie stecken. Die zweite Karte ist für eine Vertrauensperson.
        Bei Änderungen bitte neu drucken.
      </p>
      {[0, 1].map((n) => (
        <div key={n} className="doc-card" data-testid={n === 0 ? "wallet-card-face" : undefined}>
          <span className="doc-cut doc-cut-tl" aria-hidden />
          <span className="doc-cut doc-cut-tr" aria-hidden />
          <span className="doc-cut doc-cut-bl" aria-hidden />
          <span className="doc-cut doc-cut-br" aria-hidden />
          <CardFace card={model.card!} />
        </div>
      ))}
    </section>
  );
}
