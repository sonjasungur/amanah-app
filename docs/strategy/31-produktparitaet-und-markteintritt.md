# Produktparität mit True Wills, Marke und Markteintritt (Stand 01.11.2026)

Grundlagen: [Doku 02](02-true-wills-benchmark.md) (Benchmark), [Doku 18](18-testament-und-pruefworkflow.md), [Doku 20](20-vorsorge-plus-abgrenzung.md). Rechtliche Prüfpunkte: [Doku 32](32-juristische-pruefpunkte.md). Marke und Domains: [Doku 33](33-marken-und-domainvorrecherche.md).

**Kennzeichnung:** **[V]** belegt (Quelle genannt), **[I]** eigene Schlussfolgerung. Keine Reichweiten- oder Umsatzprognosen. Aufwände sind grobe Schätzungen in Personentagen (PT) für die Entwicklung, ohne Prüfzeiten der Fachleute.

## 1. Ergebnis in Kürze

1. **Parität ist noch nicht erreicht.** Aktiv ist eine Vorsorge-Mappe mit starkem Janazah-Teil. Der Kern von True Wills fehlt oder ist gesperrt: Erbenmodell, Quotenanzeige, Vermächtnislogik, Vollstrecker, Dokumentausgabe, Kanzleiprüfung.
2. **Das Freischalten des Flags würde nicht genügen.** Auch entsperrt zeigt die Testamentsvorbereitung keine Erbanteile an (`src/app/dashboard/testament/vorbereitung/page.tsx:125-133`), und es gibt keinen buchbaren Testament-Tarif.
3. **Nicht alles lässt sich übertragen.** Ein gedrucktes Testament zum Unterschreiben wäre in Deutschland formnichtig (§ 2247 BGB). Die im Preis enthaltene Prüfung durch eine eigene Anwältin trifft auf RDG und § 49b BRAO. Parität heißt hier: gleicher Nutzen auf anderem Weg.
4. **Der Name ist ein Blocker.** „Amanah“ ist als Wortmarke für Bestattungen eingetragen und wird von einem islamischen Bestatter genutzt (Doku 33). Vor dem Domainkauf und vor jeder Außenwirkung ist das anwaltlich zu klären.
5. **SEO ist heute blockiert.** Kein Wissensartikel ist veröffentlicht; alle warten auf die Fachprüfung. Ohne benannte Fachprüfer beginnt der Markteintritt nicht.
6. **Kein direkter Wettbewerber sichtbar**, aber das ist kein Beleg: Sechs deutschsprachige Suchen fanden keinen islamischen Online-Testamentsdienst für Deutschland. Einen kostenlosen allgemeinen Generator gibt es von kirchlicher Seite (was-bleibt.de).

## 2. True Wills: Tarife und Abläufe

Funktionen und Abläufe: Doku 02 §1. Am 01.11. gegen Archiv-Snapshots geprüft und bestätigt: Preise, Prüfung bis 7 Tage, Übernahme durch Wahed, Verzeichnis über 1.000 Organisationen, Änderungen im ersten Jahr kostenlos.

| Paket | Preis (Archiv) | Inhalt |
|---|---|---|
| Online-Testament | £98 | Nachlass unter £350.000, Prüfung durch die Solicitor |
| Telefon-Testament | £148 | Erstellung am Telefon |
| Große Nachlässe | ab £350 | inkl. Erbschaftsteuer-Planung |
| Änderungen ab Jahr 2 | £10/Jahr (Blog 2021: £20) | optional |

Korrektur zu Doku 02: Die Startseite zeigt schon am 12.04.2021 „+£10/year“. Die Schlussfolgerung „von £20 auf £10 gesenkt“ ist damit nicht gestützt; die Reihenfolge bleibt ungeklärt.

**Status:** Website gesperrt, Portal seit der Übernahme 2023 ohne neue Testamente [V, Doku 02 §0]. True Wills ist ein historischer Maßstab, kein laufendes Produkt.

### Marketing und Vertrieb

`W/` = web.archive.org/web/, `TW` = truewills.co.uk.

