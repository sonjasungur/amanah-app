# Alarmierung per E-Mail (Brevo SMTP) – Staging, zurückgestellt (Stand 01.11.2026)

**Stand 01.11.2026, 13:03:**
- **Echter SMTP-Versand: NICHT ABGENOMMEN.** Owner-Entscheidung: zurückgestellt, bis die endgültige Domain und passende Amanah-Absenderadressen eingerichtet sind.
- Externer Versand auf Staging **aus** (`ALERT_EXTERNAL=false`). Eingetragene Zugangsdaten bleiben unverändert auf dem Server.
- Weiter aktiv: Health-Überwachung, Backup- und Restore-Prüfungen, Alarmprotokollierung im lokalen Log.
- Keine weitere SMTP-Fehlersuche. ntfy wird nicht verwendet und bleibt aus.
- Lokale Tests mit simuliertem SMTP-Server sind bestanden (§3). Sie belegen die Logik, nicht die Zustellung über Brevo.

Ersetzt Doku 29 §3.2 (ntfy).

## 1. Vorbild Nasib Nikah (nur gelesen, keine Secrets ausgegeben)

| Bereich | Befund | Quelle |
|---|---|---|
| Versand | Brevo SMTP-Relay `smtp-relay.brevo.com`, Port 587 mit STARTTLS, Login + SMTP-Schlüssel aus dem Brevo-Dashboard, verifizierter Absender | `sakinah-match…/backend/app/services/email/config.py`, `providers/brevo.py`; Cutover-Doku (SMTP host gesetzt) |
| Robustheit | Platzhalter-Erkennung (`HIER_`, `EINTRAGEN`, `CHANGE_ME`, `example.com` …); ohne Konfiguration wird übersprungen statt abgebrochen; Fehler werden geloggt, die App läuft weiter | `services/email/placeholders.py`, `email_service.py` |
| Admin-Mails | Digest per Cron an `ADMIN_EMAIL` (Verifizierungs-Rückstau), überspringt ohne Konfiguration | `backend/app/scripts/admin_capacity_digest.py` |
| Server-Monitoring per Mail | **nicht gefunden.** Auf `nasibnikah-netcup` gibt es nur den Backup-Timer, `OnFailure=` ist leer; kein Mailprogramm installiert | `systemctl cat nasibnikah-backup.service` (gelesen) |

Für Amanah übernommen:
- Versandweg (Brevo SMTP, 587, STARTTLS)
- Platzhalter-Prüfung
- Überspringen ohne Konfiguration
- Protokollieren statt Abbrechen

Neu für Amanah, weil Nasib das nicht hat: Alarm, Erinnerung und Entwarnung je Prüfung.

## 2. Aufbau

```
cron (/etc/cron.d/amanah-staging) → staging-cron.sh <job> → Prüfskript → staging-alert.sh
    → lokales Log /var/log/amanah-staging-alerts.log (immer)
    → staging-alert-mail.py → Brevo SMTP (nur wenn ALERT_EXTERNAL=true und ALERT_MAIL=true)
```

| Datei | Aufgabe |
|---|---|
| `scripts/staging-alert-mail.py` | Versand, nur Python-Standardbibliothek (Server: Python 3.12, keine Paketinstallation) |
| `scripts/staging-alert.sh` | Zustand je Prüfung, Alarm/Erinnerung/Entwarnung, erneuter Versuch nach Zustellfehler |
| `scripts/staging-alert-channel.sh` | Einrichtung durch den Owner: `mail-set`, `status`, `enable`, `disable` |
| `scripts/testing/fake_smtp_server.py` | nur für Tests: simulierter SMTP-Server auf 127.0.0.1 |
| `/opt/amanah-staging/alert.env` | Konfiguration und Zugangsdaten (root, 600; nie im Repo) |

### Ereignisse

