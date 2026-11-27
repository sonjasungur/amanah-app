"use client";

import { useId, useState } from "react";
import { debtTypeLabels } from "@/lib/vorsorge/labels";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import type { DebtAmanahItem } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";


const priorityLabels = {
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

export function DebtsEditor() {
  const uid = useId();
  const { debtsAmanah, addDebtAmanah, removeDebtAmanah } = useAmanahStore();
  const [type, setType] = useState<DebtAmanahItem["type"]>("debt_owed");
  const [description, setDescription] = useState("");
  const [person, setPerson] = useState("");
  const [priority, setPriority] = useState<DebtAmanahItem["priority"]>("medium");

  const handleAdd = () => {
    if (!description.trim()) return;
    addDebtAmanah({
      id: crypto.randomUUID(),
      type,
      description: description.trim(),
      person: person.trim(),
      priority,
    });
    setDescription("");
    setPerson("");
    setPriority("medium");
  };

  return (
    <div>
      <Card className="mb-6">
        <CardTitle>Neuen Eintrag hinzufügen</CardTitle>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor={`${uid}-type`}>Art</Label>
            <Select id={`${uid}-type`} value={type} onChange={(e) => setType(e.target.value as DebtAmanahItem["type"])}>
              {Object.entries(debtTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`${uid}-desc`}>Beschreibung</Label>
            <Textarea id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was genau? Betrag, Datum, Kontext..."
            />
          </div>
          <div>
            <Label htmlFor={`${uid}-person`}>Person / Stelle</Label>
            <Input id={`${uid}-person`}
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Name, Organisation oder Hinweis"
            />
          </div>
          <div>
            <Label htmlFor={`${uid}-prio`}>Priorität</Label>
            <Select id={`${uid}-prio`} value={priority} onChange={(e) => setPriority(e.target.value as DebtAmanahItem["priority"])}>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!description.trim()}>
            <Plus size={16} className="mr-2" /> Hinzufügen
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Deine Einträge ({debtsAmanah.length})</CardTitle>
        {debtsAmanah.length === 0 ? (
          <p className="text-sm text-muted mt-4">Noch keine Einträge. Füge Schulden, Amanah und offene Pflichten hinzu.</p>
        ) : (
          <ul className="space-y-3 mt-4">
            {debtsAmanah.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-primary/10 bg-sand/50 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {debtTypeLabels[item.type]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.priority === "high" ? "bg-danger/10 text-danger" :
                      item.priority === "medium" ? "bg-warning/10 text-warning" :
                      "bg-muted/10 text-muted"
                    }`}>
                      {priorityLabels[item.priority]}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{item.description}</p>
                  {item.person && <p className="text-sm text-muted mt-1">{item.person}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDebtAmanah(item.id)}
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