| Kanal | Befund [V] | Beleg |
|---|---|---|
| Social | Facebook, X, Instagram; 66 archivierte Tweets 11/2020–02/2022 | W/20210412190021/TW |
| Blog/SEO | 18 Artikel-URLs im Archiv; neuester angezeigt 16.01.2022 | W/20260612014635/TW |
| Webinare | kostenlos, 60 Min., Fragen und Portal-Rundgang; 2020 und 2021 | W/20211027152552/TW/webinar/list/?eventDisplay=past |
| Muslimisches Radio | Ramadan FM (wöchentliche Sendung Ramadan 2021), Salaam Radio, Radio Dawn | Tweets, z. B. W/20210416120132/twitter.com/maketruewills/status/1383027630006484993 |
| Presse | „As featured in“ mit Logos muslimischer Medien | W/20260512155710/TW/about/ |
| Empfehlung | Persönlicher Link mit `refID`, E-Mail-Einladung, religiöse Motivation, kein Rabatt im Code | Portal-Bundle 02/2023 |
| Gewinnspiel | 5 Bestattungshandbücher, Teilnahme nur mit Portal-Konto | W/20211208153154/TW/webinar/win-a-free-funeral-rites-manual/ |
| Saisonal | Ramadan-Radio; Hajj-Blog 07/2021 | W/20210713121323/TW/blog/have-you-prepared-for-a-trip-of-a-lifetime/ |
| Tracking | Meta-Pixel, Segment, Google Analytics. **Kein Beleg für geschaltete Anzeigen** | W/20260612014635/TW |
| Übernahme | Wahed kauft iWill und True Wills; True Wills als „funnel“ | Legal Futures 14.02.2023; Law Gazette 15.02.2023 |
| Vergleich: IFG Wills | Charity-Landingpages (Muslim Hands £35 statt £98) | wills.islamicfinanceguru.com/muslim-hands |

**Nicht gefunden** (kein Beleg für Fehlen): Moschee- oder Charity-Kooperationen von True Wills vor der Übernahme, eigener Podcast, Offline-Events.

**Nicht belegt:** Testamentzahlen, Conversion, Reichweite. Meta Ad Library und Google Ads Transparency wurden nicht geprüft.

**[I]** Das Muster war Vertrauen über muslimische Medien plus Webinar mit Produktvorführung. Der stärkste belegte Kanal im Vergleich ist die Charity-Landingpage.

## 3. Funktionsvergleich gegen den Code

Code-Stand `d9b23f9`, gelesen 01.11. Status: **aktiv**, **gesperrt** (fertig hinter Flag oder Modus), **teilweise**, **fehlt**.

