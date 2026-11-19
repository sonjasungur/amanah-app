# Testamentsprozess für Deutschland – gesonderter Freigabebereich (Stand 01.11.2026)

**Für:** Owner und die spätere anwaltliche und fachliche Prüfung. Keine Rechtsberatung, keine Freigabe. Rechtliche Grundlagen und IDs: [Doku 32](32-juristische-pruefpunkte.md). Bestand: [Doku 18](18-testament-und-pruefworkflow.md).

**Grundsatz:** Amanah erstellt kein Testament. Das Produkt ordnet Angaben und bereitet das Gespräch vor. Ein Testament entsteht nur eigenhändig durch die Person selbst oder vor dem Notar.

## 1. Ablauf und Freigabetore

| # | Schritt | Technischer Stand | Tor vor Aktivierung | Sperre im Code |
|---|---|---|---|---|
| 1 | Einstieg: Hinweis „kein Testament“, Einwilligung Art. 9 DSGVO | Einwilligung vorhanden, Text „Entwurf“ | A (Datenschutz) | Consent-Gate |
| 2 | Fragebogen: Familie, Güterstand, Staatsangehörigkeit, Vermögen im Ausland, minderjährige Kinder | gebaut, gesperrt | A: Fragen und Hilfetexte (R-RDG-01) | `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION` |
| 3 | Erbenmodell für die islamische Modellinformation, inkl. Halbgeschwister, Adoption, mehrere Ehen, weitere Verwandte | gebaut, gesperrt; Sonderfälle blockiert | G: Umfang und Sperrfälle (R-ISL-01) | Flag |
| 4 | Wünsche: Testamentsvollstreckung, Vormund (eine Person oder Ehepaar), Ausschluss | gebaut, gesperrt; nur Wunsch | A (R-VORM-01) | Flag |
| 5 | Modellrechnung als Bruchteile | Rechnung nur Kernfamilie; Anzeige gebaut (auch je Person und Rechenschritte). Prüfpaket: `docs/review-packages/REGELWERK-MODELLRECHNUNG.md` | **G: Regelwerk geprüft und mit Name und Datum vermerkt**; A: Darstellung | Flag **und** `reviewStatus = scholar_reviewed` mit Name und Datum (im Code erzwungen); heute `unreviewed_draft` |
| 6 | Gesprächsunterlage mit Fragen an Anwalt oder Notar | gebaut, gesperrt | A: Anwaltsfragen, Bezeichnungen | Flag |
| 7 | Pflichtteilsvergleich | **nicht gebaut** | A, St; RDG-Grenze zuerst klären (R-PFL-01) | – |
| 8 | Abschreibvorlage mit Form-Checkliste | **nicht gebaut** | A: Zulässigkeit überhaupt (R-FORM-01) | – |
| 9 | Format für den Notarentwurf | **nicht gebaut** | N (R-FORM-02) | – |
| 10 | Vermächtniswünsche (Betrag, Prozent, Gegenstand, Begünstigte) | gebaut, gesperrt; nur Eingabeprüfung, keine Bewertung. Frage zur Drittel-Grenze nur bei Flag **und** benannter Prüfung | G (Drittel), A (R-VERM-01, Doku 36 B) | Flag; Drittel-Frage zusätzlich `scholar_reviewed` |
| 11 | Optionale Prüfung durch unabhängige Kanzlei im Direktmandat | Sandbox, keine Persistenz | A: Vertrag, § 49b BRAO, § 43e BRAO, AVV (R-BRAO-01/02) | `AMANAH_INTERNAL_TOOLS` |
| 12 | Nutzer schreibt selbst oder geht zum Notar; Verwahrung | Hinweise teils vorhanden | N (R-VERW-01) | – |

**Kein Zustand im Produkt bedeutet „rechtsgültig“.** Das ist getestet und bleibt so.

## 2. Reihenfolge der Freigaben

1. Fachanwalt: RDG-Grenze und Fragebogen (Schritte 1, 2, 4, 6, 10), anhand der Entscheidungsfragen in [Doku 36](36-anwaltliche-entscheidungsfragen.md). Ohne diese Antwort lohnt der Bau von 7 und 8 nicht.
2. Gelehrte: Umfang des Regelwerks und Sperrfälle (Schritte 3, 5, 10).
3. Kanzleimodell und Kooperationsvertrag (Schritt 11).
4. Erst danach: Flag, Tarif und Texte, jeweils mit eigener Owner-Freigabe.

## 3. Fragen, die im Code bewusst als Annahme stehen (Prüfung nötig)

| Stelle | Annahme | Wer prüft |
|---|---|---|
| `faraid-mapping.ts` | Weitere männliche Verwandte blockieren nur, wenn kein Sohn lebt; lebt ein Sohn, wird die Antwort nicht ausgewertet | G |
| `faraid-mapping.ts` | Halbgeschwister zählen wie Geschwister (Regel der Engine: blockiert ohne Sohn) | G |
| `faraid-mapping.ts` | Adoption und mehrere Ehen führen immer in den Sonderfall | G, A |
| `steps.ts` | Vormund nur als eine Person oder Ehepaar; Ersatzvormund wird nicht abgefragt | A |
| `lawyer-questions.ts` | Norm-Hinweise (§§ 1782, 1783, 2197 ff., 2087, 2150 BGB) zeigen nur das Thema an | A |
| `steps.ts`, `bequest-editor.tsx` | „Vermächtniswunsch“ als Bezeichnung, auch für Prozentangaben, obwohl ein Bruchteil nach § 2087 BGB eine Erbeinsetzung sein kann | A |
| `bequest-editor.tsx` | Die Summe der Prozente wird nur rechnerisch gezeigt; ein Hinweis erscheint erst über 100 % | A, G |
| `faraid-model-result.tsx` | Anteile gelten nach Bestattungskosten, Schulden und Vermächtnissen | G |

Die Rollen-Checkbox „Vormund“ in `/dashboard/personen` erlaubt mehrere Personen. Sie ist nur eine Notiz und wurde nicht geändert, sollte aber bei der Prüfung mit angesehen werden.
