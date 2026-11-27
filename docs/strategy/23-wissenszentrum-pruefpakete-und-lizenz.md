# Wissenszentrum: Prüfpakete und Nutzungsrechte der Qur'an-Übersetzung

Stand: 2026-10-31 · **Veröffentlicht: 0 Artikel** · keine Prüfer kontaktiert, keine Prüfergebnisse eingetragen

## 1. Prüfpakete

- **Zum Versenden:** [`docs/review-packages/`](../review-packages/README.md), je Startartikel eine Markdown-Datei. Neu erzeugen mit `npm run export:review-packages` (nach jeder Textänderung, da die Pakete die Artikelversion tragen).
- **Zum Drucken:** `/wissen/redaktion/paket/<id>` (nur mit internen Werkzeugen; in Produktion 404).
- **Inhalt je Paket:** Entwurfstext, alle Quellen mit arabischem Text, Übersetzung bzw. Kennzeichnung als eigene Wiedergabe, Prüfregister und Einstufungen, Tabellen für die vier Rechtsschulen, offene Punkte, **konkrete Prüffragen je Rolle**, leere Prüfvermerke (Name, Qualifikation, Datum, geprüfte Version, Ergebnis, Unterschrift).

Die Fragen werden deterministisch aus dem Artikel abgeleitet (`src/modules/islamic-knowledge/review-questions.ts`):

| Rolle | Fragen |
|---|---|
| Quellenprüfer | Je Qur'an-Vers: Wortlaut gegen Tanzil 1.1 und QuranEnc 1.1.4. Je Hadith: Nummer gegen sunnah.com-Zählung **und** gedruckte Ausgabe (Ausgabe nennen); bei eigener Wiedergabe: Sinntreue; bei Einstufungen: Beleg in gedruckten Werken. Je Fiqh-Quelle: konkretes Werk mit Band und Seite. Dazu: fehlende Belege? |
| Gelehrte | Jeder Vermerk „[Redaktion: …]“ als Frage. Jede offene Streitfrage: Position je Schule (Ḥanafī, Mālikī, Shāfiʿī, Ḥanbalī) mit Werk und Stelle. Dazu: Einzelmeinung als einzige dargestellt? Für Laien verständlich, ohne eine Fatwa zu ersetzen? |
| Juristen (Artikel 4, 5, 9, 10) | Jeder Vermerk „[Juristische Prüfung: …]“. Dazu: Normen zutreffend? Keine Rechtsdienstleistung im Einzelfall (§ 2 RDG)? Religiöse Lehre und deutsches Recht getrennt? |

Umfang: 46 Fragen an Quellenprüfer, 49 an Gelehrte, 16 an Juristen (siehe `docs/review-packages/README.md`).

Tests (`review-questions.test.ts`, `export-review-packages.test.ts`):
- Jede Quelle, jeder Vermerk und jede offene Streitfrage erzeugt eine Frage.
- Ein Artikel mit juristischem Vermerk muss eine juristische Prüfung vorsehen.
- Keine doppelten Fragen.
- Prüfvermerke bleiben leer.

Dabei gefunden und behoben: Zwei Fiqh-Quellen tragen denselben Verweistext („Klassische Fiqh-Literatur – fachlich prüfen“). Die Frage nennt deshalb jetzt den Titel der Quelle.

**Ablauf nach Rücklauf (Owner):** Ergebnisse trägt der Redakteur in `reviews` des Artikels ein (Name, Rolle, Datum, Version); erst dann sind Statuswechsel und Veröffentlichung technisch möglich (`isPublishable`). Ein Prüfvermerk ohne echten Rücklauf darf nicht eingetragen werden.

## 2. Nutzungsrechte der deutschen Übersetzung (Bubenheim/Elyas)

Nachgeprüft am 31.10.2026 (Recherche vom 30.10. in Doku 09a):

| Punkt | Ergebnis | Beleg |
|---|---|---|
| Version | `german_bubenheim` **1.1.4** (letzte Änderung 2025-02-03) – unverändert | `GET https://quranenc.com/api/v1/translations/list/de` |
| Bedingungen | Wortgleich zum 30.10.: Wiederveröffentlichung erlaubt, wenn (1) unverändert, (2) Herausgeber und QuranEnc genannt, (3) Version genannt, (4) Begleitangaben erhalten, (5) Anmerkungen an QuranEnc gemeldet, (6) auf neueste Version aktualisiert, (7) keine unangemessene Werbung | `https://quranenc.com/en/home/about`, Abschnitt „Terms and Policies“ |
| Wortlaut im Projekt | alle 8 gespeicherten Verse identisch mit QuranEnc | `node scripts/check-quranenc-version.mjs` (Exit 0) |
| Kommerzieller Betreiber | Kein Verbot in den Bedingungen. Die Wissensseiten sind kostenlos und werbefrei. | – |
| Rechtekette | **nicht verifiziert:** Ob QuranEnc für die Rechteinhaber (Übersetzer, König-Fahd-Komplex, ggf. Islamisches Zentrum Aachen) Lizenzen erteilen darf, ist online nicht belegt. | Doku 09a |
| Tanzil-Fassung derselben Übersetzung | nur nicht-kommerziell → nicht verwenden | Doku 09a |

Umsetzung der Bedingungen im Code: Wortlaut unverändert und nur ganze Verse (`quran-verbatim.test.ts`), Nennung von Übersetzern, QuranEnc und Version bei jeder Anzeige, Pflege über das neue Prüfskript (Bedingung 6). Empfehlung: Skript monatlich und vor jedem Release ausführen.

**Offen (REQUIRES_OWNER, kein Kontakt erfolgt):**
1. Schriftliche Bestätigung bei QuranEnc (und ggf. beim König-Fahd-Komplex) einholen, dass die Nutzung in einer Web-App eines kommerziellen Betreibers mit kostenlosem Wissensbereich gedeckt ist.
2. Die zwei in Doku 09 notierten Textauffälligkeiten an QuranEnc melden (Bedingung 5).
3. Bis zur Bestätigung: Qur'an-Zitate nur in unveröffentlichten Entwürfen. Das ist der aktuelle Zustand, weil kein Artikel veröffentlicht ist.

## 3. Weiter offen für die Veröffentlichung

- REQUIRES_SCHOLAR_REVIEW: alle zehn Startartikel und die 34 Altinhalte; Prüfgremium und Prüfmodell (Doku 10).
- REQUIRES_LEGAL_REVIEW: Artikel 4, 5, 9, 10.
- Hadith-Übersetzungen bleiben eigene Wiedergaben; Herkunft der Einstufungen aus der hadith-api ungeklärt.
