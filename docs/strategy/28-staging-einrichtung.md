# Staging-Einrichtung auf dem gemeinsamen Server (31.10.2026)

Stand: 2026-10-31 · Agent: Claude Code · Grundlage: Owner-Freigabe „Git-Push und kontrolliertes Staging“
Server: `gemeinsam1-prod` (Hetzner; dort laufen bereits Amanah-Produktion und gemeinsam1-Produktion). Checkliste: Doku 27 §6.

## 1. Ergebnis in einem Satz

Amanah-Staging läuft isoliert auf dem Server, **ohne öffentlichen Zugang**: Die App hört nur auf `127.0.0.1:3201`, der Zugriff erfolgt per SSH-Tunnel. HTTPS, Basic Auth, DNS und Caddy wurden **übersprungen**, weil keine Amanah-Domain existiert (`amanahordner.de`: NXDOMAIN, nicht registriert). Alle anderen Abnahmepunkte sind grün; Produktion und andere Projekte sind unverändert.

Zugang für Tester: `ssh -N -L 3201:127.0.0.1:3201 gemeinsam1-prod`, dann `http://127.0.0.1:3201` im Browser. Testkonten liegen in `/root/amanah-staging-testdata/accounts.json` (Rechte 600, nur root).

## 2. Bestandsaufnahme vorher (nur lesend)

| Bereich | Befund |
|---|---|
| Host | Ubuntu 24.04, 2 CPU, 3,7 GB RAM (2,2 GB verfügbar), `/` 6,8 GB frei (82 %), Docker 29.6 mit containerd-Image-Speicher |
| Container | `amanah-app` (Produktion, `127.0.0.1:3001`), `amanah-postgres`, `gemeinsam1-prod-{frontend,backend,db,caddy}`. Caddy als Container mit 80/443, Konfiguration `/opt/gemeinsam1/deploy/Caddyfile` (nur gemeinsam1-Domains) |
| Netze/Volumes | `amanah-app_amanah_internal`, `gemeinsam1-prod_internal`; Volumes `amanah_pg_prod`, `gemeinsam1-prod_*` |
| Firewall | UFW aktiv: eingehend nur 22, 80, 443 |
| Ports | belegt: 22, 80, 443, 127.0.0.1:3001; **3201 frei** |
| DNS | `amanahordner.de`, `staging.amanahordner.de`: NXDOMAIN. Keine andere eindeutig Amanah gehörende Domain → DNS/Caddy-Schritt dokumentiert übersprungen |
| Werkzeuge | kein Node, kein `age` auf dem Host; `jq`, `openssl`, `curl` vorhanden |

**Entscheidungen, um Produktion zu schützen:**
- Images lokal gebaut und übertragen, nicht auf dem Server gebaut: Ein Next-Build braucht mehr RAM, als neben der Produktion frei ist.
- Keine Pakete auf dem Host installiert: `age` läuft als Mini-Container.
- Harte Grenzen für RAM, CPU und Logs in `docker-compose.staging.yml` (`f9022d3`).

## 3. Was auf dem Server angelegt wurde (nur Amanah-Staging)

| Ressource | Zweck |
|---|---|
| `/opt/amanah-staging/` (700) | `docker-compose.staging.yml`, `.env.staging` (600, auf dem Server erzeugt, nie ausgegeben), `scripts/` (Validator, Health-, Sicherheitscheck, Backup, Restore, Seed), `bin/age` (Wrapper), `backups/` (700) |
| Container | `amanah-staging-app` (768 MB / 1 CPU, Benutzer `nextjs`), `amanah-staging-postgres` (384 MB / 0,5 CPU) |
| Netze | `amanah_staging_db` (**internal**, kein Internet: DB, Migration, App), `amanah_staging_edge` (nur App: 127.0.0.1:3201, ausgehend für eine spätere Stripe-Test-API) |
| Volume | `amanah_pg_staging` |
| Images | `amanah-staging-app:f9022d3` (591 MB auf dem Server), `amanah-staging-age:1` (29 MB). Das Migrate-Image (2,8 GB) habe ich nach der Migration wieder entfernt |
| `/etc/cron.d/amanah-staging` | Health-Check alle 5 Minuten, verschlüsseltes Backup täglich 03:45 mit 7 Tagen Aufbewahrung, Sicherheitscheck montags 04:30. Logs werden je Lauf überschrieben; Alarmdatei `/var/log/amanah-staging-health.alarm` |
| `/root/amanah-staging-testdata/accounts.json` (600) | synthetische Testkonten (`pilot-…@staging.invalid`) |

