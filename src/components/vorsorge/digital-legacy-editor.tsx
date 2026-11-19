"use client";

import { useId, useState } from "react";
import { digitalTypeLabels } from "@/lib/vorsorge/labels";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import type { DigitalLegacyItem } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";


export function DigitalLegacyEditor() {
  const uid = useId();
  const { digitalLegacy, addDigitalLegacy, removeDigitalLegacy } = useAmanahStore();
  const [type, setType] = useState<DigitalLegacyItem["type"]>("email");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");

  const handleAdd = () => {
    if (!description.trim()) return;
    addDigitalLegacy({
      id: crypto.randomUUID(),
      type,
      description: description.trim(),
      locationHint: locationHint.trim(),
    });
    setDescription("");
    setLocationHint("");
  };

  return (
    <div>
      <Card className="mb-6">
        <CardTitle>Neuen Hinweis hinzufügen</CardTitle>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor={`${uid}-type`}>Art</Label>
            <Select id={`${uid}-type`} value={type} onChange={(e) => setType(e.target.value as DigitalLegacyItem["type"])}>
              {Object.entries(digitalTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`${uid}-desc`}>Beschreibung</Label>
            <Input id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z. B. Gmail-Hauptkonto, Dropbox-Familienordner"
            />
          </div>
          <div>
            <Label htmlFor={`${uid}-loc`}>Wo liegen die Zugangsdaten?</Label>
            <Textarea id={`${uid}-loc`}
              value={locationHint}
              onChange={(e) => setLocationHint(e.target.value)}
              placeholder="z. B. 1Password — Notfall-Kit im Schrank, Brief beim Notar"
            />
          </div>
          <Button onClick={handleAdd} disabled={!description.trim()}>
            <Plus size={16} className="mr-2" /> Hinzufügen
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Deine Hinweise ({digitalLegacy.length})</CardTitle>
        {digitalLegacy.length === 0 ? (
          <p className="text-sm text-muted mt-4">Noch keine Einträge. Füge wichtige digitale Konten und Dateien hinzu.</p>
        ) : (
          <ul className="space-y-3 mt-4">
            {digitalLegacy.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-primary/10 bg-sand/50 p-4"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {digitalTypeLabels[item.type]}
                  </span>
                  <p className="text-sm font-medium mt-2">{item.description}</p>
                  {item.locationHint && (
                    <p className="text-sm text-muted mt-1">
                      <span className="font-medium">Hinweis:</span> {item.locationHint}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDigitalLegacy(item.id)}
                  aria-label="Eintrag löschen"
                  className="text-danger hover:bg-danger/10 shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
