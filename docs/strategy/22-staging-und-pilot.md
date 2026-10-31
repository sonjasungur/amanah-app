# Geschützte Staging-Umgebung und privater Pilot

Stand: 2026-10-31 · **technisch vorbereitet, lokal geprobt, nicht deployt** · nur synthetische Testdaten

## 1. Aufbau

```
Internet ─▶ Caddy (vorhanden, 443) ─ basic_auth + noindex ─▶ 127.0.0.1:3201 amanah-staging-app
                                                               │  (Netz amanah_staging_internal)
                                                               └▶ amanah-staging-postgres (Volume amanah_pg_staging)
```

| Datei | Zweck |
|---|---|
| `docker-compose.staging.yml` | Eigenständiges Compose-Projekt `amanah-staging`: eigene Container, eigenes Netz, eigene DB, App nur an `127.0.0.1:3201`. Nichts wird mit Produktion geteilt. |
| `.env.staging.example` | Vorlage; echte Werte nur in `.env.staging` (ignoriert) und **nie** aus Produktion übernehmen. |
| `deploy/Caddyfile.staging-snippet` | Block für den vorhandenen Caddy: Basic Auth, `X-Robots-Tag: noindex`, HSTS, Log 14 Tage. Nicht installiert, weil das eine Serveränderung ist. |
| `scripts/validate-staging-env.mjs` | Alle Produktionsregeln, dazu Staging-Regeln (siehe 2). |
| `scripts/seed-staging-accounts.mjs` | Synthetische Testkonten über die öffentliche API. Bricht ab, wenn das Ziel nicht „staging“ meldet; Passwörter nur in eine Datei mit Rechten 600 außerhalb des Repos. |
| `scripts/staging-healthcheck.sh` | Monitoring: Health, Umgebung, DB, KI aus, Plattenfüllstand, Alter des letzten verschlüsselten Backups. Exit 1 = Alarm. |
| `scripts/staging-security-check.sh` | Black-Box-Prüfungen gegen die laufende Instanz (siehe 6). |

App-Änderungen dafür:
- `AMANAH_DEPLOYMENT_ENV=staging`: Health meldet `environment: staging`.
- Build-Variable `NEXT_PUBLIC_AMANAH_ENVIRONMENT=staging`: Banner „TESTUMGEBUNG – nur synthetische Testdaten“, `robots.txt` sperrt alles, `X-Robots-Tag: noindex`.
- `AMANAH_REGISTRATION_ALLOWED_DOMAINS`: Registrierung nur mit reservierten Testdomains (`staging.invalid`). Echte Personen können sich deshalb nicht registrieren, auch wenn jemand die Basic Auth kennt.
- Dockerfile: zwei optionale Build-Argumente; die Standardwerte lassen den Produktions-Build unverändert.

## 2. Was Staging von Produktion trennt (vom Validator erzwungen)

- **Mail:** Keine echte Mail; nur `outbox` (bleibt im Speicher) oder `disabled`.
- **Registrierung:** Allow-List ist Pflicht und darf nur `.invalid`, `.test` oder `.example` enthalten.
- **Datenbank:** Eigene Datenbank, der Name muss „staging“ enthalten.
- **KI und Zahlungen:** Externe KI aus. Billing nur Sandbox, keine Sperren.
- **Verschlüsselung:** wie in Produktion Pflicht, mit eigenen Schlüsseln.
- **Erlaubt (nur hier):** Dev-Outbox, Sandbox-Kasse, interne Werkzeuge (für Testkonten und Tests).

## 3. Einrichtung (Owner-Schritte, je mit Freigabe)

1. DNS `staging.<domain>` und eine Entscheidung, auf welchem Host Staging läuft. Speicher auf `/` beachten: am 31.10. noch 8,5 GB frei, ein Build braucht mehrere GB.
2. `.env.staging` mit frischen Secrets anlegen (Befehle in der Vorlage), dann `node scripts/validate-staging-env.mjs`.
3. `docker compose -p amanah-staging -f docker-compose.staging.yml --env-file .env.staging up -d --build`.
4. Caddy-Block aus `deploy/Caddyfile.staging-snippet` mit eigenem Basic-Auth-Hash einsetzen und Caddy neu laden. Das ändert den gemeinsamen Webserver und braucht deshalb eine eigene Freigabe.
5. Testkonten: `STAGING_BASE_URL=… STAGING_BASIC_AUTH=… node scripts/seed-staging-accounts.mjs --count 5 --out <sicherer Pfad>`.
6. Cron (Vorschlag):
   - `*/5 * * * *` Health-Check
   - `15 3 * * *` Backup: `ENV_FILE=.env.staging POSTGRES_CONTAINER=amanah-staging-postgres BACKUP_DIR=/srv/backups/amanah-staging BACKUP_REQUIRE_ENCRYPTION=true scripts/backup-postgres.sh`
   - wöchentlich der Sicherheitscheck
   - Benachrichtigung bei Exit ≠ 0 (z. B. vorhandener Mailer des Hosts oder ein Uptime-Dienst, falls freigegeben)

## 4. Backups

- age-verschlüsselt, nur öffentlicher Empfängerschlüssel auf dem Server (Doku 15). Aufbewahrung Staging: 7 Tage.
- **Restore-Probe vor Pilotstart:** Backup in eine frische Datenbank zurückspielen (`scripts/restore-postgres.sh`) und mit einem Testkonto anmelden.

## 5. Rückrollplan

