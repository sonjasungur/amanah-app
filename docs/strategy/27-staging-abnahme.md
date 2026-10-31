# Staging-Vorbereitung und finale technische Abnahme

Stand: 2026-10-31 · Agent: Claude Code · Grundlage: Auftrag „Staging-Vorbereitung und finale technische Abnahme“ auf Basis von `e1d6bd9` / Doku 26
Nicht erfolgt: Server-, DNS- oder Caddy-Änderung, Deployment, Merge nach `main`, **Push** (keine neue Freigabe), echte Zahlung, echter Mailversand, externe Kontakte.

## 1. Git-Stand

| Branch | Stand | Remote |
|---|---|---|
| `feat/vorsorge-testament-foundation` | `e1d6bd9` + 3 lokale Commits | GitHub: `e1d6bd9`. **Neue Commits nicht gepusht** (Freigabe nötig) |
| `main` | `1fdb5db` unverändert | – |

Commits dieses Auftrags:
- `a405780` Plus-Hinweise und begrenzter Bestandsschutz
- `5c739f7` interne Redaktionsseiten auf Staging unerreichbar
- Compose-Netztrennung, Abnahme-Doku (dieser Commit)

`git status`: nur `AI_HANDOFF.md` und `docs/qa/` (fremd, unverändert) unversioniert.

## 2. Docker-Abnahmetest (Commit `5c739f7`)

**Vorher geprüft:** `/` 11 GB frei (81 %), `docker system df` 20 Images / 10,81 GB, kein Build-Cache, keine Amanah-Netze oder -Volumes. Liste aller Image-IDs gesichert.

**Build:** `docker build --no-cache`, Runner-Target mit den Staging-Build-Argumenten (API-Modus, Staging-Banner, Registrierung an), dazu das Migrate-Target.
- Ergebnis: beide erfolgreich (277 MB / 1,31 GB).
- Minimum freier Platz während des Builds: 9 GB. Ein Wächter hätte den Build unter 3 GB abgebrochen.

**Aufbau wie Staging:**
- Wegwerf-PostgreSQL 16.6 im RAM, nur in einem `internal`-Netz, ohne veröffentlichten Port.
- App als Nicht-Root-Benutzer `nextjs`, nur an `127.0.0.1:3299`.
- Frisch erzeugte Wegwerf-Secrets.
- Umgebung wie `.env.staging` (Testdomain-Allow-List, Dev-Outbox, Sandbox-Kasse, interne Werkzeuge aus).

| Prüfung | Ergebnis |
|---|---|
| `validate-staging-env.mjs` mit dieser Umgebung | ok |
| Migration im Container | alle Migrationen angewandt |
| `/api/health` | `environment: staging`, `dbReachable: true`, `aiEnabled: false` |
| Container-Benutzer, DB ohne Port, DB-Netz `internal` | ok |
| `staging-security-check.sh`: CSP, noindex, X-Frame-Options, kein X-Powered-By, robots.txt, Banner, fremde Herkunft, Allow-List, Ordner-API ohne Sitzung, 4 interne Seiten 404, unsignierter Webhook 400 | 14/14 |
| Testkonten über die öffentliche API (Registrieren, Bestätigen, Einwilligung, Ordner) | 2/2 |
| **Verschlüsselung at rest:** Ordner `amanah-aes256gcm-v1`, Klartext „Testperson“ in der DB | 2/2 verschlüsselt, 0 Klartext |
| **Login**, Ordner lesen (für den Eigentümer entschlüsselt) | ok |
| **Vorsorgeprozess:** Notfallkarte ändern, neu laden, Änderung bleibt; in der DB weiterhin kein Klartext | ok |
| Zweites Konto sieht den Ordner des ersten nicht | ok |
| Sandbox-Kauf 39 € → bezahlt; Status: Sperren aus, Zugriff je Plus-Funktion (6) | ok |
| **Export** (Art. 15/20): vollständig, ohne Passwort-Hash | ok |
| **Löschung** (Art. 17): mit falschem Passwort abgelehnt (403); mit richtigem gelöscht; Login und alte Sitzung danach 401; Ordner aus der DB entfernt | ok |
| Browser Desktop + Mobil (Login über das Formular): Plus-Hinweis ohne Kaufknopf, Staging-Banner, kein Querscrollen, Testamentsvorbereitung/Erbquoten gesperrt | 10/10 |
| Ungeprüfter Artikel `/wissen/faraid-und-wasiyya-das-wichtigste` | 404 |
| App-Log: E-Mail-Adressen, Tokens, Passwörter, DB-Passwort, Datenschlüssel | 0 Treffer |

