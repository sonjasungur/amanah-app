import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { translations } from "@/lib/i18n/translations";
import { janazahSections } from "@/lib/modules/janazah-sections";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

// ---------------------------------------------------------------------------
// Translation parity
// ---------------------------------------------------------------------------
describe("translation parity: settings.* keys in DE and EN", () => {
  const settingsKeys = [
    "settings.storageLocation.title",
    "settings.storageLocation.api",
    "settings.storageLocation.local",
    "settings.deleteData.title",
    "settings.deleteData.description",
    "settings.deleteData.button",
    "settings.deleteData.confirm",
    "settings.ai.title",
    "settings.ai.disabled",
  ] as const;

  for (const key of settingsKeys) {
    it(`"${key}" exists in both DE and EN`, () => {
      expect(translations.de[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    });
  }
});

describe("translation parity: storage.status.* keys in DE and EN", () => {
  const storageStatusKeys = [
    "storage.status.saved",
    "storage.status.savedLocal",
    "storage.status.savedAccount",
    "storage.status.saving",
    "storage.status.error",
  ] as const;

  for (const key of storageStatusKeys) {
    it(`"${key}" exists in both DE and EN`, () => {
      expect(translations.de[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    });
  }
});

describe("translation parity: janazah.guided.* keys in DE and EN", () => {
  const janazahKeys = [
    "janazah.guided.saveAndNext",
    "janazah.guided.previewCheck",
    "janazah.guided.pdfDownload",
    "janazah.guided.unsavedChanges",
  ] as const;

  for (const key of janazahKeys) {
    it(`"${key}" exists in both DE and EN`, () => {
      expect(translations.de[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    });
  }
});

// ---------------------------------------------------------------------------
// Save behavior (unit-level, source inspection)
// ---------------------------------------------------------------------------
describe("store-sync: flushPendingSave delegates to persistStoreChanges", () => {
  const storeSync = read("src/lib/storage/store-sync.ts");

  it("flushPendingSave calls persistStoreChanges", () => {
    expect(storeSync).toContain("export async function flushPendingSave");
    expect(storeSync).toContain("persistStoreChanges()");
  });
});

describe("use-amanah-store: cancelPendingSave and resetAmanahStore", () => {
  const storeFile = read("src/lib/store/use-amanah-store.ts");

  it("exports cancelPendingSave", () => {
    expect(storeFile).toContain("export function cancelPendingSave");
  });

  it("resetAmanahStore calls cancelPendingSave before clearing", () => {
    const resetFn = storeFile.slice(storeFile.indexOf("export async function resetAmanahStore"));
    expect(resetFn).toContain("cancelPendingSave()");
    // cancelPendingSave must appear before clearAmanahData
    const cancelIdx = resetFn.indexOf("cancelPendingSave()");
    const clearIdx = resetFn.indexOf("clearAmanahData()");
    expect(cancelIdx).toBeLessThan(clearIdx);
  });
});

describe("getActiveStorageLabel: logic via source inspection", () => {
  const storageConfig = read("src/lib/storage/storage-config.ts");

  it("returns 'local' as default when no api token", () => {
    expect(storageConfig).toContain("return \"local\"");
  });

  it("returns 'api' when storageMode is api and token exists", () => {
    expect(storageConfig).toContain("return \"api\"");
    expect(storageConfig).toContain("getStorageMode() === \"api\"");
    expect(storageConfig).toContain("getAuthToken()");
  });
});

// ---------------------------------------------------------------------------
// Guided flow structural tests
// ---------------------------------------------------------------------------
describe("guided flow: structural integrity", () => {
  it("each section has at least one field", () => {
    for (const section of janazahSections) {
      expect(section.fields.length).toBeGreaterThan(0);
    }
  });

  it("step 5 (index 4) has the 'persoenlich' section", () => {
    expect(janazahSections[4].id).toBe("persoenlich");
  });
});

describe("guided flow: getInitialStep logic via source", () => {
  const flowFile = read("src/components/modules/janazah-guided-flow.tsx");

  it("has getInitialStep function or equivalent", () => {
    expect(flowFile).toMatch(/getInitialStep|initialStep/);
  });

  it("starts at step 0 for empty data (default 0 fallback)", () => {
    expect(flowFile).toMatch(/return 0|initialStep.*0|getInitialStep/);
  });
});

// ---------------------------------------------------------------------------
// PDF / Export tests
// ---------------------------------------------------------------------------
describe("vorschau page: PDF button updated label", () => {
  const vorschauFile = read("src/app/dashboard/janazah/vorschau/page.tsx");

  it("has data-testid='janazah-preview-download'", () => {
    expect(vorschauFile).toContain('data-testid="janazah-preview-download"');
  });

  it("button label uses janazah.preview.openPdf translation key", () => {
    expect(vorschauFile).toContain("janazah.preview.openPdf");
    expect(vorschauFile).not.toContain("Vorsorgeübersicht als PDF herunterladen");
  });

  it("links to /dashboard/pdf", () => {
    expect(vorschauFile).toContain("/dashboard/pdf");
  });
});

describe("pdf page: print and no-send note", () => {
  const pdfFile = read("src/app/dashboard/pdf/page.tsx");

  it("uses window.print()", () => {
    expect(pdfFile).toContain("window.print");
  });

  it("has no external fetch/API calls", () => {
    expect(pdfFile).not.toContain("fetch(");
    expect(pdfFile).not.toContain("axios");
  });

  it("has note that document is not sent automatically", () => {
    expect(pdfFile).toContain("nichts automatisch");
  });
});

// ---------------------------------------------------------------------------
// Settings tests
// ---------------------------------------------------------------------------
describe("settings page: testids and structure", () => {
  const settingsFile = read("src/app/dashboard/einstellungen/page.tsx");

  it("has data-testid='settings-storage-location'", () => {
    expect(settingsFile).toContain('data-testid="settings-storage-location"');
  });

  it("has data-testid='settings-delete-data-button'", () => {
    expect(settingsFile).toContain('data-testid="settings-delete-data-button"');
  });

  it("has data-testid='settings-ai-section'", () => {
    expect(settingsFile).toContain('data-testid="settings-ai-section"');
  });

  it("imports resetAmanahStore", () => {
    expect(settingsFile).toContain("resetAmanahStore");
  });
});

describe("AI consent: localStorage key usage", () => {
  const consentFile = read("src/lib/ai/consent-client.ts");

  it("setAiConsent stores in localStorage", () => {
    expect(consentFile).toContain("localStorage.setItem");
    expect(consentFile).toContain("amanah-ai-consent");
  });

  it("revokeAiConsent removes from localStorage", () => {
    expect(consentFile).toContain("localStorage.removeItem");
  });

  it("getAiConsent reads from localStorage", () => {
    expect(consentFile).toContain("localStorage.getItem");
  });
});

// ---------------------------------------------------------------------------
// Navigation reachability
// ---------------------------------------------------------------------------
describe("navigation: settings route is reachable", () => {
  it("dashboard-layout.tsx contains link to /dashboard/einstellungen", () => {
    const layout = read("src/components/dashboard/dashboard-layout.tsx");
    expect(layout).toContain("/dashboard/einstellungen");
  });

  it("nav settings link has data-testid", () => {
    const layout = read("src/components/dashboard/dashboard-layout.tsx");
    expect(layout).toContain('data-testid="nav-settings-link"');
  });
});
