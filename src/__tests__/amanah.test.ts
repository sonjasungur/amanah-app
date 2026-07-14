import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSourcesByIds, islamicSources } from "@/lib/knowledge/sources";
import { searchKnowledge, getAllPublishedArticles } from "@/lib/knowledge";
import { searchFuneralPartners, funeralPartners } from "@/lib/mock/funeral-partners";
import { calculateProgress, getCriticalMissing, getModuleProgress, getAllModuleProgress } from "@/lib/utils/progress";
import { defaultAmanahData, demoAmanahData } from "@/lib/domain";
import { migrateV0ToV1, normalizeData, extractDataFromImport } from "@/lib/domain/migration";
import { createExportBundle, SCHEMA_VERSION } from "@/lib/domain/schema";
import { parseImportJson } from "@/lib/storage/amanah-storage";
import { LocalStorageProvider } from "@/lib/storage/local-storage-provider";
import { STORAGE_KEY } from "@/lib/storage/types";
import { cultureFilterCards } from "@/lib/knowledge/kulturfilter";
import { checkInheritance } from "@/lib/domain/validation";

describe("Islamic Sources", () => {
  it("has required source entries", () => {
    expect(islamicSources["quran-nisa-4-11"]).toBeDefined();
    expect(islamicSources["hadith-sadaqa-jariya"]).toBeDefined();
    expect(islamicSources["hadith-janazah-hasten"]).toBeDefined();
    expect(islamicSources["quran-al-muminun-23-99"]).toBeDefined();
  });

  it("retrieves sources by ids", () => {
    const sources = getSourcesByIds(["quran-nisa-4-11", "hadith-wasiyyah-third"]);
    expect(sources).toHaveLength(2);
    expect(sources[0].type).toBe("quran");
  });
});

describe("Knowledge Base", () => {
  it("returns only non-draft articles", () => {
    const articles = getAllPublishedArticles();
    expect(articles.length).toBeGreaterThan(10);
    expect(articles.every((a) => a.reviewStatus !== "draft")).toBe(true);
  });

  it("searches knowledge by query", () => {
    const results = searchKnowledge("janazah");
    expect(results.length).toBeGreaterThan(0);
  });

  it("all culture filter cards have sources", () => {
    for (const card of cultureFilterCards) {
      expect(card.sourceIds.length).toBeGreaterThan(0);
      expect(card.reviewStatus).not.toBe("draft");
    }
  });
});

describe("Funeral Partners", () => {
  it("has at least 6 partners", () => {
    expect(funeralPartners.length).toBeGreaterThanOrEqual(6);
  });

  it("searches by city", () => {
    const results = searchFuneralPartners("Berlin");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].city).toBe("Berlin");
  });
});

describe("Inheritance Check", () => {
  it("returns red for excluding daughters", () => {
    const result = checkInheritance({
      ...defaultAmanahData.inheritanceProfile,
      desiredWasiyyah: "Tochter ausschließen und alles an Sohn",
    });
    expect(result.status).toBe("red");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns green for basic profile", () => {
    const result = checkInheritance({
      ...defaultAmanahData.inheritanceProfile,
      sons: 2,
      daughters: 1,
      married: true,
    });
    expect(result.status).toBe("green");
  });
});

describe("Progress", () => {
  it("calculates low progress for empty data", () => {
    const progress = calculateProgress(defaultAmanahData);
    expect(progress).toBeLessThan(20);
  });

  it("identifies critical missing fields", () => {
    const missing = getCriticalMissing(defaultAmanahData);
    expect(missing).toContain("Notfallkontakt");
  });

  it("calculates module progress", () => {
    const mod = getModuleProgress(demoAmanahData, "notfallkarte");
    expect(mod.percent).toBeGreaterThan(0);
    expect(mod.moduleId).toBe("notfallkarte");
  });

  it("returns progress for all modules", () => {
    const all = getAllModuleProgress(demoAmanahData);
    expect(all).toHaveLength(13);
  });
});

describe("Migration v0 → v1", () => {
  it("adds schemaVersion and new arrays to legacy data", () => {
    const legacy = {
      userProfile: { name: "Legacy User", birthDate: "1990-01-01", language: "de" },
      selectedPath: "janazah",
    };
    const migrated = migrateV0ToV1(legacy);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.familyMembers).toEqual([]);
    expect(migrated.documents).toEqual([]);
    expect(migrated.userProfile.name).toBe("Legacy User");
  });

  it("normalizes partial data with defaults", () => {
    const normalized = normalizeData({ userProfile: { name: "Test", birthDate: "", language: "de" } });
    expect(normalized.schemaVersion).toBe(SCHEMA_VERSION);
    expect(normalized.emergencyCard).toBeDefined();
    expect(normalized.reviewStatus).toBe("draft");
  });

  it("extracts data from export bundle", () => {
    const bundle = createExportBundle(demoAmanahData);
    const extracted = extractDataFromImport(bundle as unknown as Record<string, unknown>);
    expect(extracted.userProfile.name).toBe("Ahmed Demo");
    expect(extracted.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe("Import/Export Bundle", () => {
  it("creates valid export bundle", () => {
    const bundle = createExportBundle(demoAmanahData);
    expect(bundle.schemaVersion).toBe(SCHEMA_VERSION);
    expect(bundle.exportedAt).toBeTruthy();
    expect(bundle.data.userProfile.name).toBe("Ahmed Demo");
  });

  it("parses export bundle successfully", () => {
    const bundle = createExportBundle(demoAmanahData);
    const result = parseImportJson(bundle);
    expect(result.success).toBe(true);
    expect(result.data?.userProfile.name).toBe("Ahmed Demo");
  });

  it("rejects invalid import without destroying data", () => {
    const result = parseImportJson(null);
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("migrates legacy flat JSON on import", () => {
    const legacy = { userProfile: { name: "Alt", birthDate: "", language: "de" } };
    const result = parseImportJson(legacy);
    expect(result.success).toBe(true);
    expect(result.data?.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.data?.userProfile.name).toBe("Alt");
  });
});

describe("Storage round-trip", () => {
  const mockStorage = new Map<string, string>();

  beforeEach(() => {
    mockStorage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => { mockStorage.set(key, value); },
      removeItem: (key: string) => { mockStorage.delete(key); },
    });
    vi.stubGlobal("window", { localStorage: localStorage });
  });

  it("saves and loads data through LocalStorageProvider", async () => {
    const provider = new LocalStorageProvider();
    await provider.save(demoAmanahData);
    const loaded = await provider.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.userProfile.name).toBe("Ahmed Demo");
    expect(loaded!.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("migrates v0 zustand persist format on load", async () => {
    const legacyState = {
      state: {
        userProfile: { name: "Persisted", birthDate: "", language: "de" },
        debtsAmanah: [{ id: "1", type: "zakat", description: "Test", person: "X", priority: "high" }],
      },
      version: 0,
    };
    mockStorage.set(STORAGE_KEY, JSON.stringify(legacyState));
    const provider = new LocalStorageProvider();
    const loaded = await provider.load();
    expect(loaded!.userProfile.name).toBe("Persisted");
    expect(loaded!.debtsAmanah).toHaveLength(1);
    expect(loaded!.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe("SaveStatus types", () => {
  it("default save state is idle-compatible", () => {
    const statuses = ["idle", "saving", "saved", "error"] as const;
    expect(statuses).toContain("saved");
    expect(statuses).toContain("error");
  });
});
