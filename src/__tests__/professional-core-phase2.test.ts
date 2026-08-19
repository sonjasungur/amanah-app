import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { janazahSections } from "@/lib/modules/janazah-sections";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { SCHEMA_VERSION } from "@/lib/domain/schema";
import { isAiUiEnabled } from "@/lib/ai/config";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("janazah-sections: structure", () => {
  it("defines exactly 5 sections in the correct order", () => {
    expect(janazahSections).toHaveLength(5);
    expect(janazahSections.map((s) => s.id)).toEqual([
      "grunddaten",
      "benachrichtigung",
      "ghusl-janazah",
      "beisetzung",
      "persoenlich",
    ]);
  });

  it("each section has id, title, description and fields", () => {
    for (const section of janazahSections) {
      expect(section.id).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(section.description).toBeTruthy();
      expect(section.fields.length).toBeGreaterThan(0);
    }
  });
});

describe("janazah-guided-flow: file structure", () => {
  const flow = read("src/components/modules/janazah-guided-flow.tsx");

  it("has guided flow testid", () => {
    expect(flow).toContain('data-testid="janazah-guided-flow"');
  });

  it("has step testid pattern", () => {
    expect(flow).toContain("janazah-step-");
  });

  it("has progress bar testid", () => {
    expect(flow).toContain('data-testid="janazah-step-progress"');
  });

  it("has next button testid", () => {
    expect(flow).toContain('data-testid="janazah-next-button"');
  });

  it("has back button testid", () => {
    expect(flow).toContain('data-testid="janazah-back-button"');
  });

  it("has preview button testid", () => {
    expect(flow).toContain('data-testid="janazah-preview-button"');
  });

  it("imports janazahSections", () => {
    expect(flow).toContain("janazahSections");
  });

  it("imports flushPendingSave", () => {
    expect(flow).toContain("flushPendingSave");
  });

  it("shows JanazahLegalNotice on step 0", () => {
    expect(flow).toContain("JanazahLegalNotice");
    expect(flow).toContain("currentStep === 0");
  });

  it("includes SaveStatusIndicator", () => {
    expect(flow).toContain("SaveStatusIndicator");
  });

  it("includes Zurück zum Vorsorgeplan link", () => {
    expect(flow).toContain("Zurück zum Vorsorgeplan");
    expect(flow).toContain("/dashboard");
  });

  it("uses correct handleChange pattern", () => {
    expect(flow).toContain('store.updateField("janazahWishes"');
    expect(flow).toContain("setNestedValue");
  });

  it("navigates to vorschau on preview", () => {
    expect(flow).toContain("/dashboard/janazah/vorschau");
  });
});

describe("janazah-vorschau: file structure", () => {
  const preview = read("src/app/dashboard/janazah/vorschau/page.tsx");

  it("has preview testid", () => {
    expect(preview).toContain('data-testid="janazah-preview"');
  });

  it("has section testid pattern", () => {
    expect(preview).toContain("janazah-preview-section-");
  });

  it("has download testid", () => {
    expect(preview).toContain('data-testid="janazah-preview-download"');
  });

  it("has back testid", () => {
    expect(preview).toContain('data-testid="janazah-preview-back"');
  });

  it("has disclaimer text", () => {
    expect(preview).toContain("keine rechtliche oder religiöse Verbindlichkeit");
  });

  it("links to PDF page", () => {
    expect(preview).toContain("/dashboard/pdf");
  });

  it("has edit links with schritt param", () => {
    expect(preview).toContain("?schritt=");
  });

  it("has Noch offen marker for critical fields", () => {
    expect(preview).toContain("Noch offen");
  });
});

describe("SaveStatusIndicator: aria-live", () => {
  const indicator = read("src/components/storage/save-status-indicator.tsx");

  it("has aria-live polite on container", () => {
    expect(indicator).toContain('aria-live="polite"');
  });
});