Ein Fehler lag nur in meinem Testskript: Der erste Browserlauf setzte das `__Host-`-Cookie von Hand, Chromium sendete es nicht. Mit echtem Login über das Formular liefen alle Prüfungen grün.

**Bereinigt, nur selbst erzeugte Ressourcen:**
- beide Container, beide Netze
- beide getaggten Images und die 19 Zwischen-Images meines Builds (Abgleich mit der Liste vor dem Build)
- Wegwerf-Secrets und Zugangsdaten-Datei

Danach wieder 20 Images / 10,81 GB, kein vorher vorhandenes Image entfernt, `/` 11 GB frei. Fremde Container und Volumes unverändert.

## 3. Testergebnisse

| Ebene | Ergebnis |
|---|---|
| tsc, ESLint | ok |
| Vitest (ohne DB) | 524 bestanden, 13 übersprungen; Staging-Datei danach 16/16 |
| Vitest Postgres, Billing, Stripe (temporäre PostgreSQL 16.6, `migrate deploy`) | 40/40 |
| Playwright lokal (Desktop + Mobil) | 253 bestanden, 73 übersprungen (inkl. 14 neue Plus-Tests) |
| Playwright API-Modus + Postgres + Billing-Sandbox + CSP + Altkonten, mit `AMANAH_DEV_OUTBOX` statt interner Werkzeuge | 61 bestanden, 9 übersprungen (Mobil-Duplikate) |
| Docker-Abnahme | alle Prüfungen in §2 grün |
| Stripe gegen echtes Stripe, Caddy/HTTPS/Basic Auth | **NOT_RUN**: kein Amanah-Stripe-Konto, kein Server |

## 4. Plus-Oberflächen

- Jeder Dashboard-Bereich, den `plan-matrix.ts` Vorsorge Plus zuordnet, zeigt einen Hinweis:
  - „Dieser Bereich gehört künftig zu Vorsorge Plus (39 € einmalig, kein Abo)“
  - nutzbar ohne Einschränkung
  - Link „Was gehört zu Vorsorge Plus?“

  Kein Kaufknopf, keine Sperre (`AMANAH_BILLING_ENFORCE` bleibt aus). Kostenlose Bereiche zeigen keinen Hinweis.
- **Bestandsschutz begrenzt:** Jede Plus-Funktion trägt `availableBeforeLaunch`. Konten von vor dem Starttermin behalten nur diese Funktionen; später hinzukommende Plus-Funktionen (`false`) sind nicht automatisch enthalten. Die Texte auf `/preise`, im Hinweis und auf der internen Konzeptseite sagen genau das.
- `PlusGate` nutzt den Zugriff je Funktion; dabei die falsche Funktions-ID der PDF-Seite korrigiert (`pdf_exports`).
- Geprüft:
  - Desktop 1280 px und Mobil 390 px, lokal und im Container: kein Querscrollen
  - E2E für 5 Plus- und 2 kostenlose Bereiche

## 5. Staging-Architektur: Prüfergebnis

