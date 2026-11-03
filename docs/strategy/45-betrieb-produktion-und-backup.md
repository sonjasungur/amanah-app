# Betrieb: Produktion, Backup, Prüfung, Staging (Stand 03.11.2026, 10:23)

**Für:** Betrieb und Owner. Keine Geheimnisse in diesem Dokument. Produktion: `7d0859b` mit Hotfix (Doku 41). Release-Kandidat: `b473cd5`, nur auf Staging.

## 1. Produktion: Ablage

| Pfad | Inhalt | Rechte |
|---|---|---|
| `/opt/amanah-prod/` | Compose gepinnt, vollständige Env, Prüf- und Backup-Skripte | 700 |
| `/opt/amanah-prod/backups/` | verschlüsselte Backups | 700, Dateien 600 |
| `/opt/amanah-prod/images/` | Archive von Hotfix- und Rollback-Image, `SHA256SUMS` | 400 |
| `/opt/amanah-prod/config-vorher/` | frühere Konfiguration, Crontab, verschlüsselte Alt-Env | 700 |
| `/opt/amanah-prod/release/` | **vorbereitete, unbenutzte** Release-Env und Kopie des Datenschlüssels (Produktionsplan) | 700, Dateien 600 |
| `/opt/amanah-app/` | Quellstand `7d0859b`, **nur Backup-Altlast und Build-Sperre** | `.env.production` nur mit `POSTGRES_USER`, `POSTGRES_DB` |

Der Quellordner startet nichts mehr. Die Altkopie `.env.production.backup.20260705-145025` ist verschlüsselt gesichert und entfernt; sie stand nie in Git und unter keinem öffentlichen Pfad. **Es gibt keinen Hinweis auf eine Offenlegung, daher keine Rotation.** Ob ihre Werte noch gelten, ist unbekannt; sie weicht von der aktiven Datei ab.

## 2. Backups

**Vorher:** 126 unverschlüsselte Klartext-Dumps (`gzip`, Inhalt per Kopfzeile bestätigt), für alle lesbar.

**Jetzt:** Cron `15 3 * * * /opt/amanah-prod/backup-encrypted.sh`, Log `/var/log/amanah-backup.log`. Verschlüsselung mit `age`, nur an öffentliche Empfänger aus `backup.env`. Ohne Empfänger oder bei falschem Format entsteht keine Datei. Der private Schlüssel liegt nicht auf dem Server. Keine automatische Löschung.

### 2.1 Was womit geprüft wurde

Empfänger-Fingerabdruck in `backup.env`: `2cfae5a85d555db6`, identisch mit dem Eintrag in `/opt/amanah-staging/state/owner-restore.ok`. Mit diesem Schlüssel hat der Owner am 31.10. ein **Staging**-Backup wiederhergestellt. Anzahl Empfänger: aus dem `age`-Kopf gezählt; `age` speichert nicht, wer sie sind.

| Datei | Empfänger | Mit RAM-Schlüssel geprüft (03.11., danach vernichtet) | Mit Owner-Schlüssel |
|---|---|---|---|
| `amanah_amanah_20261103_074832` | 2 | **isolierte Wiederherstellung, identisch mit Live** | `NOT_RUN` |
| `amanah_amanah_20261103_074755` | 2 | keine vollständige Probe, Prüflauf brach sicher ab | `NOT_RUN` |
| `amanah_amanah_20261103_074910` | 1, nur Owner | nicht möglich; nur Format, Rechte, Größe | `NOT_RUN` |
| `altbestand-klartext-20261103` | 2 | alle 126 Prüfsummen gleich | `NOT_RUN` |
| `env-production-backup-20260705` | 2 | Vergleich gleich | `NOT_RUN` |

