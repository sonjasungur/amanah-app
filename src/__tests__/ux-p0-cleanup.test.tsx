import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { translations } from "@/lib/i18n/translations";

const read = (p: string) => readFileSync(p, "utf8");
const de = translations.de;

describe("P0 UX cleanup", () => {
  it("the storage texts in the account mode describe what really happens and contradict nothing", () => {
    const banner = read("src/components/auth/storage-mode-banner.tsx");
    const apiBranch = banner.slice(banner.indexOf("if (isApi)"), banner.indexOf("return (", banner.indexOf("if (isApi)") + 200));
    expect(apiBranch).not.toContain("localHint");
    expect(de["auth.storage.apiHint1"]).toContain("verschlüsselt in deinem Konto");
    expect(de["auth.storage.apiHint2"]).toContain("Browser-Tab");
    expect(de["auth.storage.apiHint2"]).toContain("Abmelden");
    expect(de["auth.storage.localHint3"]).not.toContain("Später im Produkt");
    expect(de["auth.privacyNote"]).not.toMatch(/Backend|Server/);
  });

  it("one save status: no page or form renders its own next to the storage bar", () => {
    for (const file of [
      "src/app/dashboard/page.tsx",
      "src/app/dashboard/dokumente/page.tsx",
      "src/app/dashboard/personen/page.tsx",
      "src/app/dashboard/vermoegen/page.tsx",
      "src/components/modules/janazah-guided-flow.tsx",
      "src/components/modules/janazah-wishes-form.tsx",
      "src/components/dashboard/dashboard-layout.tsx",
      "src/components/storage/storage-controls.tsx",
    ]) {
      expect(read(file), file).not.toContain("<SaveStatusIndicator");
    }
  });

  it("the sidebar holds navigation only; exports and deletion live in the account settings", () => {
    const layout = read("src/components/dashboard/dashboard-layout.tsx");
    expect(layout).not.toContain("<StorageControls");
    expect(layout).toContain("/dashboard/einstellungen#export-sicherung");
    expect(read("src/app/dashboard/einstellungen/page.tsx")).toContain("<StorageControls />");
  });

  it("every export stays reachable in one bundle; demo and reset only outside the account mode", () => {
    const controls = read("src/components/storage/storage-controls.tsx");
    for (const action of ["handleReadableExport", "handleExport", "handleEmergencyExport", "handleMarkdownExport", "/dashboard/pdf", "fileRef.current?.click()"]) {
      expect(controls, action).toContain(action);
    }
    expect(controls).toMatch(/\{!isApiStorage && \(\s*<>\s*<Button[^>]*onClick=\{handleLoadDemo\}/);
    expect(controls).not.toContain("handleDeleteServerData");
  });

  it("no price is announced in the care areas while the package cannot be bought", () => {
    const notice = read("src/components/billing/plus-area-notice.tsx");
    expect(notice).not.toMatch(/formatPrice|€/);
    expect(notice).toContain('data-testid="plus-area-notice"');
  });

  it("no developer or demo wording in the account mode", () => {
    expect(read("src/app/dashboard/ausfuellen/page.tsx")).not.toContain("Demo zurücksetzen");
    expect(read("src/components/auth/auth-form.tsx")).toContain('authMode === "api" ? null');
    expect(read("src/components/auth/storage-mode-banner.tsx")).not.toMatch(/"API"/);
  });

  it("one product name and one name for the check", () => {
    expect(read("src/lib/brand.ts")).toContain('name: "Wasiyya"');
    expect(JSON.stringify(de)).not.toMatch(/Amanah-Check|Amanah-Daten/);
    expect(read("src/app/page.tsx")).not.toContain("Amanah-Check");
  });
});