| Fall | Vorgehen |
|---|---|
| Neue Version fehlerhaft, keine Migration | `AMANAH_RELEASE=<vorheriger SHA>`; Image neu bauen bzw. vorhandenes Tag starten: `up -d app`. Images tragen den Git-SHA (`amanah-staging-app:<sha>`). |
| Neue Version mit Migration | **Vor** jedem Deploy mit Migration ein Backup ziehen. Rückweg: App stoppen → DB aus diesem Backup in eine frische DB zurückspielen → vorherige Version starten. Prisma-Migrationen werden nicht „rückwärts“ ausgeführt. |
| Schlüsselproblem | Alter Schlüssel bleibt in `AMANAH_DATA_KEYS`, bis `reencrypt-amanah-data.mjs` alle Datensätze umgeschlüsselt hat (Doku 15). Nie einen Schlüssel entfernen, der noch referenziert wird. |
| Staging kompromittiert | Container stoppen, Volume löschen (nur synthetische Daten), alle Staging-Secrets neu erzeugen, Basic Auth wechseln. |

## 6. Sicherheitsprüfungen

Automatisch (`staging-security-check.sh`):
- CSP gesetzt; `X-Robots-Tag: noindex`; `X-Frame-Options: DENY`; kein `X-Powered-By`
- `robots.txt` sperrt alles; Staging-Banner sichtbar
- Login von fremder Herkunft wird abgelehnt
- Registrierung mit nicht zugelassener Domain wird abgelehnt
- Ordner-API ohne Sitzung gibt 401
- Hinter Caddy zusätzlich: Basic Auth (401 ohne Zugangsdaten) und HSTS

Dazu vor dem Pilot:
- Validator-Lauf
- Secret-Scan (gitleaks)
- `npm audit --omit=dev`
- Restore-Probe
- Logs auf Adressen und Tokens durchsuchen

## 7. Testprotokoll

### Lokaler Probelauf 2026-10-31 (Claude Code; temporäre PostgreSQL 16.6, DB `amanah_staging`, Wegwerf-Secrets, `next start` mit Staging-Build an 127.0.0.1:3201)

| # | Prüfung | Ergebnis |
|---|---|---|
| 1 | `validate-staging-env.mjs` mit vollständiger Staging-Env | keine Fehler |
| 2 | `prisma migrate deploy` auf `amanah_staging` | alle 4 Migrationen angewandt |
| 3 | `/api/health` | `environment: staging`, `dbReachable: true`, `aiEnabled: false` |
| 4 | `seed-staging-accounts.mjs --count 3` | 3 Konten `pilot-0X-…@staging.invalid`, bestätigt, Einwilligung, synthetischer Ordner; Datei mit Rechten 600 |
| 5 | Seed mit Zielpfad im Repo | verweigert (Exit 2) |
| 6 | Datenbank | 3/3 Ordner verschlüsselt (`amanah-aes256gcm-v1`), kein Klartext „Testperson“ |
| 7 | Login mit Testkonto | 200, Status `verified` |
| 8 | `staging-healthcheck.sh` | 5/5 OK |
| 9 | `staging-security-check.sh` (ohne Caddy) | 9/9 OK |
| 10 | Server-Log | keine Adressen, Passwörter oder Tokens |
| 11 | Unit-Tests `staging.test.ts` | 14/14 (Domain-Allow-List, Validator-Ablehnungen, Compose-Trennung) |
| – | Basic Auth, HSTS, Caddy, Docker-Compose-Lauf, Backup/Restore auf Staging | `NOT_RUN` (kein Deployment; Backup/Restore-Skript am 30.10. gegen Temp-DB bestanden, unverändert) |

### Vorlage für den Pilot (je Durchgang ausfüllen)

| Bereich | Fall | Erwartet | Ergebnis | Tester/Datum |
|---|---|---|---|---|
| Konto | Registrieren mit `…@staging.invalid`, Link aus Outbox, Bestätigung | Dashboard, Einwilligungsabfrage | | |
| Konto | Passwort vergessen → Reset → alte Sitzungen ungültig | Neuanmeldung nötig | | |
| Einwilligung | Ordner speichern ohne/mit Einwilligung; Widerruf | 403 / gespeichert / Serverkopie gelöscht | | |
| Vorsorge | Notfallkarte, Janazah, Dokumente, Personen, Schulden ausfüllen, neu laden | Daten bleiben | | |
| Export | Konto-Export (JSON), PDF-Druckansicht | vollständig | | |
| Löschen | Konto löschen mit Passwort | Konto weg, Kauf anonymisiert | | |
| Plus | Sandbox-Kauf 39 €, Fehlschlag, Erstattung | Status korrekt, Testbeleg | | |
| Wissen | `/wissen` ohne Konto | erreichbar, keine unveröffentlichten Artikel | | |
| Mobil | Alle Fälle auf einem echten Smartphone | bedienbar, kein Querscrollen | | |
| Betrieb | Health-Check, Backup, Restore-Probe | grün | | |

## 8. Lücke in der Produktionskonfiguration (behoben am 31.10.)

`docker-compose.prod.yml` reichte die seit dem 30.10. nötigen Variablen nicht an die App weiter (Datenschlüssel, Verschlüsselungsmodus, Basis-URL, Mail, Billing, Frist für Altkonten). Ohne Datenschlüssel wäre der Dienst faktisch ausgefallen: Speichern schlägt fehl, verschlüsselte Ordner sind nicht lesbar.

Auf Owner-Freigabe vom 31.10. im Repository angewandt (kein Deployment). Lokal geprüft mit `docker compose -f docker-compose.prod.yml --env-file <Dummy-Werte> config`:
- Alle Variablen kommen an; Mail bleibt `disabled`, Billing `disabled`, Frist 60 Tage.
- Fehlen `AMANAH_DATA_KEYS`, `AMANAH_DATA_KEY_ACTIVE` oder `AMANAH_PUBLIC_BASE_URL`, bricht Compose vor dem Start mit einer klaren Meldung ab.
