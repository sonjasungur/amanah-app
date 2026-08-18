/**
 * Central operator/imprint configuration.
 * Placeholders are intentional launch blockers — do not invent company or person data.
 */
export const IMPRINT_LAUNCH_BLOCKER =
  "Impressum enthält noch Platzhalter. Ein produktiver Release ist nicht freigegeben, bis echte Anbieterangaben gesetzt sind.";

export const IMPRINT = {
  productName: "Mein Wille",
  legalFormPlaceholder: "[Firmenname / Projektname — Platzhalter]",
  streetPlaceholder: "[Straße und Hausnummer]",
  cityPlaceholder: "[PLZ Ort]",
  country: "Deutschland",
  email: "kontakt@amanahordner.de",
  phonePlaceholder: "[Platzhalter]",
  representativePlaceholder: "[Name des Vertretungsberechtigten — Platzhalter]",
  vatIdPlaceholder: "[DE XXX XXX XXX — Platzhalter, falls vorhanden]",
  contentResponsibleNamePlaceholder: "[Name]",
  contentResponsibleAddressPlaceholder: "[Adresse]",
  isPlaceholder: true,
  launchBlocker: IMPRINT_LAUNCH_BLOCKER,
} as const;
