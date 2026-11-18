"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { buildGesamt } from "@/lib/documents/model";
import { DocumentView } from "@/components/documents/document-view";

export const FULL_PRINT_TITLE = "Vorsorge-Übersicht – kein Testament";

/** The complete overview as a designed document; every page repeats what it is not. */
export function FullPrintView() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  return <DocumentView model={buildGesamt(data)} createdAt={new Date()} dataAsOf={data.lastSaved} testId="full-print-view" />;
}
