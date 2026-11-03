# Testnachweis Release-Kandidat `b473cd5` (03.11.2026)

**Ein grüner Lauf ist hier keine Abnahme:** Echte Geräte, echter Mailversand und fachliche Freigaben fehlen. Die Gerätetests laufen auf diesem Kandidaten.

**Image auf Staging:** `amanah-staging-app:b473cd5`, Image-ID `sha256:9410a8e607689561bdc4fdd7abe4d72432ba5d71107e88b6f8f9fead67121a15`, aus `git archive` gebaut. Schichten-Prüfsumme lokal und auf dem Server gleich (`99ebdcea…`). Staging: 7 von 7 Migrationen, Schlüsselreferenz angelegt.

## HTTPS-Zugang, echter Host (03.11., 14:38 bis 14:50)

`https://amanah-test.mscisystems.com`, vom Owner bestätigt. Zertifikat Let's Encrypt, Prüfung `ok`, gültig bis 01.02.2027.

| Prüfung | Ergebnis |
|---|---|
| Ohne Passwort, 12 Pfade einschließlich API, Export, Outbox, Dashboard, statischer Dateien | überall 401 |
| Falsches Passwort | 401 |
| Mit Passwort | 200 |
| Interne Seiten | 404 |
| Kopfzeilen | `noindex`, HSTS, CSP vorhanden |
| **iPhone-WebKit, echter Host, echtes Zertifikat** | Kernablauf und schmale Ansichten, 3 von 3 |
| Android, echter Host | 3 von 3 |
| Kandidat und Konfiguration | Image-ID gleich, übrige Env-Zeilen gleich (Prüfsumme), nur die zwei Adresszeilen neu, Schlüsselreferenz `ok`, Health 0 FAIL |
| `gemeinsam1` | 200, Caddy ohne Neustart, übrige Caddyfile unverändert |

Echte Geräte: `NOT_RUN`. WebKit im Container ist eine Emulation.

### Vorfall: Produktionsroute kurz in der laufenden Konfiguration

**Von 14:38:43 bis 14:43:01 (03.11.2026, MEZ, 4 min 18 s) stand `amanahordner.de → amanah-app:3000` in der laufenden Caddy-Konfiguration; der Staging-Block fehlte in dieser Zeit.** Beginn und Ende stehen im Caddy-Log als `load complete`, das Ende auch im Zeitstempel von `autosave.json`.

**Ursache:** `staging-https.sh enable` lud `/etc/caddy/Caddyfile`. Der Container sieht dort über einen Einzeldatei-Mount die Datei vom Juli mit der alten Route (Inode `281101`, Host `273390`, Doku 41 §2). Mein Fehler: Doku 41 beschreibt die Falle, der Reload im Skript beachtete sie nicht, und der frühere Test nutzte nur `caddy validate`.

**Warum die Route nach den Belegen nicht nutzbar war:**

| Glied der Kette | Beleg |
|---|---|
| Name löst nicht auf | Let's Encrypt meldete im Fenster NXDOMAIN (Caddy-Log); 1.1.1.1 und 8.8.8.8 melden auch danach NXDOMAIN |
| Kein Zertifikat | Caddy begann um 14:38:43 mit `obtaining certificate`, 4-mal `could not get certificate from issuer`; im Speicher liegt kein Zertifikat für die Domain |
| Ohne Zertifikat kein HTTPS | Direkter Abruf über die Server-IP mit diesem Namen scheitert am TLS-Handshake; auf Port 80 antwortet Caddy nur mit einer Weiterleitung auf HTTPS (nach dem Fenster geprüft: 308) |
| App vom Proxy getrennt | `prod-check` um 14:30, 14:41 und 14:45: `amanah-app` nur im eigenen Netz; aus dem Caddy-Container `bad address`; Port 3001 nur auf `127.0.0.1` |

**Grenzen der Aussage:**

- Das ist ein Schluss aus der technischen Kette, **keine Beobachtung, dass niemand es versucht hat.** Caddy schreibt kein Zugriffslog (`logs` nicht gesetzt). Verbindungsversuche an die Server-IP lassen sich weder belegen noch ausschließen.
- Der HTTPS-Abruf und die Port-80-Antwort wurden erst nach dem Fenster geprüft, nicht währenddessen.
- Das Netz wurde stichprobenartig geprüft, nicht lückenlos. Eine Änderung zwischen zwei Prüfungen ist nicht belegbar ausgeschlossen, das App-Startdatum (02.11.) und die Netzliste sprechen dagegen.
- Im App-Log standen im Fenster 0 Zeilen, 0 Konten in der Datenbank. Beides stützt den Befund, belegt aber keinen fehlenden Zugriff: Dass die App jede Anfrage protokolliert, ist nicht belegt. **Die frühere Formulierung „Erreichbar war nichts“ war dafür zu stark.**

