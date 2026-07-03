import type { AmanahOrdnerData } from "@/lib/types";

export const STORAGE_KEY = "amanah-ordner-data";

export const defaultAmanahData: AmanahOrdnerData = {
  userProfile: { name: "", birthDate: "", language: "de" },
  emergencyCard: {
    name: "",
    birthDate: "",
    emergencyContact1: { name: "", phone: "", relation: "" },
    emergencyContact2: { name: "", phone: "", relation: "" },
    familyDoctor: "",
    illnesses: "",
    medications: "",
    allergies: "",
    language: "Deutsch",
    mosqueImam: "",
    preferredFuneralDirector: "",
    hasPatientenverfuegung: null,
    hasVorsorgevollmacht: null,
    hasJanazahWishes: null,
  },
  medicalWishes: {
    medicalWishes: "",
    religiousWishes: "",
    imamSeelsorge: "",
    dignityBoundaries: "",
    whoSpeaksToDoctors: "",
    documentLocation: "",
    openQuestionsDoctor: "",
    openQuestionsLawyer: "",
    openQuestionsImam: "",
  },
  powerOfAttorney: {
    authorizedPerson: "",
    substitutePerson: "",
    medical: "",
    authorities: "",
    bank: "",
    housing: "",
    care: "",
    burial: "",
    documents: "",
    digitalAccounts: "",
    excludedPersons: "",
  },
  careDirective: {
    preferredGuardian: "",
    excludedGuardian: "",
    religiousWishes: "",
    careHousingWishes: "",
    languageFamilyNotes: "",
  },
  janazahWishes: {
    islamicBurialDesired: null,
    noUnnecessaryDelay: null,
    ghusl: "",
    kafan: "",
    janazahPrayer: "",
    burialGermany: null,
    repatriation: "",
    preferredCemetery: "",
    preferredMosque: "",
    preferredFuneralDirector: "",
    culturalExclusions: "",
    messageToFamily: "",
  },
  ghuslKafan: {
    whoMayBePresent: "",
    preferredGhuslTeam: "",
    dignityBoundaries: "",
    spouseNote: "",
    familyFarewell: "",
    familyFarewellConditions: "",
    notes: "",
  },
  burialPreference: {
    burialGermanyPreferred: null,
    repatriationPreferred: null,
    decisionCriteria: "",
    cityPlz: "",
    contactPerson: "",
    costDocumentNotes: "",
    familyNote: "",
  },
  inheritanceProfile: {
    married: null,
    spouseAlive: null,
    sons: 0,
    daughters: 0,
    parentsAlive: null,
    siblings: null,
    stepchildren: null,
    fosterChildren: null,
    nonMuslimRelatives: null,
    realEstate: null,
    companyGmbH: null,
    foreignProperty: null,
    approximateWealth: "",
    debts: "",
    desiredWasiyyah: "",
    desiredSadaqaJariya: "",
    openQuestionsImam: "",
    openQuestionsLawyer: "",
  },
  debtsAmanah: [],
  digitalLegacy: [],
  barzakhPlan: {
    familyFirstCheck: "",
    importantDebtsAmanah: "",
    desiredDuas: "",
    desiredSadaqaJariya: "",
    culturalExclusions: "",
    peopleToContact: "",
    messageToFamily: "",
  },
  sadaqaJariya: {
    joinFoerderkreis: null,
    preferredPot: "",
    monthlyAmount: "",
    oneTimeAmount: "",
    personToVerify: "",
    gemeinsam1Link: "",
  },
  familyMessage: {
    familyLetter: "",
    whatsappMessage: "",
    conversationGuide: "",
    keyWishesSummary: "",
  },
  selectedPath: "complete",
  lastSaved: null,
};

export function loadFromStorage(): AmanahOrdnerData {
  if (typeof window === "undefined") return defaultAmanahData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAmanahData;
    return { ...defaultAmanahData, ...JSON.parse(raw) };
  } catch {
    return defaultAmanahData;
  }
}

export function saveToStorage(data: AmanahOrdnerData): void {
  if (typeof window === "undefined") return;
  const toSave = { ...data, lastSaved: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function clearStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportToJson(data: AmanahOrdnerData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `amanah-ordner-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJson(file: File): Promise<AmanahOrdnerData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        resolve({ ...defaultAmanahData, ...parsed });
      } catch {
        reject(new Error("Ungültige JSON-Datei"));
      }
    };
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsText(file);
  });
}
