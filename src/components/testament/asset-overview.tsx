"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AssetEntry } from "@/lib/domain/types";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";

const ASSET_TYPES: Record<AssetEntry["type"], string> = {
  bank: "Bankkonto",
  real_estate: "Immobilie",
  investment: "Aktien oder Wertpapiere",
  pension: "Rente oder Pension",
  life_insurance: "Lebensversicherung",
  gold_silver: "Gold und Silber",
  business: "Unternehmen",
  vehicle: "Fahrzeug",
  other: "Sonstiges",
};

const MORTGAGE = { "": "Keine Angabe", ja: "Ja", nein: "Nein", unsicher: "Weiß ich nicht" };
const OWNERSHIP = { "": "Keine Angabe", allein: "Allein", gemeinsam: "Gemeinsam", unsicher: "Weiß ich nicht" };

/** Where things are, so the family can find them. No amounts required, no legal assessment. */
export function AssetOverview() {
  const assets = useAmanahStore((s) => s.assets);
  const updateField = useAmanahStore((s) => s.updateField);
  const [type, setType] = useState<AssetEntry["type"]>("bank");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [mortgage, setMortgage] = useState<keyof typeof MORTGAGE>("");
  const [ownership, setOwnership] = useState<keyof typeof OWNERSHIP>("");

  const add = () => {
    const entry: AssetEntry = { id: crypto.randomUUID(), type, description: description.trim(), locationHint: locationHint.trim() || undefined };
    if (type === "real_estate") {
      if (mortgage) entry.mortgage = mortgage;
      if (ownership) entry.ownership = ownership;
    }
    updateField("assets", [...assets, entry]);
    setDescription("");
    setLocationHint("");
    setMortgage("");
    setOwnership("");
  };

  return (
    <Card className="mt-6" data-testid="asset-overview">
      <CardTitle>Vermögensübersicht</CardTitle>
      <p className="mt-1 text-sm text-muted">Damit deine Familie weiß, was es gibt und wo die Unterlagen liegen. Beträge sind nicht nötig. Das ist keine Bewertung und ersetzt kein Testament.</p>
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
              <Select id="asset-mortgage" value={mortgage} onChange={(e) => setMortgage(e.target.value as keyof typeof MORTGAGE)}>
                {Object.entries(MORTGAGE).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="asset-ownership">Eigentum</Label>
              <Select id="asset-ownership" value={ownership} onChange={(e) => setOwnership(e.target.value as keyof typeof OWNERSHIP)}>
                {Object.entries(OWNERSHIP).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </>
        )}
      </div>
      <Button type="button" className="mt-4" onClick={add} disabled={!description.trim()} data-testid="asset-add">
        <Plus size={16} className="mr-2" aria-hidden /> Hinzufügen
      </Button>
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
              <Button type="button" variant="outline" size="sm" aria-label={`${a.description} entfernen`} onClick={() => updateField("assets", assets.filter((x) => x.id !== a.id))}>
                <Trash2 size={14} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
