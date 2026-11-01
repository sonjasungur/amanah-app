# Anwaltliche Entscheidungsfragen: Dokumentausgabe und Kanzleimodell (Stand 01.11.2026)

**Für:** unabhängige Fachanwältin oder Fachanwalt für Erbrecht, mit Blick auf RDG, BRAO, UWG und Verbraucherrecht. **Keine Rechtsberatung und keine Freigabe.** Die Hinweise sind unsere Arbeitsannahmen und sollen geprüft werden.

**Grundlagen:** Normen, Quellen und Status in [Doku 32](32-juristische-pruefpunkte.md) (IDs wie R-RDG-01). Ablauf in [Doku 35](35-testamentsprozess-deutschland.md).

**Das Produkt:** deutschsprachiges Vorsorgeportal für Muslime in Deutschland, Arbeitsname Amanah, Oberfläche heute „Mein Wille“. Es erstellt keine Testamente. Regelbasierter Fragebogen, keine KI im Testamentbereich, keine Rückfragen an Nutzer durch Mitarbeitende.

**Bitte je Frage eine Option ankreuzen und kurz begründen.** „Nicht zulässig“ ist eine brauchbare Antwort: Wir bauen dann nicht oder bauen zurück.

## A. Dokumentausgabe

Heute gibt es weder Abschreibvorlage noch Notarentwurf. Gebaut und gesperrt ist nur die „Gesprächsunterlage“: Angaben plus Fragen an Anwalt oder Notar, Titel „kein Testament“.

| Nr. | Entscheidungsfrage | Optionen | Folge im Produkt |
|---|---|---|---|
| A1 | Darf ein Generator aus Nutzerangaben eine Abschreibvorlage mit Namen und Quoten ausgeben (R-FORM-01, R-RDG-01)? | ☐ ja ☐ nur ohne Personendaten ☐ nur nach Anwaltsprüfung im Einzelfall ☐ nein | Entscheidet, ob Schritt 8 gebaut wird. Bei „nein“ bleibt es bei der Gesprächsunterlage. |
| A2 | Trägt die Smartlaw-Entscheidung (BGH I ZR 113/20) auch für letztwillige Verfügungen, und mit welchen Grenzen? | ☐ ja ☐ eingeschränkt: ______ ☐ nein | Rahmen für alle Fragen in A und B |
| A3 | Ab wann wird unser regelbasierter Fragebogen zur Einzelfallprüfung (§ 2 RDG)? Hier: Sprünge nach Antworten, Sperrfälle, abgeleitete Fragen an den Anwalt. | ☐ heute unbedenklich ☐ unbedenklich mit Änderung: ______ ☐ bedenklich | Fragebogen und `lawyer-questions.ts` bleiben, ändern sich oder entfallen |
| A4 | Darf die Gesprächsunterlage Normhinweise nennen (z. B. „§ 2087 BGB“ an einer Frage)? | ☐ ja ☐ nur allgemein ☐ nein | Hinweise bleiben oder entfallen |
| A5 | Darf eine Unterlage für den Notar die Wünsche gegliedert zusammenfassen (R-FORM-02)? Wird das zum Entwurf? | ☐ ja, auch als „Entwurf“ ☐ ja, nur als „Stichpunkte“ ☐ nein; Notar einbeziehen | Schritt 9 |
| A6 | Darf eine Modellrechnung nach islamischer Lehre neben Testamentsthemen stehen, wenn sie klar als Modell ohne Rechtswirkung bezeichnet ist? Darf ein Pflichtteilsvergleich auf Basis der Familienangaben erscheinen (R-PFL-01)? | Modell: ☐ ja ☐ nur getrennt ☐ nein. Vergleich: ☐ ja ☐ nur abstrakt ☐ nein | Schritte 5 und 7 |
| A7 | Welche Pflichtwarnungen und Bezeichnungen braucht jede Ausgabe? Unser Text steht in `vorbereitung/page.tsx`. | Text: ______ | Texte vor Aktivierung |

### Heute schon aktiv: bitte mit prüfen

Diese Funktionen sind nutzbar und wurden nie anwaltlich geprüft. Am 01.11. wurde der Stand vorsorglich entschärft; die Änderung ist technisch, keine rechtliche Bewertung. Stand im Code: lokal, noch nicht deployt.

