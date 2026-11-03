# Testnachweis Release-Kandidat `3d5110f` (03.11.2026)

**Ein grüner Lauf ist hier keine Abnahme:** Echte Geräte, echter Mailversand und fachliche Freigaben fehlen. Dieser Kandidat behebt den Datenverlust bei Schlüsselfehlern; die echten Gerätetests laufen auf ihm.

**Image auf Staging:** `amanah-staging-app:3d5110f`, Image-ID `sha256:20a8854546f569c0fb54500b2eb20599e416f388f4889074304a9f5ddf65164b`, sauber aus `git archive` gebaut. Schichten-Prüfsumme lokal und auf dem Server gleich (`b548c42c…`). Keine neue Migration.

## Release-Check

Befehl `scripts/testing/release-check.sh`, 11:53 bis 12:12 Uhr, auf `b91972a`. **Der Lauf endete mit „FEHLGESCHLAGEN“**: zwei Schritte, beide durch Tests unter Last, nicht durch das Produkt. `3d5110f` ändert nur diese beiden Testdateien. Wiederholt wurden nur die zwei Schritte, nicht der Gesamtlauf.

| Prüfung | Ergebnis |
|---|---|
| Typprüfung, ESLint | 0 Fehler (1 fremde Warnung in `docs/qa/`) |
| Vitest | Lauf 1: 1 Fehler, Zeitlimit im Test mit echtem Scanner. **Wiederholt auf `3d5110f`: 888 bestanden, 30 übersprungen** |
| PostgreSQL | 37 von 37 |
| Migrations-Diff, Migrationsprobe | keine Differenz; 1 auf 6, Daten erhalten |
| API-Regression Desktop / Mobil | 34 / 25 bestanden, Mobil 9 übersprungen |
| Hydration, Konto, Verlauf, Plus | je Desktop und Mobil bestanden |
| Kernablauf Konto bis Löschung | Desktop, Mobil, iPhone-WebKit, Android bestanden |
| **Schlüsselfehler im Browser** (`e2e/folder-unreadable.spec.ts`) | Desktop, Mobil bestanden |
| Schmale Ansichten bis 320 px | iPhone-WebKit, Android bestanden |
| Restore-Übung Löschprotokoll | bestanden |
| Standard-, Flags-, E2E-Build | Exit 0; Flags 8 bestanden |
| Playwright gesamt, lokaler Modus | Lauf 1: 1 Fehler, Klick vor der Hydration. **Wiederholt auf `3d5110f`: 297 bestanden, 95 übersprungen, 0 fehlgeschlagen** |
| Secret-Scan Historie | keine Funde; der Fehlalarm aus `5e6a66a` steht mit Begründung in `.gitleaksignore` |
| `npm audit` | `NOT_RUN` in dieser Runde; keine Abhängigkeit geändert |
| Staging, Android-Profil | Kernablauf und schmale Ansichten bestanden, 3 von 3 |

Echte Geräte: `NOT_RUN`. Echtes Zertifikat: `NOT_RUN`.

## Nachweis unveränderter Daten

Probe `scripts/testing/rollback-encryption-probe.sh` auf dem Server, isoliert, synthetisches Konto, Prüfsumme der Zeile vor und nach jedem Versuch.

| Lage | Lesen | Vollständig schreiben | Teiländerung | Ordner leeren | Zeile unverändert |
|---|---|---|---|---|---|
| Kein Schlüssel | 503 | 503 | | | ja |
| Falscher Schlüssel, gleiche Kennung | 503 | 503 | 503 | 503 | ja, Antwortcode `folder_unreadable` |
| Danach richtiger Schlüssel | 200, alter Stand | | | | ja |

Vor der Korrektur (Kandidat `8668188`): Schreiben 200, Zeile überschrieben, auch der richtige Schlüssel las sie nicht mehr.

**Zusätzlich belegt:**
- Automatisiert auch für einen entfernten Schlüssel, ein unbekanntes Format, Wiederherstellung einer Version, kostenlose Bereiche und Export; PostgreSQL mit und ohne Verlauf, ganze Zeile und Versionen identisch.
- Parallele Teiländerungen verlieren nichts.
- Echter Browser, zwei Server auf einer Datenbank: Hinweis statt leerer Formulare, kein Schreibversuch auch beim Schließen der Seite, Direktaufrufe 503, Zeile identisch. Danach richtiger Schlüssel: Wert da, Speichern funktioniert. Auch ein anderer Ladefehler sperrt das Speichern.
- Serverlog und Antworten ohne Schlüssel und Inhalte.
- Das Umschlüsselungswerkzeug meldet einen falschen Schlüssel. Sein bedingtes Update ist als gleichlautende SQL-Anweisung getestet, nicht in einem echten Wettlauf des Skripts.

