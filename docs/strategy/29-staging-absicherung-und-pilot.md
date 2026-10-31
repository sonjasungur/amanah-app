# Staging absichern und Pilot vorbereiten (31.10.2026)

Grundlage: Doku 28 (Einrichtung), Doku 27 (Checkliste). Server `gemeinsam1-prod`, nur Amanah-Staging verändert.
Keine Änderungen an Produktion, Caddy, DNS, Firewall oder gemeinsam1.

## 1. Ergebnis

| Bereich | Stand |
|---|---|
| Git | `c2da7b9..f7f9b05` auf GitHub gepusht (gitleaks: 2 Commits und gesamte Historie ohne Funde). Arbeit dieses Auftrags lokal committet, **nicht gepusht** |
| Backups | **nicht abgenommen.** Es gibt noch keinen dauerhaft verwahrten Schlüssel. Der tote Testempfänger ist entfernt; das nächtliche Backup schlägt deshalb sichtbar fehl und alarmiert. Skripte für Restore-Test fertig und mit Wegwerf-Schlüssel auf dem Server geprüft |
| Alarmierung | eingerichtet, **nur lokal** (`/var/log/amanah-staging-alerts.log`). Externer Kanal vorbereitet (ntfy oder Webhook), aus bis zur Freigabe |
| Domain/Caddy | Variante A läuft (Tunnel). Variante B vorbereitet und geprüft (eigenes internes Proxy-Netz, Snippet validiert), nicht angewandt |
| Sicherheit | alle 8 Punkte erneut geprüft, ohne Befund (§5) |
| Pilot | Testdaten-Pilot nur für den Owner per Tunnel; **kein Pilot mit weiteren Testern**, bis Backup-Schlüssel und Restore-Test stehen (§9) |

## 2. Staging-Backups

### 2.1 Ausgangslage

- Das Backup vom 31.10. 13:48 ist mit einem Testschlüssel verschlüsselt, dessen privater Teil gelöscht ist. Es ist **nicht wiederherstellbar** und heißt jetzt `…134846.sql.gz.age.UNRESTORABLE-key-deleted` (zählt für keine Prüfung mehr).
- Der Health-Check hatte dieses Backup als „OK“ gezählt. Das ist korrigiert: Ein Backup zählt erst, wenn ein Restore-Test **mit dem aktuellen Empfängerschlüssel** bestanden ist (§2.4).
- `BACKUP_AGE_RECIPIENTS` in `/opt/amanah-staging/.env.staging` ist jetzt leer (Sicherung der vorherigen Datei: `/opt/amanah-staging/rollback/`). Folge: Das Backup um 03:45 bricht ab und alarmiert, statt wertlose Dateien zu erzeugen.

### 2.2 Schlüssel erstellen und verwahren (Owner, auf dem eigenen Rechner)

Der private Schlüssel entsteht **nicht** auf dem Server, nicht in einem Repository und nicht durch einen Agenten. Auf den Server kommt nur der öffentliche Teil (`age1…`).

1. age installieren (Ubuntu: `sudo apt install age`).
2. Schlüssel erzeugen, ohne ihn anzuzeigen:
   ```bash
   umask 077
   mkdir -p ~/amanah-keys
   age-keygen -o ~/amanah-keys/amanah-staging-backup.key   # gibt nur "Public key: age1…" aus
   ```
3. Verwahren, **zwei unabhängige Orte**:
   - Passwortmanager: den ganzen Dateiinhalt als sichere Notiz („Amanah Staging Backup-Schlüssel“).
   - Offline-Kopie: ausgedruckt oder auf einem verschlüsselten USB-Stick, getrennt vom Laptop aufbewahrt.
   - Nicht in Cloud-Ordnern im Klartext, nicht in Git, nicht per Mail oder Chat.
4. Die lokale Datei danach löschen (`shred -u ~/amanah-keys/amanah-staging-backup.key`). Für Restore-Tests wird sie kurzzeitig aus dem Passwortmanager wiederhergestellt.
5. Den **öffentlichen** Schlüssel (`age1…`) an Claude geben oder selbst eintragen:
   ```bash
   ssh gemeinsam1-prod "sed -i 's/^BACKUP_AGE_RECIPIENTS=.*/BACKUP_AGE_RECIPIENTS=age1…/' /opt/amanah-staging/.env.staging"
   ```
