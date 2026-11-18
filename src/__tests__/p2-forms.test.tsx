/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateInput, PasswordInput } from "@/components/ui/input";
import { HelpTip } from "@/components/ui/help-tip";
import { HELP_TOPICS, releasedHelp, type HelpTopicId } from "@/lib/content/help-topics";
import { checkBirthDate, formatDateTyping, formatDisplayDate, toIsoDate } from "@/lib/utils/date-input";
import { normalizeData } from "@/lib/domain/migration";
import { emergencyCardFields, ghuslKafanFields, medicalFields, powerOfAttorneyFields, careDirectiveFields, inheritanceFields, sadaqaFields } from "@/lib/modules/fields";
import { janazahFields } from "@/lib/modules/janazah-sections";

afterEach(cleanup);

describe("P2 date input TT.MM.JJJJ", () => {
  it.each([
    ["1", "", "1"],
    ["15", "1", "15."],
    ["15.03", "15.0", "15.03."],
    ["15031985", "", "15.03.1985"],
    ["1985-03-15", "", "15.03.1985"],
    ["1.", "1", "01."],
    ["01.3.", "01.3", "01.03."],
    ["15.03.19855", "15.03.1985", "15.03.1985"],
    ["15.03", "15.03.", "15.03"],
  ])("typing %s after %s gives %s", (next, prev, expected) => {
    expect(formatDateTyping(next, prev)).toBe(expected);
  });

  it("stores ISO and shows TT.MM.JJJJ; impossible dates are refused", () => {
    expect(toIsoDate("15.03.1985")).toBe("1985-03-15");
    expect(toIsoDate("31.02.1985")).toBeNull();
    expect(formatDisplayDate("1985-03-15")).toBe("15.03.1985");
    expect(formatDisplayDate("irgendwann")).toBe("irgendwann");
    expect(checkBirthDate("15.03", new Date("2026-11-18"))).toBe("incomplete");
    expect(checkBirthDate("31.02.1985")).toBe("invalid");
    expect(checkBirthDate("01.01.2999", new Date("2026-11-18"))).toBe("future");
  });

  it("older folders with TT.MM.JJJJ become ISO, free text stays as typed", () => {
    const data = normalizeData({ emergencyCard: { birthDate: "15.03.1978" } as never, userProfile: { birthDate: "ca. 1980" } as never });
    expect(data.emergencyCard.birthDate).toBe("1978-03-15");
    expect(data.userProfile.birthDate).toBe("ca. 1980");
  });

  it("the field adds dots while typing, reports ISO, keeps a deleted dot away and explains a wrong date", () => {
    const values: string[] = [];
    render(<DateInput id="geb" value="" onValueChange={(v) => values.push(v)} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.inputMode).toBe("numeric");
    expect(input.autocomplete).toBe("bday");
    fireEvent.change(input, { target: { value: "15" } });
    expect(input.value).toBe("15.");
    fireEvent.change(input, { target: { value: "15" } });
    expect(input.value).toBe("15");
    fireEvent.change(input, { target: { value: "15031985" } });
    expect(input.value).toBe("15.03.1985");
    expect(values.at(-1)).toBe("1985-03-15");
    fireEvent.change(input, { target: { value: "31.02.1985" } });
    fireEvent.blur(input);
    expect(screen.getByRole("alert").textContent).toContain("Dieses Datum gibt es nicht");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("birth date fields use the date input", () => {
    expect(emergencyCardFields.find((f) => f.key === "birthDate")?.type).toBe("date");
    expect(janazahFields.find((f) => f.key === "birthDate")?.type).toBe("date");
  });
});

describe("P2 password visibility", () => {
  it("the eye switches the display only, keeps the value, and is a labelled button", () => {
    render(<PasswordInput defaultValue="geheim-123" autoComplete="new-password" placeholder="••••••••" />);
    const input = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
    const eye = screen.getByRole("button", { name: "Passwort anzeigen" });
    expect(input.type).toBe("password");
    expect(eye.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(eye);
    expect(input.type).toBe("text");
    expect(input.value).toBe("geheim-123");
    expect(input.autocomplete).toBe("new-password");
    expect(screen.getByRole("button", { name: "Passwort verbergen" }).getAttribute("aria-pressed")).toBe("true");
    expect(input.hasAttribute("data-password")).toBe(true);
  });

  it("login, registration, reset and account deletion use it", () => {
    for (const file of ["src/components/auth/auth-form.tsx", "src/components/auth/account-recovery-forms.tsx", "src/components/storage/account-controls.tsx"]) {
      const src = readFileSync(file, "utf8");
      expect(src, file).toContain("<PasswordInput");
      expect(src, file).not.toMatch(/<Input[^>]*type="password"/);
    }
  });
});

describe("P2 contextual help", () => {
  const ids = Object.keys(HELP_TOPICS) as HelpTopicId[];

  it("covers the requested topics, each with meaning, reason, what to enter and whom to ask", () => {
    for (const id of ["ghusl", "kafan", "ghusl-personen", "schamgrenzen", "janazah-gebet", "bestattung-ort", "moschee-bestatter", "patientenverfuegung", "vorsorgevollmacht", "betreuungsverfuegung", "erbprofil", "wasiyya", "sadaqa-jariya", "digitaler-nachlass", "schulden-amanah", "dokumente-ablage"]) {
      expect(ids).toContain(id);
    }
    for (const id of ids) {
      const t = HELP_TOPICS[id];
      for (const part of [t.title, t.meaning, t.why, t.enter, t.ask]) expect(part.trim().length, id).toBeGreaterThan(2);
    }
  });

  it("states no religious duty and no legal effect while unreviewed", () => {
    for (const id of ids) {
      const text = Object.values(HELP_TOPICS[id]).join(" ");
      expect(text, id).not.toMatch(/\bPflicht\b|farḍ|wajib|verpflichtet|ist rechtlich wirksam|rechtsgültig|§/i);
      expect(releasedHelp(id), id).toBeNull();
    }
  });

  it("every help used by a field exists, and every topic is used somewhere", () => {
    const fields = [...emergencyCardFields, ...medicalFields, ...powerOfAttorneyFields, ...careDirectiveFields, ...ghuslKafanFields, ...inheritanceFields, ...sadaqaFields, ...janazahFields];
    const used = new Set(fields.map((f) => f.help).filter(Boolean) as string[]);
    for (const page of ["dokumente", "schulden-amanah", "digitaler-nachlass", "krankheit", "vollmacht", "betreuung", "sadaqa-jariya", "ghusl-kafan", "bestattung"]) {
      const src = readFileSync(`src/app/dashboard/${page}/page.tsx`, "utf8");
      for (const m of src.matchAll(/(?:topic|help)="([a-z-]+)"/g)) used.add(m[1]);
    }
    for (const id of used) expect(ids, id).toContain(id);
    for (const id of ids) expect([...used], id).toContain(id);
  });

  it("opens with a button, explains in plain words, and closes with Escape", () => {
    render(<HelpTip topic="ghusl" />);
    const button = screen.getByRole("button", { name: "Hilfe: Ghusl" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const panel = screen.getByRole("region", { name: "Erklärung: Ghusl" });
    expect(panel.textContent).toContain("Was du einträgst");
    expect(panel.textContent).toContain("keine Rechts- oder Fatwa-Beratung");
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(screen.queryByRole("region")).toBeNull();
  });
});
