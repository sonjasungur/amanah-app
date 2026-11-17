"use client";

import { useId } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { Label, Select } from "@/components/ui/input";
import type { PersonLinkField } from "@/lib/domain/types";
import { activeLinks, linkPerson, peopleForField } from "@/lib/vorsorge/people";
import Link from "next/link";

/** Chooses a person from "Familie & Kontakte" for one field instead of typing them in again. */
export function PersonPicker({ field, label }: { field: PersonLinkField; label: string }) {
  const id = useId();
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const people = peopleForField(data, field);
  const current = activeLinks(data)[field]?.id ?? "";

  if (people.length === 0) {
    return (
      <p className="text-sm text-muted">
        {label}: Noch keine Personen in{" "}
        <Link href="/dashboard/personen" className="underline text-primary">
          Familie &amp; Kontakte
        </Link>
        . Du kannst den Namen auch direkt eintragen.
      </p>
    );
  }

  return (
    <div data-testid={`person-picker-${field}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={current}
        onChange={(e) => {
          if (e.target.value) store.updateSections(linkPerson(data, field, e.target.value));
        }}
      >
        <option value="">Aus Familie &amp; Kontakte wählen</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.relation ? ` (${p.relation})` : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