| Ereignis | Job | Takt |
|---|---|---|
| Staging-Ausfall (Health, DB, Umgebung, KI aus) | `health` | alle 5 min |
| Kritischer Speicherplatz (> 85 %) | `health` | alle 5 min |
| Backup-Fehler (Job-Exit, kein Backup jünger als 26 h) | `backup` / `health` | 03:45 / 5 min |
| Restore-Test fehlgeschlagen oder Nachweis zu alt (2 bzw. 35 Tage) | `restore` / `health` | 04:15 / 5 min |
| Sicherheitsprobleme (Header, Allow-List, interne Seiten, Webhook) | `security` | Mo 04:30 |
| Zertifikat < 21 Tage (ab HTTPS) | `health` mit `CERT_HOST` | alle 5 min |

### Verhalten

- **Neuer oder geänderter Fehler:** sofort eine Mail „ALARM“.
- **Fehler besteht weiter:** höchstens alle 24 h eine „Erinnerung“ (`ALERT_REPEAT_HOURS`).
- **Behoben:** eine „Entwarnung“.
- **Zustellung fehlgeschlagen:**
  - Eintrag `DELIVERY … mail failed: <code>` im lokalen Log.
  - Nach 30 min ein neuer Versuch (`ALERT_RETRY_MINUTES`), bis die Mail ankommt.
  - Der Job endet trotzdem mit 0. Die App wird nicht berührt, der Versand hat höchstens 90 s Zeit.
- **Fehlercodes ohne Inhalte:** `auth_failed (535)`, `recipient_refused`, `sender_refused`, `rejected (554)`, `starttls_not_supported`, `tls_failed`, `timeout`, `connection_failed`, `mail skipped: not configured (<Feldnamen>)`.

### Inhalt der Mails

- Betreff neutral und technisch:
  - `[Monitoring] ALARM: staging / health`
  - `[Monitoring] Erinnerung: staging / backup`
  - `[Monitoring] Entwarnung: staging / restore`

  Ohne Produktnamen, ohne Inhalte.
- Text:
  - Umgebung, Prüfung, Zeitpunkt (UTC), Server
  - die `FAIL`-Zeilen der Prüfskripte (höchstens 20 × 200 Zeichen)
  - Hinweis „Details stehen nur im Log auf dem Server“
- Zweite Bereinigung im Versandskript: Entfernt werden
  - E-Mail-Adressen
  - age-, Stripe-, Brevo- und Token-Schlüssel
  - `password=`/`token=`-Werte
  - URL-Parameter
  - lange Zufallsketten
- Nie enthalten: Nutzerdaten, religiöse Angaben, Ordnerinhalte, Passwörter, Tokens, vollständige Logs. Die Prüfskripte erzeugen solche Inhalte gar nicht.
- **Sicherheit:**
  - Unverschlüsselter Versand wird abgelehnt (`ALERT_SMTP_TLS=none` nur zu 127.0.0.1).
  - Bietet der Server kein STARTTLS an, meldet sich der Versand gar nicht erst an.
  - Zertifikatsprüfung gegen die System-CAs.

## 3. Lokale Tests (31.10., selbst ausgeführt, nur 127.0.0.1)

`src/__tests__/staging-alert-mail.test.ts`, 12 Tests gegen den Fake-SMTP-Server mit Wegwerf-Zertifikat:

| Fall | Ergebnis |
|---|---|
| Versand aus (`ALERT_MAIL`/`ALERT_EXTERNAL`) | keine Verbindung |
| Alarm → Erinnerung nach 24 h → Entwarnung | 3 Mails, STARTTLS, Login ok, richtige Absender/Empfänger, neutrale Betreffs; Zahlenwechsel 91→92 % ohne neue Mail |
| Bereinigung | keine Adresse, kein Token, kein age-Schlüssel, kein Produktname in den Mails; Passwort nicht im Log |
| Login abgelehnt (535) | Log `auth_failed (535)`, Job-Exit 0, Markierung gesetzt; innerhalb 30 min kein neuer Versuch; danach zugestellt, Markierung gelöscht; Log-Inhalt „pg_dump …“ nicht in der Mail |
| Empfänger abgelehnt (550) / Inhalt abgelehnt (554) / kein STARTTLS | `recipient_refused` / `rejected (554)` / `starttls_not_supported`; ohne STARTTLS keine Anmeldung, kein Inhalt |
| Server hängt / Port zu | `timeout` nach 2 s / `connection_failed`; Job-Exit 0 |
| Platzhalter / fehlende Angaben | `mail skipped: not configured (ALERT_SMTP_PASSWORD, ALERT_MAIL_TO)` |
| Unverschlüsselt zu Brevo | abgelehnt |
| `mail-set` → `enable` | `mail-set` versendet nichts; `enable` genau „ALARM“ + „Entwarnung“ für `channel-test`; bei Zustellfehler meldet `enable` das, statt Erfolg zu behaupten |