**Ehrliche Grenze:** Der RAM-Schlüssel belegt, dass Dump, Verschlüsselung und Wiederherstellung funktionieren. Er belegt nicht, dass der Owner-Schlüssel diese Dateien öffnet. **Keine Produktionsdatei wurde je mit dem dauerhaften Schlüssel entschlüsselt.** Der Beleg ist indirekt: gleicher Empfänger wie im Staging-Test. Da der RAM-Schlüssel vernichtet ist und die Klartexte entfernt sind, hängt alles allein am Owner-Schlüssel. Die Probe in 2.2 schließt diese Lücke.

### 2.2 Wiederherstellungsprobe (Owner, rund 5 Minuten)

Auf dem eigenen Rechner im Repo, nötig sind nur `age` und `ssh`. Der private Schlüssel bleibt dort. Die Entschlüsselung läuft lokal; die Testdatenbank läuft auf dem Server ohne Netz und im RAM und wird danach entfernt. Ausgegeben werden nur Zahlen. Produktionsdaten werden nicht verändert.

```bash
scripts/owner-production-backup.sh restore-probe --paste    # neuestes Backup; Schlüssel unsichtbar einfügen
scripts/owner-production-backup.sh check-old --paste        # Altbestand und alte Env-Kopie, nur gezählt
scripts/owner-production-backup.sh check-data-key --paste   # Kopie des Datenschlüssels, nur Prüfsummen
```

Erwartet: `Fertig: Probe bestanden.`, `OK Altbestand lesbar: 126 Dateien`, `OK Kopie des Datenschlüssels passt`. Danach steht auf dem Server `state-owner-restore.ok`.

Getestet mit Wegwerf-Schlüssel und Testordner: Probe bestanden, falscher Schlüssel und leere Eingabe scheitern ohne Vermerk, nichts bleibt zurück. **Die Probe des Owners selbst steht aus.**

### 2.3 Eigener Produktionsschlüssel (Owner)

Doku 29 sieht ihn vor, heute ist es der Owner-Schlüssel aus Staging. Nur der öffentliche Teil erreicht den Server. Das Skript gibt den privaten Schlüssel nie aus.

```bash
scripts/owner-production-backup.sh create            # ~/amanah-keys/amanah-production-backup.key
# Inhalt im Passwortmanager und offline sichern, nicht in Git oder einem Cloud-Ordner
scripts/owner-production-backup.sh add-recipient     # ab jetzt beide Empfänger
ssh gemeinsam1-prod /opt/amanah-prod/backup-encrypted.sh
scripts/owner-production-backup.sh restore-probe ~/amanah-keys/amanah-production-backup.key
```

Erst wenn die Probe besteht, den alten Empfänger für **künftige** Backups entfernen:

```bash
ssh gemeinsam1-prod /opt/amanah-prod/set-backup-recipient.sh list
ssh gemeinsam1-prod /opt/amanah-prod/set-backup-recipient.sh remove 2cfae5a85d555db6
```

**Den alten privaten Schlüssel nicht vernichten.** Alle bis dahin geschriebenen Dateien brauchen ihn weiter. Auch Staging nutzt ihn.

### 2.4 Cron

Server-Zeitzone `Europe/Berlin` (CET, NTP synchron). **Erster automatischer verschlüsselter Lauf: 04.11.2026, 03:15 CET. Stand 03.11.: ausstehend.** Diese Sitzung überwacht ihn nicht.

```bash
ssh gemeinsam1-prod /opt/amanah-prod/check-backup-cron.sh    # Exit 0 erledigt, 3 ausstehend, 1 Fehler
```

Unabhängig davon meldet die Betriebsprüfung ein fehlendes Backup ins lokale Alarmlog, sobald das letzte älter als 26 Stunden ist.

### 2.5 Einspielen in die Produktion

Nur nach Owner-Entscheidung; Wege und Grenzen im Produktionsplan. Die Skripte aus 2.2 können das nicht: Sie schreiben nie in die Produktion.

## 3. Automatische Prüfung und Alarm

