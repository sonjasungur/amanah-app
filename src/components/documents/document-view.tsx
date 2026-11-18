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
import type { CardLine, DocBlock, DocIcon, DocModel } from "@/lib/documents/model";

/**
 * One design system with two modes (P2.6), chosen per document by attribute (same markup):
 * - "klinisch": functional, sans serif, quick to scan (emergency documents)
 * - "editorial": calm, serif headings and text (Janazah wishes, family letter, overview)
 */
export type DocVariant = "klinisch" | "editorial";
export const DEFAULT_DOC_VARIANT: DocVariant = "klinisch";

/**
 * Owner decision P2.5 (18.11.2026): A "klinisch" for everything used in a hurry, B "editorial" for
 * the calm, personal documents. One design system (tokens, icons, blocks), two treatments.
 */
export const DOCUMENT_VARIANTS: Record<DocModel["id"], DocVariant> = {
  notfallkarte: "klinisch",
  notfallinfo: "klinisch",
  leitfaden: "klinisch",
  erbprofil: "klinisch",
  schulden: "klinisch",
  vermoegen: "klinisch",
  janazah: "editorial",
  familienbrief: "editorial",
  gesamt: "editorial",
};

export const variantFor = (id: DocModel["id"]): DocVariant => DOCUMENT_VARIANTS[id] ?? DEFAULT_DOC_VARIANT;

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
const longDate = (d: Date) => d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

/**
 * The family letter, set as a letter (P2.6, DIN 5008 grid): small letterhead, sender, place and date,
 * optional Basmala, salutation, paragraphs, closing, room for the signature, printed name. No numbered
 * sections, no form look.
 */
function LetterView({ model, createdAt, dataAsOf, testId }: { model: DocModel; createdAt: Date; dataAsOf: string | null; testId: string }) {
  const l = model.letter!;
  const asOf = dataAsOf && !Number.isNaN(Date.parse(dataAsOf)) ? fmt(new Date(dataAsOf)) : null;
  return (
    <article className="amanah-doc amanah-letter" data-doc-variant="editorial" data-doc-id={model.id} data-testid={testId} lang="de">
      <header className="letter-head">
        <div className="doc-brand">
          <DocumentLogoMark size={22} />
          <span>Amanah</span>
          <span className="doc-audience">{model.title}</span>
        </div>
        {l.sender && <p className="letter-sender">{l.sender}</p>}
        <p className="letter-date">{[l.place, longDate(createdAt)].filter(Boolean).join(", ")}</p>
        <h1 className="sr-only">{model.title}</h1>
      </header>
      {l.bismillah && (
        <p className="letter-basmala" lang="ar" dir="rtl">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}
      {l.greeting && <p className="letter-greeting">{l.greeting}</p>}
      <div className="letter-body">
        {l.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="letter-sign">
        {l.closing && <p className="letter-closing">{l.closing}</p>}
        <div className="letter-sign-space" aria-hidden />
        {l.signature && <p className="letter-name">{l.signature}</p>}
      </div>
      {l.summary && (
        <section className="letter-summary">
          <h2>Das Wichtigste in Kürze</h2>
          <p>{l.summary}</p>
        </section>
      )}
      {model.missing.length > 0 && (
        <p className="doc-callout doc-missing letter-missing" data-testid="doc-missing">
          Noch nicht ausgefüllt: {model.missing.join(" · ")}
        </p>
      )}
      <footer className="doc-foot letter-foot">
        <span data-testid="doc-status">{model.status}</span> Erstellt am {fmt(createdAt)}
        {asOf ? ` · Stand der Angaben: ${asOf}` : ""}.
      </footer>
    </article>
  );
}

export function DocumentView({
  model,
  createdAt,
  dataAsOf,
  variant,
  testId = "document-view",
}: {
  model: DocModel;
  createdAt: Date;
  /** Last confirmed save; "Stand der Angaben". */
  dataAsOf: string | null;
  variant?: DocVariant;
  testId?: string;
}) {
  if (model.letter && model.hasContent) return <LetterView model={model} createdAt={createdAt} dataAsOf={dataAsOf} testId={testId} />;
  const look = variant ?? variantFor(model.id);
  const asOf = dataAsOf && !Number.isNaN(Date.parse(dataAsOf)) ? fmt(new Date(dataAsOf)) : null;
  const running = [model.identity && model.title, model.identity].filter(Boolean).join(" · ");
  const showCover = Boolean(model.cover && model.hasContent);
  return (
    <article className="amanah-doc" data-doc-variant={look} data-doc-id={model.id} data-testid={testId} lang="de">
      <table className="doc-frame" role="presentation">
        {/* Repeats on every printed page: the top margin with who and what (Chrome repeats thead/tfoot). */}
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
        <tfoot aria-hidden>
          <tr>
            <td className="doc-page-spacer" />
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td>
              <header className={showCover ? "doc-head doc-cover" : "doc-head"}>
                <div className="doc-brand">
                  <DocumentLogoMark size={26} />
                  <span>Amanah</span>
                  {model.audience && <span className="doc-audience">{model.audience}</span>}
                </div>
                <h1 className="doc-title">{model.title}</h1>
                {model.identity && <p className="doc-identity">{model.identity}</p>}
                <p className="doc-meta">
                  Stand der Angaben: {asOf ?? "nicht gespeichert"} · Erstellt am {fmt(createdAt)} · Spätere Änderungen sind in diesem Ausdruck nicht enthalten.
                </p>
                <p className="doc-status" data-testid="doc-status">
                  {model.status}
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
                  <section key={s.title} className="doc-section" data-section-icon={s.icon} data-critical={s.critical ? "" : undefined}>
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

function CardSide({ lines, className, band }: { lines: CardLine[]; className: string; band?: boolean }) {
  return (
    <div className={`doc-card-face ${className}`}>
      {band && (
        <div className="doc-card-band">
          <span>NOTFALL · Bitte lesen</span>
        </div>
      )}
      <div className="doc-card-body">
        {lines.map((l, i) => (
          <span key={i} className={`card-${l.kind}`}>
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The fold card on its own sheet: front and back side by side (85.6 × 54 mm each), cut along the
 * marks, fold in the middle. Two copies: one for the wallet, one for a trusted person. No text below
 * 9 pt; what does not fit stays on the A4 sheet (see walletCard in model.ts).
 */
export function WalletCard({ model, variant }: { model: DocModel; variant?: DocVariant }) {
  if (!model.card) return null;
  const card = model.card;
  return (
    <section className="doc-wallet" data-doc-variant={variant ?? variantFor(model.id)} data-testid="wallet-card" lang="de" aria-label="Notfallkarte zum Ausschneiden">
      <h2 className="doc-wallet-title">
        <span>Notfallkarte zum Ausschneiden</span>
      </h2>
      <p className="doc-wallet-hint">
        An den Ecken ausschneiden, in der Mitte falten und ins Portemonnaie stecken. Die zweite Karte ist für eine Vertrauensperson.
        Mit „Tatsächliche Größe“ drucken. Bei Änderungen bitte neu drucken.
      </p>
      {[0, 1].map((n) => (
        <div key={n} className="doc-card" data-testid={n === 0 ? "wallet-card-face" : undefined}>
          <span className="doc-cut doc-cut-tl" aria-hidden />
          <span className="doc-cut doc-cut-tr" aria-hidden />
          <span className="doc-cut doc-cut-bl" aria-hidden />
          <span className="doc-cut doc-cut-br" aria-hidden />
          <CardSide lines={card.front} className="doc-card-front" band />
          <CardSide lines={card.back} className="doc-card-back" />
        </div>
      ))}
    </section>
  );
}