Weitere Tests in `staging-ops.test.ts`:
- `mail-set` speichert mit Rechten 600, `status` zeigt keine Werte, ntfy bleibt aus.
- Unvollständige Eingaben werden abgewiesen.

Gesamtsuite 554 bestanden, `tsc` 0 Fehler.

**Server (Staging), 31.10. 18:50:**
- Die drei Skripte sind eingespielt (identisch mit dem Repo); die vorherigen Fassungen liegen in `rollback/`.
- `alert.env` unverändert (Hash gleich).
- `status`: Versand aus, Kanal nicht konfiguriert, ntfy aus.
- Der Mailer überspringt mangels Konfiguration.
- Health-Job 8/8 ohne Versandversuch.

## 3a. Echter Versuch vom 01.11.2026 (nicht abgenommen)

| Punkt | Befund | Quelle |
|---|---|---|
| Einrichtung | Kanal vom Owner eingetragen, Versand 12:56 eingeschaltet | `staging-alert-channel.sh status`, Dateidatum `alert.env` |
| Lokales Log | 12:56:11 je eine Zeile ALARM und OK für `channel-test`, keine `DELIVERY`-Zeile | `/var/log/amanah-staging-alerts.log` |
| Zustellung | **nicht belegt.** Eine fehlende `DELIVERY`-Zeile heißt nur, dass der Mailer keinen Fehler gemeldet hat; das Postfach wurde nicht geprüft | – |
| Abschaltung | 01.11. 13:03 per `disable`; alle anderen Einstellungen per Hash unverändert, Trockenprobe mit getrenntem Zustand ohne Versandversuch | Serverprüfung |

**Für den späteren Neustart (nicht weiter untersucht):** `status` zeigt die Absenderdomain `nasibikah.de`. Die Nasib-Domain wird sonst `nasibnikah.de` geschrieben. Da ohnehin Amanah-Absender vorgesehen sind, ist der Eintrag beim Neustart mit `mail-set` zu ersetzen.

**Neustart:** erst nach Domain und Absender: `mail-set` mit Amanah-Absender und eigenem SMTP-Schlüssel, Freigabe, `enable`, Eingang im Postfach bestätigen. Erst dann gilt der Versand als abgenommen.

## 4. Angaben für den ersten echten Testversand

> Stand 01.11.: zurückgestellt (§3a). Fehlend sind vor allem die endgültige Domain und die Amanah-Absenderadresse.

| # | Angabe | Wo | Hinweis |
|---|---|---|---|
| 1 | **Brevo-SMTP-Login** | Brevo → SMTP & API → SMTP | derselbe Brevo-Account wie Nasib ist möglich |
| 2 | **Eigener SMTP-Schlüssel für Amanah**, z. B. „amanah-staging-monitoring“ | Brevo → SMTP & API → „SMTP-Schlüssel erzeugen“ | getrennt vom Nasib-Schlüssel, einzeln widerrufbar |
| 3 | **Absenderadresse**, deren Domain in Brevo verifiziert ist (SPF/DKIM) | Brevo → Absender & Domains | Eine Amanah-Domain gibt es noch nicht. Übergangsweise eine bereits verifizierte Domain des Accounts mit neutraler Adresse, z. B. `monitoring@…` |
| 4 | **Empfängeradresse(n)** | – | an die Alarme gehen |
| 5 | **Freigabe für den Testversand** | – | `enable` schickt genau 2 Mails (ALARM + Entwarnung „channel-test“) |

**Einrichten (Owner; die Eingaben sind verdeckt, Claude sieht sie nicht):**