**Nebenwirkungen:** Staging war im Fenster nicht erreichbar, sein Zertifikat kam um 14:43:07. Caddy stellte erfolglose Zertifikatsanfragen für die alte Domain, seit 14:43:01 keine mehr. Fremde Dienste: Der Reload lief ohne Neustart.

**Behoben:** Host-Datei über `stdin` geladen; das Skript lädt nun immer so und prüft danach die laufende Konfiguration; Regressionstest.

### Routenprüfung und Altdatei (03.11., nach dem Vorfall)

Installiert: `verify-production-image.sh` und `caddy-route-policy.py` in `/opt/amanah-prod/`; alte Prüfung in `config-vorher/`. Die Regel liest die **laufende** Konfiguration strukturell und erlaubt nur den Staging-Host mit Passwort und Upstream. Nicht lesbar gilt als Fehler.

Isolierte Proben (`scripts/caddy-route-probes.sh`, nur `caddy adapt` in Wegwerf-Containern ohne Netz, nichts geladen):

| Probe | Ergebnis | Alter Filter |
|---|---|---|
| Gemeinsam1 mit geschütztem Staging / ohne Staging | akzeptiert | – |
| Zusätzliche Produktionsroute, Weiterleitung der alten Domain | abgelehnt | erkannt |
| Staging-Host auf Produktions-App | abgelehnt | erkannt |
| Staging-Host auf fremde Adresse | abgelehnt | **OK gemeldet** |
| Staging ohne Passwort | abgelehnt | **OK gemeldet** |
| Fremder Host auf Staging-Upstream | abgelehnt | **OK gemeldet** |
| Fremder Host auf Produktions-Port | abgelehnt | **OK gemeldet** |
| Echte Altdatei aus dem Container | abgelehnt | erkannt |
| Leere Antwort / Admin nicht erreichbar | Fehler | **OK gemeldet** |

Neu: `FAIL proxy container sees the host file`, solange die Altdatei im Container liegt. Vorgehen und Stand: [Doku 45 §4.2](../strategy/45-betrieb-produktion-und-backup.md).

## Release-Check

Befehl `scripts/testing/release-check.sh`, 13:34 bis 13:46 Uhr, auf `b473cd5`: **bestanden, kein Schritt fehlgeschlagen.** Danach änderten sich nur `staging-https.sh`, sein Test und Doku, nicht das Image.

| Prüfung | Ergebnis |
|---|---|
| `npm audit` (alle Abhängigkeiten) | 0 Funde |
| Typprüfung, ESLint | 0 Fehler (1 fremde Warnung in `docs/qa/`) |
| Vitest | 898 bestanden, 40 übersprungen, 0 fehlgeschlagen |
| PostgreSQL | 47 von 47 |
| Migrations-Diff, Migrationsprobe | keine Differenz; 1 auf 7, Daten erhalten |
| API-Regression Desktop / Mobil | 34 / 25 bestanden, Mobil 9 übersprungen |
| Hydration, Konto, Verlauf, Plus | je Desktop und Mobil bestanden |
| Kernablauf Konto bis Löschung | Desktop, Mobil, iPhone-WebKit, Android bestanden |
| Schlüsselfehler im Browser | Desktop, Mobil bestanden |
| Schmale Ansichten bis 320 px | iPhone-WebKit, Android bestanden |
| Restore-Übung Löschprotokoll | 70 von 70 |
| Standard-, Flags-, E2E-Build | Exit 0; Flags 8 bestanden |
| Playwright gesamt, lokaler Modus | 297 bestanden, 95 übersprungen, 0 fehlgeschlagen |
| Secret-Scan Historie | keine Funde |
| Staging, Android-Profil, auf dem echten Server | 3 von 3 |

`NOT_RUN`: echte Geräte, echter Mailversand.

### Fehler auf dem Weg zum grünen Lauf

Zwei Läufe davor schlugen fehl, keine Prüfung wurde dafür abgeschwächt.