6. Für die Produktion später einen **eigenen** Schlüssel erzeugen, nie diesen wiederverwenden.

### 2.3 Optional: automatischer Restore-Test (Entscheidung Owner)

Der Restore-Test braucht einen privaten Schlüssel. Zwei Wege:

| | Nur Owner-Schlüssel | Zusätzlich Prüfschlüssel auf dem Server (empfohlen für Staging) |
|---|---|---|
| Ablauf | Owner führt den Test wöchentlich aus (§2.4, Weg 2) | Nacht-Job 04:15 prüft das frische Backup automatisch |
| Alarm bei Fehler | nur über das Alter des letzten Nachweises (> 8 Tage) | sofort am Morgen |
| Risiko | keins zusätzlich | Wer Root auf dem Server hat, kann die Staging-Backups entschlüsseln. Diese Person kann die Staging-DB aber ohnehin lesen; Inhalte sind synthetisch |

Umsetzung des Prüfschlüssels (nur nach Freigabe):
- Claude erzeugt `/root/.config/amanah-staging/restore-check.key` (600) auf dem Server, ohne Ausgabe.
- Der öffentliche Teil kommt als **zweiter** Empfänger in `BACKUP_AGE_RECIPIENTS`.
- In `ops.env` wird `AGE_IDENTITY` gesetzt.
- Der Owner-Schlüssel bleibt der einzige Weg, falls der Server verloren geht.

### 2.4 Restore-Test nach Bereitstellung des Schlüssels

`scripts/staging-restore-test.sh`:
- spielt ein Backup in die Wegwerf-DB `amanah_restore_test` im Staging-Postgres ein
- vergleicht Tabellenzahl und angewandte Migrationen mit der Live-DB und verlangt Konten
- löscht die Wegwerf-DB wieder
- schreibt bei Erfolg `/opt/amanah-staging/state/restore-test.ok` mit Datum, Backup-Name und SHA-256 der Empfänger

Der Health-Check meldet FAIL, wenn:
- kein Empfänger eingetragen ist,
- der Nachweis fehlt,
- der Nachweis zu anderen Empfängern gehört,
- oder er älter als 8 Tage ist.

Ablauf nach Schritt 2.2:
1. Claude: `scripts/staging-cron.sh backup` (neues Backup mit dem Owner-Empfänger).
2. Owner, Weg 2: Der Schlüssel verlässt den Rechner nicht. Entschlüsselt wird lokal, nur die entschlüsselten synthetischen Daten gehen zurück auf den Server:
   ```bash
   F=$(ssh gemeinsam1-prod 'ls -1t /opt/amanah-staging/backups/amanah_*.sql.gz.age | head -1')
   ssh gemeinsam1-prod "cat $F" | age -d -i ~/amanah-keys/amanah-staging-backup.key \
     | ssh gemeinsam1-prod "cd /opt/amanah-staging && BACKUP_NAME=$(basename $F) scripts/staging-restore-test.sh --stdin"
   ```
   Erwartet: 5 × `OK`.
3. Claude: Health-Check muss danach ohne FAIL laufen; einmal zusätzlich App-Ebene prüfen (zweite Instanz auf einer frischen DB, Login, Ordner entschlüsselbar), wie in Doku 28 §5.

**Skripttest heute** (Wegwerf-Schlüssel nur im RAM unter `/dev/shm`, danach gelöscht; kein Nachweis für die Abnahme):

| Fall | Ergebnis |
|---|---|
| richtiger Schlüssel, Datei-Weg | 5 × OK |
| richtiger Schlüssel, stdin-Weg (Owner-Weg) | 5 × OK (erster Lauf scheiterte: Abfragen lasen stdin mit, behoben) |
| falscher Schlüssel | FAIL, kein Nachweis geschrieben |
| kein Schlüssel | FAIL „no age identity available“ |
| altes Backup (Testschlüssel gelöscht) | FAIL: bestätigt nicht wiederherstellbar |

Danach waren nur `amanah_staging`, `postgres` und die Vorlagen-DBs vorhanden, und `/dev/shm` war leer.

### 2.5 Verlust und Wechsel

