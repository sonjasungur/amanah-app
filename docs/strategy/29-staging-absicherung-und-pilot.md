# Staging absichern und Pilot vorbereiten (31.10.2026)

Grundlage: Doku 28 (Einrichtung), Doku 27 (Checkliste). Server `gemeinsam1-prod`, nur Amanah-Staging verändert.
Keine Änderungen an Produktion, Caddy, DNS, Firewall oder gemeinsam1.

**Stand 31.10., 18:05: Staging technisch abgenommen** (§2.2b): Owner-Restore-Test bestanden, Health 8/8, Wiederherstellung auf App-Ebene 18/18.

Stand 17:45 nach Owner-Auftrag „nächste Freigaben und Prioritäten“:
- Schlüsselarchitektur festgelegt: Owner-Schlüssel plus separater Testschlüssel.
- ntfy vorbereitet.
- Variante B für `staging.amanahordner.de` konkretisiert.

## 1. Ergebnis

| Bereich | Stand |
|---|---|
| Git | bis `a489618` auf GitHub (18:03, gitleaks ohne Funde); diese Abnahme-Doku lokal committet |
| Backups | **abgenommen.** Owner-Empfänger `2cfae5a85d555db6`; Backup 17:54 an Owner- und Testschlüssel; automatischer Restore-Test (Testschlüssel) und persönlicher Restore-Test des Owners (Laptop) bestanden; Wiederherstellung auf App-Ebene 18/18 (§2.2a/b) |
| Automatischer Restore-Test | täglich 04:15 mit dem separaten Testschlüssel; Health verlangt Nachweis ≤ 2 Tage, Owner-Nachweis ≤ 35 Tage |
| Alarmierung | lokal aktiv; **E-Mail über Brevo SMTP** vorbereitet und lokal mit simuliertem SMTP-Server geprüft (Doku 30); **echter SMTP-Versand nicht abgenommen und zurückgestellt bis zur Domain**; Versand **aus**, ntfy aus |
| Domain/Caddy | Variante B1 gewählt; Schritte für `staging.amanahordner.de` mit Prüfskript (§4.3); nichts angewandt, nichts gekauft |
| Sicherheit | 8/8 ohne Befund (§5) |
| Pilot | nur Owner per Tunnel (§9) |

## 2. Staging-Backups

### 2.1 Schlüsselarchitektur

| Schlüssel | Wo der private Teil liegt | Zweck |
|---|---|---|
| **Owner-Schlüssel** | nur beim Owner (Passwortmanager und Offline-Kopie); nie auf dem Server, in Git, Logs oder Chat | dauerhafte Wiederherstellung, auch wenn der Server verloren ist |
| **Testschlüssel** (`restore-check`) | `/root/.config/amanah-staging/restore-check.key` (600) auf dem Server | nur automatischer Restore-Test mit synthetischen Staging-Daten |

- Jedes Staging-Backup wird an **beide** öffentlichen Schlüssel verschlüsselt.
- Ohne Owner-Empfänger entsteht **kein** Backup. Der Testschlüssel wird nur zusätzlich angehängt (`BACKUP_AGE_EXTRA_RECIPIENTS`) und reicht allein nicht.
- `staging-set-recipient.sh` weist den Testschlüssel als Owner-Schlüssel zurück.
- `staging-restore-test.sh` läuft nur mit einer Staging-Konfiguration (`AMANAH_DEPLOYMENT_ENV=staging`).
- **Produktion:** kein Testschlüssel auf dem Server; Restore-Tests nur mit dem Owner-Schlüssel auf dem Owner-Rechner und einem eigenen Produktionsschlüssel.

Der Health-Check verlangt zwei Nachweise, beide gebunden an den aktuellen Owner-Empfänger:
- automatischer Restore-Test (`state/restore-test.ok`), höchstens 2 Tage alt
- Restore-Test des Owners mit seinem Schlüssel (`state/owner-restore.ok`), höchstens 35 Tage alt

Ein neuer Owner-Schlüssel macht beide ungültig, bis neu getestet wurde.

### 2.2 Vorbereitung für den Owner (auf deinem Rechner)

