"use client";

import { useId, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { FamilyMember, FamilyRelationType, FamilyRole } from "@/lib/domain/types";
import { LINK_FIELD_LABELS, ROLE_HELP, ROLE_LABELS, removePerson, updatePerson, usagesOf } from "@/lib/vorsorge/people";

export const RELATIONS: Record<FamilyRelationType, string> = {
  ehepartner: "Ehepartner/in",
  kind: "Kind",
  elternteil: "Mutter / Vater",
  geschwister: "Bruder / Schwester",
  sonstige: "Andere Person",
};

interface Draft {
  name: string;
  relationType: FamilyRelationType;
  phone: string;
  roles: FamilyRole[];
}

const EMPTY: Draft = { name: "", relationType: "kind", phone: "", roles: [] };

function draftOf(member: FamilyMember): Draft {
  return {
    name: member.name,
    relationType: member.relationType ?? "sonstige",
    phone: member.phone ?? "",
    roles: member.roles ?? [],
  };
}

function PersonFields({ draft, onChange, idPrefix }: { draft: Draft; onChange: (d: Draft) => void; idPrefix: string }) {
  const toggleRole = (role: FamilyRole) =>
    onChange({ ...draft, roles: draft.roles.includes(role) ? draft.roles.filter((r) => r !== role) : [...draft.roles, role] });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input id={`${idPrefix}-name`} value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} autoComplete="off" />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-relation`}>Beziehung zu dir</Label>
        <Select
          id={`${idPrefix}-relation`}
          value={draft.relationType}
          onChange={(e) => onChange({ ...draft, relationType: e.target.value as FamilyRelationType })}
        >
          {Object.entries(RELATIONS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-phone`}>Telefon (freiwillig)</Label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={draft.phone}
          onChange={(e) => onChange({ ...draft, phone: e.target.value })}
        />
      </div>
      <fieldset className="text-sm min-w-0">
        <legend className="font-medium mb-1">Rolle (freiwillig)</legend>
        {(Object.keys(ROLE_LABELS) as FamilyRole[]).map((role) => (
          <label key={role} className="flex items-start gap-2 min-h-[44px] py-1">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={draft.roles.includes(role)} onChange={() => toggleRole(role)} />
            <span>
              {ROLE_LABELS[role]}
              <span className="block text-xs text-muted">{ROLE_HELP[role]}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

/**
 * The one list of people. A change here carries into every place that shows the person
 * (emergency card, power of attorney, care directive, Janazah). Removing a person keeps the text there.
 */
export function PeopleEditor() {
  const uid = useId();
  const store = useAmanahStore();
  const members = store.familyMembers;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<{ id: string; draft: Draft } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const data = pickDataFields(store);

  const add = () => {
    if (!draft.name.trim()) return;
    const member: FamilyMember = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      relation: RELATIONS[draft.relationType],
      relationType: draft.relationType,
      phone: draft.phone.trim() || undefined,
      roles: draft.roles,
    };
    store.updateField("familyMembers", [...members, member]);
    setDraft(EMPTY);
  };

  const saveEdit = () => {
    if (!editing || !editing.draft.name.trim()) return;
    const before = members.find((m) => m.id === editing.id);
    if (!before) return;
    const updated: FamilyMember = {
      ...before,
      name: editing.draft.name.trim(),
      relationType: editing.draft.relationType,
      relation: RELATIONS[editing.draft.relationType],
      phone: editing.draft.phone.trim() || undefined,
      roles: editing.draft.roles,
    };
    store.updateSections(updatePerson(data, updated));
    setEditing(null);
  };

  const remove = (id: string) => {
    store.updateSections(removePerson(data, id));
    setConfirmRemove(null);
  };

  return (
    <div className="space-y-6">
      <ul className="space-y-3" data-testid="person-list">
        {members.map((m) => {
          const usages = usagesOf(data, m.id);
          const isEditing = editing?.id === m.id;
          return (
            <li key={m.id}>
              <Card className="p-4" data-testid="person-item">
                {isEditing && editing ? (
                  <div className="space-y-4">
                    <PersonFields draft={editing.draft} onChange={(d) => setEditing({ id: m.id, draft: d })} idPrefix={`${uid}-edit-${m.id}`} />
                    {usages.length > 0 && (
                      <p className="text-xs text-muted">Änderungen erscheinen auch in: {usages.map((u) => LINK_FIELD_LABELS[u]).join(", ")}.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={saveEdit} disabled={!editing.draft.name.trim()} data-testid="person-save">
                        Änderung speichern
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold break-words">{m.name}</p>
                      <p className="text-sm text-muted break-words">
                        {m.relation}
                        {m.phone ? ` · ${m.phone}` : ""}
                      </p>
                      {m.roles && m.roles.length > 0 && (
                        <p className="flex flex-wrap gap-1.5 mt-2">
                          {m.roles.map((r) => (
                            <span key={r} className="text-xs rounded-full bg-accent-soft text-primary px-2 py-0.5">{ROLE_LABELS[r]}</span>
                          ))}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-2" data-testid="person-usages">
                        {usages.length > 0 ? `Verwendet in: ${usages.map((u) => LINK_FIELD_LABELS[u]).join(", ")}` : "Noch nirgends ausgewählt"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" aria-label={`${m.name} bearbeiten`} onClick={() => setEditing({ id: m.id, draft: draftOf(m) })}>
                        <Pencil size={14} aria-hidden />
                      </Button>
                      <Button type="button" variant="outline" size="sm" aria-label={`${m.name} entfernen`} onClick={() => setConfirmRemove(m.id)}>
                        <Trash2 size={14} aria-hidden />
                      </Button>
                    </div>
                    {confirmRemove === m.id && (
                      <div className="w-full rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm" role="group" aria-label="Entfernen bestätigen">
                        <p>
                          {usages.length > 0
                            ? `${m.name} ist ausgewählt in: ${usages.map((u) => LINK_FIELD_LABELS[u]).join(", ")}. Dort bleibt der Name als Text stehen.`
                            : `${m.name} aus der Liste entfernen?`}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => remove(m.id)} data-testid="person-remove-confirm">
                            Entfernen
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>
                            Behalten
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
        {members.length === 0 && <p className="text-sm text-muted">Noch keine Personen eingetragen.</p>}
      </ul>

      <Card>
        <CardTitle>Person hinzufügen</CardTitle>
        <div className="mt-4">
          <PersonFields draft={draft} onChange={setDraft} idPrefix={`${uid}-new`} />
        </div>
        <Button type="button" className="mt-4" onClick={add} disabled={!draft.name.trim()} data-testid="person-add">
          <UserPlus size={16} className="mr-2" aria-hidden /> Hinzufügen
        </Button>
      </Card>
    </div>
  );
}