- Schlüssel verloren: Alle Backups mit diesem Empfänger sind wertlos. Neuen Schlüssel nach §2.2 erzeugen, eintragen, sofort Backup und Restore-Test.
- Wechsel: Neuen Empfänger eintragen. Der Health-Check meldet FAIL, bis ein Restore-Test mit dem neuen Schlüssel bestanden ist. Alte Backups bleiben mit dem alten Schlüssel lesbar, bis die Aufbewahrung von 7 Tagen sie entfernt.

## 3. Alarmierung

### 3.1 Aufbau

`/etc/cron.d/amanah-staging` ruft für jeden Job `scripts/staging-cron.sh <job>` auf. Die Ausgabe landet in `/var/log/amanah-staging-<job>.log`, das Ergebnis geht an `scripts/staging-alert.sh`.

| Ereignis | Prüfung | Takt | Schwelle |
|---|---|---|---|
| Staging-Ausfall | `health`: `/api/health`, Umgebung, DB, KI aus | alle 5 min | sofort |
| Speicher kritisch | `health`: Belegung `/` | alle 5 min | > 85 % (aktuell 83 %) |
| Backup fehlgeschlagen | `backup`: Exit-Code; `health`: kein Backup jünger als 26 h | 03:45 / 5 min | sofort |
| Restore-Test fehlgeschlagen | `restore` (mit Prüfschlüssel) und `health`: Nachweis fehlt, falscher Schlüssel oder älter als 8 Tage | 04:15 / 5 min | sofort |
| Zertifikat läuft ab | `health` mit `CERT_HOST` (erst ab Variante B) | alle 5 min | < 21 Tage (Caddy erneuert ab 30 Tagen; Alarm heißt: Erneuerung gescheitert) |
| Sicherheitscheck | `security`: Header, Allow-List, interne Seiten, Webhook | Mo 04:30 | sofort |

Verhalten des Dispatchers:
- **Alarm** bei neuem oder geändertem Fehler; ein reiner Zahlenwechsel (86 % → 87 %) zählt als derselbe Fehler.
- **Erinnerung** alle 24 h, solange der Fehler besteht.
- **Entwarnung**, sobald die Prüfung wieder besteht.
- Versendet werden nur die `FAIL`-Zeilen der Prüfskripte oder „Job X mit Code N beendet“, nie Log-Inhalte.
- URL und Token gehen über stdin an curl, nie als Prozessargument.
- Tests: `src/__tests__/staging-ops.test.ts` (11).

### 3.2 Kanal

Auf dem Server gibt es keinen Mailversand, und es gibt keinen bestehenden Benachrichtigungsweg. Optionen:

| Kanal | Aufwand | Bewertung |
|---|---|---|
| **ntfy** (App auf dem Handy, ntfy.sh oder später selbst betrieben) | Topic mit langem Zufallsnamen bzw. Konto mit Token; keine Serverpakete nötig | **empfohlen**: kostenlos, nur curl, sofort aufs Handy |
| Chat-Webhook (Mattermost, Slack, Rocket.Chat) | Webhook-URL | wenn ein Team-Chat existiert |
| E-Mail | Mailprogramm auf dem Server (Paketinstallation) + SMTP-Zugang | mehr Serveränderung, Zugangsdaten auf dem Server |

Einschalten (nach Freigabe, Owner trägt Werte selbst ein; Claude liest die Datei nicht aus):
1. `/opt/amanah-staging/alert.env` (600) bearbeiten: `ALERT_NTFY_URL`, ggf. `ALERT_NTFY_TOKEN`, `ALERT_EXTERNAL=true`.
2. Test: `scripts/staging-alert.sh kanaltest 1` → eine Testnachricht, dann `scripts/staging-alert.sh kanaltest 0` → Entwarnung.

Sobald der Kanal aktiv ist, meldet er sofort den offenen Alarm „kein Backup-Empfänger“.

### 3.3 Grenzen

- Fällt der ganze Server aus, läuft auch Cron nicht, und es kommt keine Meldung. Abhilfe: externer Uptime-Prüfer auf die HTTPS-Adresse (ab Variante B, erwartet 401) oder ein Heartbeat-Dienst. Beides wäre ein neuer externer Dienst und braucht deine Freigabe.
- Speicher-Alarm ab 85 %. Der Server liegt bei 83 %, Hauptverursacher sind 13,3 GB fremder Build-Cache (nicht angefasst).