`/etc/cron.d/amanah-prod-check`, alle 15 Minuten, nur lesend: Image, Health, Route, Netz, Volume, Wissenssperre, Backup-Alter und Format, kein Klartext, keine Secret-Kopie. Keine Reparaturen. Verlauf `/var/log/amanah-prod-check.log`, Zustandswechsel `/var/log/amanah-prod-alerts.log`, logrotate wöchentlich. Das Alarmlog enthält von 07:49 einen Fehlalarm mit Entwarnung (Suchmuster traf `.env.production.example`, korrigiert).

**Niemand wird benachrichtigt.** Externer Versand ist aus, und es gibt keinen autorisierten Kanal; der Mailkanal aus Staging wurde am 01.11. abgeschaltet (Doku 30 §3a).

**Vorbereitet:** `prod-check.sh` übergibt an denselben Dispatcher wie Staging (Wiederholung alle 24 h, Entwarnung, Wiederholversuch), aber nur mit `ALERT_EXTERNAL=true` in `/opt/amanah-prod/alert.env`. Die Datei existiert nicht; Vorlage `alert.env.example`. Getestet mit lokalem Empfänger: ohne Datei und mit Schalter aus nichts versendet; mit Schalter an Alarm und Entwarnung zugestellt. Keine Nachricht hat den Rechner verlassen.

| Kanal | Vorteil | Fehlt |
|---|---|---|
| **Mail über Brevo-SMTP (empfohlen)** | Code und Vergleich vorhanden | Absender-Domain, eigener SMTP-Schlüssel, Empfänger, Freigabe |
| Chat-Webhook | sofort einrichtbar, kein Domainbezug | eigener Kanal; Inhalte liegen bei dessen Anbieter |
| ntfy | Push aufs Telefon | im Dispatcher vorgesehen, bisher abgeschaltet; Betrieb des Dienstes |

Bei Serverausfall meldet keiner dieser Wege etwas; dafür bräuchte es eine Prüfung von außen.

## 4. Staging

Läuft mit `amanah-staging-app:b473cd5`, eigene Datenbank, eigene Netze, Port nur `127.0.0.1:3201`, nur synthetische Konten, Mail-Outbox, KI aus. Migrationen 7 von 7. Zugang heute: `ssh -N -L 3201:127.0.0.1:3201 gemeinsam1-prod`, dann `http://127.0.0.1:3201`.

### 4.1 HTTPS-Zugang für Telefone

**Vorbereitet und geprüft, nicht aktiv: Es fehlt ein Hostname.** Eine vorhandene Test-Subdomain gibt es nicht: `amanahordner.de` ist nicht registriert, unter `gemeinsam1.com` und `mscisystems.com` existiert keine, und ein DNS-Zugang liegt dieser Umgebung nicht vor.

**DNS, Stand 03.11.:** Kein Zugang für Agenten vorhanden, weder lokal noch auf dem Server; `mscisystems.com` liegt bei Namecheap (`dns1.registrar-servers.com`). Der Name `amanah-test` ist noch frei, es gibt keinen CAA-Eintrag, Ports 80 und 443 sind offen. Server-IP verifiziert: `167.233.152.17` (Schnittstelle `eth0`, SSH-Ziel, `gemeinsam1.com`).

**Der Name ist ein Vorschlag, bis der Owner ihn bestätigt.** Eintrag im Namecheap-Konto unter Domain List, Manage, Advanced DNS, Add New Record:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `amanah-test` | `167.233.152.17` | Automatic |

Kein AAAA-Eintrag nötig. Prüfen: `dig +short A amanah-test.mscisystems.com` muss `167.233.152.17` zeigen.

**Vorgehen, sobald der DNS-Eintrag (A auf die Server-IP) steht:**

```bash
ssh gemeinsam1-prod /opt/amanah-staging/scripts/staging-https.sh enable <host>
ssh gemeinsam1-prod cat /opt/amanah-staging/state/https-access    # Zugangsdaten nur so abrufen
```