| Funktion bei True Wills | Amanah | Beleg | Anmerkung |
|---|---|---|---|
| Einstieg ohne Konto | aktiv | `src/app/check/page.tsx:21` | 15 Fragen zur Vorsorge |
| Eignungsfilter (Wohnsitz, Auslandsvermögen) | teilweise | `src/lib/testament/steps.ts:36,42` | Nur im gesperrten Ablauf; aktiv nur ein Ja/Nein-Hinweis |
| Konto, E-Mail-Bestätigung | gesperrt | `src/app/api/auth/register/route.ts:21` | `AMANAH_PUBLIC_REGISTRATION_ENABLED`, Produktion aus |
| Autosave, Fortsetzen | aktiv | `src/lib/store/use-amanah-store.ts:114` | |
| Schritt-Karten, Zeit, Fortschritt | teilweise | `src/components/dashboard/module-tiles.tsx:33` | Keine Zeitangaben |
| Geführter Testament-Ablauf | teilweise | `src/lib/guided-flow/config.ts:3-39`; Fragebogen in `vorbereitung` | Fragebogen gesperrt; im geführten Ablauf keine Erbfelder |
| Familie und Erben bis zum Cousin | teilweise | `src/lib/modules/fields.ts:82-90`, `src/lib/testament/steps.ts:53-56` | Neffen, Onkel, Cousins, Halbgeschwister fehlen |
| Vermögensarten, Immobiliendaten | teilweise | `src/lib/modules/fields.ts:91-95` | Ja/Nein und Freitext; Adresse, Hypothek, Eigentum fehlen |
| Wasiyyah in Prozent | teilweise | `src/lib/domain/validation.ts:194,204` | Freitext mit Warnung, keine Berechnung |
| Spendenverzeichnis | fehlt | `src/lib/modules/fields.ts:114-125` | |
| Nachrichten an die Familie | aktiv | `src/app/dashboard/familie/page.tsx:31` | |
| Janazah-Wünsche (dort nur Freitext) | **aktiv, stärker** | `src/components/modules/janazah-guided-flow.tsx:70` | Strukturiert |
| Vormund | teilweise | `src/app/dashboard/personen/page.tsx:23` | Nur Rolle; Mehrfachauswahl passt nicht zu § 1782 BGB |
| Vollstrecker | fehlt | Suche `vollstreck|executor` ohne Treffer | |
| Berechnung der Erbquoten | gesperrt | `src/lib/inheritance/calculate.ts:52` | Nur Kernfamilie, `unreviewed_draft` |
| Anzeige der Anteile | fehlt | `vorbereitung/page.tsx:125-133` | Auch entsperrt nur Sperrtext |
| Letter of Wishes | teilweise | `src/app/dashboard/pdf/page.tsx:169` | Familienbrief aktiv, Gesprächsunterlage gesperrt |
| Dokument-PDF | teilweise | `src/app/dashboard/pdf/page.tsx:86-91` | Browser-Druck „kein Testament“; das ist in DE gewollt |
| Prüfung durch Juristen | teilweise | `src/lib/legal-review/workflow.ts:66` | Nur interne Sandbox, keine Persistenz, keine Kanzlei |
| Mail bei Statuswechsel | fehlt | `src/lib/server/account-recovery.ts` | |
| Änderungen, Historie | teilweise | `prisma/schema.prisma:42-52` | Bearbeiten ja, keine Versionen |
| Zahlung | gesperrt | `src/lib/billing/config.ts:9` | Sandbox/Stripe-Test |
| Testament-Tarif | teilweise | `src/lib/billing/products.ts:47-58` | Katalogeintrag ohne Preis, nicht buchbar |
| Telefon-Service | fehlt | – | Nur über Kanzleien denkbar |
| Große Nachlässe, Steuer | fehlt | `src/lib/testament/lawyer-questions.ts:43` | Nur Stichwort |
| Freunde einladen | fehlt | Suche ohne Treffer | |
| Chat, Rückruf | fehlt | Suche ohne Treffer | Nur E-Mail im Impressum |
| Mobil | aktiv | `playwright.config.ts:38` | |

**Stärker als True Wills:** Madhab-Frage und Sonderfallsperren (noch gesperrt), Notfallkarte, strukturierte Janazah, Vollmacht- und Betreuungsbereich, Verschlüsselung at rest, getrennte Darstellung von Religion und Recht.

**Nicht übernehmen:**
- **Werbe-Tracking:** Meta-Pixel, wie True Wills sie nutzte, passen nicht zu einem Dienst mit Religionsdaten (Art. 9 DSGVO).
- **Gewinnspiel gegen Kontodaten:** Fehlanreiz bei sensiblen Pflichtangaben.
- **Zwei Zeugen und Trust-Konstruktion:** englisches Recht.

## 4. Fehlende Funktionen und Entwicklungsplan

**Fortschritt 01.11. (lokal, hinter den bestehenden Sperren, Details [Doku 35](35-testamentsprozess-deutschland.md)):** vollständigeres Erbenmodell mit Sperrfällen, Vollstrecker- und Vormund-Wünsche, Anzeige der Modellrechnung (nur mit Flag **und** geprüftem Regelwerk), Vermögensübersicht (aktiv, ohne Rechtsaussage). Erbquoten, Dokumente und Rechtsberatung bleiben gesperrt.

Reihenfolge nach Abhängigkeit. **Wer freigibt:** A Anwalt, N Notar, G Gelehrter. Alles bleibt hinter den bestehenden Sperren, bis die Freigabe vorliegt.

