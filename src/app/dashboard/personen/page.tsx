"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import type { FamilyMember, FamilyRelationType, FamilyRole } from "@/lib/domain/types";

const RELATIONS: Record<FamilyRelationType, string> = {
  ehepartner: "Ehepartner/in",
  kind: "Kind",
  elternteil: "Mutter / Vater",
  geschwister: "Bruder / Schwester",
  sonstige: "Andere Person",
};

const ROLES: Record<FamilyRole, string> = {
  notfallkontakt: "Notfallkontakt",
  vertrauensperson: "Vertrauensperson",
  vormund_wunsch: "Gewünschter Vormund für Kinder",
};

/** One list of people, reused by emergency card, powers of attorney and the testament preparation. */
export default function PersonenPage() {
  const members = useAmanahStore((s) => s.familyMembers);
  const updateField = useAmanahStore((s) => s.updateField);
  const [name, setName] = useState("");
  const [relationType, setRelationType] = useState<FamilyRelationType>("kind");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<FamilyRole[]>([]);

  const add = () => {
    if (!name.trim()) return;
    const member: FamilyMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      relation: RELATIONS[relationType],
      relationType,
      phone: phone.trim() || undefined,
      roles,
    };
    updateField("familyMembers", [...members, member]);
    setName("");
    setPhone("");
    setRoles([]);
  };

  const toggleRole = (role: FamilyRole) => setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">Familie & Vertrauenspersonen</h1>
          <p className="text-muted max-w-2xl">Wer gehört zu deiner Familie, und wer soll im Ernstfall angerufen werden?</p>
        </div>
        <SaveStatusIndicator />
      </header>

      <Card>
        <CardTitle>Person hinzufügen</CardTitle>
        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="person-name">Name</Label>
            <Input id="person-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="person-relation">Beziehung</Label>
            <Select id="person-relation" value={relationType} onChange={(e) => setRelationType(e.target.value as FamilyRelationType)}>
              {Object.entries(RELATIONS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="person-phone">Telefon (optional)</Label>
            <Input id="person-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <fieldset className="text-sm">
            <legend className="font-medium mb-1">Rolle (optional)</legend>
            {Object.entries(ROLES).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 min-h-[36px]">
                <input type="checkbox" checked={roles.includes(value as FamilyRole)} onChange={() => toggleRole(value as FamilyRole)} />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
        <Button type="button" className="mt-4" onClick={add} disabled={!name.trim()} data-testid="person-add">
          <UserPlus size={16} className="mr-2" aria-hidden /> Hinzufügen
        </Button>
      </Card>

      <ul className="space-y-2" data-testid="person-list">
        {members.map((m) => (
          <li key={m.id}>
            <Card className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-muted">
                  {m.relation}
                  {m.phone ? ` · ${m.phone}` : ""}
                  {m.roles?.length ? ` · ${m.roles.map((r) => ROLES[r]).join(", ")}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`${m.name} entfernen`}
                onClick={() => updateField("familyMembers", members.filter((x) => x.id !== m.id))}
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            </Card>
          </li>
        ))}
        {members.length === 0 && <p className="text-sm text-muted">Noch keine Personen eingetragen.</p>}
      </ul>
    </div>
  );
}