Dauer etwa 10 Minuten. Alle Befehle im Repo-Ordner auf deinem Laptop; Claude führt sie nicht aus und sieht keinen Schlüssel.

1. age installieren: `sudo apt install age`
2. Schlüsselpaar erzeugen:
   ```bash
   scripts/owner-backup-key.sh create
   ```
   - Ergebnis: `~/amanah-keys/amanah-staging-backup.key` (600) und ein Fingerprint (16 Zeichen).
   - Das Skript zeigt den Schlüssel nicht an.
   - Es verweigert das Überschreiben sowie Ablageorte in Git-Repositories und Cloud-Ordnern.
3. Verwahren an **zwei unabhängigen Orten**:
   - Passwortmanager: den ganzen Dateiinhalt als sichere Notiz („Amanah Staging Backup-Schlüssel“), z. B. per `cat` im eigenen Terminal kopieren.
   - Offline-Kopie: ausgedruckt oder auf einem verschlüsselten USB-Stick, getrennt vom Laptop aufbewahrt.
   - Nicht in Cloud-Ordner im Klartext, nicht per Mail oder Chat, nicht ins Repo.
4. Öffentlichen Schlüssel auf den Server übertragen (geht über stdin, erscheint nirgends):
   ```bash
   scripts/owner-backup-key.sh install-recipient
   ```
   - Der Server antwortet mit seinem Fingerprint; er muss mit dem lokalen übereinstimmen.
   - Ein versehentlich übergebener privater Schlüssel wird abgewiesen und nicht gespeichert.
5. Claude Bescheid geben: „Empfänger gesetzt, Fingerprint …“. Der Fingerprint ist kein Schlüssel.
6. Claude: neues Backup (`staging-cron.sh backup`) und automatischer Restore-Test (`staging-cron.sh restore`).
7. Du: echter Wiederherstellungstest mit deinem Schlüssel:
   ```bash
   scripts/owner-backup-key.sh restore-test
   ```
   - Entschlüsselt wird auf deinem Rechner; nur die synthetischen Daten gehen in eine Wegwerf-DB auf dem Server.
   - Erwartet: 5 × `OK`.
8. Danach die lokale Schlüsseldatei löschen: `shred -u ~/amanah-keys/amanah-staging-backup.key`.
   Spätere Tests (mindestens alle 35 Tage, der Health-Check erinnert) mit `scripts/owner-backup-key.sh restore-test --paste`: Die `AGE-SECRET-KEY-…`-Zeile wird verdeckt aus dem Passwortmanager eingefügt, liegt nur im RAM und wird danach gelöscht.
9. Claude: Health-Check ohne FAIL, einmal Restore auf App-Ebene (zweite Instanz, Login, Ordner entschlüsselbar), Doku fortschreiben. **Erst dann** gilt Staging als vollständig abgenommen.

### 2.2a Stand 31.10., 17:54 (Owner-Empfänger installiert)

| Schritt | Ergebnis |
|---|---|
| Owner-Empfänger auf dem Server | 1 öffentlicher age-Schlüssel, Fingerprint `2cfae5a85d555db6` (= Owner-Angabe), verschieden vom Testschlüssel; kein privater Schlüssel in `/opt/amanah-staging` |
| Backup `amanah_amanah_staging_20261031_175418.sql.gz.age` | erstellt (24,6 KB, Rechte 600), Kopf `age-encryption.org/v1`, **2 Empfänger-Einträge** (Owner + Testschlüssel), ohne Schlüssel nicht lesbar |
| Automatischer Restore-Test (Testschlüssel) | 5 × OK; Nachweis an Owner-Empfänger `2cfae5a85d555db6` gebunden |
| Health-Check | 7 × OK, 1 × FAIL „no passed owner restore test“ (erwartet, Alarm lokal) |
| Persönlicher Restore-Test (Owner, Laptop) | **bestanden** 17:59 (5 × OK laut Owner; Nachweis `state/owner-restore.ok` auf dem Server: gleiches Backup, Fingerprint `2cfae5a85d555db6`) |