| Prio | Funktion | Aufwand (PT) | Freigabe vor Aktivierung |
|---|---|---|---|
| **0** | Entscheidungen: Name, Fachprüfer, Kanzleimodell (§ 7) | – | Owner, A |
| **1** | Vollständiges Erbenmodell (Datenmodell, Oberfläche) | 5–8 | G, A |
| 1 | Anzeige der Modellrechnung hinter dem Flag | 1–2 | G, A |
| 1 | Vermögen strukturiert (`AssetEntry`-Oberfläche): am 01.11. lokal fertig, eigene Seite `/dashboard/vermoegen` mit einfachem Ausdruck, dauerhaft kostenlos, als getrennte Anlage in der gesperrten Gesprächsunterlage | erledigt | A (Doku 36 A8) |
| 1 | Vermächtniswünsche (Prozent, Betrag, Gegenstand): am 01.11. lokal gebaut und gesperrt; bearbeitbar, als unverbindliche Wünsche gekennzeichnet; Drittel-Frage nur nach Gelehrtenprüfung, offene Punkte in Doku 36 B | erledigt, Freigabe offen | G, A |
| 1 | Vollstrecker, Vormund (eine Person bzw. Ehegatten, Ausschluss, Kindbezug) | 2–3 | A |
| 1 | Geführter Testament-Ablauf mit Eignungsfilter | 4–7 | A |
| **2** | Abschreibvorlage mit Form-Checkliste | 2–3 | A |
| 2 | Format für den Notarentwurf | 2 | N |
| 2 | Pflichtteilsvergleich | 5–8 | A, St (RDG-Grenze offen) |
| 2 | Madhab-Berechnung je Schule | 5–10 | G |
| 2 | ZTR- und Verwahrhinweise | 0,5 | N |
| **3** | Kanzlei-Prüfworkflow mit Persistenz, Rollen, verschlüsselter Übermittlung | 8–12 | A (Vertrag, § 49b BRAO, AVV) |
| 3 | Mail bei Statuswechsel | 1–2 | setzt Mail-Abnahme voraus (Doku 30) |
| 3 | Änderungshistorie: serverseitig und mit Oberfläche vorbereitet und getestet, aus (Doku 38) | Feinschliff 0,5–1 | Datenschutz |
| 3 | Testament-Tarif im Katalog | 2–3 | A (Bündelpreis offen) |
| 3 | AGB-Seite, Bestellablauf | 1 | A |
| **4** | Erinnerungen bei Lebensereignissen | 3–5 | A (keine Rechtsaussage) |
| 4 | Spendenverzeichnis ohne Empfehlung | 3–5 + Recherche | A (Steuer: St) |
| 4 | Paar-Modus mit Bindungswarnung | 5–8 | A |
| 4 | Einladen von Familie (nur durch Nutzer ausgelöst) | 1–2 | A (§ 7 UWG) |
| 4 | Datensparsame Messung ohne Werbe-Tracking | 1–2 | A (Datenschutz) |
| 4 | Schritt-Karten mit Zeitangabe | 0,5–1 | Zeiten erst nach Nutzertest |
| 4 | Einheitliche Marke im Code (ca. 22 markenartige Amanah-Stellen außerhalb der Sprachdatei, 116 „Mein Wille“) | 1–2 | nach Namensentscheidung |

**Summe grob 60–100 PT** Entwicklung, ohne Prüfzeiten. Diese sind ohne benannte Fachleute nicht planbar.

**Bewusst nicht vorgesehen:** Telefon-Service durch Amanah, unterschriftsfertiger Druck, Prüfung durch eigene Juristen.

## 5. Wissenszentrum

### 5.1 Lokal umgesetzt und getestet (nicht deployt)

| Verbesserung | Beleg |
|---|---|
| Suche versteht Schreibvarianten (Dschanaza/Cenaze, Gusl, Kefen, Koran/Qurʾān, Wasiyyah, Vermaechtnis) und ignoriert Füllwörter | `src/modules/islamic-knowledge/search-text.ts` |
| Volltext auch bei allgemeinen Themen statt nur Titel und Kurzfassung | `src/app/wissen/page.tsx` |
| Bei Treffer ohne Artikel: ehrlicher Hinweis und „Themen in Vorbereitung“, nur Titel der öffentlichen Übersicht, ohne Link und Entwurfstext | `searchPreparedTopics` in `publication.ts` |
| Teilen auch auf allgemeinen Themenseiten; WhatsApp und E-Mail erst nach Klick; zeigt den Link, wenn Kopieren scheitert | `article-actions.tsx`, `wissen/[slug]/page.tsx` |
| Fehler behoben: Abbruch des Teilen-Dialogs kopierte trotzdem | `article-actions.tsx` |