```bash
ssh -t gemeinsam1-prod /opt/amanah-staging/scripts/staging-alert-channel.sh mail-set   # 1–4 eingeben
ssh gemeinsam1-prod /opt/amanah-staging/scripts/staging-alert-channel.sh status        # zeigt nur „gesetzt“
ssh gemeinsam1-prod /opt/amanah-staging/scripts/staging-alert-channel.sh enable        # erster echter Testversand
```

- Ausschalten: `… disable`.
- Schlüssel ersetzen: erneut `mail-set`.
- Danach kommen alle Alarme per Mail. Offene Alarme werden beim nächsten Lauf ihres Jobs einmal gemeldet.

**Datenschutz:**
- Die Mails enthalten keine Personendaten, nur die Empfängeradresse.
- Brevo verarbeitet sie als Auftragsverarbeiter. Ob der bestehende AV-Vertrag des Brevo-Accounts auch Amanah abdeckt, prüft der Owner.

## 5. Späterer Wechsel auf Produktion

Die Mechanik ist umgebungsneutral (`ALERT_ENV`, eigene `alert.env`, eigener Zustand). Für die Produktion gilt:

| Punkt | Staging heute | Produktion (Vorschlag) |
|---|---|---|
| Konfiguration | `/opt/amanah-staging/alert.env` | eigene Datei, z. B. `/opt/amanah-app/ops/alert.env` (600), `ALERT_ENV=production` |
| SMTP-Schlüssel | „amanah-staging-monitoring“ | **eigener** Schlüssel „amanah-production-monitoring“; nie den Staging-Schlüssel wiederverwenden |
| Zustand und Log | `/var/lib/amanah-staging-alerts`, `/var/log/amanah-staging-alerts.log` | `/var/lib/amanah-prod-alerts`, `/var/log/amanah-prod-alerts.log` (`ALERT_STATE_DIR`, `ALERT_LOG`) |
| Cron | `/etc/cron.d/amanah-staging` | eigene Datei `/etc/cron.d/amanah-production`. Die heutige Produktions-Backupzeile in der root-Crontab (03:15) bleibt, bis der Owner die Umstellung freigibt |
| Prüfungen | Port 3201, `EXPECT_ENV=staging` | Port 3001, `EXPECT_ENV=production`; dazu Sicherheitscheck gegen die öffentliche HTTPS-Adresse und Zertifikatsprüfung |
| Restore-Test | Testschlüssel (automatisch) + Owner-Schlüssel | **nur Owner-Schlüssel** (`owner-backup-key.sh` mit eigenem Produktionsschlüssel), kein Testschlüssel auf dem Server; Health mit `OWNER_RESTORE_STAMP`, ohne `RESTORE_STAMP` |
| Betreff | `[Monitoring] ALARM: staging / …` | `[Monitoring] ALARM: production / …` |

**Nötige Code-Anpassung vor der Produktion:**
- `staging-cron.sh` hat Staging-Werte fest eingebaut: `.env.staging`, `amanah-staging-postgres`, Port 3201.
- Diese Werte müssen über `ops.env` einstellbar werden (`ENV_FILE`, `POSTGRES_CONTAINER`, `EXPECT_ENV`), mit Tests.
- Danach kann dieselbe Skriptfassung beide Umgebungen bedienen. Bisher nicht umgesetzt, weil Produktion gesperrt ist.

**Sichere Reihenfolge**, jeder Schritt mit eigener Owner-Freigabe:
1. E-Mail-Alarmierung auf Staging mindestens eine Woche ohne Fehlalarm.
2. Code-Anpassung oben, Tests.
3. Produktions-Konfiguration mit `ALERT_EXTERNAL=false` anlegen und 24 h nur lokal protokollieren lassen, dann mit Staging vergleichen.
4. Eigenen SMTP-Schlüssel eintragen, `enable`: Testmail mit Betreff „production“.
5. Rückroll: Cron-Datei der Produktion entfernen oder `disable`; Staging bleibt unberührt.

**Nicht geprüft:**
- Ob die heutige Produktions-Backupzeile ihre Dumps verschlüsselt. Dazu müsste ich `.env.production` lesen, und das tue ich nicht. Der Owner sollte das prüfen.