Hinweis: age speichert die Empfänger nicht lesbar im Kopf. Dass das Backup an den Owner-Schlüssel verschlüsselt ist, belegen:
- der zum Backup-Zeitpunkt eingetragene Empfänger
- die zwei Empfänger-Einträge im Kopf
- **abschließend erst der persönliche Restore-Test**

Staging gilt bis dahin nicht als vollständig abgenommen. Inzwischen erledigt: Der persönliche Restore-Test hat bestätigt, dass das Backup mit dem Owner-Schlüssel entschlüsselbar ist.

### 2.2b Wiederherstellung auf App-Ebene und technische Abnahme (31.10., 18:00–18:03)

Health-Check vorher: **8/8** (inkl. „restore test passed within 2 days“ und „owner restore test passed within 35 days“); Entwarnung 18:00.

Prüfskript auf dem Server: temporär unter `/root`, keine Passwörter, Cookies oder Inhalte ausgegeben, danach gelöscht. Ablauf:
- Backup 17:54 mit dem Testschlüssel in die **frische** DB `amanah_staging_restore` eingespielt.
- **Zweite App-Instanz** gestartet: gleiches Image `amanah-staging-app:f9022d3`, gleiche Datenschlüssel, nur `DATABASE_URL` auf die Kopie, 127.0.0.1:3202, 512 MB.

| Prüfung | Ergebnis |
|---|---|
| Wiederherstellung in frische DB | OK; 5 Konten wie live |
| Verschlüsselung at rest in der Kopie | 5/5 Ordner `amanah-aes256gcm-v1`, 0 Klartext |
| Zweite Instanz | healthy, `staging`, DB erreichbar; zeigt nachweislich auf die Kopie |
| Vor dem Backup gelöschtes Konto 1 | Login 401: bleibt gelöscht |
| Konto 2 und 3: Login auf der Kopie | 200 / 200 |
| Entschlüsselung der Vorsorgedaten | eigener synthetischer Name lesbar; Ordner **identisch** mit live (Hash-Vergleich) |
| Kontentrennung | Konto 2 sieht nichts von Konto 3 und umgekehrt; ohne Sitzung 401 |
| Log der zweiten Instanz | 6 Zeilen, 0 sensible Treffer |
| Live-Staging / Produktion | unverändert healthy / Health 200 |
| Aufräumen | Container, DB, Arbeitsordner, Port 3202 entfernt; unabhängig nachgeprüft: keine Reste in Docker, `/root`, `/dev/shm`; DB-Netz wieder nur App + DB |

Gesamt 18/18. Nebenwirkung: Die Live-Vergleichs-Logins haben 2 Sitzungen in der Live-Staging-DB angelegt (synthetische Konten).

**Ergebnis: Staging ist technisch abgenommen.**

Umfang:
- Isolation, Sicherheit, Abläufe, Browser, Webhook-Signaturen (Doku 28)
- Alarmierung lokal (§3)
- Backups mit Owner-Schlüssel und Testschlüssel; automatischer, persönlicher und App-Ebene-Restore

Nicht enthalten:
- externer Alarmkanal
- HTTPS/Basic Auth (keine Domain)

Diese sind Voraussetzungen für den Pilot mit Testern (§9), nicht für die technische Abnahme.

### 2.3 Verlust und Wechsel

- **Owner-Schlüssel verloren:** Alle Backups sind nur noch mit dem Testschlüssel lesbar, solange der Server existiert. Neues Paar nach §2.2 erzeugen; damit werden beide Nachweise ungültig, bis neu getestet wurde.
- **Testschlüssel verloren oder kompromittiert:** In `ops.env` den Eintrag `RESTORE_CHECK_RECIPIENT` neu setzen (neues Paar im age-Container). Der Owner-Schlüssel ist davon nicht betroffen.
- Alte Backups entfernt die Aufbewahrung nach 7 Tagen.

### 2.4 Ausgangszustand (unverändert)

- Das Backup vom 31.10. 13:48 heißt `….UNRESTORABLE-key-deleted`; der Schlüssel dazu ist gelöscht, es zählt nicht.
- `BACKUP_AGE_RECIPIENTS` ist leer. Das Backup um 03:45 schlägt fehl und alarmiert.

### 2.5 Generalprobe und Skripttests (31.10., auf dem Server)