| Anforderung | Umsetzung | Status |
|---|---|---|
| Eigene Datenbank | Container `amanah-staging-postgres`, Volume `amanah_pg_staging`; Validator verlangt „staging“ im DB-Namen | geprüft (Compose-Test, Docker-Abnahme) |
| Eigene Secrets | Pflicht über `:?`; `.env.staging` nie aus Produktion. Gleichheit mit Produktion ist technisch nicht prüfbar, ohne Produktions-Secrets zu lesen | Checkliste A3 (Owner) |
| Eigene Container | Compose-Projekt `amanah-staging`, eigene Containernamen | geprüft |
| Getrenntes Netz | **neu:** `amanah_staging_db` (`internal: true`, nur DB, Migration, App) und `amanah_staging_edge` (nur App: Port auf 127.0.0.1, ausgehend Stripe). DB ohne Port | geprüft (Compose-Test, `docker compose config`, Docker-Abnahme mit gleichem Aufbau) |
| Geschützte Testdomain, HTTPS | Caddy-Snippet: automatisches HTTPS, HSTS, noindex | NOT_RUN (kein Server) |
| Basic Auth | Snippet: alles außer `/api/billing/webhook` | NOT_RUN (kein Server) |
| Stripe-Testmodus | `AMANAH_BILLING_MODE=stripe_test`; nur `sk_test_`/`rk_test_` + `whsec_`; Live-Schlüssel abgelehnt | Mocks getestet; echtes Stripe NOT_RUN |
| Signierte Webhooks | Signatur, Toleranz, Live-Ereignisse abgelehnt, Idempotenz | getestet (Mocks; unsigniert im Container 400) |
| Interne Redaktion nicht erreichbar | **behoben:** Bisher hing das nur daran, dass die Seiten beim Build als 404 vorgerendert werden. Jetzt sind interne Werkzeuge auf Staging verboten (Validator), die Outbox hat ein eigenes Flag `AMANAH_DEV_OUTBOX`, und Caddy antwortet zusätzlich 404 | getestet (Container 4/4) |
| Keine echten Registrierungen | Allow-List nur `.invalid/.test/.example`; Validator erzwingt das | getestet |
| Synthetische Testdaten | `seed-staging-accounts.mjs` (bricht bei Nicht-Staging ab, Zugangsdaten nur in eine Datei mit Rechten 600 außerhalb des Repos) | getestet |

## 6. Deployment-Checkliste Staging (jeder Schritt mit Freigabe, Reihenfolge einhalten)

**A. Vorbereitung (ohne Serveränderung)**
1. [ ] Owner-Freigabe für Server, DNS und Caddy (F6), mit Name der Testdomain.
2. [ ] Host festlegen; mindestens 6 GB frei auf dem Docker-Datenträger (Build ≈ 3 GB inkl. Zwischen-Images).
3. [ ] `.env.staging` aus `.env.staging.example` mit **frisch erzeugten** Werten anlegen, Rechte 600:
   - `SESSION_SECRET`, Datenschlüssel, `POSTGRES_PASSWORD`, Sandbox-Secret
   - nie aus `.env.production` kopieren
4. [ ] Optional Stripe (Doku 25): Amanah-Konto, `rk_test_…`, Webhook `https://staging.<domain>/api/billing/webhook` mit 5 Ereignissen, `whsec_…`; `AMANAH_BILLING_MODE=stripe_test`.
5. [ ] `set -a; . ./.env.staging; set +a; node scripts/validate-staging-env.mjs` → keine Fehler.
6. [ ] Git-Stand festhalten: `AMANAH_RELEASE=<sha>` in `.env.staging`.

**B. Start**
7. [ ] `docker compose -p amanah-staging -f docker-compose.staging.yml --env-file .env.staging up -d --build`
8. [ ] `docker compose … ps`: Migration „exited 0“, Postgres „healthy“, App „healthy“; `curl -s 127.0.0.1:3201/api/health` → `environment: staging`.

