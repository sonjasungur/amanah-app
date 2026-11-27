"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import type { DigitalCategory, DigitalLegacyItem, DigitalSecureAccess, DigitalTreatment } from "@/lib/domain/types";
import {
  DIGITAL_CATEGORY_LABELS,
  DIGITAL_SECURE_ACCESS_LABELS,
  DIGITAL_TREATMENT_LABELS,
  KNOWN_PROVIDERS,
  LEGACY_TYPE_LABELS,
  NOTE_MAX,
  REFERENCE_MAX,
  digitalEntryFindings,
  digitalEntryHasSecrets,
  digitalKindLabel,
  digitalTitle,
  isLegacyDigitalEntry,
  trustedPersonName,
  type DigitalCheckedField,
  type DigitalDraft,
} from "@/lib/vorsorge/digital-legacy";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";

interface FormState extends DigitalDraft {
  category: DigitalCategory;
  knownId: string;
  treatments: DigitalTreatment[];
  trustedPersonId: string;
  secureAccess: DigitalSecureAccess | "";
}

const EMPTY: FormState = {
  category: "email",
  knownId: "",
  providerName: "",
  reference: "",
  treatments: [],
  treatmentNote: "",
  trustedPersonId: "",
  secureAccess: "",
  secureAccessNote: "",
};

function formFrom(item: DigitalLegacyItem): FormState {
  return {
    category: item.category ?? "other",
    knownId: item.provider?.knownId ?? "",
    providerName: item.provider?.name ?? "",
    reference: item.reference ?? "",
    treatments: item.treatments ?? [],
    treatmentNote: item.treatmentNote ?? "",
    trustedPersonId: item.trustedPersonId ?? "",
    secureAccess: item.secureAccess ?? "",
    secureAccessNote: item.secureAccessNote ?? "",
  };
}

/**
 * AP22 EA-18.1: one entry per account with provider, category, short reference, wished treatment,
 * responsible person and how the family gets access safely. Inputs that look like passwords, PINs,
 * IBANs or long numbers are refused before saving (shared check, lib/validation/secret-like.ts).
 */