**Tests:** 17 neue Unit-Tests (`knowledge-search-share.test.tsx`), 1 neuer E2E-Test; `knowledge-center.spec.ts` 26/26 auf Desktop und Mobil; Vitest gesamt 571 bestanden; `tsc` und ESLint ohne Fehler. Getestet ist auch, dass die Suche nichts Unveröffentlichtes liefert.

### 5.2 Stand der zehn Startartikel

Alle zehn sind vorhanden und prüffähig: Status `DRAFT`, öffentlich 0, Prüfpakete in `docs/review-packages/`. Offene Prüfungen je Artikel: Quellen und islamische Fachperson, bei Artikel 4, 5, 9 und 10 zusätzlich juristisch. Am 01.11. gegen den Katalog geprüft (44 Einträge, 0 veröffentlicht).

**Freigegeben wurde nichts.** Die Sperren bleiben: Quellen- und Gelehrtenprüfung, bei deutschem Recht zusätzlich juristisch.

## 6. Produktstrategie und Marke

### 6.1 Die fünf Bereiche

| Bereich | Kundennutzen | Technische Voraussetzung | Rechtliche und fachliche Voraussetzung | Mögliche laufende Kosten (Beträge offen) |
|---|---|---|---|---|
| **Kostenloses islamisches Wissen** | Belegte Antworten zu Erbe, Tod, Janazah; ohne Konto, ohne Werbung | Fertig; Suche und Teilen verbessert | Fachprüfung je Artikel; bei Recht zusätzlich juristisch; Lizenz der Übersetzung | Prüfhonorare, Pflege, Hosting |
| **Kostenloser Vorsorge-Check** | In Minuten sehen, was fehlt | Fertig | Neutrale Checkliste; familienbezogene Ampel ist RDG-Frage | Hosting |
| **Vorsorge Plus, 39 € einmalig** (Testpreis) | Verschlüsselter Ordner, Familie und Vertrauenspersonen, Janazah-Wünsche, PDF | Fertig; Live-Zahlung und Sperren aus | AGB, Widerruf (§ 356 Abs. 6 BGB, Einordnung offen), Bestellbutton, Rechnung; Art. 9 DSGVO | Zahlungsgebühren, Hosting, Backups, Mail. **Einmalpreis gegen dauerhafte Speicherung ist wirtschaftlich zu prüfen** |
| **Testamentsvorbereitung** | Geordnete Angaben und Fragen für Anwalt oder Notar, spart Beratungszeit; **kein Testament** | Fragebogen gesperrt; Prio 1–2 fehlen | RDG-Grenze (Smartlaw-Übertragbarkeit offen); Abschreibvorlage durch A; Quoten durch G | Prüfhonorare, Pflege bei Rechtsänderung, Haftpflicht prüfen |
| **Testament mit anwaltlicher Prüfung** | Individuelle Prüfung durch eine unabhängige Kanzlei im Direktmandat | Prio 3 fehlt | Kanzlei-Vertrag; § 49b BRAO: keine fallbezogene Vergütung; § 43e BRAO; Bündelpreis offen | Kanzleihonorar (Mandat Nutzer–Kanzlei), Betrieb der Schnittstelle |

**Offene Tarif-Frage:** True Wills hatte die Prüfung im Preis. Ob Amanah einen Gesamtpreis anbieten darf oder die Kanzlei getrennt abrechnen muss, klärt erst die anwaltliche Prüfung (R-BRAO-01). Bis dahin nennt der Plan keinen Preis.

### 6.2 Einheitliches Konzept