**C. Caddy und DNS (gemeinsamer Webserver, eigene Freigabe)**
9. [ ] DNS `staging.<domain>` auf den Host.
10. [ ] `caddy hash-password`; Block aus `deploy/Caddyfile.staging-snippet` mit Domain, Benutzer und Hash einsetzen.
11. [ ] `caddy validate`, dann `caddy reload`. Kein Neustart, damit andere Sites nicht betroffen sind.

**D. Abnahme auf dem Server**
12. [ ] `BASE_URL=https://staging.<domain> EXPECT_BASIC_AUTH=true EXPECT_HSTS=true STAGING_BASIC_AUTH=… scripts/staging-security-check.sh` → alle OK.
13. [ ] `scripts/staging-healthcheck.sh` → OK.
14. [ ] Testkonten: `seed-staging-accounts.mjs --count 5 --out <sicherer Pfad außerhalb des Repos>`.
15. [ ] DB-Probe: alle Ordner `amanah-aes256gcm-v1`; App-Log ohne Adressen und Tokens.
16. [ ] Backup ziehen und Restore in eine frische DB proben (Doku 22 §4).
17. [ ] Cron: Health-Check alle 5 Minuten, Backup täglich, Sicherheitscheck wöchentlich; Alarmweg festlegen.
18. [ ] Bei Stripe: 6 Testfälle aus Doku 25 §5 protokollieren.
19. [ ] Testprotokoll Doku 22 §7 ausfüllen, Ergebnis an den Owner.

## 7. Rückrollplan Staging

| Fall | Vorgehen |
|---|---|
| App startet nicht oder ist fehlerhaft, keine neue Migration | `AMANAH_RELEASE=<vorheriger sha>`, `docker compose … up -d app` mit dem vorhandenen Image; Health-Check |
| Neue Version mit Migration | **Vorher** Backup (Schritt 16). Rückweg: App stoppen → frische DB aus diesem Backup → vorherige Version starten. Migrationen werden nicht rückwärts ausgeführt |
| Caddy-Block fehlerhaft | Block entfernen bzw. vorherige Caddyfile zurück, `caddy validate`, `caddy reload`. Andere Sites bleiben unberührt, weil kein Neustart |
| Stripe-Probleme | `AMANAH_BILLING_MODE=sandbox` setzen, `up -d app`; Webhook im Stripe-Dashboard deaktivieren |
| Verdacht auf Kompromittierung | Container stoppen, Volume löschen (nur synthetische Daten), alle Staging-Secrets und Basic Auth neu, Stripe-Testschlüssel rollen |
| Staging ganz entfernen | `docker compose -p amanah-staging -f docker-compose.staging.yml down` (mit `-v` nur, wenn die Testdaten weg dürfen), Caddy-Block entfernen, DNS-Eintrag löschen |

## 8. Sicherheitsstatus

| Prüfpunkt | Status | Beleg |
|---|---|---|
| Keine Produktionsschlüssel | **teilweise automatisch:** Live-Stripe-Schlüssel überall abgelehnt; Staging verlangt eigene DB. Ob Datenschlüssel/Secrets mit Produktion übereinstimmen, prüft nur Checkliste A3 | Validatoren, Tests |
| Keine echten E-Mails | Staging-Validator erlaubt nur `outbox`/`disabled`; Produktion `disabled` bis Anbieterfreigabe | `staging.test.ts` |
| Keine Stripe-Live-Zahlungen | kein Live-Modus im Code; Live-Schlüssel, Live-Ereignisse und Live-Antworten abgelehnt | `stripe-billing.test.ts` (inkl. Mutationsprobe) |
| Keine sensiblen Werte in Logs | Fehlerlogs nur mit HTTP-Status; Container-Log 0 Treffer; Validator zeigt Secrets als `[set]` | Docker-Abnahme |
| Keine öffentlich erreichbare Datenbank | Staging- und Produktions-DB ohne Port; Staging-DB zusätzlich im `internal`-Netz | Compose-Tests, Docker-Abnahme |
| Keine ungeschützten internen Endpunkte | interne Seiten 404 (App + Caddy); Outbox nur mit `AMANAH_DEV_OUTBOX` **und** Outbox-Transport, in Produktion verboten; einziger Pfad ohne Basic Auth ist der signierte Webhook | Container 4/4, Unit-Tests |
| Keine Veröffentlichung ungeprüfter Artikel | nur freigegebene Artikel öffentlich; Entwurf im Container 404 | `islamic-knowledge.test.ts`, Docker-Abnahme |
| Erbquotenberechnung deaktiviert | Anzeige nur mit Flag **und** Regelwerk `scholar_reviewed` (aktuell `unreviewed_draft`); Seite zeigt Sperrhinweis | Docker-Abnahme Browser |