## 4. Domain und Caddy

### 4.1 Netzwerkanalyse (nur lesend)

- Caddy ist der Container `gemeinsam1-prod-caddy` (Caddy 2.11.4) und hängt nur im Netz `gemeinsam1-prod_internal`. Die Caddyfile ist als **einzelne Datei** eingebunden.
- Staging-App: Netze `amanah_staging_db` (internal) und `amanah_staging_edge`, Port nur `127.0.0.1:3201` auf dem Host.
- **Caddy erreicht Staging heute nicht**:
  - `127.0.0.1` im Caddy-Container ist der Container selbst, nicht der Host.
  - Caddy und Staging teilen kein Netz.
  - Beides geprüft: `wget amanah-staging-app` aus Caddy → „bad address“.
- Das alte Snippet hatte `reverse_proxy 127.0.0.1:3201` und hätte deshalb nicht funktioniert. Korrigiert.
- Die Amanah-Produktion hängt per `docker-compose.prod.nocaddy.yml` im Netz `gemeinsam1-prod_internal` (siehe §6).
- sshd: nur Schlüssel-Login, Weiterleitung erlaubt, einziger Login-Nutzer ist `root`.

### 4.2 Variante A: SSH-Tunnel ohne Domain (aktiver Stand)

- Zugang: `ssh -N -L 3201:127.0.0.1:3201 gemeinsam1-prod`, dann `http://127.0.0.1:3201`.
- Vorteile: keine öffentliche Angriffsfläche, keine Änderung an Caddy, DNS oder Firewall, kein Zertifikat.
- Nachteile:
  - Heute nur mit Root-Zugang zum Server, also **nur für den Owner geeignet**.
  - Die App läuft mit `http://127.0.0.1:3201` als Basis-URL. Links in Outbox-Mails zeigen dorthin; für Tester mit Tunnel ist das passend.
- Erweiterung A2 für Tester, die keinen Server-Zugang bekommen sollen (Serveränderung, nur nach Freigabe):
  - Eigener Nutzer `amanah-tunnel` ohne Passwort und ohne Shell. Je Tester eine Zeile in `authorized_keys`:
    ```
    restrict,port-forwarding,permitopen="127.0.0.1:3201",command="/usr/sbin/nologin" ssh-ed25519 AAAA… tester-name
    ```
  - Der Tester kann damit nur Port 3201 weiterleiten: keine Shell, keine anderen Ports.
  - Rückroll: Zeile löschen bzw. Nutzer entfernen.

### 4.3 Variante B: eigene Subdomain mit HTTPS und Basic Auth (vorbereitet)

Geprüfte Anbindungen:

| Weg | Bewertung |
|---|---|
| **B1: eigenes internes Netz `amanah_staging_proxy`** nur für Caddy und Staging-App | **empfohlen.** Caddy sieht nur `amanah-staging-app:3000`; Staging sieht nichts von gemeinsam1; das Netz ist `internal`, keine Route nach außen |
| B2: Caddy → Host (`host.docker.internal:3201`) | abgelehnt: Caddy-Container müsste neu erstellt werden (extra_hosts), Staging-Port müsste ans Docker-Gateway, plus UFW-Regel |
| B3: Staging ins Netz `gemeinsam1-prod_internal` | abgelehnt: Staging könnte `gemeinsam1-prod-db` und Backend erreichen |
| B4: eigener Proxy für Amanah | nicht möglich, 80/443 sind belegt |

Vorbereitet im Repo:
- `docker-compose.staging.proxy.yml` (Overlay; `docker compose config` geprüft: nur die App bekommt das Proxy-Netz, DB bleibt im internen DB-Netz).
- `deploy/Caddyfile.staging-snippet`:
  - Upstream `amanah-staging-app:3000`
  - Basic Auth außer für den Stripe-Webhook
  - interne Seiten 404, HSTS, noindex
  - Log im `caddy_data`-Volume mit Rotation
  - mit Caddy 2.11.4 validiert („Valid configuration“; lokaler Wegwerf-Container, Image danach entfernt)

