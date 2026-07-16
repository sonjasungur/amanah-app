import type { AmanahOrdnerData } from "./types";

export const SCHEMA_VERSION = 2;

export interface AmanahExportBundle {
  schemaVersion: number;
  exportedAt: string;
  data: AmanahOrdnerData;
}

export function createExportBundle(data: AmanahOrdnerData): AmanahExportBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { ...data, schemaVersion: SCHEMA_VERSION },
  };
}

export interface EmergencyExportBundle {
  schemaVersion: number;
  exportedAt: string;
  disclaimer: string;
  data: Pick<
    AmanahOrdnerData,
    "userProfile" | "emergencyCard" | "medicalWishes" | "powerOfAttorney" | "janazahWishes" | "debtsAmanah"
  >;
}

export function createEmergencyExportBundle(data: AmanahOrdnerData): EmergencyExportBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Diese Notfallmappe dient der Orientierung und Vorbereitung. Sie ersetzt keine Rechtsberatung, ärztliche Beratung oder fachliche Prüfung durch Imam/Gelehrte.",
    data: {
      userProfile: data.userProfile,
      emergencyCard: data.emergencyCard,
      medicalWishes: data.medicalWishes,
      powerOfAttorney: data.powerOfAttorney,
      janazahWishes: data.janazahWishes,
      debtsAmanah: data.debtsAmanah,
    },
  };
}