| Fund | Ursache | Behebung |
|---|---|---|
| `npm audit`: 16 mittlere Funde | Eine Meldung zu `minimatch` unter 11.0.1 im ESLint-Baum; Produktionsabhängigkeiten 0 Funde | Override auf `minimatch@^11` im Commit `521c65e`; ESLint-Ergebnis gleich, Regeln greifen. Grenze: Plugin-Regeln, die `minimatch` als Default-Export lesen, würden mit Glob-Optionen laut scheitern; dieses Projekt nutzt solche Optionen nicht |
| WebKit: keine Mail beim Passwort-Reset | **Produktfehler:** Vor der Hydration Eingetipptes erreichte den React-State nicht, das Formular sendete eine leere Adresse und meldete Erfolg | Formulare lesen beim Absenden das Feld (`b473cd5`), auch Anmeldung, Registrierung, neues Passwort; Regressionstest |
| Schlüsselfehler-Spec | Testaufbau: Server beendete sich nicht; fehlende Einwilligung im neuen Schritt | Spec korrigiert |
| Commit-Hook stoppte `b473cd5` zunächst | Fehlalarm auf ein erfundenes Testpasswort | Test geändert, keine Ausnahme eingetragen |

### Übersprungene Prüfungen und ihre Bedeutung

| Gruppe | Anzahl | Grund | Lücke? |
|---|---|---|---|
| Vitest PostgreSQL | 39 | brauchen Datenbank | nein, eigener Lauf 47 von 47 |
| Vitest Prüfpaket-Export | 1 | nur auf Anforderung | nein |
| Playwright `phase2-failure-paths` | 50 | API-Modus | nein, API-Regression bestanden |
| `security-session` | 14 | API-Modus; Teil nur Desktop | nein, API-Regression bestanden |
| `plus-tariff-account` | 10 | API-Modus mit Plus | nein, eigener Lauf 5 + 5 |
| `free-asset-account` | 6 | API-Modus mit Plus | nein, eigener Lauf 3 + 3 |
| `legacy-email-verification` | 4 | Postgres; nur Desktop | nein, in Regression bestanden |
| `data-history` | 4 | Verlauf aus | gesperrte Funktion; eigener Lauf 2 + 2 |
| `release-core-flows`, `folder-unreadable` | je 2 | API-Modus | nein, eigener Lauf |
| `navigation` | 3 | nur Desktop-Breite | nein, Desktop bestanden |
| API-Regression Mobil | 9 | Serververhalten unabhängig vom Gerät | nein, Desktop bestanden |

## Schlüsselreferenz

Isolierte Probe auf dem Server (`rollback-encryption-probe.sh`), synthetisches Konto:

| Lage | Ergebnis |
|---|---|
| Vor `init` | `not_initialized`, Exit 1 |
| Richtiger / falscher Schlüssel, ohne Ordnerdaten | `ok` / `wrong_key` |
| `init` erneut mit falschem Schlüssel | abgelehnt, Referenz unverändert |
| **Konto ohne Daten, falscher Schlüssel** | Lesen 503, erstes Speichern 503, **0 Zeilen**, Referenz unverändert |
| Danach richtiger Schlüssel | erstes Speichern 200, 1 Zeile |
| Vorhandene Zeile, kein oder falscher Schlüssel | Lesen, Schreiben, Teiländerung, Leeren 503; Zeile unverändert |

Automatisiert, eigene Wegwerf-Datenbank (`postgres-key-reference.test.ts`): fehlender Schlüssel, entfernte Kennung, kaputte Konfiguration, Klartextzeile wird nicht mit falschem Schlüssel versiegelt, `init` mit Daten nur bei passendem Schlüssel. **Kontrollierter Wechsel:** `add` nur bei öffnenden Referenzen, `retire` nur ohne Zeilen unter dem alten Schlüssel, danach läuft der neue allein; Entfernen ohne `retire` bleibt ein Fehler. Die App schreibt die Tabelle nirgends (Test über `src/lib` und `src/app`).

**Staging, echter Lauf:** Wechsel ohne Referenz abgebrochen (`not_initialized`), `init` legte sie an und öffnete vorher alle 10 Zeilen, zweites `init` abgelehnt, Wechsel mit falschem Schlüssel abgebrochen, Referenz und Container unverändert, danach Wechsel: 10 Zeilen mit identischer Prüfsumme.

**Grenzen:** Beim allerersten `init` gibt es keinen Vergleichswert, deshalb vorher `check-data-key`. Die Produktion ist nicht migriert und hat keine Referenz.

## Fund beim HTTPS-Probelauf

`staging-https.sh` stellte beim Abbau eine ganze alte Env-Kopie wieder her. Das setzte `AMANAH_RELEASE` zurück, der Neustart schlug fehl, das Skript meldete trotzdem OK, und die App behielt die Probe-Adresse. Sofort bemerkt, repariert, Skript merkt sich nur noch die beiden Adresszeilen und meldet Fehlschläge; Regressionstest, Probe erneut bestanden: 11 Prüfungen OK, danach Release und Adresse richtig (Env: gleiche Zeilen, andere Reihenfolge). Nur synthetische Staging-Daten betroffen, keine Zeile geändert.

---

# Älterer Testnachweis `3d5110f` (03.11.2026)

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
