# Testnachweis Release-Kandidat `8668188` (03.11.2026)

**Ein grüner Lauf ist hier keine Abnahme:** Echte Geräte, echter Mailversand und fachliche Freigaben fehlen.

Befehl: `scripts/testing/release-check.sh`, 08:33 bis 08:49 Uhr, Wegwerf-Datenbank, jeder Schritt mit Timeout und Log. Staging separat auf demselben Stand.

| Prüfung | Ergebnis |
|---|---|
| Typprüfung, ESLint | 0 Fehler (1 fremde Warnung in `docs/qa/`) |
| Vitest | 845 bestanden, 23 übersprungen |
| PostgreSQL | 30 von 30 |
| Migrations-Diff, Migrationsprobe | keine Differenz; 1 auf 6, Daten erhalten |
| API-Regression Desktop / Mobil | 34 / 25 bestanden, Mobil 9 übersprungen |
| Hydration, Konto, Verlauf, Plus | je Desktop und Mobil bestanden |
| Kernablauf Konto bis Löschung | Desktop, Mobil, iPhone-WebKit, Android bestanden |
| Schmale Ansichten bis 320 px | iPhone-WebKit, Android bestanden |
| Restore-Übung Löschprotokoll | 70 von 70 |
| Standard-, Flags-, E2E-Build | Exit 0; Flags 8 bestanden |
| Playwright gesamt, lokaler Modus | 295 bestanden, 95 übersprungen, 0 fehlgeschlagen |
| Secret-Scan | keine Funde |
| `npm audit` | 0 Schwachstellen |
| Inhaltsprüfung Staging | JavaScript 0 Treffer, 60 URLs ohne ungeprüfte Inhalte, KI 503 |

**Staging (Android-Profil):** Kernablauf und schmale Ansichten bestanden. Restore-Prüfung zuerst FAIL (08:35), weil das Backup älter als die Migration war; mit neuem Backup bestanden (08:52). **Health-Job weiter FAIL:** nur Platte 87 % über der Grenze von 85 %.

**Nach dem Gesamtlauf:** Nur die Testkorrektur `phase2-behavior`; kein Produktcode. Der Gesamtlauf wurde nicht wiederholt; die 95 sind sein Stand. Vitest erneut: 845 bestanden, 23 übersprungen, 0 fehlgeschlagen. Grenze des korrigierten Tests: Er belegt `lang=en` und die Schrittanzeige, keine vollständige Übersetzung.

## Übersprungene Tests

| Gruppe | Anzahl | Grund | Release-relevant? | Ersatznachweis |
|---|---|---|---|---|
| Vitest PostgreSQL | 22 | brauchen Datenbank | ja | eigener Lauf: 30 von 30 |
| Vitest Prüfpaket-Export | 1 | nur auf Anforderung | nein | Export liegt in `docs/review-packages/` |
| Playwright `phase2-failure-paths` | 50 | brauchen API-Modus | ja | API-Regression bestanden |
| `security-session` | 14 | API-Modus; Teil nur Desktop | ja | API-Regression bestanden |
| `plus-tariff-account` | 10 | API-Modus mit Plus | ja | eigener Lauf: 5 + 5 |
| `free-asset-account` | 6 | API-Modus mit Plus | ja | eigener Lauf: 3 + 3 |
| `legacy-email-verification` | 4 | Postgres; nur Desktop | ja | in Regression bestanden |
| `data-history` | 4 | Verlauf aus | gesperrte Funktion | eigener Lauf: 2 + 2 |
| `release-core-flows` | 2 | API-Modus | ja | eigener Lauf, 4 Profile |
| `navigation` | 3 | nur Desktop-Breite, auf Mobil übersprungen | nein | Desktop bestanden |
| `phase2-behavior` | 2 | Der Test suchte einen Selektor, den es im Produkt nicht gibt, und lief deshalb nie | ja, Sprachwahl | Test auf die echte Sprachwahl umgestellt: Datei 22 von 22, kein Skip, Desktop und Mobil |
| API-Regression Mobil | 9 | Serververhalten unabhängig vom Gerät | nein | Desktop bestanden |

## Nicht abgedeckt

Echter Mailversand, echte Geräte und Safari über HTTPS, Stripe, echte Produktionskonfiguration. Mobile Profile laufen auf HTTP mit `AMANAH_COOKIE_SECURE=false`, weil WebKit dort sichere Cookies ablehnt; Staging und Produktion nutzen sichere Cookies.

**Im Lauf gefundene und behobene Fehler:** Überlauf auf `/datenschutz` bei 320 px; Passwortfeld der Kontolöschung außerhalb des Sichtbereichs; Hydrationsfehler; verlorene Eingaben beim schnellen Neuladen; Regressions-Lücke `legacy-email-verification`.