**Grenzen:** siehe Produktionsplan, „Grenze“ und „Bewusste Ausnahme“. Geprüft wurden keine echten Geräte im Fehlerfall.

## Rollback-Sperre

Echter Lauf auf Staging mit 9 verschlüsselten Zeilen, `rollback-app.sh --apply`:

| Ziel | Ergebnis |
|---|---|
| `amanah-staging-app:8668188` (ohne Schreibschutz) | Exit 1, nichts geändert |
| `amanah-staging-app:f9022d3` | Exit 1, nichts geändert |
| `amanah-app-app:wissenssperre-dda903c` (heutiges Produktionsimage) | Exit 1, nichts geändert |
| Image fehlt | Exit 2, nichts geändert |
| `amanah-staging-app:3d5110f` | Trockenlauf 9 geöffnet, 0 Fehler; gewechselt, gesund, Zeilen-Prüfsumme identisch |

Container-Image und Startzeit blieben bei den Abbrüchen gleich. Der Lauf deckte einen Fehler im Skript auf: Compose nannte alle Images statt nur der App. Das Skript brach dabei sicher ab und ermittelt das Ziel seither über JSON. Dieser Fix liegt nach `3d5110f`, nur im Skript, nicht im Image. Der Weg über die Produktion ist `NOT_RUN`: Das Skript ist dort nicht installiert, das ist Teil des Release-Schritts 7.

**Umgehung:** Compose von Hand bleibt technisch möglich. Darum nennt der Plan nur noch diesen Weg, und Schritt 7 entfernt den alten Stack aus dem Startordner.

## Secret-Scan

`.githooks/pre-commit` und `pre-push` stoppen bei Fund, Scannerabbruch, fehlendem Scanner und fehlender Konfiguration. Getestet mit echtem gitleaks und echtem `git commit` im Wegwerf-Repository: Der Commit mit einem erfundenen Token entsteht nicht, ein sauberer schon. Der Push-Hook ist mit einem Stub-Scanner getestet; echte Pushes dieser Runde liefen über ihn. Korrigiert: `--all` ignorierte Funde in vorgemerkten Änderungen. Der Hook gilt je Klon und lässt sich mit `--no-verify` umgehen; die Prüfung in CI bleibt deshalb bestehen.

---

# Älterer Testnachweis `8668188` (03.11.2026)

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

## Nachträge 03.11., 10:23 (nur Geänderten geprüft)

| Prüfung | Ergebnis |
|---|---|
| iPhone-WebKit und Android über HTTPS mit Passwortschutz, Wegwerf-Caddy auf dem Server | Kernablauf bestanden, schmale Ansichten bestanden; sichere Cookies ohne Ausnahme |
| Erster WebKit-Lauf | 1 fehlgeschlagen: Test navigierte gleichzeitig mit der App-Weiterleitung nach der Löschung; Test korrigiert, danach 2 × bestanden. Android danach nicht wiederholt |
| Zugangsschutz | 7 Pfade ohne Passwort 401, falsches Passwort 401, mit Passwort 200, intern 404, `noindex` |
| Rollback- und Verschlüsselungsprobe | durchgeführt, **zwei Befunde**, Produktionsplan |
| Backup-Probe, Empfänger-, Cron-, Rollback-Skripte, Alarm-Haken | mit Wegwerf-Schlüssel und lokalem Empfänger bestanden, Doku 45 |
| Typprüfung, ESLint der geänderten Tests, Vitest | 0 Fehler; 845 bestanden, 23 übersprungen |

Kein Produktcode geändert. Der Playwright-Gesamtlauf wurde nicht wiederholt.

## Nicht abgedeckt

Echter Mailversand, echte Geräte, Stripe, echte Produktionskonfiguration, Rollback im Browser. Im Release-Check laufen die Mobilprofile auf HTTP mit `AMANAH_COOKIE_SECURE=false`, weil WebKit dort sichere Cookies ablehnt; über HTTPS ohne Ausnahme siehe Nachträge.

**Im Lauf gefundene und behobene Fehler:** Überlauf auf `/datenschutz` bei 320 px; Passwortfeld der Kontolöschung außerhalb des Sichtbereichs; Hydrationsfehler; verlorene Eingaben beim schnellen Neuladen; Regressions-Lücke `legacy-email-verification`.