| Ebene | Vorschlag | Status |
|---|---|---|
| Dachmarke | Offen, siehe Doku 33. Arbeitsvorschlag: „Mein Wille – Islamisch vorsorgen“ | REQUIRES_OWNER, Markenanwalt |
| Begriff „Amanah“ | Weiter als religiöser Begriff im Text (anvertrautes Gut), nicht als Produktname, bis geklärt | Vorschlag |
| Wissensbereich | Eigener, werbefreier Bereich „Islamisches Wissen“, Sadaqa Jāriya, ohne Kaufaufruf im Artikel | Passt zum Bestand |
| Vorsorge Plus | Bleibt als Name; beschreibend | Prüfen |
| Testamentsprodukte | Nie „Testament erstellen“, sondern „Vorbereitung“ und „Prüfung durch eine Kanzlei“ | UWG, A prüft |

### 6.3 Überarbeitete Startseite (Konzept, nicht umgesetzt)

Heute: Hero und Check → Einstiege → Nutzen mit Vergleich → So funktioniert → Was du vorbereiten kannst → Akhira → Preise. Dazu stehen „Mein Wille“ und „Amanah-Check“ nebeneinander (`src/lib/brand.ts:2,25`).

Vorschlag:
1. **Hero:** Ein Satz Nutzen, Check als Hauptaufruf, Wissen als zweiter Weg.
2. **Drei Wege:** „Ich möchte verstehen“ (Wissen), „Ich möchte vorsorgen“ (Check, Plus), „Ein Todesfall ist eingetreten“ (Soforthilfe).
3. **Stufenleiter** der fünf Bereiche aus §6.1, mit Status; „in Vorbereitung“ offen benannt.
4. **Warum vertrauenswürdig:** benannte Fachprüfer (erst wenn vorhanden), Trennung Religion und Recht, Verschlüsselung.
5. **So funktioniert es** in drei Schritten.
6. **Klare Grenze:** Was das Produkt nicht ist (kein Testament, keine Fatwa, keine Rechtsberatung).
7. **Preise** kurz, Link zu `/preise`.

`/preise` sollte zusätzlich Vorbereitung und Prüfung als „in Vorbereitung, ohne Preis“ zeigen. Umsetzung erst nach der Namensentscheidung und Freigabe der Texte (Sperre „Preis-/Plus-Texte“).

## 7. Markteintritt Deutschland

Keine Reichweiten- oder Umsatzannahmen. Reihenfolge nach Voraussetzung:

| Phase | Tor | Maßnahmen |
|---|---|---|
| **A. Vertrauen** | Name geklärt; Fachprüfer benannt | Gelehrtengremium und Fachanwalt gewinnen, Prüfmodell festlegen, Namen und Qualifikation mit Einverständnis zeigen |
| **B. Wissen** | Erste Artikel freigegeben | SEO mit den freigegebenen Artikeln (Sitemap ist vorhanden), Artikel 1, 2, 4, 5 zuerst (Doku 10), Datum und Prüfer sichtbar |
| **C. Reichweite** | Mindestens eine Artikelwelle öffentlich | Sachliche Social-Media-Inhalte aus freigegebenen Artikeln, Webinare mit Fachprüfern und Produktvorführung, muslimische Medien und Radio (bei True Wills belegt) |
| **D. Kooperation** | Vertragsmuster durch A geprüft | Moscheegemeinden und Verbände (Informationsabende), Bestatter (nur nach Namensklärung), gemeinnützige Organisationen, Kanzleien |
| **E. Umwandlung** | Live-Zahlung, AGB | Check → Konto → Plus; Testamentsprodukte erst nach Freigabe |

**Kooperationen:**
- Kanzleien: keine Vergütung für konkrete Mandate, keine Zuweisung gegen Entgelt (R-BRAO-01).
- Charity-Landingpages (bei IFG belegt): Rabatt- und Vermächtnisbezug vorher juristisch prüfen.
- Keine Empfehlung einzelner Organisationen als religiöse Pflicht.

**Messung der Umwandlung** (ohne Werbe-Tracking, aggregiert, keine Inhalte):

| Schritt | Kennzahl |
|---|---|
| Wissen → Check | Anteil Sitzungen mit Check-Start |
| Check gestartet → beendet | Abschlussquote |
| Check → Konto | Registrierungen je beendetem Check |
| Konto → Einwilligung → erste Angabe | Aktivierung |
| Konto → Plus | Kaufquote, Zeit bis zum Kauf |
| Plus → Bindung | Vollständigkeit der Bereiche, Widerrufe, Support-Anfragen |

