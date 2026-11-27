"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import type { PoaAreaChoice, PoaAreaId, PoaHolder, PowerOfAttorney, PowerOfAttorneyWishes } from "@/lib/domain/types";
import { activeLinks, linkPerson, peopleForField } from "@/lib/vorsorge/people";
import {
  POA_AREAS,
  POA_CHOICE_LABELS,
  POA_HOLDER_LABELS,
  hasSavedPoaWishes,
  legacyPoaEntries,
  powerOfAttorneyWishes,
} from "@/lib/vorsorge/power-of-attorney";
import { isSecretLike } from "@/lib/validation/secret-like";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const OTHER = "__other";

/** Preferred or substitute person: a contact, a typed name, or "noch nicht festgelegt". */
function PersonChoice({ field, label }: { field: "authorizedPerson" | "substitutePerson"; label: string }) {
  const id = useId();
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const people = peopleForField(data, field);
  const linked = activeLinks(data)[field];
  const name = data.powerOfAttorney[field] ?? "";
  const [typing, setTyping] = useState(false);
  const value = linked ? linked.id : name.trim() || typing ? OTHER : "";

  const writeName = (next: string, keepLink = false) => {
    const state = useAmanahStore.getState();
    const personLinks = { ...state.vorsorgeMeta.personLinks };
    if (!keepLink) delete personLinks[field];
    store.updateSections({
      powerOfAttorney: { ...state.powerOfAttorney, [field]: next },
      vorsorgeMeta: { ...state.vorsorgeMeta, personLinks },
    });
  };

  return (
    <div data-testid={`poa-person-${field}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            setTyping(false);
            writeName("");
          } else if (v === OTHER) {
            setTyping(true);
            writeName(name);
          } else {
            setTyping(false);
            store.updateSections(linkPerson(pickDataFields(useAmanahStore.getState()), field, v));
          }
        }}
      >
        <option value="">Noch nicht festgelegt</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.relation ? ` (${p.relation})` : ""}
          </option>
        ))}
        <option value={OTHER}>Andere Person (Name eintragen)</option>
      </Select>
      {value === OTHER && (
        <div className="mt-2">
          <Label htmlFor={`${id}-name`}>Name</Label>
          <Input id={`${id}-name`} value={name} onChange={(e) => writeName(e.target.value)} data-testid={`poa-name-${field}`} />
        </div>
      )}
      {people.length === 0 && (
        <p className="text-xs text-muted mt-1">
          Personen kannst du in{" "}
          <Link href="/dashboard/personen" className="underline text-primary">
            Familie &amp; Kontakte
          </Link>{" "}
          anlegen und dann hier wählen.
        </p>
      )}
    </div>
  );
}

function AreaChoice({ area, label, choice, onChange }: { area: PoaAreaId; label: string; choice: PoaAreaChoice; onChange: (c: PoaAreaChoice) => void }) {
  const id = useId();
  const { familyMembers } = useAmanahStore();
  return (
    <div className="rounded-xl border border-border p-3" data-testid={`poa-area-${area}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={choice.holder} onChange={(e) => onChange({ holder: e.target.value as PoaHolder })}>
        {(Object.entries(POA_HOLDER_LABELS) as [PoaHolder, string][]).map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </Select>
      {choice.holder === "other" && (
        <div className="mt-2">
          <Label htmlFor={`${id}-person`}>Person</Label>
          <Select
            id={`${id}-person`}
            value={choice.personId ?? ""}
            onChange={(e) => {
              const person = familyMembers.find((m) => m.id === e.target.value);
              onChange(person ? { holder: "other", personId: person.id, personName: person.name } : { holder: "other" });
            }}
          >
            <option value="">Noch nicht gewählt</option>
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          {!choice.personId && choice.personName && <p className="text-xs text-muted mt-1">Früher gewählt: {choice.personName}</p>}
        </div>
      )}
    </div>
  );
}

/** Old free texts: read only, each can be deleted on purpose. Nothing is removed automatically. */
function LegacyTexts({ poa }: { poa: PowerOfAttorney }) {
  const store = useAmanahStore();
  const [confirm, setConfirm] = useState<keyof PowerOfAttorney | null>(null);
  const entries = legacyPoaEntries(poa);
  if (!entries.length) return null;
  return (
    <Card className="mt-6" data-testid="poa-legacy">
      <CardTitle className="text-base">Früher eingetragen</CardTitle>
      <p className="text-sm text-muted mb-3">
        Diese Texte stammen aus der ersten Fassung. Sie bleiben erhalten und erscheinen weiter im Ausdruck, bis du sie löschst. Übertrage, was noch gilt, in
        die Auswahl oben oder in „Zusätzliche Hinweise“.
      </p>
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.key} className="rounded-xl border border-border bg-sand/40 p-3 text-sm" data-testid={`poa-legacy-${e.key}`}>
            <p className="font-medium">{e.label}</p>
            <p className="whitespace-pre-line mt-1">{e.value}</p>
            {e.movedTo && (
              <p className="text-xs text-muted mt-1">
                Gehört jetzt zu:{" "}
                <Link href={e.movedTo.href} className="underline text-primary">
                  {e.movedTo.label}
                </Link>
              </p>
            )}
            {isSecretLike(e.value) && (
              <p className="mt-1 flex items-start gap-2 text-danger" role="alert">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> Sieht nach Zugangsdaten oder einer Nummer aus. Bitte löschen; es wird nicht
                gedruckt.
              </p>
            )}
            {confirm === e.key ? (
              <div className="mt-2 flex flex-wrap items-center gap-2" role="alertdialog" aria-label="Alten Text löschen?">
                <span>Diesen alten Text löschen?</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    store.updateField("powerOfAttorney", { ...useAmanahStore.getState().powerOfAttorney, [e.key]: "" });
                    setConfirm(null);
                  }}
                >
                  Löschen
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                  Behalten
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="mt-1" onClick={() => setConfirm(e.key)}>
                Alten Text löschen
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * AP22 EA-07: wishes for a power of attorney. A preferred person and optionally a substitute, for
 * all matters (default) or split by area. Free text only for additional notes. Burial is handled
 * in the Janazah area.
 */
export function PoaWishesEditor() {
  const uid = useId();
  const store = useAmanahStore();
  const poa = store.powerOfAttorney;
  const wishes = powerOfAttorneyWishes(poa);
  const notesSecret = isSecretLike(wishes.additionalNotes);

  const save = (patch: Partial<PowerOfAttorneyWishes>) => {
    const current = useAmanahStore.getState().powerOfAttorney;
    store.updateField("powerOfAttorney", { ...current, wishes: { ...powerOfAttorneyWishes(current), ...patch } });
  };
  const setArea = (area: PoaAreaId, choice: PoaAreaChoice) => save({ areas: { ...wishes.areas, [area]: choice } });

  return (
    <div data-testid="poa-wishes">
      <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-sm mb-6" data-testid="poa-not-effective" role="note">
        <p className="font-semibold">Deine Wünsche – keine wirksame Vollmacht</p>
        <p className="mt-1 text-muted">
          Hier hältst du fest, wen du dir wünschst und wofür. Eine wirksame Vorsorgevollmacht ist ein eigenes Dokument. Form und Inhalt klärst du mit einem
          Notar oder Anwalt.
        </p>
      </div>

      <Card className="mb-6">
        <CardTitle className="text-base">Wer soll für dich handeln?</CardTitle>
        <p className="text-sm text-muted mb-3">Gewählte Personen bleiben mit „Familie &amp; Kontakte“ verbunden.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <PersonChoice field="authorizedPerson" label="Bevorzugte Vertrauensperson" />
          <PersonChoice field="substitutePerson" label="Ersatzperson (optional)" />
        </div>
      </Card>

      <Card className="mb-6">
        <fieldset>
          <legend className="font-semibold text-base mb-2">Wofür?</legend>
          <div className="space-y-2" data-testid="poa-scope">
            <label className="flex items-start gap-3 min-h-[44px] text-sm">
              <input type="radio" name={`${uid}-scope`} className="mt-1 h-5 w-5" checked={wishes.scope === "all"} onChange={() => save({ scope: "all" })} data-testid="poa-scope-all" />
              <span>
                <b>Alle Angelegenheiten durch diese Person</b> (Standard)
              </span>
            </label>
            <label className="flex items-start gap-3 min-h-[44px] text-sm">
              <input type="radio" name={`${uid}-scope`} className="mt-1 h-5 w-5" checked={wishes.scope === "split"} onChange={() => save({ scope: "split" })} data-testid="poa-scope-split" />
              <span>Nach Bereichen aufteilen</span>
            </label>
          </div>
        </fieldset>
        {wishes.scope === "split" && (
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            {POA_AREAS.map((a) => (
              <AreaChoice key={a.id} area={a.id} label={a.label} choice={wishes.areas[a.id]} onChange={(c) => setArea(a.id, c)} />
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-6 space-y-4">
        <div>
          <Label htmlFor={`${uid}-online`}>Auch für Online-Konten und digitale Daten?</Label>
          <Select id={`${uid}-online`} value={wishes.onlineAccounts} onChange={(e) => save({ onlineAccounts: e.target.value as PowerOfAttorneyWishes["onlineAccounts"] })} data-testid="poa-online">
            <option value="">Noch nicht festgelegt</option>
            {Object.entries(POA_CHOICE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <p className="text-xs text-muted mt-1">
            Welche Konten es gibt und was damit geschehen soll, hältst du im{" "}
            <Link href="/dashboard/digitaler-nachlass" className="underline text-primary">
              Digitalen Nachlass
            </Link>{" "}
            fest.
          </p>
        </div>
        <div>
          <Label htmlFor={`${uid}-beyond`}>Soll die Vollmacht auch über den Tod hinaus gelten?</Label>
          <Select id={`${uid}-beyond`} value={wishes.beyondDeath} onChange={(e) => save({ beyondDeath: e.target.value as PowerOfAttorneyWishes["beyondDeath"] })} data-testid="poa-beyond-death">
            <option value="">Noch nicht festgelegt</option>
            {Object.entries(POA_CHOICE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <p className="text-xs text-muted mt-1">Nur dein Wunsch. Ob und wie das wirkt, klärst du mit einem Notar oder Anwalt.</p>
        </div>
        <div>
          <Label htmlFor={`${uid}-notes`}>Zusätzliche Hinweise</Label>
          <Textarea
            id={`${uid}-notes`}
            value={wishes.additionalNotes}
            onChange={(e) => save({ additionalNotes: e.target.value })}
            aria-describedby={notesSecret ? `${uid}-notes-error` : undefined}
            data-testid="poa-notes"
          />
          {notesSecret && (
            <p id={`${uid}-notes-error`} role="alert" className="text-sm text-danger mt-1">
              Das sieht nach Zugangsdaten oder einer Nummer aus. Bitte entfernen; es wird nicht gedruckt.
            </p>
          )}
        </div>
      </Card>

      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm" data-testid="poa-burial-note">
        <p className="font-medium">Bestattung und Totenfürsorge</p>
        <p className="text-muted mt-1">
          Wer sich um deine Bestattung kümmern soll, legst du in den{" "}
          <Link href="/dashboard/janazah" className="underline text-primary">
            Janazah-Wünschen
          </Link>{" "}
          fest, nicht hier.
        </p>
      </div>

      {!hasSavedPoaWishes(poa) && legacyPoaEntries(poa).some((e) => ["medical", "authorities", "bank", "housing", "care"].includes(e.key)) && (
        <p className="text-xs text-muted mt-4" data-testid="poa-derived-note">
          Die Auswahl oben wurde aus deinen früheren Einträgen abgeleitet („ja“ = vorgesehene Person). Bitte prüfe sie.
        </p>
      )}

      <LegacyTexts poa={poa} />
    </div>
  );
}
