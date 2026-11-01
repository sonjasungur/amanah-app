"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BequestWish, YesNoUnsure } from "@/lib/domain/types";
import { isRuleSetDisplayable, type RuleSet } from "@/lib/inheritance";
import { BEQUEST_KINDS, bequestFromDraft, describeBequestSubject, percentTotal, validateBequestDraft, type BequestDraft } from "@/lib/testament/bequests";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const EMPTY_DRAFT: BequestDraft = { kind: "amount", value: "", item: "", beneficiary: "", beneficiaryKind: "person", alsoHeir: "", note: "" };

const ALSO_HEIR: Record<Exclude<YesNoUnsure, "">, string> = { ja: "Ja", nein: "Nein", unsicher: "Weiß ich nicht" };

function PercentTotal({ bequests }: { bequests: BequestWish[] }) {
  if (!bequests.some((b) => b.kind === "percent")) return null;
  const total = percentTotal(bequests);
  return (
    <p className="text-sm text-muted mt-2" data-testid="bequest-percent-total">
      Prozentangaben zusammen: {total.toLocaleString("de-DE")} %
      {total > 100 && " – das ist mehr als 100 %. Bitte prüfe deine Eingaben."}
    </p>
  );
}

function BequestLine({ bequest }: { bequest: BequestWish }) {
  return (
    <>
      <span className="font-medium break-words">{describeBequestSubject(bequest)}</span> für <span className="break-words">{bequest.beneficiary}</span>
      {bequest.beneficiaryKind === "organisation" && " (Einrichtung)"}
      {bequest.alsoHeir && <span className="block text-muted">Auch Erbe: {ALSO_HEIR[bequest.alsoHeir]}</span>}
      {bequest.note && <span className="block text-muted break-words">{bequest.note}</span>}
    </>
  );
}

/** Structured wishes for the conversation. It validates the input and never assesses a wish legally. */
export function BequestEditor({ bequests, onChange }: { bequests: BequestWish[]; onChange: (next: BequestWish[]) => void }) {
  const [draft, setDraft] = useState<BequestDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<BequestDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const add = () => {
    const found = validateBequestDraft(draft);
    setErrors(found);
    if (found.length) return;
    onChange([...bequests, bequestFromDraft(draft, crypto.randomUUID())]);
    setDraft(EMPTY_DRAFT);
  };

  return (
    <div data-testid="bequest-editor">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="bequest-kind">Was?</Label>
          <Select id="bequest-kind" value={draft.kind} onChange={(e) => set({ kind: e.target.value as BequestWish["kind"] })}>
            {Object.entries(BEQUEST_KINDS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        {draft.kind === "item" ? (
          <div>
            <Label htmlFor="bequest-item">Gegenstand</Label>
            <Input id="bequest-item" value={draft.item} onChange={(e) => set({ item: e.target.value })} placeholder="z. B. Goldkette" />
          </div>
        ) : (
          <div>
            <Label htmlFor="bequest-value">{draft.kind === "amount" ? "Betrag in Euro" : "Anteil in Prozent"}</Label>
            <Input id="bequest-value" inputMode="decimal" value={draft.value} onChange={(e) => set({ value: e.target.value })} />
          </div>
        )}
        <div>
          <Label htmlFor="bequest-beneficiary">Für wen?</Label>
          <Input id="bequest-beneficiary" value={draft.beneficiary} onChange={(e) => set({ beneficiary: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="bequest-beneficiary-kind">Person oder Einrichtung?</Label>
          <Select id="bequest-beneficiary-kind" value={draft.beneficiaryKind} onChange={(e) => set({ beneficiaryKind: e.target.value as BequestWish["beneficiaryKind"] })}>
            <option value="person">Person</option>
            <option value="organisation">Einrichtung</option>
          </Select>
        </div>
        {draft.beneficiaryKind === "person" && (
          <div>
            <Label htmlFor="bequest-also-heir">Würde die Person auch erben?</Label>
            <Select id="bequest-also-heir" value={draft.alsoHeir} onChange={(e) => set({ alsoHeir: e.target.value as YesNoUnsure })}>
              <option value="">Keine Angabe</option>
              {Object.entries(ALSO_HEIR).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="sm:col-span-2">
          <Label htmlFor="bequest-note">Anmerkung (freiwillig)</Label>
          <Input id="bequest-note" value={draft.note} onChange={(e) => set({ note: e.target.value })} />
        </div>
      </div>
      {errors.length > 0 && (
        <ul className="mt-3 text-sm text-danger" role="alert" data-testid="bequest-errors">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <Button type="button" variant="outline" className="mt-3" onClick={add} data-testid="bequest-add">
        <Plus size={16} className="mr-2" aria-hidden /> Wunsch hinzufügen
      </Button>
      {bequests.length > 0 && (
        <ul className="mt-4 divide-y divide-border" data-testid="bequest-list">
          {bequests.map((b) => (
            <li key={b.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <p className="min-w-0"><BequestLine bequest={b} /></p>
              <Button type="button" variant="outline" size="sm" aria-label={`Wunsch für ${b.beneficiary} entfernen`} onClick={() => onChange(bequests.filter((x) => x.id !== b.id))}>
                <Trash2 size={14} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <PercentTotal bequests={bequests} />
    </div>
  );
}

/**
 * The wishes in the conversation paper. The questions about the one-third rule and bequests to
 * heirs are religious content: like the shares, they appear only after a recorded scholar review.
 */
export function BequestSummary({ bequests, ruleSet, featureEnabled }: { bequests: BequestWish[]; ruleSet: RuleSet; featureEnabled: boolean }) {
  if (bequests.length === 0) return null;
  const scholarQuestions = isRuleSetDisplayable(ruleSet, featureEnabled);
  return (
    <div className="mt-3" data-testid="bequest-summary">
      <p className="text-sm font-medium">Vermächtniswünsche (nur als Wunsch, nichts davon ist damit geregelt)</p>
      <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
        {bequests.map((b) => (
          <li key={b.id}><BequestLine bequest={b} /></li>
        ))}
      </ul>
      <PercentTotal bequests={bequests} />
      {scholarQuestions && (percentTotal(bequests) > 100 / 3 || bequests.some((b) => b.alsoHeir === "ja")) && (
        <p className="text-sm text-muted mt-2" data-testid="bequest-scholar-questions">
          Für das Gespräch mit einer Gelehrten oder einem Gelehrten: Wie sind Wünsche über einem Drittel oder zugunsten von Erben zu bewerten?
        </p>
      )}
    </div>
  );
}