Mit einem **Simulationsschlüssel an Stelle des Owner-Schlüssels**. Er lag nur in `/dev/shm`; danach wurden alles gelöscht und der Ausgangszustand wiederhergestellt. Das ist kein Abnahme-Nachweis.

| Schritt | Ergebnis |
|---|---|
| Empfänger über stdin setzen | gesetzt, nur Fingerprint ausgegeben, Sicherung in `rollback/` |
| Backup (Owner + Testschlüssel) | ok, 28 KB |
| Automatischer Restore mit Testschlüssel | 5 × OK, Nachweis geschrieben |
| Owner-Weg über stdin mit Simulationsschlüssel | 5 × OK, eigener Nachweis |
| Health-Check | 8/8 OK; Backup- und Health-Alarm mit Entwarnung |
| Rücksetzen | Empfänger leer, Nachweise und Probe-Backup gelöscht, `/dev/shm` leer, Wegwerf-DB entfernt; Alarm wieder aktiv |

Ebenfalls geprüft:
- Vorher (15:28): falscher Schlüssel, kein Schlüssel und das alte Backup führen jeweils zu FAIL, ohne Nachweis.
- Unit-Tests (`staging-ops.test.ts`, mit Stubs, ohne Netz):
  - Setzen des Empfängers: privater Schlüssel, Unsinn und der Testschlüssel als Owner-Schlüssel werden abgewiesen; die übrige env-Datei bleibt erhalten.
  - Owner-Helfer: Datei 600; kein Überschreiben; kein Git- oder Cloud-Ordner; über ssh geht nur der öffentliche Schlüssel.

## 3. Alarmierung

### 3.1 Aufbau

`/etc/cron.d/amanah-staging` ruft `scripts/staging-cron.sh <job>` auf. Die Ausgabe landet in `/var/log/amanah-staging-<job>.log`, das Ergebnis geht an `scripts/staging-alert.sh`.

| Ereignis | Prüfung | Takt | Schwelle |
|---|---|---|---|
| Staging-Ausfall | `health`: `/api/health`, Umgebung, DB, KI aus | alle 5 min | sofort |
| Speicher kritisch | `health`: Belegung `/` | alle 5 min | > 85 % (aktuell 83 %) |
| Backup fehlgeschlagen | `backup`-Exit-Code; `health`: kein Backup jünger als 26 h | 03:45 / 5 min | sofort |
| Restore-Test fehlgeschlagen | `restore` (Testschlüssel); `health`: Nachweise fehlen, falscher Schlüssel, zu alt (2 bzw. 35 Tage) | 04:15 / 5 min | sofort |
| Zertifikat läuft ab | `health` mit `CERT_HOST` (ab Variante B) | alle 5 min | < 21 Tage |
| Sicherheitscheck | `security` | Mo 04:30 | sofort |

Verhalten des Dispatchers:
- **Alarm** bei neuem oder geändertem Fehler.
- **Erinnerung** alle 24 h, solange der Fehler besteht.
- **Entwarnung**, sobald die Prüfung wieder besteht.
- Versendet werden nur `FAIL`-Zeilen oder „Job X mit Code N beendet“, keine Log-Inhalte.
- URL und Token gehen über stdin an curl.

### 3.2 Kanal: E-Mail über Brevo SMTP (31.10., ersetzt ntfy)

Owner-Entscheidung 31.10.: **E-Mail statt ntfy**, wie bei Nasib Nikah über Brevo SMTP. ntfy bleibt aus; der Code bleibt im Dispatcher, ist abgeschaltet und weiter getestet. Einrichtung, Tests, fehlende Angaben und Produktionswechsel: **Doku 30**.

**Stand 01.11.:** Echter SMTP-Versand nicht abgenommen, zurückgestellt bis zur endgültigen Domain mit Amanah-Absendern. Externer Versand aus; Alarme stehen bis dahin nur im lokalen Log auf dem Server, ohne Benachrichtigung.

### 3.3 Grenzen