Nicht angefasst:
- `/opt/amanah-app`, `/opt/gemeinsam1`, die Caddyfile, die Crontab von root (Produktions-Backup 03:15)
- UFW, DNS
- alle anderen Container, Netze und Volumes

## 4. Konfiguration (Werte nicht ausgegeben)

- Alle Secrets frisch auf dem Server erzeugt (`openssl rand`), nicht aus Produktion übernommen: DB-Passwort, `SESSION_SECRET`, Datenschlüssel `stg1`, Sandbox-Webhook-Secret.
- `AMANAH_DEPLOYMENT_ENV=staging`, Banner, noindex.
- Registrierung nur `staging.invalid`, Mail nur Outbox (`AMANAH_DEV_OUTBOX`), interne Werkzeuge aus.
- Billing Sandbox, Sperren aus, KI aus.
- Datenbank `amanah_staging`.
- `validate-staging-env.mjs` (im App-Image ausgeführt): keine Fehler.
- `AMANAH_PUBLIC_BASE_URL=http://127.0.0.1:3201` (Tunnelzugang). Mit einer Domain wird das Image mit der neuen URL neu gebaut.

## 5. Abnahme auf dem Server

| Prüfung | Ergebnis |
|---|---|
| Start | Migration angewandt, Postgres healthy, App healthy; `/api/health`: `staging`, DB erreichbar, KI aus |
| Produktion danach | `amanah-app` Health 200; alle gemeinsam1-Container unverändert „Up“ |
| `staging-security-check.sh` | 14/14 (CSP, noindex, Frame-Schutz, robots, Banner, fremde Herkunft, Allow-List, Ordner-API, 4 interne Seiten 404, unsignierter Webhook 400) |
| Isolation | DB ohne Port; DB-Netz `internal`; DB ohne Internet; Staging-App erreicht weder Amanah-Produktions-DB noch gemeinsam1-DB (Name und IP); der gemeinsame Caddy erreicht Staging nicht; von außen sind Port 3201 und 5432 nicht erreichbar |
| Testkonten | 3 über die öffentliche API (Registrieren, Bestätigen, Einwilligung, Ordner) |
| Verschlüsselung at rest | alle Ordner `amanah-aes256gcm-v1`, 0 Klartext, auch nach Änderung |
| Login, Vorsorgeprozess | Login 200; Notfallkarte ändern, neu laden, bleibt; zweites Konto sieht nichts vom ersten |
| Testkauf | Sandbox 39 € → bezahlt; Sperren aus; Zugriff je Plus-Funktion |
| Export, Löschung | Export vollständig, ohne Passwort-Hash; Löschung mit falschem Passwort 403, mit richtigem 200; danach Login und alte Sitzung 401 |
| Browser Desktop 1280 px + Mobil 390 px (über Tunnel, Login per Formular) | Plus-Hinweis ohne Kaufknopf, Banner, kein Querscrollen, Testamentsvorbereitung/Erbquoten gesperrt; ungeprüfter Artikel 404 (11/11) |
| **Stripe-Webhook-Signaturen** (vorübergehend `stripe_test` mit selbst erzeugtem `whsec_` und Dummy-Testschlüssel; Stripe wurde nicht kontaktiert) | ohne Signatur 400, falsches Geheimnis 400, Zeitstempel 10 min alt 400, Live-Ereignis 400, gültig + unbekannter Kauf 200 `unknown_purchase`, gültig + anderer Typ 200 `ignored` (6/6). Danach zurück auf Sandbox, Override-Datei gelöscht |
| Logs | App- und DB-Log: 0 Treffer für Adressen, Tokens, Passwörter, `whsec_`/`rk_test_`, DB-Passwort, Session-Secret, Datenschlüssel. Auch nach rund 20 Anfragen enthält das App-Log nur 6 Startzeilen |
| Backup | `backup-postgres.sh` mit age (nur öffentlicher Schlüssel auf dem Server): Datei `age-encryption.org/v1`, ohne Schlüssel nicht lesbar |
| **Rückrollbarkeit** | Backup lokal entschlüsselt, in die **neue** DB `amanah_staging_restore` eingespielt; zweite App-Instanz (127.0.0.1:3202) darauf gestartet. Login und Entschlüsselung der Ordner ok; das vorher gelöschte Konto blieb gelöscht. Danach Instanz und DB entfernt. Konfigurations-Rückroll (stripe_test → sandbox per `up -d --no-deps app`) ebenfalls nachgewiesen |
| `staging-healthcheck.sh` | 6/6 (Fehler gefunden und behoben: Das Skript brauchte Node, der Server hat keines → nutzt jetzt `jq`) |

