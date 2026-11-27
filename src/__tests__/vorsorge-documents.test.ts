import { describe, expect, it } from "vitest";
import { DOCUMENT_CHECKLIST, documentSummary, upsertDocument } from "@/lib/vorsorge/documents";
import { normalizeData } from "@/lib/domain/migration";

describe("document checklist", () => {
  it("upserts one entry per checklist type and keeps other entries", () => {
    let docs = upsertDocument([], "testament", { status: "vorhanden" });
    docs = upsertDocument(docs, "testament", { location: "Notar Müller" });
    docs = upsertDocument(docs, "ausweis", { status: "fehlt" });
    expect(docs.filter((d) => d.type === "testament")).toHaveLength(1);
    expect(docs.find((d) => d.type === "testament")).toMatchObject({ status: "vorhanden", location: "Notar Müller", title: "Testament" });
    expect(documentSummary(docs)).toEqual({ total: DOCUMENT_CHECKLIST.length, available: 1, missing: 1, review: 0 });
  });

  it("older folders without the new fields still load", () => {
    const data = normalizeData({ documents: [{ id: "1", type: "testament", title: "Testament", location: "Schrank" }], familyMembers: [{ id: "p", name: "A", relation: "Kind" }] });
    expect(data.documents[0].status).toBeUndefined();
    expect(data.familyMembers[0].relationType).toBeUndefined();
    expect(data.knowledgeBookmarks).toEqual([]);
  });
});