- Fällt der ganze Server aus, kommt keine Meldung, weil auch Cron nicht läuft. Abhilfe ab Variante B: externer Uptime-Prüfer auf `https://staging.amanahordner.de` (erwartet 401). Das wäre ein neuer Dienst und braucht deine Freigabe.
- Die Platte liegt bei 83 %; 13,3 GB davon sind fremder Build-Cache.

## 4. Domain und Caddy

### 4.1 Netzwerkanalyse (nur lesend, 15:25)

- Caddy (`gemeinsam1-prod-caddy`, v2.11.4) hängt nur in `gemeinsam1-prod_internal`; die Caddyfile ist als Einzeldatei eingebunden.
- Staging hängt in `amanah_staging_db` (internal) und `amanah_staging_edge`, Port nur `127.0.0.1:3201`.
- Caddy erreicht Staging heute nicht („bad address“), denn `127.0.0.1` im Container ist nicht der Host.
- gemeinsam1.com hat nur IPv4 (A `167.233.152.17`, kein AAAA). sshd: nur Schlüssel, nur `root`.

### 4.2 Variante A: SSH-Tunnel (aktueller Stand)

- `ssh -N -L 3201:127.0.0.1:3201 gemeinsam1-prod`, dann `http://127.0.0.1:3201`.
- Nur für den Owner (Root-Zugang).
- Erweiterung A2 für einzelne Tester: Nutzer `amanah-tunnel` ohne Shell, Schlüsselzeile mit `restrict,port-forwarding,permitopen="127.0.0.1:3201",command="/usr/sbin/nologin"`. Das ist eine Serveränderung und braucht eine Freigabe.

### 4.3 Variante B1 (gewählt): `staging.amanahordner.de` über eigenes Proxy-Netz

Prinzip: Das Netz `amanah_staging_proxy` (internal) enthält nur Caddy und `amanah-staging-app`. Caddy sieht nur `amanah-staging-app:3000`; Staging sieht nichts von gemeinsam1.

Andere Wege, verworfen:
- über den Host: Caddy müsste neu erstellt werden, und eine UFW-Regel wäre nötig
- Staging im gemeinsam1-Netz: Zugriff auf `gemeinsam1-prod-db`
- eigener Proxy: 80/443 sind belegt

Vorbereitet und geprüft:
- `docker-compose.staging.proxy.yml`: `docker compose config` ergibt nur die App im Proxy-Netz.
- `deploy/Caddyfile.staging-snippet`: mit Caddy 2.11.4 validiert.
- `scripts/staging-domain-preflight.sh` (nur lesend):
  - prüft Nameserver, A/AAAA, CAA, Caddyfile-Eintrag, Caddy-Container, Proxy-Netz (internal, nur erlaubte Mitglieder) und Port 80
  - Stand 31.10. für `staging.amanahordner.de`: FAIL „keine Nameserver“, FAIL „kein A-Record“, alles andere OK
  - Gegenprobe mit `gemeinsam1.com` korrekt

Stand: `amanahordner.de` hat keine Nameserver und ist vermutlich nicht registriert. **Nicht gekauft.**

Schritte, jeder mit eigener Owner-Freigabe; ab Schritt 5 wird der gemeinsam genutzte Caddy berührt:

| # | Wer | Schritt | Prüfung |
|---|---|---|---|
| 1 | Owner | `amanahordner.de` registrieren (Kosten beim Owner) | Preflight: Nameserver OK |
| 2 | Owner | DNS: `staging.amanahordner.de. 300 IN A 167.233.152.17`; vorerst kein AAAA (wie gemeinsam1.com); keine anderen Einträge ändern; falls CAA gesetzt wird, `letsencrypt.org` erlauben | `staging-domain-preflight.sh staging.amanahordner.de` ohne FAIL |
| 3 | Claude | `.env.staging`: `AMANAH_PUBLIC_BASE_URL` und `NEXT_PUBLIC_SITE_URL` = `https://staging.amanahordner.de` (Sicherung vorher). Image lokal mit diesem `NEXT_PUBLIC_SITE_URL` bauen, als neues `AMANAH_RELEASE` laden. Das ist eine neue Staging-Version und braucht eine Freigabe | Image-Größe/Platte prüfen (Doku 28 §6) |
| 4 | Claude | `docker compose -f docker-compose.staging.yml -f docker-compose.staging.proxy.yml --env-file .env.staging up -d --no-deps app` | Health 6/6; Preflight: Netz internal, nur App |
| 5 | Claude | `docker network connect amanah_staging_proxy gemeinsam1-prod-caddy` (ohne Neustart) | Preflight: Mitglieder nur App + Caddy; `docker exec gemeinsam1-prod-caddy wget -qO- http://amanah-staging-app:3000/api/health` |
| 6 | Owner | Basic-Auth-Passwort im Passwortmanager anlegen; `ssh -t gemeinsam1-prod docker exec -it gemeinsam1-prod-caddy caddy hash-password` | nur der Hash wird verwendet |
| 7 | Claude | Caddyfile: `cp -p /opt/gemeinsam1/deploy/Caddyfile /opt/gemeinsam1/deploy/Caddyfile.bak-<datum>`; neue Fassung = alte + Snippet (Domain `staging.amanahordner.de`, Nutzer, Hash); `docker cp` in den Container und dort `caddy validate --adapter caddyfile` gegen die Kopie; `diff` zeigt nur den neuen Block; **in place schreiben** (`cat neu > Caddyfile`); `docker exec gemeinsam1-prod-caddy caddy reload --config /etc/caddy/Caddyfile` | `gemeinsam1.com` und `api.gemeinsam1.com` 200 vor und nach dem Reload; Caddy-Log: Zertifikat für `staging.amanahordner.de` |
| 8 | Claude | Abnahme: ohne Anmeldung 401, mit Anmeldung 200; `BASE_URL=https://staging.amanahordner.de EXPECT_BASIC_AUTH=true EXPECT_HSTS=true STAGING_BASIC_AUTH=… scripts/staging-security-check.sh`; Webhook ohne Signatur 400; von außen 3201/5432 weiter zu | alle OK |
| 9 | Claude | `ops.env`: `BASE_URL` bleibt intern, `CERT_HOST=staging.amanahordner.de` | Health „certificate … valid“ |

Rückroll, jeweils einzeln möglich:
- Caddyfile aus `.bak-<datum>` in place zurückschreiben, `caddy reload`.
- `docker network disconnect amanah_staging_proxy gemeinsam1-prod-caddy`.
- App ohne Overlay starten (`up -d --no-deps app` mit nur der Staging-Datei).
- `.env.staging` aus `rollback/`.
- DNS-Eintrag löschen.
- Betroffen ist nur Staging; gemeinsam1 bleibt unberührt, solange in Schritt 7 nur ein Block ergänzt wird.

Hinweise:
- Das Zertifikat läuft über das ACME-Konto von gemeinsam1 (`admin@gemeinsam1.com`), deshalb die eigene Zertifikatsprüfung (§3).
- Nach einer Neuerstellung des Caddy-Containers fehlt die Netzverbindung aus Schritt 5. Dann ist nur Staging betroffen (502). Dauerhaft wäre ein Eintrag in der gemeinsam1-Compose-Datei nötig; das ist eine Entscheidung im Projekt gemeinsam1.
- Die Registrierung auf Staging bleibt auf `staging.invalid` beschränkt; Tester erhalten vorbereitete Testkonten.

## 5. Sicherheitsprüfung (31.10., 15:30, nur lesend)

| Punkt | Ergebnis |
|---|---|
| Staging-DB nicht öffentlich | keine Portbindung; Netz `amanah_staging_db` internal mit nur App und DB; von außen 5432, 5433, 3201, 3001 zu (Kontrolle 443 offen) |
| Keine echten Nutzerdaten | 5 Konten, alle `@staging.invalid` |
| Keine Stripe-Live-Schlüssel | Billing `sandbox`, kein Stripe-Schlüssel; 0 Live-Muster in env-Datei und Container |
| Keine echten E-Mails | Transport `outbox`, keine Mail-Anbieter-Variablen |
| Keine öffentlichen religiösen Entwürfe | ungeprüfter Artikel und interne Seiten 404 |
| Keine aktive Erbquotenberechnung | `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION` nicht gesetzt |
| Keine sensiblen Logs | App 6 Zeilen, DB 78 Zeilen, Job-Logs: 0 Treffer |
| Kein Zugriff auf Produktionsdaten | Produktions-DBs/-App aus Staging zu (Positivkontrolle Staging-DB offen); Caddy erreicht Staging nicht |

