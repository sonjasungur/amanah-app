"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Printer, Trash2 } from "lucide-react";
import type { AssetEntry } from "@/lib/domain/types";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { ASSET_TYPES, MORTGAGE, OWNERSHIP } from "@/lib/testament/asset-labels";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";

/** Where things are, so the family can find them. No amounts required, no legal assessment. */
export function AssetOverview() {
  const assets = useAmanahStore((s) => s.assets);
  const updateField = useAmanahStore((s) => s.updateField);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<AssetEntry["type"]>("bank");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [mortgage, setMortgage] = useState<AssetEntry["mortgage"] | "">("");
  const [ownership, setOwnership] = useState<AssetEntry["ownership"] | "">("");

  const reset = () => {
    setEditingId(null);
    setDescription("");
    setLocationHint("");
    setMortgage("");
    setOwnership("");
  };

  const submit = () => {
    const previous = assets.find((a) => a.id === editingId);
    const entry: AssetEntry = { id: previous?.id ?? crypto.randomUUID(), type, description: description.trim(), locationHint: locationHint.trim() || undefined };
    // Older entries may hold these; the form does not show them, so they must not get lost.
    if (previous?.approximateValue) entry.approximateValue = previous.approximateValue;
    if (previous?.notes) entry.notes = previous.notes;
    if (type === "real_estate") {
      if (mortgage) entry.mortgage = mortgage;
      if (ownership) entry.ownership = ownership;
    }
    updateField("assets", previous ? assets.map((a) => (a.id === previous.id ? entry : a)) : [...assets, entry]);
    reset();
  };

  const edit = (entry: AssetEntry) => {
    setEditingId(entry.id);
    setType(entry.type);
    setDescription(entry.description);
    setLocationHint(entry.locationHint ?? "");
    setMortgage(entry.mortgage ?? "");
    setOwnership(entry.ownership ?? "");
  };

  const remove = (id: string) => {
    updateField("assets", assets.filter((a) => a.id !== id));
    if (editingId === id) reset();
  };

  return (
    <Card className="mt-6" data-testid="asset-overview">
      <CardTitle>Vermögensübersicht</CardTitle>
      <p className="mt-1 text-sm text-muted">Damit deine Familie weiß, was es gibt und wo die Unterlagen liegen. Beträge sind nicht nötig. Das ist keine Bewertung und ersetzt kein Testament.</p>
      <p className="mt-1 text-sm text-muted">Trage keine Kontonummern, PINs oder Passwörter ein.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="asset-type">Art</Label>
          <Select id="asset-type" value={type} onChange={(e) => setType(e.target.value as AssetEntry["type"])}>
            {Object.entries(ASSET_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="asset-description">{type === "real_estate" ? "Adresse oder Bezeichnung" : "Bezeichnung"}</Label>
          <Input id="asset-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="z. B. Girokonto bei …" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="asset-location">Wo liegen die Unterlagen?</Label>
          <Input id="asset-location" value={locationHint} onChange={(e) => setLocationHint(e.target.value)} placeholder="z. B. Ordner im Arbeitszimmer" />
        </div>
        {type === "real_estate" && (
          <>
            <div>
              <Label htmlFor="asset-mortgage">Hypothek oder Kredit?</Label>
              <Select id="asset-mortgage" value={mortgage} onChange={(e) => setMortgage(e.target.value as AssetEntry["mortgage"] | "")}>
                {Object.entries({ "": "Keine Angabe", ...MORTGAGE }).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="asset-ownership">Eigentum</Label>
              <Select id="asset-ownership" value={ownership} onChange={(e) => setOwnership(e.target.value as AssetEntry["ownership"] | "")}>
                {Object.entries({ "": "Keine Angabe", ...OWNERSHIP }).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={submit} disabled={!description.trim()} data-testid="asset-add">
          {editingId ? "Änderung speichern" : <><Plus size={16} className="mr-2" aria-hidden /> Hinzufügen</>}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={reset} data-testid="asset-edit-cancel">Abbrechen</Button>
        )}
      </div>
      {assets.length > 0 && (
        <ul className="mt-4 divide-y divide-border" data-testid="asset-list">
          {assets.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0 text-sm">
                <p className="font-medium break-words">{ASSET_TYPES[a.type]}: {a.description}</p>
                {a.locationHint && <p className="text-muted break-words">Unterlagen: {a.locationHint}</p>}
                {a.mortgage && <p className="text-muted">Hypothek oder Kredit: {MORTGAGE[a.mortgage]}</p>}
                {a.ownership && <p className="text-muted">Eigentum: {OWNERSHIP[a.ownership]}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" aria-label={`${a.description} bearbeiten`} onClick={() => edit(a)}>
                  <Pencil size={14} aria-hidden />
                </Button>
                <Button type="button" variant="outline" size="sm" aria-label={`${a.description} entfernen`} onClick={() => remove(a.id)}>
                  <Trash2 size={14} aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {assets.length > 0 && (
        <Link href="/dashboard/pdf#export-vermoegen" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline min-h-[44px]" data-testid="asset-print-link">
          <Printer size={16} aria-hidden /> Übersicht als PDF speichern oder drucken
        </Link>
      )}
    </Card>
  );
}