| Nr. | Funktion | Stand nach der Durchsicht | Frage | Optionen |
|---|---|---|---|---|
| A8 | **Vermögensübersicht** mit Druck (`asset-print-view.tsx`), eigene Seite `/dashboard/vermoegen`, vorläufig kostenlos | Art, Bezeichnung, Ort der Unterlagen, bei Immobilien Kredit und Eigentum. Ohne Beträge und Notizen, Titel „Kein Testament“ | Unbedenklich als Bestandsaufnahme? | ☐ ja ☐ mit Änderung: ______ ☐ nein |
| A9 | **Ampel „Erste Hinweise“** (grün, gelb, rot) | **Abgeschaltet** hinter `NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS`. Gründe: Sie bewertet Freitext und Familienangaben automatisch; „Keine Auffälligkeiten erkannt“ kann als Prüfung gelesen werden; die Warnungen enthalten ungeprüfte religiöse Aussagen (etwa „maximal ein Drittel“); die Stichwortsuche liefert Fehlalarme (Sadaqa-Text „Brunnen 2025“ gilt als über 33). Ersatz: neutrale Fragen allein aus den Fakten, ohne Auswertung des Freitexts | Dürfen die neutralen Fragen bleiben? Darf die Ampel in irgendeiner Form zurückkommen? | Fragen: ☐ ja ☐ mit Änderung: ______ ☐ nein. Ampel: ☐ ja, so ☐ mit Änderung: ______ ☐ nie |
| A10 | **Bezeichnungen des Gesamtausdrucks** | Geändert: „Mein Wille — Komplett“ wurde „Vorsorge-Übersicht“, „Mein Wille als PDF speichern“ wurde „Gesamtübersicht als PDF speichern“. Auf jeder Druckseite steht „kein Testament, keine Vollmacht, keine Patientenverfügung“. Abschnitte heißen z. B. „Wünsche zur medizinischen Behandlung (keine Patientenverfügung)“. Offen bleibt der Produktname „Mein Wille“ selbst (Doku 33, R-UWG-01) | Reicht das? Ist „Mein Wille“ als Produktname für diesen Dienst vertretbar? Ist der Bereichstitel „Testament & Erbe“ vertretbar? | ☐ ja ☐ ändern: ______ |
| A11 | **Freitextfeld Waṣiyya** samt Ausdruck | Geändert: „Gewünschte Waṣiyya (max. 1/3)“ wurde „Deine Notizen zur Waṣiyya (unverbindlich)“, mit dem Hinweis, dass die Notiz kein Testament ist und nichts regelt. Die Drittel-Angabe ist entfernt: Sie ist eine ungeprüfte religiöse Aussage und zivilrechtlich keine Grenze. Gleiches gilt für Sadaqa Jariya | Besteht weiter das Risiko, dass ein Ausdruck als Verfügung missverstanden wird? | ☐ keine Maßnahme ☐ Hinweis: ______ ☐ entfernen |

## B. Vermächtniswünsche

Gebaut und gesperrt: Eingabe von Betrag, Prozent oder Gegenstand mit Begünstigten, dazu „Würde die Person auch erben?“. Geprüft wird nur die Eingabe (Zahl, Pflichtfeld). Über 100 % erscheint ein rechnerischer Hinweis. Die Eingaben landen als „nur als Wunsch“ in der Gesprächsunterlage und erzeugen Fragen an den Anwalt.

| Nr. | Entscheidungsfrage | Optionen | Folge im Produkt |
|---|---|---|---|
| B1 | **Prozentangaben:** Nach § 2087 Abs. 1 BGB ist die Zuwendung eines Bruchteils des Vermögens als Erbeinsetzung anzusehen. Die Oberfläche nennt die Einträge jetzt „unverbindliche Wünsche zur fachlichen Prüfung“ und erklärt bei jeder Prozentangabe, dass die Einordnung offen ist und ein Anteil als Einsetzung zum Erben gelten kann. Reicht das? | ☐ so lassen ☐ andere Bezeichnung: ______ ☐ Prozent-Eingabe entfernen | Bezeichnung und Feld |
| B2 | Ist „Vermächtnis“ als Wort für einen unverbindlichen Wunsch zulässig (R-UWG-01)? | ☐ ja ☐ nur „Zuwendungswunsch“ ☐ anders: ______ | Oberflächentext |
| B3 | Ist die Addition der Prozente und der Hinweis über 100 % noch reine Eingabehilfe? | ☐ ja ☐ nein | Summe bleibt oder entfällt |
| B4 | Ist die Frage „Würde die Person auch erben?“ zulässig? Sie führt zu einer Frage zum Vorausvermächtnis (§ 2150 BGB). | ☐ ja ☐ nein | Feld bleibt oder entfällt |
| B5 | Eine Frage zur islamischen Drittel-Grenze erscheint nur nach Gelehrtenprüfung. Zivilrechtlich ist sie keine Grenze (R-VERM-01). Reicht die Trennung so? | ☐ ja ☐ zusätzlicher Hinweis: ______ | Text in `bequest-editor.tsx` |

## C. Kanzleimodell