17:40: Durch den Testschlüssel, die Generalprobe und das Prüfskript kam nichts Öffentliches hinzu. Der Testschlüssel ist root-only (Ordner 700, Datei 600); der age-Container läuft ohne Netzwerk.

## 6. Separater Befund: Amanah-Produktion im gemeinsam1-Netz (nichts geändert)

- `amanah-app` (Produktion) hängt über `docker-compose.prod.nocaddy.yml` (`SHARED_PROXY_NETWORK`, Standard `gemeinsam1-prod_internal`) im selben Netz wie `gemeinsam1-prod-db`, -backend und -frontend.
- Risiko mittel bis niedrig.
- Abhilfe (Produktionsänderung, nur nach Freigabe): eigenes Netz `amanah_prod_proxy` analog zu B1 beim nächsten geplanten Produktions-Deploy.

## 7. Auf dem Server geändert (nur `/opt/amanah-staging`, eigene Dateien)

15:20–15:38:
- Ops-Skripte; `ops.env`; `alert.env` (600, extern aus)
- `/etc/cron.d/amanah-staging` auf `staging-cron.sh` umgestellt
- toter Empfänger geleert, altes Backup umbenannt
- Zustand in `/var/lib/amanah-staging-alerts/`; Logs `/var/log/amanah-staging-*.log`

17:35–17:45:
- Skripte aktualisiert (`backup-postgres.sh` im Staging-Ordner, Health-Check, Restore-Test, Cron-Wrapper) und neu eingespielt (`staging-set-recipient.sh`, `staging-alert-channel.sh`, `staging-domain-preflight.sh`)
- Testschlüssel `/root/.config/amanah-staging/restore-check.key` (Ordner 700, Datei 600)
- `ops.env`: `RESTORE_CHECK_RECIPIENT` (öffentlich), `AGE_IDENTITY`, Altersgrenzen 2/35 Tage
- Generalprobe vollständig zurückgesetzt

Sicherungen liegen in `/opt/amanah-staging/rollback/` (700). Container nicht neu gestartet. Produktion und `/opt/amanah-app` unberührt.

## 8. Offene Owner-Aufgaben

1. ~~Backup-Schlüssel~~ erledigt (31.10.). Laufend: persönlicher Restore-Test mindestens alle 35 Tage (`scripts/owner-backup-key.sh restore-test --paste`); den Health-Alarm gibt es ab Tag 36. Lokale Schlüsseldatei nach Sicherung im Passwortmanager und in der Offline-Kopie mit `shred -u` löschen.
2. **E-Mail-Alarmierung**: zurückgestellt bis zur Domain; danach Amanah-Absender eintragen (`mail-set`), mit `enable` freigeben, Eingang bestätigen (Doku 30 §3a).
3. **Domain** `amanahordner.de` registrieren und DNS nach §4.3 Schritt 2. Danach Freigaben für die Schritte 3–9.
4. Push-Freigabe für den Abnahme-Doku-Commit nach `a489618`.
5. Optional:
   - Build-Cache auf dem Server bereinigen
   - Befund §6 bei nächster Produktionsänderung
   - Port 5433 im Projekt `gemeinsam1-ai-platform` (Doku 28)

## 9. Pilot-Status

| | Entscheidung |
|---|---|
| Owner testet selbst per Tunnel mit synthetischen Daten | **GO** |
| Privater Testdaten-Pilot mit weiteren Testern | **NO-GO** bis: ~~(1) Owner-Schlüssel, Backup, Restore-Tests~~ erledigt; offen: (2) E-Mail-Alarmierung aktiv (Doku 30), (3) Zugang über B1 (Domain, DNS, Caddy, HTTPS, Basic Auth), (4) Testkonten und Zugangsdaten je Tester |
| Echte Personen oder echte Daten, öffentlicher Start | **NO-GO** (Sperren AI_HANDOFF §8) |