describe("translations: required keys present", () => {
  const translations = read("src/lib/i18n/translations.ts");

  it("has saveAndNext key", () => {
    expect(translations).toContain("janazah.guided.saveAndNext");
  });

  it("has previewCheck key", () => {
    expect(translations).toContain("janazah.guided.previewCheck");
  });

  it("has pdfDownload key", () => {
    expect(translations).toContain("janazah.guided.pdfDownload");
  });

  it("has unsavedChanges key", () => {
    expect(translations).toContain("janazah.guided.unsavedChanges");
  });

  it("has settings storage location keys", () => {
    expect(translations).toContain("settings.storageLocation.title");
    expect(translations).toContain("settings.storageLocation.api");
    expect(translations).toContain("settings.storageLocation.local");
  });

  it("has settings delete data keys", () => {
    expect(translations).toContain("settings.deleteData.title");
    expect(translations).toContain("settings.deleteData.button");
  });

  it("has settings AI keys", () => {
    expect(translations).toContain("settings.ai.title");
    expect(translations).toContain("settings.ai.disabled");
  });
});

describe("settings page: structure", () => {
  const settings = read("src/app/dashboard/einstellungen/page.tsx");

  it("has storage location testid", () => {
    expect(settings).toContain('data-testid="settings-storage-location"');
  });

  it("has delete data button testid", () => {
    expect(settings).toContain('data-testid="settings-delete-data-button"');
  });

  it("has delete confirm testid", () => {
    expect(settings).toContain('data-testid="settings-delete-data-confirm"');
  });

  it("has AI section testid", () => {
    expect(settings).toContain('data-testid="settings-ai-section"');
  });

  it("has AI consent status testid", () => {
    expect(settings).toContain('data-testid="settings-ai-consent-status"');
  });

  it("calls resetAmanahStore for delete", () => {
    expect(settings).toContain("resetAmanahStore");
  });

  it("uses getActiveStorageLabel for storage display", () => {
    expect(settings).toContain("getActiveStorageLabel");
  });

  it("uses isAiUiEnabled gating", () => {
    expect(settings).toContain("isAiUiEnabled");
  });
});

describe("schema version", () => {
  it("is still version 3", () => {
    expect(SCHEMA_VERSION).toBe(3);
  });
});

describe("default data: janazah fields preserved", () => {
  it("has janazahWishes with all required fields", () => {
    const jw = defaultAmanahData.janazahWishes;
    expect(jw).toHaveProperty("fullName");
    expect(jw).toHaveProperty("trustedContact");
    expect(jw).toHaveProperty("islamicBurialDesired");
    expect(jw).toHaveProperty("preferredMosque");
    expect(jw).toHaveProperty("messageToFamily");
    expect(jw).toHaveProperty("ghusl");
    expect(jw).toHaveProperty("kafan");
    expect(jw).toHaveProperty("repatriation");
  });
});

describe("AI consent functions", () => {
  const consentClient = read("src/lib/ai/consent-client.ts");

  it("exports getAiConsent", () => {
    expect(consentClient).toContain("export function getAiConsent");
  });

  it("exports setAiConsent", () => {
    expect(consentClient).toContain("export function setAiConsent");
  });

  it("exports revokeAiConsent", () => {
    expect(consentClient).toContain("export function revokeAiConsent");
  });
});

describe("isAiUiEnabled: env-var gated", () => {
  it("returns false when env var not set", () => {
    const original = process.env.NEXT_PUBLIC_AMANAH_AI_ENABLED;
    delete process.env.NEXT_PUBLIC_AMANAH_AI_ENABLED;
    expect(isAiUiEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_AMANAH_AI_ENABLED = original;
  });

  it("uses NEXT_PUBLIC_AMANAH_AI_ENABLED env var", () => {
    const config = read("src/lib/ai/config.ts");
    expect(config).toContain("NEXT_PUBLIC_AMANAH_AI_ENABLED");
  });
});

describe("no external data transfer in PDF export", () => {
  const pdfPage = read("src/app/dashboard/pdf/page.tsx");

  it("uses window.print() not external service", () => {
    expect(pdfPage).toContain("window.print");
    expect(pdfPage).not.toContain("fetch(");
    expect(pdfPage).not.toContain("axios");
  });
});