Ablauf B1 (jeder Schritt mit Freigabe; Schritte 3–5 ändern den gemeinsam genutzten Caddy):
1. Domain festlegen/registrieren. DNS: `staging.<domain>` A und AAAA auf den Server (nur ein Amanah-Eintrag).
2. Staging-Image mit `NEXT_PUBLIC_SITE_URL`/`AMANAH_PUBLIC_BASE_URL=https://staging.<domain>` neu bauen (lokal) und laden, dann `up -d --no-deps app` mit dem Overlay. Das ist eine neue Staging-Version.
3. `docker network connect amanah_staging_proxy gemeinsam1-prod-caddy`. Das geschieht im laufenden Betrieb ohne Neustart.
   - Dauerhaft wäre ein Eintrag in der gemeinsam1-Compose-Datei nötig.
   - Geht die Verbindung verloren, ist nur Staging betroffen (502).
4. Basic-Auth-Passwort im Passwortmanager anlegen; Hash mit `docker exec -it gemeinsam1-prod-caddy caddy hash-password`.
5. Caddyfile:
   - Sicherung `cp -p Caddyfile Caddyfile.bak-<datum>`
   - neue Fassung = alte + Snippet
   - `caddy validate` (im Container auf eine Kopie)
   - **in place schreiben** (`cat neu > Caddyfile`, wegen der Einzeldatei-Einbindung)
   - `caddy reload`
   - danach `gemeinsam1.com` und `api.gemeinsam1.com` prüfen (200)
6. Prüfen:
   - ohne Anmeldung 401
   - mit Anmeldung 200
   - Zertifikat gültig
   - `staging-security-check.sh` mit `EXPECT_BASIC_AUTH=true EXPECT_HSTS=true`
   - Webhook ohne Signatur 400
   - `CERT_HOST` in `ops.env` setzen
7. Rückroll:
   - Caddyfile aus der Sicherung in place zurückschreiben, `caddy reload`
   - `docker network disconnect amanah_staging_proxy gemeinsam1-prod-caddy`
   - DNS-Eintrag löschen
   - App ohne Overlay starten

Hinweis: Das Zertifikat läuft über das ACME-Konto von gemeinsam1 (`admin@gemeinsam1.com`); Ablaufwarnungen gehen dorthin. Das ist ein zusätzlicher Grund für die Zertifikatsprüfung in §3.

### 4.4 Empfehlung

- **Jetzt**: Variante A für den Owner.
- **Für den Pilot mit Testern**: Variante B1, sobald die Domain feststeht. A2 nur, wenn die Tester mit SSH umgehen können und die Domain noch fehlt.

## 5. Sicherheitsprüfung (31.10., 15:30, nur lesend)

| Punkt | Ergebnis |
|---|---|
| Staging-DB nicht öffentlich | keine Portbindung; Netz `amanah_staging_db` internal mit nur App und DB; kein Listener auf 5432/5433; von außen 5432, 5433, 3201, 3001 zu (Kontrolle 443 offen) |
| Keine echten Nutzerdaten | 5 Konten, alle `@staging.invalid`; Registrierung nur für diese Domain |
| Keine Stripe-Live-Schlüssel | Billing `sandbox`, Sperren aus, kein Stripe-Schlüssel gesetzt; 0 Live-Muster in env-Datei und Container |
| Keine echten E-Mails | Transport `outbox`, keine Mail-Anbieter-Variablen im Container |
| Keine öffentlichen religiösen Entwürfe | ungeprüfter Artikel `/wissen/faraid-und-wasiyya-das-wichtigste` 404; `/wissen/redaktion`, `/intern`, `/brand-review` 404 |
| Keine aktive Erbquotenberechnung | `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION` nicht gesetzt (Sperre greift; Browserprüfung Doku 28) |
| Keine sensiblen Logs | App-Log 6 Zeilen, DB-Log 78 Zeilen: 0 Treffer (Adressen, Passwörter, Tokens, Schlüsselmuster, DB-Passwort, Session-Secret); Job-Logs 0 Treffer |
| Kein Zugriff auf Produktionsdaten | Aus der Staging-App sind `amanah-postgres`, `amanah-app`, `gemeinsam1-prod-db` und deren IPs zu (Positivkontrolle: Staging-DB offen); Caddy erreicht Staging nicht; App ohne Volumes |
| Wöchentlicher Sicherheitscheck | über den neuen Job erneut ausgeführt: bestanden |
| Produktion | `amanah-app` Health 200; alle 6 Produktionscontainer unverändert „Up“ |