## 6. Speicher und Ressourcen

| | vorher | Spitze | nachher |
|---|---|---|---|
| `/` frei | 6,8 GB (82 %) | 3,9 GB (90 %) während das Migrate-Image geladen war | 6,1 GB (83 %) |
| RAM verfügbar | 2,2 GB | – | 2,1 GB; Staging belegt rund 120 MB (App 79 MB, DB 41 MB) |

Hinweis: Auf dem Server liegen 13,3 GB Build-Cache und rund 5,9 GB nicht genutzte Images anderer Projekte bzw. der Produktion. Ich habe nichts davon angefasst; eine Bereinigung ist Sache des Owners.

## 7. Rückrollplan (konkret für diesen Server)

| Fall | Befehl bzw. Vorgehen (in `/opt/amanah-staging`) |
|---|---|
| Staging stoppen | `docker compose -p amanah-staging -f docker-compose.staging.yml --env-file .env.staging stop` |
| App-Version zurück | `AMANAH_RELEASE=<alter sha>` in `.env.staging` (Image muss geladen sein), `… up -d --no-build --no-deps app` |
| Neue Migration | vorher Backup; Migrate-Image laden, `… up -d --no-build`, danach Migrate-Container und -Image wieder entfernen (2,8 GB) |
| DB zurück | Backup lokal entschlüsseln (Owner-Schlüssel), in eine frische DB einspielen, prüfen, dann `DATABASE_URL` umstellen (wie in §5 geprobt) |
| Staging ganz entfernen | `… down` (mit `-v` löscht auch die Testdaten), dazu `/etc/cron.d/amanah-staging`, `/opt/amanah-staging`, `/root/amanah-staging-testdata`, die Images `amanah-staging-*` und die Logs `/var/log/amanah-staging-*` entfernen. Produktion bleibt davon unberührt |

## 8. Offene Voraussetzungen

1. **Domain:** Eine Amanah-Domain registrieren bzw. benennen (z. B. `amanahordner.de`). Dann:
   - DNS `staging.<domain>` → Server
   - Caddy-Block: Weil Caddy im gemeinsam1-Container läuft, nicht `127.0.0.1:3201` verwenden. Stattdessen Staging-App zusätzlich an ein eigenes Netz hängen, das auch Caddy kennt, **oder** `reverse_proxy host.docker.internal:3201` mit passender Bindung. Das ist eine Entscheidung am gemeinsamen Webserver.
   - Basic Auth, HTTPS prüfen (`EXPECT_BASIC_AUTH=true EXPECT_HSTS=true`)
   - Image mit der neuen `NEXT_PUBLIC_SITE_URL` neu bauen
2. **Backup-Schlüssel:** In `.env.staging` steht der öffentliche Schlüssel meines Testlaufs. Den privaten Schlüssel habe ich gelöscht. Bitte einen eigenen age-Schlüssel erzeugen (`age-keygen`), den privaten Teil getrennt verwahren und `BACKUP_AGE_RECIPIENTS` ersetzen. Bis dahin sind die Staging-Backups nicht wiederherstellbar (nur synthetische Daten).
3. **Alarmweg:** Der Health-Check schreibt bei Fehler `/var/log/amanah-staging-health.alarm`. Benachrichtigung (Mail oder Uptime-Dienst) ist noch nicht festgelegt.
4. **Plattenplatz:** Der Server liegt bei 83 %, der Health-Check alarmiert ab 85 %. Bereinigung des Build-Caches (13 GB) durch den Owner empfohlen.
5. **Stripe:** Amanah-Konto und Testschlüssel (Doku 25). Webhook erst sinnvoll, wenn die Domain steht.
6. **Push** der neuen Commits ab `f9022d3` (eigene Freigabe).

## 9. Go/No-Go

**Privater Testdaten-Pilot: GO**, über SSH-Tunnel mit den synthetischen Testkonten. Für Tester ohne SSH-Zugang ist zuerst die Domain samt Caddy/HTTPS/Basic Auth nötig (§8.1); bis dahin gilt GO nur für Tester mit SSH-Zugang.

**Pilot mit echten Personen und öffentlicher Start: NO-GO** (Rechts- und Datenschutzfreigaben, Doku 27 §10).
