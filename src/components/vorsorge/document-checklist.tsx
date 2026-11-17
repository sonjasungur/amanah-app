"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { DOCUMENT_CHECKLIST, DOCUMENT_STATUS_LABELS, documentSummary, upsertDocument } from "@/lib/vorsorge/documents";
import type { DocumentStatus } from "@/lib/domain/types";

/** Status and place of the original for each typical document; used on the page and in the guided flow. */
export function DocumentChecklist() {
  const documents = useAmanahStore((s) => s.documents);
  const updateField = useAmanahStore((s) => s.updateField);
  const summary = documentSummary(documents);

  const change = (type: (typeof DOCUMENT_CHECKLIST)[number]["type"], patch: Record<string, string>) =>
    updateField("documents", upsertDocument(documents, type, patch));

  return (
    <div className="space-y-4">
      <p className="text-sm" data-testid="documents-summary">
        {summary.available} von {summary.total} vorhanden · {summary.missing} fehlen · {summary.review} prüfen
      </p>
      <div className="space-y-3">
        {DOCUMENT_CHECKLIST.map((item) => {
          const entry = documents.find((d) => d.type === item.type);
          return (
            <Card key={item.type} className="p-4" data-testid={`document-${item.type}`}>
              <CardTitle className="text-base">{item.title}</CardTitle>
              {item.hint && <p className="text-xs text-muted mb-3">{item.hint}</p>}
              <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                <div>
                  <Label htmlFor={`status-${item.type}`}>Status</Label>
                  <Select
                    id={`status-${item.type}`}
                    value={entry?.status ?? ""}
                    onChange={(e) => change(item.type, { status: e.target.value as DocumentStatus })}
                  >
                    <option value="">Noch nicht angegeben</option>
                    {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`location-${item.type}`}>Wo liegt das Original?</Label>
                  <Input
                    id={`location-${item.type}`}
                    value={entry?.location ?? ""}
                    placeholder="z. B. Ordner im Arbeitszimmer, bei Schwester Amina"
                    onChange={(e) => change(item.type, { location: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