export function DigitalLegacyEditor() {
  const uid = useId();
  const { digitalLegacy, familyMembers, updateSections } = useAmanahStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const findings = digitalEntryFindings(form);
  const blocked = Object.keys(findings).length > 0;
  const canSave = form.providerName.trim().length > 0 && !blocked;
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const fieldError = (field: DigitalCheckedField) =>
    findings[field]?.length ? (
      <p id={`${uid}-${field}-error`} role="alert" className="text-sm text-danger mt-1" data-testid={`digital-error-${field}`}>
        {findings[field]!.map((f) => f.message).join(" ")}
      </p>
    ) : null;
  const describedBy = (field: DigitalCheckedField) => (findings[field]?.length ? `${uid}-${field}-error` : undefined);

  const save = () => {
    if (!canSave) return;
    const person = familyMembers.find((m) => m.id === form.trustedPersonId);
    const current = useAmanahStore.getState().digitalLegacy;
    const before = editingId ? current.find((d) => d.id === editingId) : undefined;
    const entry: DigitalLegacyItem = {
      // Old fields of an entry being edited stay as they are (nothing is dropped).
      ...(before ?? { id: crypto.randomUUID(), description: "", locationHint: "" }),
      category: form.category,
      provider: { name: form.providerName.trim(), ...(form.knownId ? { knownId: form.knownId } : {}) },
      reference: form.reference.trim(),
      treatments: form.treatments,
      treatmentNote: form.treatmentNote.trim(),
      trustedPersonId: person?.id ?? "",
      trustedPersonName: person?.name ?? "",
      secureAccessNote: form.secureAccessNote.trim(),
      updatedAt: new Date().toISOString(),
    };
    if (form.secureAccess) entry.secureAccess = form.secureAccess;
    else delete entry.secureAccess;
    updateSections({ digitalLegacy: before ? current.map((d) => (d.id === before.id ? entry : d)) : [...current, entry] });
    setForm(EMPTY);
    setEditingId(null);
  };

  const remove = (id: string) => {
    updateSections({ digitalLegacy: useAmanahStore.getState().digitalLegacy.filter((d) => d.id !== id) });
    setConfirmDelete(null);
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY);
    }
  };

  const toggleTreatment = (t: DigitalTreatment) =>
    set({ treatments: form.treatments.includes(t) ? form.treatments.filter((x) => x !== t) : [...form.treatments, t] });

  return (
    <div>
      <Card className="mb-6" data-testid="digital-form">
        <CardTitle>{editingId ? "Eintrag bearbeiten" : "Neues Konto hinzufügen"}</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${uid}-category`}>Kategorie</Label>
              <Select id={`${uid}-category`} value={form.category} onChange={(e) => set({ category: e.target.value as DigitalCategory })} data-testid="digital-category">
                {Object.entries(DIGITAL_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`${uid}-known`}>Bekannter Anbieter (optional)</Label>
              <Select
                id={`${uid}-known`}
                value={form.knownId}
                onChange={(e) => {
                  const known = KNOWN_PROVIDERS.find((p) => p.id === e.target.value);
                  set(known ? { knownId: known.id, providerName: known.name, category: known.category } : { knownId: "" });
                }}
                data-testid="digital-known-provider"
              >
                <option value="">Anderer Anbieter</option>
                {KNOWN_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor={`${uid}-provider`}>Anbieter</Label>
            <Input
              id={`${uid}-provider`}
              value={form.providerName}
              maxLength={200}
              onChange={(e) => set({ providerName: e.target.value })}
              placeholder="z. B. Gmail, Dropbox, Netflix"
              aria-describedby={describedBy("providerName")}
              aria-invalid={Boolean(findings.providerName)}
              data-testid="digital-provider"
            />
            {fieldError("providerName")}
          </div>
          <div>
            <Label htmlFor={`${uid}-reference`}>Konto- oder Vertragsbezeichnung (optional)</Label>
            <p id={`${uid}-reference-hint`} className="text-xs text-muted mb-1.5">
              Nur kurz und unkritisch, z. B. „privates Konto“ oder „Familienvertrag“. Keine Vertrags- oder Kundennummern: die tragen deine Angehörigen später selbst ins Schreiben ein.
            </p>
            <Input
              id={`${uid}-reference`}
              value={form.reference}
              maxLength={REFERENCE_MAX}
              onChange={(e) => set({ reference: e.target.value })}
              aria-describedby={[`${uid}-reference-hint`, describedBy("reference")].filter(Boolean).join(" ")}
              aria-invalid={Boolean(findings.reference)}
              data-testid="digital-reference"
            />
            {fieldError("reference")}
          </div>
          <fieldset>
            <legend className="text-sm font-medium mb-1.5">Was soll mit dem Konto geschehen? (mehrere möglich)</legend>
            <div className="grid gap-2 sm:grid-cols-2" data-testid="digital-treatments">
              {(Object.entries(DIGITAL_TREATMENT_LABELS) as [DigitalTreatment, string][]).map(([value, label]) => (
                <label key={value} className="flex items-start gap-3 min-h-[44px] text-sm">
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={form.treatments.includes(value)} onChange={() => toggleTreatment(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor={`${uid}-tnote`}>Kurzer Hinweis zum Wunsch (optional)</Label>
            <Input
              id={`${uid}-tnote`}
              value={form.treatmentNote}
              maxLength={NOTE_MAX}
              onChange={(e) => set({ treatmentNote: e.target.value })}
              placeholder="z. B. Fotos vorher für die Kinder sichern"
              aria-describedby={describedBy("treatmentNote")}
              aria-invalid={Boolean(findings.treatmentNote)}
              data-testid="digital-treatment-note"
            />
            {fieldError("treatmentNote")}
          </div>
          <div>
            <Label htmlFor={`${uid}-person`}>Wer soll sich darum kümmern?</Label>
            {familyMembers.length ? (
              <Select id={`${uid}-person`} value={form.trustedPersonId} onChange={(e) => set({ trustedPersonId: e.target.value })} data-testid="digital-person">
                <option value="">Noch nicht festgelegt</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.relation ? ` (${m.relation})` : ""}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-sm text-muted">
                Noch keine Personen in{" "}
                <Link href="/dashboard/personen" className="underline text-primary">
                  Familie &amp; Kontakte
                </Link>
                .
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${uid}-access`}>Wie kommt deine Familie sicher heran? (ohne Passwort)</Label>
              <Select id={`${uid}-access`} value={form.secureAccess} onChange={(e) => set({ secureAccess: e.target.value as DigitalSecureAccess | "" })} data-testid="digital-secure-access">
                <option value="">Bitte wählen</option>
                {Object.entries(DIGITAL_SECURE_ACCESS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`${uid}-anote`}>Hinweis zum Zugang (optional)</Label>
              <Input
                id={`${uid}-anote`}
                value={form.secureAccessNote}
                maxLength={NOTE_MAX}
                onChange={(e) => set({ secureAccessNote: e.target.value })}
                placeholder="z. B. Notfallzugang bei meiner Schwester"
                aria-describedby={describedBy("secureAccessNote")}
                aria-invalid={Boolean(findings.secureAccessNote)}
                data-testid="digital-access-note"
              />
              {fieldError("secureAccessNote")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={!canSave} data-testid="digital-save">
              <Plus size={16} className="mr-2" aria-hidden /> {editingId ? "Änderungen speichern" : "Hinzufügen"}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
                Abbrechen
              </Button>
            )}
          </div>
          {blocked && <p className="text-sm text-danger">Bitte zuerst die markierten Angaben ändern. Zugangsdaten, PINs und Nummern werden nicht gespeichert.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Deine Konten ({digitalLegacy.length})</CardTitle>
        {digitalLegacy.length === 0 ? (
          <p className="text-sm text-muted mt-4">Noch keine Einträge. Füge wichtige digitale Konten hinzu.</p>
        ) : (
          <ul className="space-y-3 mt-4">
            {digitalLegacy.map((item) => {
              const person = trustedPersonName({ familyMembers }, item);
              const secret = digitalEntryHasSecrets(item);
              return (
                <li key={item.id} className="rounded-xl border border-primary/10 bg-sand/50 p-4" data-testid="digital-entry">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{digitalKindLabel(item)}</span>
                      <p className="font-medium mt-2">{digitalTitle(item)}</p>
                      {item.reference && <p className="text-muted mt-1">Bezeichnung: {item.reference}</p>}
                      {item.treatments?.length ? <p className="mt-1">Wunsch: {item.treatments.map((t) => DIGITAL_TREATMENT_LABELS[t]).join(", ")}</p> : null}
                      {item.treatmentNote && <p className="text-muted mt-1">{item.treatmentNote}</p>}
                      {person && <p className="mt-1">Zuständig: {person}</p>}
                      {(item.secureAccess || item.secureAccessNote) && (
                        <p className="mt-1">
                          Zugang: {[item.secureAccess && DIGITAL_SECURE_ACCESS_LABELS[item.secureAccess], item.secureAccessNote].filter(Boolean).join(": ")}
                        </p>
                      )}
                      {isLegacyDigitalEntry(item) && (item.description || item.locationHint) && (
                        <div className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted" data-testid="digital-legacy-note">
                          <p className="font-medium text-foreground">Früher eingetragen{item.type ? ` (${LEGACY_TYPE_LABELS[item.type]})` : ""}</p>
                          {item.description && <p>Beschreibung: {item.description}</p>}
                          {item.locationHint && <p>Hinweis: {item.locationHint}</p>}
                        </div>
                      )}
                      {secret && (
                        <p className="mt-2 flex items-start gap-2 text-danger" role="alert" data-testid="digital-secret-warning">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                          Dieser Eintrag enthält möglicherweise Zugangsdaten oder eine Nummer. Bitte bearbeite oder lösche ihn. Er wird nicht gedruckt.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingId(item.id); setForm(formFrom(item)); }}
                        aria-label={`Eintrag bearbeiten: ${digitalTitle(item)}`}
                      >
                        <Pencil size={16} aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(item.id)}
                        aria-label={`Eintrag löschen: ${digitalTitle(item)}`}
                        className="text-danger hover:bg-danger/10"
                      >
                        <Trash2 size={16} aria-hidden />
                      </Button>
                    </div>
                  </div>
                  {confirmDelete === item.id && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" role="alertdialog" aria-label="Eintrag löschen?">
                      <span>Eintrag wirklich löschen?</span>
                      <Button size="sm" variant="danger" onClick={() => remove(item.id)} data-testid="digital-delete-confirm">Löschen</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