Beobachtung außerhalb von Amanah, nicht geändert: Der Container `gemeinsam1-db` eines anderen Projekts ist auf `0.0.0.0:5433` veröffentlicht, also auf allen Netzschnittstellen des Hosts. Bitte im zuständigen Projekt prüfen.

## 9. Offene Voraussetzungen für die Einrichtung

1. Freigabe Server, DNS, Caddy und Testdomain (F6, A13).
2. Push der neuen Commits (eigene Freigabe).
3. Stripe-Amanah-Konto und Testschlüssel, nur wenn Stripe auf Staging getestet werden soll (Doku 25).
4. Ort für Backups und age-Empfängerschlüssel (Doku 15); Alarmweg für den Health-Check.
5. Wer die Testkonten bekommt und das Testprotokoll führt.

## 10. Offene Produkt- und Rechtsfreigaben (Übersicht)

| Bereich | Offen | Wer |
|---|---|---|
| Produkt | Endgültiger Preis (heute Testpreis 39 €), Plus-Starttermin `AMANAH_PLUS_LAUNCH_AT`, Freigabe der Sperren | Owner |
| Produkt | Texte `/preise`, Startseite, Plus-Hinweise vor Veröffentlichung | Owner |
| Produkt | Support-Prozess und Sicherheitskontakt (C8) | Owner |
| Recht | AGB, Widerrufsbelehrung digitale Inhalte, Bestellbutton, Rechnung/USt (C6) | Rechtsberatung, Steuerberatung |
| Datenschutz | Endgültige Einwilligungs- und Kontotexte, Datenschutzerklärung, DSFA, Verzeichnis, Löschfristen (B2–B4, B7) | Rechtsberatung / DSB |
| Datenschutz | AVV/DPA Hoster, Mailanbieter, Stripe (B5) | Owner |
| Technik extern | Mailanbieter und DNS SPF/DKIM/DMARC (A6); Verwahrung der Datenschlüssel (A8) | Owner |
| Zahlung | Stripe-Kontoaktivierung, Live-Modus im Code (eigene Freigabe) | Owner |
| Wissen | Fachprüfung der 10 Artikel, Redaktionsgremium, QuranEnc-Lizenzbestätigung (D3–D5) | Gelehrte, Owner |
| Gesperrt | Testamentsvorbereitung, Erbquoten, juristischer Prüfworkflow, externe KI | Owner + Recht bzw. Gelehrte |

## 11. Go/No-Go

- **Privater Pilot auf Staging mit synthetischen Daten: GO.** Technisch abgenommen; Voraussetzung sind die Freigaben in §9, Punkte 1 und 2, danach die Checkliste §6.
- **Stripe-Testkäufe auf Staging: GO nach** Anlage des Amanah-Kontos und der Testschlüssel.
- **Pilot mit echten Personen: NO-GO**, bis Datenschutztexte, DSFA und AVVs freigegeben sind (B2–B5).
- **Öffentlicher Start / echte Zahlungen: NO-GO**, bis die Rechts- und Produktfreigaben in §10 erteilt sind und der Live-Modus eigens freigegeben ist.