Zielwerte werden erst nach echten Pilotdaten festgelegt. Heute ist im Code keine Messung vorhanden.

**Externe Kontaktaufnahmen wurden nicht vorgenommen.** Alle Maßnahmen setzen deine Freigabe voraus.

## 8. Technisch fertig gegen fachlich freigegeben

| Bereich | Technisch | Fachlich freigegeben |
|---|---|---|
| Wissenszentrum (Struktur, Suche, Teilen, Prüfworkflow) | fertig | **nein:** 0 von 44 Einträgen veröffentlicht |
| Zehn Startartikel | Entwürfe mit Prüfpaketen | **nein** |
| Vermögensübersicht mit Ausdruck | fertig, dauerhaft kostenlos auch im Konto (Doku 38) | **nein:** Doku 36 A8 |
| Ampel „Erste Hinweise“ | seit 01.11. lokal abgeschaltet, neutrale Fragen als Ersatz | **nein:** Doku 36 A9 |
| Vorsorge-Check | fertig | Texte nicht juristisch geprüft |
| Vorsorge-Ordner, Janazah, Notfallkarte | fertig, verschlüsselt | Religiöse Inhalte nicht geprüft; Einwilligungstext „Entwurf“ |
| Vorsorge Plus | Sandbox/Stripe-Test | **nein:** AGB, Widerruf, Preis, Sperren offen |
| Erbquoten-Engine | Kernfamilie berechnet, Anzeige fehlt | **nein:** `unreviewed_draft` |
| Testamentsvorbereitung | Fragebogen gesperrt, unvollständig | **nein** |
| Abschreibvorlage, Pflichtteilsvergleich, Vollstrecker | fehlen | **nein** |
| Kanzlei-Prüfworkflow | Sandbox | **nein:** kein Vertrag, keine Persistenz |
| Staging | technisch abgenommen (Doku 29) | Mail-Versand **nicht** abgenommen (Doku 30), kein HTTPS |
| Marke | „Mein Wille“ und „Amanah“ gemischt | **nein:** nur Vorrecherche |

## 9. Offene Entscheidungen

| # | Entscheidung | Wer | Warum jetzt |
|---|---|---|---|
| 1 | Markenanwalt beauftragen; Name festlegen | Owner | Blockiert Domain, HTTPS, Außenauftritt |
| 2 | Fachanwalt für Erbrecht beauftragen (Doku 32 als Grundlage) | Owner | Blockiert Prio 1–3 |
| 3 | Gelehrtengremium und Schulumfang | Owner | Blockiert Wissen und Quoten |
| 4 | Kanzleimodell: Direktmandat, Preis getrennt oder gebündelt | Owner + A | Bestimmt den Tarif |
| 5 | 39 € einmalig gegen dauerhafte Speicherkosten prüfen | Owner | Preis ist nur Testpreis |
| 6 | EUIPO, TMview, WIPO manuell durchsuchen | Owner | Automatisch nicht abfragbar |

**Staging-Domain:** Wenn HTTPS vor der Namensklärung gebraucht wird, wäre eine neutrale, nicht markengebundene Domain für den geschützten Zugang möglich. Sie sollte nicht öffentlich beworben werden; auch das ist ein Punkt für den Markenanwalt.

## 10. Quellen und Grenzen

- Code-Abgleich: Stand `d9b23f9`, stichprobenartig selbst geprüft (Anteilsanzeige, Vollstrecker); App dafür nicht ausgeführt.
- True Wills: nur Archiv und Portal-Code, keine Live-Abläufe. Facebook und Instagram im Archiv ohne Inhalt; Follower unbekannt.
- Die Rohdaten aus Doku 02 (`tw_raw/`) existieren nicht mehr. Neue Downloads liegen nur temporär.
- Wahed und IFG nur für den Kanalvergleich, kurz geprüft.
- Wettbewerb Deutschland: App Stores, Instagram und Moscheeverbände nicht systematisch geprüft.
