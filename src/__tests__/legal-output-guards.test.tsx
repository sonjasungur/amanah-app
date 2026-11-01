import { existsSync, readFileSync, readdirSync } from "fs";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { inheritanceConversationPoints } from "@/lib/domain/validation";
import { isInheritanceHintsEnabled } from "@/lib/flags/inheritance-hints";
import { inheritanceFields } from "@/lib/modules/fields";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { FullPrintView } from "@/components/print/print-views";
import PdfPage from "@/app/dashboard/pdf/page";
import TestamentPage from "@/app/dashboard/testament/page";
import { I18nProvider } from "@/lib/i18n/context";

const profile = (over: Partial<typeof defaultAmanahData.inheritanceProfile> = {}) => ({ ...defaultAmanahData.inheritanceProfile, ...over });
const VERDICTS = /Keine Auffälligkeiten|Möglicher Konflikt|Klärungsbedarf|Erste Hinweise:|passt nach islamischen/;

describe("inheritance hints: the verdict is locked", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));
  afterEach(() => vi.unstubAllEnvs());

  it("is off unless the flag is exactly true", () => {
    expect(isInheritanceHintsEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS", "1");
    expect(isInheritanceHintsEnabled()).toBe(false);
  });

  it("the page shows questions, never a verdict, even for text the keyword check would flag", () => {
    useAmanahStore.setState({ inheritanceProfile: profile({ desiredWasiyyah: "alles an meinen Sohn", stepchildren: true }) });
    render(<I18nProvider><TestamentPage /></I18nProvider>);
    const text = screen.getByTestId("inheritance-conversation-points").textContent!;
    expect(text).toContain("Stiefkinder");
    expect(document.body.textContent).not.toMatch(VERDICTS);
  });

  it("the printed sheet shows no verdict either and says it is no will", () => {
    useAmanahStore.setState({ inheritanceProfile: profile({ desiredWasiyyah: "alles an meinen Sohn" }) });
    render(<I18nProvider><PdfPage /></I18nProvider>);
    expect(document.body.textContent).not.toMatch(VERDICTS);
  });

  it("with the flag the verdict returns, marked as no check", () => {
    vi.stubEnv("NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS", "true");
    render(<I18nProvider><TestamentPage /></I18nProvider>);
    expect(document.body.textContent).toContain("Erste Hinweise:");
    expect(document.body.textContent).toContain("keine Prüfung");
  });
});

describe("neutral conversation points", () => {
  it("come from facts and do not judge or quote the free text", () => {
    const points = inheritanceConversationPoints(profile({ desiredWasiyyah: "alles an Mustermann", foreignProperty: true }));
    expect(points).toHaveLength(2);
    expect(points.join(" ")).not.toContain("Mustermann");
    expect(points.join(" ")).not.toMatch(/darf|muss|verboten|unzulässig|passt nicht|1\/3|Drittel/i);
  });

  it("are empty without any information", () => {
    expect(inheritanceConversationPoints(profile())).toEqual([]);
  });
});

describe("free-text fields", () => {
  it("do not state a religious limit and say they are only notes", () => {
    for (const key of ["desiredWasiyyah", "desiredSadaqaJariya"]) {
      const field = inheritanceFields.find((f) => f.key === key)!;
      expect(field.label).toContain("unverbindlich");
      expect(field.label).not.toMatch(/1\/3|Drittel/);
      expect(field.helpText).toContain("Nur eine Notiz");
    }
  });
});

describe("complete printout", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));

  it("cannot read as a will, a power of attorney or an advance directive", () => {
    render(<FullPrintView />);
    const text = screen.getByTestId("full-print-view").textContent!;
    expect(text).not.toContain("Mein Wille");
    expect(text).toContain("Vorsorge-Übersicht");
    expect(screen.getByTestId("full-print-page-notice").closest("thead")).not.toBeNull();
    for (const label of ["(keine Patientenverfügung)", "(keine Vollmacht)", "(keine Betreuungsverfügung)", "(kein Testament)", "§ 2247 BGB"]) {
      expect(text).toContain(label);
    }
    expect(text).not.toContain("Bevollmächtigte Person");
  });

  it("is not offered under a title that sounds like a will", () => {
    render(<I18nProvider><PdfPage /></I18nProvider>);
    const card = screen.getByTestId("export-full");
    expect(card.textContent).toContain("Gesamtübersicht");
    expect(card.textContent).toContain("Kein Testament");
    expect(card.textContent).not.toContain("Mein Wille");
  });
});

describe("locked flags outside the isolated test", () => {
  const LOCKED = /NEXT_PUBLIC_AMANAH_(TESTAMENT_PREPARATION|INHERITANCE_HINTS)\s*[:=]\s*["']?true/;

  it("no deployment file turns them on", () => {
    const candidates = [
      ...readdirSync(".").filter((f) => (f.startsWith(".env") && f.endsWith(".example")) || /^docker-compose|^Dockerfile/.test(f)),
      ...(existsSync("scripts") ? readdirSync("scripts", { recursive: true, encoding: "utf8" }).map((f) => `scripts/${f}`).filter((f) => /\.(sh|ya?ml|env|mjs|py)$/.test(f)) : []),
      ...(existsSync(".github/workflows") ? readdirSync(".github/workflows").map((f) => `.github/workflows/${f}`) : []),
    ];
    expect(candidates.length).toBeGreaterThan(0);
    for (const file of candidates) expect(readFileSync(file, "utf8"), file).not.toMatch(LOCKED);
  });

  it("the build refuses them outside its own folder", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toContain('"NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION", "NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS"');
    expect(config).toContain("Locked feature flags are on outside the isolated e2e build");
  });

  it("the normal e2e run does not include the flagged suite", () => {
    expect(readFileSync("playwright.config.ts", "utf8")).toContain('testDir: "./e2e"');
    expect(readFileSync("playwright.flags.config.ts", "utf8")).toContain('testDir: "./e2e-flags"');
  });
});

describe("module form accessibility", () => {
  it("connects every label and help text to its field", () => {
    render(<I18nProvider><TestamentPage /></I18nProvider>);
    const note = screen.getByLabelText(/Notizen zur Waṣiyya/);
    expect(note.tagName).toBe("TEXTAREA");
    expect(document.getElementById(note.getAttribute("aria-describedby")!)?.textContent).toContain("Nur eine Notiz");
    expect(screen.getByLabelText("Anzahl Söhne").tagName).toBe("INPUT");
    expect(screen.getByLabelText("Verheiratet?").tagName).toBe("SELECT");
  });
});