Das Skript prüft erst DNS, legt das Passwort an und trägt den Block samt Passwortschutz in einem Schritt ein: keine ungeschützte Phase, keine Ausnahme für einzelne Pfade. Caddy wird nur neu geladen, nicht neu gestartet; bei einem Fehler bleibt die laufende Konfiguration. Danach prüft es Zugang und `gemeinsam1`. Zurück: `staging-https.sh disable`.

**Wichtig:** Das ist eine Änderung am gemeinsamen Caddy von `gemeinsam1`. Sie ist durch den Auftrag vom 03.11. gedeckt, aber erst mit Hostname ausführbar. Der Hostname wird über Zertifikatslogs öffentlich sichtbar, nur nicht der Inhalt. Überschreibt ein `gemeinsam1`-Deployment die Caddy-Datei, fällt der Zugang weg; die Seite wird dadurch nicht offen.

**Geprüft am 03.11. mit Wegwerf-Caddy** (eigenes Zertifikat, eigenes Passwort, entfernt): ohne und mit falschem Passwort überall 401, intern 404, `noindex`; Kernablauf und schmale Ansichten in iPhone-WebKit und Android bestanden, über HTTPS mit sicheren Cookies. Der Block ist gegen den echten Caddy gültig (`caddy validate`), dessen Datei blieb unverändert (Prüfsumme). Die Staging-App hängt seitdem zusätzlich am internen Netz `amanah_staging_proxy`, dem sonst niemand angehört. **Echter Lauf mit Let's-Encrypt-Zertifikat: `NOT_RUN`.** Ablauf für Geräte: [smartphone-abnahme-kurz.md](../release/smartphone-abnahme-kurz.md).

## 5. Plattenplatz

| Zeitpunkt | Belegung | Frei |
|---|---|---|
| vor der Bereinigung, 03.11. 09:56 | 87 % | 4,8 GB |
| nach der Bereinigung, 03.11. | **84 %** | **5,9 GB** |

**Entfernt:** Image `amanah-app-migrate:latest` (angezeigt 1,81 GB) und der seit 17.07. beendete Einmal-Container `amanah-migrate` (Exit 0, keine Mounts), der es festhielt. **Tatsächlich gewonnen: 1,16 GB**, weil Schichten geteilt sind. Kein Volume, kein Backup berührt.

Vorher geprüft: Das Image enthielt nur die Migration `20260705105925_init`, nichts Aktives verweist darauf (gepinnter Stack ohne Migrationsdienst, Wiederherstellung ohne Prisma). Nachbau aus `7d0859b` lokal: gleiche Migrationsprüfsumme, Prisma 6.19.3, gleicher Befehl; nicht byte-identisch, da Basis-Images sich ändern. Einziger Bezug: `docker-compose.prod.yml` im alten Quellordner, der ohnehin gesperrt ist.

Betriebsprüfung danach 13 OK, Staging-Health 0 FAIL.

**Das Ziel ist erreicht, aber knapp:** bis zur Grenze von 85 % bleiben rund 0,5 GB. Ein Migrations-Image fürs Release braucht vorübergehend 1,3 GB; das bleibt über 3 GB frei, löst aber den Staging-Alarm aus.

**Weitere Möglichkeiten, nichts davon ausgeführt:**

| Posten | Größe | Hinweis |
|---|---|---|
| Docker-Build-Cache | 13,3 GB, davon 9,6 GB freigebbar | größter Posten, vermutlich überwiegend `gemeinsam1`; nur mit dessen Zustimmung |
| journald | 1,2 GB | systemweit, `journalctl --vacuum-size=300M` |
| `amanah-app-app:vor-wissenssperre` | 712 MB (angezeigt) | Archiv liegt in `images/rollback.tar.gz` |
| `amanah-staging-app:f9022d3` | 591 MB (angezeigt) | Früheres Staging-Image; `rollback-app.sh` lehnt es ab |
| `amanah-staging-app:3d5110f` | 593 MB (angezeigt) | Vorheriger Kandidat, kennt die Schlüsselreferenz nicht |
| ältere `gemeinsam1`-Images | mehrere GB | fremdes Projekt, nicht meine Entscheidung |
