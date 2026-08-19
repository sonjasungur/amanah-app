import type { FieldConfig } from "@/components/modules/module-form";
import { t, type Locale } from "@/lib/i18n/translations";

export interface JanazahSection {
  id: string;
  title: string;
  description: string;
  fields: FieldConfig[];
}

export function getJanazahSections(locale: string): JanazahSection[] {
  const loc = (locale || "de") as Locale;
  return [
    {
      id: "grunddaten",
      title: t(loc, "janazah.section.grunddaten.title"),
      description: t(loc, "janazah.section.grunddaten.desc"),
      fields: [
        { key: "fullName", label: t(loc, "janazah.field.fullName"), type: "text", testId: "janazah-fullName" },
        {
          key: "birthDate",
          label: t(loc, "janazah.field.birthDate"),
          type: "text",
          placeholder: t(loc, "janazah.field.birthDatePlaceholder"),
          showWhenProfileBirthDateEmpty: true,
          testId: "janazah-birthDate",
        },
        { key: "locationRegion", label: t(loc, "janazah.field.locationRegion"), type: "text", testId: "janazah-locationRegion" },
        { key: "trustedContact", label: t(loc, "janazah.field.trustedContact"), type: "text", testId: "janazah-trustedContact" },
      ],
    },
    {
      id: "benachrichtigung",
      title: t(loc, "janazah.section.benachrichtigung.title"),
      description: t(loc, "janazah.section.benachrichtigung.desc"),
      fields: [
        { key: "peopleToNotify", label: t(loc, "janazah.field.peopleToNotify"), type: "textarea", testId: "janazah-peopleToNotify" },
        { key: "mosqueCommunity", label: t(loc, "janazah.field.mosqueCommunity"), type: "text", testId: "janazah-mosqueCommunity" },
        { key: "preferredFuneralDirector", label: t(loc, "janazah.field.preferredFuneralDirector"), type: "text", testId: "janazah-preferredFuneralDirector" },
        { key: "additionalContacts", label: t(loc, "janazah.field.additionalContacts"), type: "textarea", testId: "janazah-additionalContacts" },
      ],
    },
    {
      id: "ghusl-janazah",
      title: t(loc, "janazah.section.ghuslJanazah.title"),
      description: t(loc, "janazah.section.ghuslJanazah.desc"),
      fields: [
        { key: "islamicBurialDesired", label: t(loc, "janazah.field.islamicBurialDesired"), type: "boolean", testId: "janazah-islamicBurialDesired" },
        { key: "noUnnecessaryDelay", label: t(loc, "janazah.field.noUnnecessaryDelay"), type: "boolean", testId: "janazah-noUnnecessaryDelay" },
        { key: "ghusl", label: t(loc, "janazah.field.ghusl"), type: "textarea", testId: "janazah-ghusl" },
        { key: "preferredGhuslPersons", label: t(loc, "janazah.field.preferredGhuslPersons"), type: "text", testId: "janazah-preferredGhuslPersons" },
        { key: "genderSpecificWishes", label: t(loc, "janazah.field.genderSpecificWishes"), type: "textarea", testId: "janazah-genderSpecificWishes" },
        { key: "kafan", label: t(loc, "janazah.field.kafan"), type: "textarea", testId: "janazah-kafan" },
        { key: "janazahPrayer", label: t(loc, "janazah.field.janazahPrayer"), type: "textarea", testId: "janazah-janazahPrayer" },
        { key: "preferredMosque", label: t(loc, "janazah.field.preferredMosque"), type: "text", testId: "janazah-preferredMosque" },
      ],
    },
    {
      id: "beisetzung",
      title: t(loc, "janazah.section.beisetzung.title"),
      description: t(loc, "janazah.section.beisetzung.desc"),
      fields: [
        { key: "burialGermany", label: t(loc, "janazah.field.burialGermany"), type: "boolean", testId: "janazah-burialGermany" },
        {
          key: "repatriation",
          label: t(loc, "janazah.field.repatriation"),
          type: "select",
          options: [
            { value: "yes", label: t(loc, "janazah.field.repatriation.yes") },
            { value: "no", label: t(loc, "janazah.field.repatriation.no") },
            { value: "unsure", label: t(loc, "janazah.field.repatriation.unsure") },
          ],
          testId: "janazah-repatriation",
        },
        { key: "preferredCemetery", label: t(loc, "janazah.field.preferredCemetery"), type: "text", testId: "janazah-preferredCemetery" },
        { key: "muslimGraveyard", label: t(loc, "janazah.field.muslimGraveyard"), type: "boolean", testId: "janazah-muslimGraveyard" },
        { key: "familyGrave", label: t(loc, "janazah.field.familyGrave"), type: "text", testId: "janazah-familyGrave" },
        { key: "burialCountryNotes", label: t(loc, "janazah.field.burialCountryNotes"), type: "textarea", testId: "janazah-burialCountryNotes" },
        { key: "repatriationNotes", label: t(loc, "janazah.field.repatriationNotes"), type: "textarea", testId: "janazah-repatriationNotes" },
        { key: "documentNotes", label: t(loc, "janazah.field.documentNotes"), type: "textarea", testId: "janazah-documentNotes" },
      ],
    },
    {
      id: "persoenlich",
      title: t(loc, "janazah.section.persoenlich.title"),
      description: t(loc, "janazah.section.persoenlich.desc"),
      fields: [
        { key: "peopleToInclude", label: t(loc, "janazah.field.peopleToInclude"), type: "textarea", testId: "janazah-peopleToInclude" },
        { key: "messageToFamily", label: t(loc, "janazah.field.messageToFamily"), type: "textarea", testId: "janazah-messageToFamily" },
        { key: "obligationsNotes", label: t(loc, "janazah.field.obligationsNotes"), type: "textarea", testId: "janazah-obligationsNotes" },
        { key: "debtsAmanahNotes", label: t(loc, "janazah.field.debtsAmanahNotes"), type: "textarea", testId: "janazah-debtsAmanahNotes" },
        { key: "donationWishes", label: t(loc, "janazah.field.donationWishes"), type: "textarea", testId: "janazah-donationWishes" },
        { key: "culturalExclusions", label: t(loc, "janazah.field.culturalExclusions"), type: "textarea", testId: "janazah-culturalExclusions" },
        { key: "additionalWishes", label: t(loc, "janazah.field.additionalWishes"), type: "textarea", testId: "janazah-additionalWishes" },
      ],
    },
  ];
}

// backward-compat default (DE)
export const janazahSections: JanazahSection[] = getJanazahSections("de");
export const janazahFields: FieldConfig[] = janazahSections.flatMap((s) => s.fields);