Heute gibt es nur eine interne Sandbox ohne Persistenz und ohne Vertrag. Bindende Vorfrage: Wie darf der Nutzer zu einer Kanzlei kommen, und wofür darf Amanah Geld erhalten (R-BRAO-01, R-BRAO-02)?

**Zu bewertende Modelle:**

| Modell | Ablauf | Zahlung | Zulässig? |
|---|---|---|---|
| K1 Verzeichnis | Nutzer wählt aus einer Liste, kontaktiert die Kanzlei selbst und nimmt seine Unterlage mit | Keine Zahlung der Kanzlei | ☐ ja ☐ mit Auflage ☐ nein |
| K2 Softwarepauschale | Kanzlei nutzt die Plattform; Übermittlung nach Einwilligung | Kanzlei zahlt fallunabhängig pauschal an Amanah | ☐ ja ☐ mit Auflage ☐ nein |
| K3 Direktmandat | Mandat und Honorar direkt zwischen Nutzer und Kanzlei; Plattform überträgt nur | Nutzer zahlt Kanzlei; Amanah erhält von der Kanzlei nichts | ☐ ja ☐ mit Auflage ☐ nein |
| K4 Bündelpreis | Nutzer zahlt Amanah einen Gesamtpreis, Amanah zahlt die Kanzlei | Amanah kassiert | ☐ ja ☐ mit Auflage ☐ nein |

**Unsere Arbeitsannahme, bitte prüfen:** K1 und K3 zuerst, K4 zunächst nicht. Sie folgt aus Doku 32 (§ 49b Abs. 3 BRAO, BGH IX ZR 89/23), die Urteilsquelle ist dort nur über eine Zusammenfassung gelesen.

| Nr. | Entscheidungsfrage | Optionen | Folge |
|---|---|---|---|
| C1 | Darf eine Softwaregebühr pro Kanzlei erhoben werden, und ab wann gilt sie als Entgelt für die Vermittlung? Was gilt bei einer Staffelung nach Nutzung? | ☐ pauschal ja ☐ gestaffelt ja ☐ nein | Vertrag und Preise |
| C2 | Wer darf ausgewählt werden und wie? Zuweisung durch Amanah, oder nur freie Wahl durch den Nutzer? | ☐ Zuweisung ☐ nur freie Wahl | Auswahlmaske |
| C3 | Ist Amanah Dienstleister nach § 43e BRAO? Welche Verträge braucht es (AVV, Verschwiegenheit)? Wie lange darf eine Kopie liegen? | Antwort: ______ | Datenmodell, Löschfrist |
| C4 | Wann entsteht das Mandat, und was zeigt das Portal davor und danach? Wer haftet wofür? | Antwort: ______ | Ablauf und Texte |
| C5 | Welche Status-Bezeichnungen sind zulässig? Vorgesehen sind neutrale wie „an Kanzlei übermittelt“. „Geprüft“ oder „rechtsgültig“ erscheinen heute nicht. | ☐ zulässig: ______ | Statusmodell |
| C6 | Welche Werbeaussagen sind möglich (z. B. „mit Anwaltsprüfung“), und was gilt für Testimonials, Preisangaben, § 27 BORA? | ☐ erlaubt: ______ ☐ verboten: ______ | Marketing |
| C7 | Widerruf: Was gilt, wenn Amanah-Dienst und Kanzleimandat getrennte Verträge sind (R-VBR-01)? | Antwort: ______ | Kasse, AGB |
| C8 | Muss die Kanzlei sich zu islamischen Fragen äußern können? Wie wird die Trennung von Recht und Religion im Mandat erklärt? | Antwort: ______ | Partnerprofil |

## D. Ergebnis und nächste Schritte

| Wenn | Dann kann Claude ohne weitere Klärung |
|---|---|
| A1 „nein“ | die Gesprächsunterlage fertigstellen; Schritt 8 entfällt |
| A1 „ja“ mit Text | Vorlage mit Form-Checkliste bauen, gesperrt bis Owner-Freigabe |
| A9–A11 „ändern“ | Texte oder Funktionen sofort lokal anpassen |
| B1 geklärt | Bezeichnung oder Feld anpassen |
| Modell K1 oder K3 | Kanzleifunktion mit Persistenz planen; Vertrag bleibt Sache von Owner und Anwalt |

Prüfvermerk: Name und Kanzlei ______ · Datum ______ · Geprüfte Fassung: Doku 36, Stand 01.11.2026

Getrennt zu beauftragen: Marke ([Doku 33](33-marken-und-domainvorrecherche.md), [34](34-namenskandidaten.md)), Datenschutz, Steuer, religiöse Fragen ([`docs/review-packages/`](../review-packages/README.md)).
