/**
 * AP22 Welle 2 Teil A: EA-01.3 help module, EA-07 power-of-attorney wishes, EA-17.1 wording help
 * for the family letter, EA-18.1 digital legacy with the shared secret check.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData, normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, DigitalLegacyItem } from "@/lib/domain/types";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { findSecretLike, isSecretLike, scanForSecrets, SECRET_WITHHELD } from "@/lib/validation/secret-like";
import {
  describeAreaChoice,
  legacyPoaEntries,
  migrateLegacyPowerOfAttorney,
  normalizePoaWishes,
  powerOfAttorneyRows,
  powerOfAttorneyWishes,
} from "@/lib/vorsorge/power-of-attorney";
import {
  digitalEntryFindings,
  digitalEntryHasSecrets,
  digitalEntrySummary,
  normalizeDigitalLegacy,
} from "@/lib/vorsorge/digital-legacy";
import { appendPhrase, LETTER_PHRASES, LETTER_RECIPIENTS, LETTER_TOPICS } from "@/lib/family-letter/phrases";
import { allFieldHelp, getFieldHelp, parseFieldHelpFile, toFieldHelpView } from "@/lib/help/registry";
import { FIELD_HELP_IDS } from "@/lib/help/types";
import { ghuslKafanArticles } from "@/lib/knowledge/ghusl-kafan";
import { islamicSources } from "@/lib/knowledge/sources";
import { HELP_TOPICS } from "@/lib/content/help-topics";
import { applyConfirmedUpdates, validateUpdates } from "@/lib/guided-flow/apply-confirmed-updates";
import { getQuestionById } from "@/lib/guided-flow/question-plan";
import { isAllowedFieldPath } from "@/lib/guided-flow/config";
import { buildGesamt } from "@/lib/documents/model";
import { buildPackage } from "@/lib/vorsorge/emergency-package";
import { buildReadableEmergencySections } from "@/lib/export/readable-emergency-export";

const fresh = (): AmanahOrdnerData => structuredClone(defaultAmanahData);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------------------------
describe("Shared secret check (Datenlandkarte §5)", () => {
  it.each([
    ["Passwort: Sonne123", "keyword_value"],
    ["Kennwort = geheim", "keyword_value"],
    ["PIN 1234", "pin_code"],
    ["Tresor-Code ist 887766", "pin_code"],
    ["DE89 3704 0044 0532 0130 00", "iban"],
    ["DE89370400440532013000", "iban"],
    ["Karte 4111 1111 1111 1111", "card_number"],
    ["abandon ability able about above absent absorb abstract absurd abuse access accident", "seed_phrase"],
  ])("flags %s", (text, kind) => {
    expect(findSecretLike(text).map((f) => f.kind)).toContain(kind);
  });

  it.each([
    "Notfallzugang im Passwort-Manager eingerichtet",
    "Passwort: im Passwort-Manager",
    "Zugangsdaten liegen im versiegelten Umschlag beim Notar",
    "PIN: liegt im Bankschließfach",
    "Gmail-Hauptkonto",
    "Telefon 0176 12345678",
    "Meine Kinder sollen die Fotos bekommen und das Konto danach löschen.",
  ])("does not flag the harmless hint %s", (text) => {
    expect(isSecretLike(text)).toBe(false);
  });

  it("limits digits in a row for references, and never returns the value", () => {
    expect(findSecretLike("Vertrag 12345678", { maxDigitsInRow: 4 }).map((f) => f.kind)).toEqual(["long_number"]);
    expect(isSecretLike("Endung 4711", { maxDigitsInRow: 4 })).toBe(false);
    const findings = findSecretLike("Passwort: Sonne123");
    expect(JSON.stringify(findings)).not.toContain("Sonne123");
    expect(scanForSecrets({ a: { b: ["ok", "PIN=1234"] } })).toEqual([{ path: "a.b[1]", kinds: expect.arrayContaining(["keyword_value"]) }]);
  });
});

// ---------------------------------------------------------------------------------------------
describe("EA-01.3 help module", () => {
  it("uses only the existing Ghusl texts, word for word, and is unreviewed", () => {
    const ghusl = ghuslKafanArticles.find((a) => a.id === "gk-ghusl")!;
    const source = islamicSources["fiqh-ghusl-kafan"];
    const anwesende = getFieldHelp("ghusl-anwesende");
    expect(anwesende.vorgabe).toBe(ghusl.content);
    expect(anwesende.auffassungen).toBe(source.note);
    expect(anwesende.begriff).toBe(HELP_TOPICS["ghusl-personen"].meaning);
    expect(anwesende.entscheidung).toBe(HELP_TOPICS["ghusl-personen"].enter);
    expect(getFieldHelp("ghusl-waschung").vorgabe).toContain(source.translationDe!);
    for (const entry of allFieldHelp()) {
      expect(entry.pruefstatus).toBe("ungeprueft");
      expect(entry.spielraum).toBeUndefined(); // no existing text, nothing invented
      expect(entry.quellen.length).toBeGreaterThan(0);
    }
    expect(allFieldHelp().map((e) => e.id)).toEqual([...FIELD_HELP_IDS]);
  });

  it("every article link names an existing knowledge-centre article (no dead link)", async () => {
    const { getCentreArticle } = await import("@/modules/islamic-knowledge/full-articles/rubrics");
    for (const entry of allFieldHelp()) if (entry.artikelSlug) expect(getCentreArticle(entry.artikelSlug), entry.id).toBeTruthy();
  });

  it("sends religious parts and the article link only in the preview", () => {
    const entry = getFieldHelp("ghusl-waschung");
    const off = toFieldHelpView(entry, { preview: false, availableArticles: new Set() });
    expect(off).toMatchObject({ restricted: true, quellen: [], pruefstatus: "ungeprueft" });
    expect(off.vorgabe).toBeUndefined();
    expect(off.artikelHref).toBeUndefined();
    const on = toFieldHelpView(entry, { preview: true, availableArticles: new Set(["p25-c-ghusl-kafan"]) });
    expect(on.restricted).toBe(false);
    expect(on.vorgabe).toBeTruthy();
    expect(on.artikelHref).toBe("/wissen/zentrum/artikel/p25-c-ghusl-kafan");
    // No dead link: an article that is not reachable is not linked.
    expect(toFieldHelpView(entry, { preview: true, availableArticles: new Set() }).artikelHref).toBeUndefined();
  });

  it("API: 404 for unknown ids; article link only with the switch and an existing article", async () => {
    const { GET } = await import("@/app/api/help/[id]/route");
    const call = async (id: string) => GET(new Request("http://x"), { params: Promise.resolve({ id }) });
    expect((await call("unbekannt")).status).toBe(404);
    vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "false");
    const off = await (await call("ghusl-anwesende")).json();
    expect(off.help.restricted).toBe(true);
    expect(off.help.artikelHref).toBeUndefined();
    vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "true");
    const on = await (await call("ghusl-anwesende")).json();
    expect(on.help.restricted).toBe(false);
    expect(on.help.artikelHref).toBe("/wissen/zentrum/artikel/p25-c-ghusl-kafan");
  });

  it("reads research files safely (only https or internal links, unreviewed unless stated)", () => {
    const { entries, errors } = parseFieldHelpFile(
      { eintraege: [{ id: "x", begriff: "B", quellen: [{ text: "Q1", href: "javascript:alert(1)" }, { text: "Q2", link: "https://example.org/a" }] }, { id: "y" }] },
      "recherche/hilfetexte-test.json",
    );
    expect(errors).toHaveLength(1);
    expect(entries[0].pruefstatus).toBe("ungeprueft");
    expect(entries[0].quellen).toEqual([{ text: "Q1" }, { text: "Q2", href: "https://example.org/a" }]);
  });

  it("renders as an accessible ⓘ button with the review status always visible", async () => {
    const { FieldHelp, clearFieldHelpCache } = await import("@/components/help/field-help");
    clearFieldHelpCache();
    const view = toFieldHelpView(getFieldHelp("ghusl-anwesende"), { preview: true, availableArticles: new Set(["p25-c-ghusl-kafan"]) });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ help: view }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<FieldHelp id="ghusl-anwesende" label="Wer darf anwesend sein?" />);
    const button = screen.getByRole("button", { name: "Erklärung: Wer darf anwesend sein?" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("field-help-pruefstatus").textContent).toBe("Noch nicht fachlich geprüft");
    await waitFor(() => expect(screen.getByTestId("field-help-vorgabe")).toBeTruthy());
    expect(screen.getByTestId("field-help-entscheidung").textContent).toContain("Was du entscheidest");
    expect(screen.getByTestId("field-help-artikel").getAttribute("href")).toBe("/wissen/zentrum/artikel/p25-c-ghusl-kafan");
    expect(fetchMock).toHaveBeenCalledWith("/api/help/ghusl-anwesende");
    fireEvent.keyDown(screen.getByRole("region"), { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("is attached to three Ghusl/Kafan fields and stays out of the client bundle", () => {
    const fields = readFileSync("src/lib/modules/fields.ts", "utf8");
    for (const id of FIELD_HELP_IDS) expect(fields).toContain(`fieldHelp: "${id}"`);
    const client = readFileSync("src/components/help/field-help.tsx", "utf8");
    expect(client).not.toMatch(/lib\/help\/registry|lib\/knowledge\//);
  });
});

// ---------------------------------------------------------------------------------------------
describe("EA-07 power-of-attorney wishes", () => {
  it("migrates old texts without loss: ja → preferred person, other text → undecided, all ja → all matters", () => {
    const allYes = { ...fresh().powerOfAttorney, medical: "Ja", authorities: "ja.", bank: "x", housing: "JA", care: "ja" };
    expect(migrateLegacyPowerOfAttorney(allYes).scope).toBe("all");

    const mixed = { ...fresh().powerOfAttorney, authorizedPerson: "Yusuf", medical: "ja", bank: "Nur Girokonto, nicht das Depot", burial: "Bruder kümmert sich", digitalAccounts: "Hinweise im Passwort-Manager" };
    const w = migrateLegacyPowerOfAttorney(mixed);
    expect(w.scope).toBe("split");
    expect(w.areas.health).toEqual({ holder: "authorized" });
    expect(w.areas.finance).toEqual({ holder: "undecided" });
    expect(w.areas.mail).toEqual({ holder: "undecided" });
    // The old texts stay as they are and are listed as "Früher eingetragen".
    expect(legacyPoaEntries(mixed).map((e) => e.value)).toEqual(["ja", "Nur Girokonto, nicht das Depot", "Bruder kümmert sich", "Hinweise im Passwort-Manager"]);
    expect(migrateLegacyPowerOfAttorney({ ...fresh().powerOfAttorney }).scope).toBe("all");
  });

  it("normalisation keeps old fields, reads saved wishes, drops malformed values, is repeatable", () => {
    const raw = {
      ...fresh(),
      powerOfAttorney: { ...fresh().powerOfAttorney, medical: "Alter Text", wishes: { scope: "split", areas: { health: { holder: "other", personId: "p1", personName: "Amina" }, bank: { holder: "x" } }, onlineAccounts: "vielleicht", additionalNotes: "Hinweis" } },
    };
    const once = normalizeData(raw as unknown as AmanahOrdnerData);
    expect(once.powerOfAttorney.medical).toBe("Alter Text");
    expect(once.powerOfAttorney.wishes!.areas.health).toEqual({ holder: "other", personId: "p1", personName: "Amina" });
    expect(once.powerOfAttorney.wishes!.areas.finance).toEqual({ holder: "undecided" });
    expect(once.powerOfAttorney.wishes!.onlineAccounts).toBe("");
    expect(normalizeData(once)).toEqual(once);
    expect(normalizePoaWishes("kaputt")).toBeUndefined();
    // Without saved wishes the reader falls back to the old structure.
    const old = normalizeData({ ...fresh(), powerOfAttorney: { ...fresh().powerOfAttorney, medical: "ja", care: "Nein" } });
    expect(old.powerOfAttorney.wishes).toBeUndefined();
    expect(powerOfAttorneyWishes(old.powerOfAttorney).scope).toBe("split");
  });

  it("outputs read the new structure and still show the old texts; secret-like texts are withheld", () => {
    const d = fresh();
    d.familyMembers = [{ id: "p1", name: "Amina", relation: "Schwester" }];
    d.powerOfAttorney = {
      ...d.powerOfAttorney,
      authorizedPerson: "Yusuf",
      substitutePerson: "Fatima",
      care: "Pflege zu Hause, wenn möglich",
      digitalAccounts: "Passwort: Sonne123",
      wishes: { ...migrateLegacyPowerOfAttorney(d.powerOfAttorney), scope: "split", areas: { ...migrateLegacyPowerOfAttorney(d.powerOfAttorney).areas, health: { holder: "other", personId: "p1" }, finance: { holder: "substitute" } }, additionalNotes: "Bitte mit der Familie absprechen." },
    };
    const rows = Object.fromEntries(powerOfAttorneyRows(d));
    expect(rows["Umfang"]).toBe("Aufteilung nach Bereichen");
    expect(rows["Gesundheit"]).toBe("Andere Person: Amina");
    expect(rows["Finanzen und Bank"]).toBe("Ersatzperson (Fatima)");
    expect(rows["Post und Fernmeldeverkehr"]).toBe("Noch nicht festgelegt");
    expect(rows["Pflege (früher eingetragen)"]).toBe("Pflege zu Hause, wenn möglich");
    expect(rows["Digitale Konten (früher eingetragen)"]).toBe(SECRET_WITHHELD);
    expect(describeAreaChoice(d, { holder: "authorized" })).toBe("Vorgesehene Person (Yusuf)");

    const gesamt = JSON.stringify(buildGesamt(d));
    expect(gesamt).toContain("Wünsche zur Vollmacht (keine Vollmacht)");
    expect(gesamt).toContain("Pflege zu Hause, wenn möglich");
    expect(gesamt).not.toContain("Sonne123");
    const pkg = JSON.stringify(buildPackage(d, new Set(["vollmacht"]), new Set()));
    expect(pkg).toContain("Andere Person: Amina");
    expect(pkg).toContain("Vorgesehene Person (Vollmacht)");
    const exp = JSON.stringify(buildReadableEmergencySections(d));
    expect(exp).toContain("Bitte mit der Familie absprechen.");
    expect(exp).toContain("Pflege zu Hause, wenn möglich");
    expect(exp).not.toContain("Sonne123");
  });

  it("D-26: the filling assistant writes digital accounts into the digital legacy, never into the power of attorney", () => {
    const q = getQuestionById("gf-digital-accounts")!;
    expect(q.fieldPath).toBe("digitalLegacy");
    expect(isAllowedFieldPath("powerOfAttorney.digitalAccounts")).toBe(false);
    const d = fresh();
    d.digitalLegacy = [{ id: "old", type: "email", description: "Gmail", locationHint: "" }];
    const { data, applied } = applyConfirmedUpdates(d, [{ fieldPath: "digitalLegacy", label: "", value: "Netflix und Spotify kündigen", confidence: "high", moduleId: "digitaler-nachlass" }]);
    expect(applied).toEqual(["digitalLegacy"]);
    expect(data.powerOfAttorney.digitalAccounts).toBe("");
    expect(data.digitalLegacy).toHaveLength(2);
    expect(data.digitalLegacy[0]).toEqual(d.digitalLegacy[0]);
    expect(data.digitalLegacy[1]).toMatchObject({ category: "other", provider: { name: "Netflix und Spotify kündigen" } });
    const refused = applyConfirmedUpdates(d, [{ fieldPath: "digitalLegacy", label: "", value: "PIN: 1234", confidence: "high", moduleId: "digitaler-nachlass" }]);
    expect(refused.rejected[0]).toMatch(/Zugangsdaten/);
    expect(refused.data.digitalLegacy).toHaveLength(1);
    expect(validateUpdates([{ fieldPath: "powerOfAttorney.digitalAccounts", label: "", value: "x", confidence: "high", moduleId: "vollmacht" }]).invalid).toEqual(["powerOfAttorney.digitalAccounts"]);
  });

  it("page: notice, structured choices, burial pointer, old texts with deliberate delete", async () => {
    const d = fresh();
    d.familyMembers = [{ id: "p1", name: "Amina", relation: "Schwester", roles: ["vertrauensperson"] }];
    d.powerOfAttorney = { ...d.powerOfAttorney, medical: "ja", burial: "Bruder kümmert sich" };
    useAmanahStore.setState({ ...d, saveStatus: "idle" });
    const { default: Page } = await import("@/app/dashboard/vollmacht/page");
    render(<Page />);
    expect(screen.getByTestId("poa-not-effective").textContent).toContain("Deine Wünsche – keine wirksame Vollmacht");
    expect(screen.getByTestId("poa-burial-note").querySelector("a")!.getAttribute("href")).toBe("/dashboard/janazah");
    expect(screen.getByTestId("poa-legacy-burial").textContent).toContain("Bruder kümmert sich");
    // Derived from the old texts: split, health = preferred person.
    expect((screen.getByTestId("poa-scope-split") as HTMLInputElement).checked).toBe(true);
    expect(screen.getAllByRole("textbox")).toHaveLength(1); // only "Zusätzliche Hinweise"

    // Choose a person from "Familie & Kontakte".
    const select = screen.getByTestId("poa-person-authorizedPerson").querySelector("select")!;
    act(() => {
      fireEvent.change(select, { target: { value: "p1" } });
    });
    expect(useAmanahStore.getState().powerOfAttorney.authorizedPerson).toBe("Amina");
    expect(useAmanahStore.getState().vorsorgeMeta.personLinks.authorizedPerson).toBe("p1");

    act(() => {
      fireEvent.click(screen.getByTestId("poa-scope-all"));
    });
    expect(useAmanahStore.getState().powerOfAttorney.wishes!.scope).toBe("all");
    expect(useAmanahStore.getState().powerOfAttorney.medical).toBe("ja"); // never overwritten

    const burial = screen.getByTestId("poa-legacy-burial");
    act(() => {
      fireEvent.click(burial.querySelector("button")!);
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    });
    expect(useAmanahStore.getState().powerOfAttorney.burial).toBe("");
  });
});

// ---------------------------------------------------------------------------------------------
describe("EA-17.1 wording help for the family letter", () => {
  it("has phrases for every recipient and topic, without Qurʾān or Hadith quotations", () => {
    expect(LETTER_RECIPIENTS.map((r) => r.id)).toEqual(["ehefrau", "ehemann", "kinder", "eltern", "geschwister", "andere"]);
    for (const r of LETTER_RECIPIENTS) for (const t of LETTER_TOPICS) expect(LETTER_PHRASES[r.id][t.id].length).toBeGreaterThan(0);
    const all = JSON.stringify(LETTER_PHRASES);
    expect(all).not.toMatch(/Sure|Sura|Hadith|Prophet|überliefert|Vers |Qur/i);
    expect(all).not.toMatch(/Testament|erbt|vermache/i);
  });

  it("appends a phrase as a new paragraph and never replaces the letter", () => {
    expect(appendPhrase("", "A")).toBe("A");
    expect(appendPhrase("Mein Text\n", "A")).toBe("Mein Text\n\nA");
  });

  it("page: click takes the sentence into the letter; the hint says it is no will", async () => {
    useAmanahStore.setState({ ...fresh(), familyMessage: { ...fresh().familyMessage, familyLetter: "Liebe Familie," }, saveStatus: "idle" });
    const { default: Page } = await import("@/app/dashboard/familie/page");
    render(<Page />);
    expect(screen.getByTestId("letter-phrases-notice").textContent).toBe("Kein Testament – rechtlich bindende Verfügungen gehören ins Testament.");
    fireEvent.click(screen.getByLabelText("Eltern"));
    const first = screen.getAllByTestId("letter-phrase")[0];
    act(() => {
      fireEvent.click(first);
    });
    expect(useAmanahStore.getState().familyMessage.familyLetter).toBe(`Liebe Familie,\n\n${LETTER_PHRASES.eltern.abschied[0]}`);
    // The letter structure is unchanged.
    for (const id of ["letter-greeting", "letter-body", "letter-closing", "letter-signature", "letter-place", "letter-bismillah"]) expect(screen.getByTestId(id)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------------------------
describe("EA-18.1 digital legacy", () => {
  const old: DigitalLegacyItem[] = [
    { id: "a", type: "email", description: "Gmail-Hauptkonto", locationHint: "Notfall-Kit im Schrank" },
    { id: "b", type: "password_manager", description: "1Password", locationHint: "Master-Passwort: Sonne123" },
    { id: "c", type: "file", description: "Fotos auf USB-Stick", locationHint: "" },
  ];

  it("migrates old entries without loss (category, provider, access note) and is repeatable", () => {
    const [a, b, c] = normalizeDigitalLegacy(old);
    expect(a).toMatchObject({ ...old[0], category: "email", provider: { name: "Gmail-Hauptkonto" }, secureAccessNote: "Notfall-Kit im Schrank", secureAccess: "not_arranged" });
    // The old hint looks like a secret: it is not taken over, stays where it was and is flagged.
    expect(b).toMatchObject({ ...old[1], category: "other", contractType: "password_manager" });
    expect(b.secureAccessNote).toBeUndefined();
    expect(digitalEntryHasSecrets(b)).toBe(true);
    expect(c).toMatchObject({ category: "other", contractType: "file" });
    expect(normalizeDigitalLegacy(normalizeDigitalLegacy(old))).toEqual(normalizeDigitalLegacy(old));
    // Through the folder migration as well, also from an old folder without schema version.
    const migrated = migrateRawData({ digitalLegacy: old } as Record<string, unknown>);
    expect(migrated.digitalLegacy.map((d) => [d.id, d.type, d.description, d.locationHint])).toEqual(old.map((d) => [d.id, d.type, d.description, d.locationHint]));
  });

  it("drops only wrong values, keeps known new fields", () => {
    const [x] = normalizeDigitalLegacy([{ id: "x", description: "", locationHint: "", category: "falsch", treatments: ["delete", "fliegen", "delete"], provider: { knownId: "nicht-bekannt", name: "Foo" }, secureAccess: "pw_manager_emergency" }]);
    expect(x.category).toBeUndefined();
    expect(x.treatments).toEqual(["delete"]);
    expect(x.provider).toEqual({ name: "Foo" });
    expect(x.secureAccess).toBe("pw_manager_emergency");
  });

  it("validates reference and notes: no long numbers, IBAN, password or PIN", () => {
    const ok = { providerName: "Telekom", reference: "Familienvertrag, Endung 4711", treatmentNote: "", secureAccessNote: "Schwester weiß Bescheid" };
    expect(digitalEntryFindings(ok)).toEqual({});
    const bad = digitalEntryFindings({ providerName: "Bank", reference: "Kundennr. 12345678", treatmentNote: "IBAN DE89370400440532013000", secureAccessNote: "PIN: 4711" });
    expect(Object.keys(bad).sort()).toEqual(["reference", "secureAccessNote", "treatmentNote"]);
  });

  it("outputs show the new fields and withhold secret-like old texts", () => {
    const d = fresh();
    d.familyMembers = [{ id: "p1", name: "Amina", relation: "Schwester" }];
    d.digitalLegacy = [
      ...normalizeDigitalLegacy(old),
      { id: "n", description: "", locationHint: "", category: "social", provider: { knownId: "facebook", name: "Facebook" }, treatments: ["memorialize"], trustedPersonId: "p1", secureAccess: "provider_legacy_contact" },
    ];
    const s = digitalEntrySummary(d, d.digitalLegacy[3]);
    expect(s).toEqual({ kind: "Soziale Netzwerke und Messenger", title: "Facebook", detail: "Wunsch: Gedenkzustand (wo der Anbieter ihn anbietet) · Zuständig: Amina · Zugang: Nachlass- oder Inaktivitätskontakt beim Anbieter eingerichtet" });
    for (const out of [JSON.stringify(buildGesamt(d)), JSON.stringify(buildPackage(d, new Set(["digital"]), new Set(["digital"]))), JSON.stringify(buildReadableEmergencySections(d))]) {
      expect(out).toContain("Facebook");
      expect(out).toContain("Gmail-Hauptkonto");
      expect(out).not.toContain("Sonne123");
    }
  });

  describe("page", () => {
    beforeEach(() => {
      const d = fresh();
      d.familyMembers = [{ id: "p1", name: "Amina", relation: "Schwester" }];
      d.digitalLegacy = normalizeDigitalLegacy(old);
      d.powerOfAttorney = { ...d.powerOfAttorney, digitalAccounts: "Netflix kündigen" };
      useAmanahStore.setState({ ...d, saveStatus: "idle" });
    });

    it("blocks a password in the form and saves a structured entry", async () => {
      const { default: Page } = await import("@/app/dashboard/digitaler-nachlass/page");
      render(<Page />);
      expect(screen.getAllByTestId("digital-legacy-note")[0].textContent).toContain("Früher eingetragen");
      expect(screen.getAllByTestId("digital-secret-warning")).toHaveLength(1);

      fireEvent.change(screen.getByTestId("digital-known-provider"), { target: { value: "netflix" } });
      fireEvent.change(screen.getByTestId("digital-access-note"), { target: { value: "Passwort: Sonne123" } });
      expect(screen.getByTestId("digital-error-secureAccessNote")).toBeTruthy();
      expect((screen.getByTestId("digital-save") as HTMLButtonElement).disabled).toBe(true);

      fireEvent.change(screen.getByTestId("digital-access-note"), { target: { value: "Amina weiß Bescheid" } });
      fireEvent.change(screen.getByTestId("digital-person"), { target: { value: "p1" } });
      fireEvent.click(screen.getByLabelText("Kündigen"));
      act(() => {
        fireEvent.click(screen.getByTestId("digital-save"));
      });
      const saved = useAmanahStore.getState().digitalLegacy.at(-1)!;
      expect(saved).toMatchObject({ category: "subscription", provider: { knownId: "netflix", name: "Netflix" }, treatments: ["cancel"], trustedPersonId: "p1", secureAccessNote: "Amina weiß Bescheid" });
      expect(useAmanahStore.getState().digitalLegacy).toHaveLength(4);
    });

    it("offers the old power-of-attorney text as an entry, without deleting it there", async () => {
      const { default: Page } = await import("@/app/dashboard/digitaler-nachlass/page");
      render(<Page />);
      act(() => {
        fireEvent.click(screen.getByTestId("digital-take-from-poa"));
      });
      expect(useAmanahStore.getState().digitalLegacy.at(-1)).toMatchObject({ provider: { name: "Netflix kündigen" } });
      expect(useAmanahStore.getState().powerOfAttorney.digitalAccounts).toBe("Netflix kündigen");
      expect(screen.queryByTestId("digital-take-from-poa")).toBeNull();
    });
  });
});
