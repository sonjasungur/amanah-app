"use client";

import { useState } from "react";
import { Printer, ShieldAlert } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { useFieldCorrections, withDateDrafts } from "@/lib/store/field-corrections";
import { DateDraftExportBlock } from "@/components/storage/date-drafts";
import {
  PACKAGE_ITEMS,
  PACKAGE_NOTICE,
  PART_TITLES,
  buildPackage,
  defaultSelection,
  type PackageItemId,
  type PackagePart,
  type PackageSection,
} from "@/lib/vorsorge/emergency-package";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PRINT_TITLE = "Notfallpaket – kein Testament";

function PackageDocument({ parts, name, createdAt }: { parts: Record<PackagePart, PackageSection[]>; name: string; createdAt: string }) {
  const empty = parts.notfall.length === 0 && parts.todesfall.length === 0;
  return (
    <article className="package-document" data-testid="package-document">
      <header className="package-head">
        <h1>Notfallpaket{name ? ` von ${name}` : ""}</h1>
        <p>Erstellt am {createdAt}. Spätere Änderungen in Wasiyya sind in diesem Ausdruck nicht enthalten.</p>
        <p className="package-notice">{PACKAGE_NOTICE}</p>
      </header>
      {empty && <p>Noch nichts ausgewählt.</p>}
      {(Object.keys(parts) as PackagePart[]).map((part) =>
        parts[part].length === 0 ? null : (
          <section key={part} className={part === "todesfall" ? "package-part package-part-break" : "package-part"} data-testid={`package-part-${part}`}>
            <h2>{PART_TITLES[part]}</h2>
            {part === "todesfall" && <p className="package-notice">Persönliche Wünsche. Sie sind keine rechtliche Verfügung.</p>}
            {parts[part].map((section) => (
              <section key={section.id} className="package-section" data-testid={`package-section-${section.id}`}>
                <h3>{section.title}</h3>
                {section.rows.length === 0 ? (
                  <p className="package-empty">Keine Angaben.</p>
                ) : (
                  <dl>
                    {section.rows.map((row, i) => (
                      <div key={`${row.label}-${i}`}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            ))}
          </section>
        ),
      )}
      <footer className="package-foot">
        <p>Bitte bewahre dieses Blatt sicher auf. Es kann sensible Angaben enthalten.</p>
      </footer>
    </article>
  );
}

/** The offline emergency package: chosen by the person, previewed, printed or saved as PDF by the browser. */
export default function NotfallpaketPage() {
  const store = useAmanahStore();
  const drafts = useFieldCorrections((s) => s.open);
  const draftOpen = Object.keys(drafts).length > 0;
  const data = withDateDrafts(pickDataFields(store), drafts);
  const [selected, setSelected] = useState<Set<PackageItemId>>(defaultSelection);
  const [confirmed, setConfirmed] = useState<Set<PackageItemId>>(() => new Set());
  const [pending, setPending] = useState<PackageItemId | null>(null);

  const parts = buildPackage(data, selected, confirmed);
  const createdAt = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const name = data.emergencyCard.name.trim() || data.userProfile.name.trim();

  const toggle = (id: PackageItemId, sensitive: boolean, checked: boolean) => {
    if (checked && sensitive) {
      setPending(id);
      return;
    }
    setSelected((s) => {
      const next = new Set(s);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    if (!checked) {
      setConfirmed((c) => {
        const next = new Set(c);
        next.delete(id);
        return next;
      });
    }
  };

  const confirm = (id: PackageItemId) => {
    setConfirmed((c) => new Set(c).add(id));
    setSelected((s) => new Set(s).add(id));
    setPending(null);
  };

  const print = () => {
    if (draftOpen) return;
    const title = document.title;
    document.title = PRINT_TITLE;
    window.print();
    document.title = title;
  };

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-primary mb-2">Notfallpaket</h1>
          <p className="text-muted max-w-2xl">
            Wähle aus, was deine Familie im Ernstfall wissen soll. Das Paket entsteht nur in deinem Browser: Du druckst es aus
            oder speicherst es als PDF und gibst es selbst weiter. Es wird nichts verschickt oder online geteilt.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Card className="p-5 self-start min-w-0" data-testid="package-selection">
            {(["notfall", "todesfall"] as PackagePart[]).map((part) => (
              <fieldset key={part} className="mb-5 last:mb-0 min-w-0">
                <legend className="font-semibold text-foreground mb-2">{PART_TITLES[part]}</legend>
                <div className="space-y-1">
                  {PACKAGE_ITEMS.filter((i) => i.part === part).map((item) => (
                    <div key={item.id}>
                      <label className="flex items-start gap-3 min-h-[44px] py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 shrink-0"
                          checked={selected.has(item.id) && (!item.sensitive || confirmed.has(item.id))}
                          onChange={(e) => toggle(item.id, item.sensitive, e.target.checked)}
                          data-testid={`package-item-${item.id}`}
                        />
                        <span>
                          <span className="font-medium">{item.label}</span>
                          {item.sensitive && (
                            <span className="ml-2 text-xs font-semibold rounded-full bg-warning/15 text-warning px-2 py-0.5">sensibel</span>
                          )}
                          <span className="block text-sm text-muted">{item.description}</span>
                        </span>
                      </label>
                      {pending === item.id && (
                        <div className="ml-8 mb-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm" role="group" aria-label={`${item.label} bestätigen`} data-testid="package-confirm">
                          <p className="flex gap-2">
                            <ShieldAlert size={16} className="text-warning shrink-0 mt-0.5" aria-hidden />
                            Diese Angaben sind besonders sensibel. Nimm sie nur auf, wenn die Person, die das Paket bekommt, sie
                            kennen soll.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => confirm(item.id)} data-testid="package-confirm-yes">
                              Aufnehmen
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setPending(null)} data-testid="package-confirm-no">
                              Nicht aufnehmen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
            {draftOpen && <div className="mt-4"><DateDraftExportBlock /></div>}
            <Button type="button" size="lg" className="w-full mt-4" onClick={print} disabled={draftOpen} data-testid="package-print">
              <Printer size={18} className="mr-2" aria-hidden /> Drucken oder als PDF speichern
            </Button>
            <p className="text-xs text-muted mt-2">Im Druckdialog kannst du „Als PDF speichern“ wählen.</p>
          </Card>

          <div className="min-w-0">
            <CardTitle className="text-base text-foreground mb-2">Vorschau</CardTitle>
            <div className="package-preview rounded-2xl border border-border bg-white shadow-sm overflow-x-auto">
              <PackageDocument parts={parts} name={name} createdAt={createdAt} />
            </div>
          </div>
        </div>
      </div>
      <div className="print-only">
        {!draftOpen && <PackageDocument parts={parts} name={name} createdAt={createdAt} />}
      </div>
    </div>
  );
}