## 6. Separater Befund: Amanah-Produktion im gemeinsam1-Netz (nichts geändert)

- `amanah-app` (Produktion) hängt über `docker-compose.prod.nocaddy.yml` (`SHARED_PROXY_NETWORK`, Standard `gemeinsam1-prod_internal`) im selben Netz wie `gemeinsam1-prod-db`, -backend und -frontend. Die Caddyfile hat keine Amanah-Route; der Zweck war offenbar die spätere Proxy-Anbindung.
- Risiko:
  - Ein kompromittierter gemeinsam1-Dienst erreicht die Amanah-App direkt, unter Umgehung des Proxys.
  - Umgekehrt erreicht die Amanah-App die gemeinsam1-Datenbank auf Netzebene; deren Passwort bleibt die einzige Hürde.
  - Bewertung: mittel bis niedrig, beide Dienste sind eigene Projekte des Owners.
- Sichere Abhilfe (Produktionsänderung, nur nach Freigabe): Analog zu B1 ein eigenes Netz `amanah_prod_proxy` nur für Caddy und `amanah-app`, `SHARED_PROXY_NETWORK` darauf umstellen, beim nächsten geplanten Produktions-Deploy anwenden.

## 7. Heute auf dem Server geändert (nur `/opt/amanah-staging` und eigene Dateien)

- Skripte aktualisiert bzw. neu: `staging-healthcheck.sh`, `staging-alert.sh`, `staging-restore-test.sh`, `staging-cron.sh`.
- Konfiguration:
  - `ops.env` (ohne Geheimnisse)
  - `alert.env` (600, `ALERT_EXTERNAL=false`)
  - `.env.staging`: `BACKUP_AGE_RECIPIENTS` geleert
- `/etc/cron.d/amanah-staging` auf `staging-cron.sh` umgestellt; Restore-Job 04:15 neu (überspringt ohne `AGE_IDENTITY`).
- Unbrauchbares Backup umbenannt (`.UNRESTORABLE-key-deleted`).
- Neu: `/var/lib/amanah-staging-alerts/` (Zustand) und `/var/log/amanah-staging-{alerts,health,backup,restore,security}.log`. Die alten Dateien `health.last`/`health.alarm` sind entfernt.
- Sicherungen der vorherigen Cron- und env-Datei: `/opt/amanah-staging/rollback/` (700).
- Rückroll: beide Dateien aus `rollback/` zurückkopieren.
- Die Container wurden nicht neu gestartet und laufen seit der Einrichtung unverändert.

## 8. Offene Owner-Aufgaben

1. **Backup-Schlüssel** nach §2.2 erzeugen und verwahren, öffentlichen Schlüssel liefern. Danach Restore-Test nach §2.4, Weg 2 (ein Befehl auf deinem Rechner).
2. **Entscheidung Prüfschlüssel** auf dem Server für den automatischen Restore-Test (§2.3).
3. **Alarmkanal** wählen (Empfehlung ntfy) und freigeben, Werte selbst in `alert.env` eintragen (§3.2).
4. **Domain** festlegen und Freigabe für Variante B1 (DNS-Eintrag, Netzanschluss am gemeinsamen Caddy, Caddyfile-Ergänzung, neues Staging-Image) oder A2 (Tunnel-Nutzer).
5. Freigabe für den Push der Commits dieses Auftrags.
6. Optional:
   - Build-Cache auf dem Server bereinigen (13,3 GB, nicht von Amanah-Staging)
   - Befund §6 bei nächster Produktionsänderung beheben
   - Befund Port 5433 aus Doku 28 im Projekt `gemeinsam1-ai-platform` beheben

## 9. Pilot-Status

| | Entscheidung |
|---|---|
| Owner testet selbst per Tunnel mit synthetischen Daten | **GO** |
| Privater Testdaten-Pilot mit weiteren Testern | **NO-GO** bis erledigt: (1) Backup-Schlüssel verwahrt + Restore-Test bestanden, (2) Alarmkanal aktiv, (3) Zugang über B1 (oder A2) |
| Pilot mit echten Personen oder echten Daten, öffentlicher Start | **NO-GO** (unverändert, Sperren aus AI_HANDOFF §8) |
