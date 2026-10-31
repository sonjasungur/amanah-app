/**
 * Product catalog. Prices are TEST VALUES only. Planned test price for Vorsorge Plus:
 * 39 € one-time (owner, 2026-10-31); 29 € stays selectable for comparison tests.
 * The Islamic knowledge centre is never part of any paid product.
 */
import { featuresByTier } from "./plan-matrix";

export type ProductId = "vorsorge_basis" | "vorsorge_plus" | "testament_vorbereitung" | "testament_pruefung";

export type PlusFeature = "account_sync" | "complete_pdf_folder" | "family_letter_export" | "document_status";

export interface Product {
  id: ProductId;
  name: string;
  /** null = free */
  testPriceCents: number | null;
  /** Purchasable at all (in sandbox). Locked products need legal/owner approval first. */
  available: boolean;
  lockedReason?: string;
  features: string[];
}

export const TEST_PRICE_OPTIONS_CENTS = [3900, 2900] as const;

export function getTestPriceCents(env: NodeJS.ProcessEnv = process.env): number {
  const configured = Number(env.AMANAH_TEST_PRICE_VORSORGE_PLUS_CENTS);
  return (TEST_PRICE_OPTIONS_CENTS as readonly number[]).includes(configured) ? configured : TEST_PRICE_OPTIONS_CENTS[0];
}

export function getProducts(env: NodeJS.ProcessEnv = process.env): Product[] {
  return [
    {
      id: "vorsorge_basis",
      name: "Mein Wille Basis",
      testPriceCents: null,
      available: true,
      features: featuresByTier("free").map((f) => f.title),
    },
    {
      id: "vorsorge_plus",
      name: "Mein Wille Vorsorge Plus",
      testPriceCents: getTestPriceCents(env),
      available: true,
      features: featuresByTier("plus").map((f) => f.title),
    },
    {
      id: "testament_vorbereitung",
      name: "Testament-Vorbereitung",
      testPriceCents: null,
      available: false,
      lockedReason: "Leistungsumfang erst nach rechtlicher Prüfung (RDG) und Owner-Freigabe.",
      features: ["Strukturierter Fragebogen", "Gesprächsunterlage für Anwalt/Notar"],
    },
    {
      id: "testament_pruefung",
      name: "Testament mit juristischer Prüfung",
      testPriceCents: null,
      available: false,
      lockedReason: "Nur über unabhängige Kanzleien; Kooperation und Vergütung noch nicht geklärt.",
      features: ["Prüfung durch Rechtsanwalt im eigenen Mandat"],
    },
  ];
}

export function formatPrice(cents: number | null): string {
  if (cents === null) return "kostenlos";
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}
