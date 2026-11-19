import type { AmanahOrdnerData, FamilyMember, FamilyRole, PersonLinkField } from "@/lib/domain/types";
import { PERSON_LINK_FIELDS } from "@/lib/vorsorge/meta";

/**
 * "Familie & Kontakte" holds every person once. Other places (emergency card, power of attorney,
 * care directive, Janazah) can point at a person. Each place keeps its own text as well, so a link
 * that goes away never takes the entry with it.
 */

export const ROLE_LABELS: Record<FamilyRole, string> = {
  notfallkontakt: "Notfallkontakt",
  vertrauensperson: "Vertrauensperson",
  vormund_wunsch: "Gewünschter Vormund für Kinder",
};

export const ROLE_HELP: Record<FamilyRole, string> = {
  notfallkontakt: "Wird im Notfall zuerst angerufen.",
  vertrauensperson: "Kennt deine Wünsche. Das ist keine rechtliche Vollmacht.",
  vormund_wunsch: "Dein Wunsch für die Sorge um deine Kinder. Er ersetzt keine rechtliche Regelung.",
};

export const LINK_FIELD_LABELS: Record<PersonLinkField, string> = {
  emergencyContact1: "Notfallkarte (Kontakt 1)",
  emergencyContact2: "Notfallkarte (Kontakt 2)",
  authorizedPerson: "Vorsorgevollmacht (vorgesehene Person)",
  substitutePerson: "Vorsorgevollmacht (Ersatzperson)",
  preferredGuardian: "Betreuungsverfügung (gewünschter Betreuer)",
  janazahTrustedContact: "Janazah-Wünsche (Vertrauensperson)",
};

/** The text a field currently holds for its person. */
export function linkedFieldName(data: AmanahOrdnerData, field: PersonLinkField): string {
  switch (field) {
    case "emergencyContact1":
      return data.emergencyCard.emergencyContact1.name;
    case "emergencyContact2":
      return data.emergencyCard.emergencyContact2.name;
    case "authorizedPerson":
      return data.powerOfAttorney.authorizedPerson;
    case "substitutePerson":
      return data.powerOfAttorney.substitutePerson;
    case "preferredGuardian":
      return data.careDirective.preferredGuardian;
    case "janazahTrustedContact":
      return data.janazahWishes.trustedContact;
  }
}

/** Writes a person into a field. Emergency contacts also take phone and relation. */
export function writePersonToField(data: AmanahOrdnerData, field: PersonLinkField, person: FamilyMember): Partial<AmanahOrdnerData> {
  switch (field) {
    case "emergencyContact1":
    case "emergencyContact2": {
      const before = data.emergencyCard[field];
      return {
        emergencyCard: {
          ...data.emergencyCard,
          [field]: { ...before, name: person.name, phone: person.phone ?? before.phone, relation: person.relation || before.relation },
        },
      };
    }
    case "authorizedPerson":
    case "substitutePerson":
      return { powerOfAttorney: { ...data.powerOfAttorney, [field]: person.name } };
    case "preferredGuardian":
      return { careDirective: { ...data.careDirective, preferredGuardian: person.name } };
    case "janazahTrustedContact":
      return { janazahWishes: { ...data.janazahWishes, trustedContact: person.name } };
  }
}

/**
 * A link only counts while the field still shows that person. Someone who typed another name by
 * hand has replaced the person, and a later change of the person must not overwrite that.
 */
export function activeLinks(data: AmanahOrdnerData): Partial<Record<PersonLinkField, FamilyMember>> {
  const result: Partial<Record<PersonLinkField, FamilyMember>> = {};
  for (const field of PERSON_LINK_FIELDS) {
    const id = data.vorsorgeMeta.personLinks[field];
    const person = id ? data.familyMembers.find((m) => m.id === id) : undefined;
    if (person && linkedFieldName(data, field).trim() === person.name.trim()) result[field] = person;
  }
  return result;
}

export function usagesOf(data: AmanahOrdnerData, personId: string): PersonLinkField[] {
  const links = activeLinks(data);
  return PERSON_LINK_FIELDS.filter((field) => links[field]?.id === personId);
}

function applyPatch(data: AmanahOrdnerData, patch: Partial<AmanahOrdnerData>): AmanahOrdnerData {
  return { ...data, ...patch };
}

/** Picks a person for a field: the field takes the person's details and remembers the link. */
export function linkPerson(data: AmanahOrdnerData, field: PersonLinkField, personId: string): Partial<AmanahOrdnerData> {
  const person = data.familyMembers.find((m) => m.id === personId);
  if (!person) return {};
  const patch = writePersonToField(data, field, person);
  return {
    ...patch,
    vorsorgeMeta: { ...data.vorsorgeMeta, personLinks: { ...data.vorsorgeMeta.personLinks, [field]: personId } },
  };
}

/**
 * Saves a changed person and carries the change into every field that still shows them.
 * Fields with another text stay untouched.
 */
export function updatePerson(data: AmanahOrdnerData, updated: FamilyMember): Partial<AmanahOrdnerData> {
  const links = activeLinks(data);
  let next: AmanahOrdnerData = applyPatch(data, {
    familyMembers: data.familyMembers.map((m) => (m.id === updated.id ? updated : m)),
  });
  for (const field of PERSON_LINK_FIELDS) {
    if (links[field]?.id === updated.id) next = applyPatch(next, writePersonToField(next, field, updated));
  }
  const patch: Partial<AmanahOrdnerData> = { familyMembers: next.familyMembers };
  if (next.emergencyCard !== data.emergencyCard) patch.emergencyCard = next.emergencyCard;
  if (next.powerOfAttorney !== data.powerOfAttorney) patch.powerOfAttorney = next.powerOfAttorney;
  if (next.careDirective !== data.careDirective) patch.careDirective = next.careDirective;
  if (next.janazahWishes !== data.janazahWishes) patch.janazahWishes = next.janazahWishes;
  return patch;
}

/** Removes a person. Fields that showed them keep their text; only the link goes. */
export function removePerson(data: AmanahOrdnerData, personId: string): Partial<AmanahOrdnerData> {
  const personLinks = { ...data.vorsorgeMeta.personLinks };
  for (const field of PERSON_LINK_FIELDS) {
    if (personLinks[field] === personId) delete personLinks[field];
  }
  return {
    familyMembers: data.familyMembers.filter((m) => m.id !== personId),
    vorsorgeMeta: { ...data.vorsorgeMeta, personLinks },
  };
}

/** People who fit a field: emergency contacts first for the emergency card, trusted people first elsewhere. */
export function peopleForField(data: AmanahOrdnerData, field: PersonLinkField): FamilyMember[] {
  const preferred: FamilyRole = field.startsWith("emergencyContact") ? "notfallkontakt" : "vertrauensperson";
  return [...data.familyMembers].sort((a, b) => {
    const pa = a.roles?.includes(preferred) ? 0 : 1;
    const pb = b.roles?.includes(preferred) ? 0 : 1;
    return pa - pb || a.name.localeCompare(b.name, "de");
  });
}
