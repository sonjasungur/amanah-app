"use client";

import { useState } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import type { DigitalLegacyItem } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Disclaimer } from "@/components/ui/disclaimer";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

const digitalTypeLabels: Record<DigitalLegacyItem["type"], string> = {
  email: "E-Mail-Konto",
  password_manager: "Passwort-Manager",
  emergency_access: "Notfallzugang",
  banking: "Online-Banking",
  paypal: "PayPal / Zahlungsdienst",
  subscription: "Abonnement",
  social: "Social Media",
  cloud: "Cloud-Speicher",
  domain: "Domain / Website",
  file: "Wichtige Datei",
};

export default function DigitalerNachlassPage() {
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
      <h1 className="text-2xl font-bold text-primary mb-2">Digitaler Nachlass</h1>
      <p className="text-muted mb-6">
        Dokumentiere Hinweise zu digitalen Konten und Dateien — ohne Passwörter zu speichern.
      </p>
      <Disclaimer className="mb-4" />

      <div className="rounded-xl bg-danger/5 border border-danger/20 px-4 py-3 text-sm mb-6 flex items-start gap-3">
        <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-danger">Keine Passwörter speichern!</p>
          <p className="text-muted mt-1">
            Trage nur Hinweise ein, wo Zugangsdaten sicher aufbewahrt werden (z. B. Passwort-Manager, versiegelter Brief).
            Speichere niemals echte Passwörter in diesem Tool.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardTitle>Neuen Hinweis hinzufügen</CardTitle>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Art</Label>
            <Select value={type} onChange={(e) => setType(e.target.value as DigitalLegacyItem["type"])}>
              {Object.entries(digitalTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z. B. Gmail-Hauptkonto, Dropbox-Familienordner"
            />
          </div>
          <div>
            <Label>Wo liegen die Zugangsdaten?</Label>
            <Textarea
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
