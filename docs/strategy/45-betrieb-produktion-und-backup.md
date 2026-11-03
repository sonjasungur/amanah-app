# Betrieb: Produktion, Backup, Prüfung, Staging (Stand 03.11.2026)

**Für:** Betrieb und Owner. Keine Geheimnisse in diesem Dokument. Produktion: `7d0859b` mit Hotfix (Doku 41). Release-Kandidat: `8668188`, nur auf Staging.

## 1. Produktion: Ablage

| Pfad | Inhalt | Rechte |
|---|---|---|
| `/opt/amanah-prod/` | Compose gepinnt, vollständige Env, Prüf- und Backup-Skripte | 700 |
| `/opt/amanah-prod/backups/` | verschlüsselte Backups | 700, Dateien 600 |
| `/opt/amanah-prod/images/` | Archive von Hotfix- und Rollback-Image, `SHA256SUMS` | 400 |
| `/opt/amanah-prod/config-vorher/` | frühere Konfiguration, Crontab, verschlüsselte Alt-Env | 700 |
| `/opt/amanah-app/` | Quellstand `7d0859b`, **nur Backup-Altlast und Build-Sperre** | `.env.production` nur mit `POSTGRES_USER`, `POSTGRES_DB` |

Der Quellordner startet nichts mehr. Die Altkopie `.env.production.backup.20260705-145025` ist verschlüsselt gesichert und entfernt; sie stand nie in Git und unter keinem öffentlichen Pfad. **Es gibt keinen Hinweis auf eine Offenlegung, daher keine Rotation.** Ob ihre Werte noch gelten, ist unbekannt; sie weicht von der aktiven Datei ab.

## 2. Backups

**Vorher:** 126 unverschlüsselte Klartext-Dumps (`gzip`, Inhalt per Kopfzeile bestätigt), für alle lesbar, ohne `age`.

**Jetzt:** Cron `15 3 * * * /opt/amanah-prod/backup-encrypted.sh`, Log `/var/log/amanah-backup.log`.

- Verschlüsselung mit `age` im Container `amanah-prod-age:1`, Empfänger nur öffentlich in `backup.env`.
- Schreibt nie unverschlüsselt: Ohne Empfänger oder bei falschem Format entsteht keine Datei.
- **Der private Schlüssel liegt nicht auf dem Server.** Empfänger ist der vorhandene Owner-Schlüssel (Fingerprint `2cfae5a85d555db6`), dessen Funktion am 31.10.2026 belegt ist (`/opt/amanah-staging/state/owner-restore.ok`).
- **Abweichung von Doku 29 §2.1:** Dort ist ein eigener Produktionsschlüssel vorgesehen. Agenten erzeugen keinen Owner-Schlüssel; bis der Owner einen liefert, nutzt die Produktion diesen. Wechsel: nur `backup.env` ändern.
- Keine automatische Löschung; die Frist ist offen (Prüfpaket Datenschutz).

**Nachweis 03.11.2026, 07:48:**

| Prüfung | Ergebnis |
|---|---|
| Format, ohne Schlüssel | `age-encryption.org/v1`, kein gzip, kein Klartext |
| Isolierte Wiederherstellung | eigene Datenbank, internes Netz: Konten, Migrationen, Tabellen identisch mit Live (`0|1|…|4`) |
| Altbestand | 126 Dateien im Archiv, alle Prüfsummen gleich, danach mit `shred` entfernt |
| Cron-Bedingungen | Lauf mit leerer Umgebung erfolgreich; 1 Empfänger. **Erster echter Cron-Lauf steht aus: 04.11.2026, 03:15** |

**So wurde geprüft, ohne Schlüssel auf dem Server zu hinterlassen:** Ein Einmal-Schlüssel entstand nur im RAM (`/dev/shm`) und war zusätzlicher Empfänger der Prüfkopien. Er wurde nach der Probe vernichtet; diese Kopien kann seither nur noch der Owner lesen. Laufende Backups haben nur den Owner als Empfänger. Grenze: `shred` ist auf dem Server-Dateisystem nur bestmöglich.

**Ein Dump im Altbestand** (`amanah_amanah_20260705_145211`) enthält 2 Kontozeilen; der Inhalt wurde nicht gelesen. Heute hat die Produktion 0 Konten. Siehe Prüfpaket Datenschutz.

### Wiederherstellung (Owner, auf dem eigenen Rechner)

```bash
scp gemeinsam1-prod:/opt/amanah-prod/backups/<datei>.sql.gz.age .
age -d -i <schlüsseldatei> <datei>.sql.gz.age | gunzip > restore.sql
```

Danach in eine **neue, isolierte** Datenbank einspielen und Tabellen, Migrationen und Konten vergleichen. Kein Agent braucht dafür den Schlüssel. **Offen: Probe durch den Owner mit einem Backup nach dem 03.11.**

**Einspielen in die Produktion:** nur nach Owner-Entscheidung. App stoppen, Datenbank ersetzen, App starten. Ohne aktives Löschprotokoll kommen Löschungen zurück (Doku 39).

## 3. Automatische Prüfung

`/etc/cron.d/amanah-prod-check`, alle 15 Minuten, nur lesend: Image, Health, Route, Netz, Volume, Wissenssperre, Backup-Alter unter 26 h und Format, kein Klartext und keine Secret-Kopie im alten Ordner. Keine Reparaturen.

- Verlauf: `/var/log/amanah-prod-check.log`; Zustandswechsel: `/var/log/amanah-prod-alerts.log`; logrotate wöchentlich, 4 Stände.
- Getestet: Ein fehlendes Backup in einer Testumgebung erzeugt einen Alarm. Das Alarmlog enthält von 07:49 einen Fehlalarm und die Entwarnung: Das Suchmuster traf zunächst auch `.env.production.example`; korrigiert.
- **Niemand wird benachrichtigt.** Externer Versand ist aus (Owner 01.11., Doku 30). Anschluss: `staging-alert.sh` als Vorbild, nach Freigabe.

## 4. Staging

Läuft mit `amanah-staging-app:8668188`, eigene Datenbank `amanah_pg_staging`, eigene Netze, nur `127.0.0.1:3201`, nur synthetische Konten, Mail-Outbox, KI aus, Plus-Zwang aus. Migrationen 6 von 6. Backup und Restore bestanden. Rollback-Image `f9022d3` und `rollback/.env.staging.vor-*` vorhanden; zurück nur mit Datenbank-Wiederherstellung.

**Zugang (Owner):** `ssh -N -L 3201:127.0.0.1:3201 gemeinsam1-prod`, dann `http://127.0.0.1:3201`. Keine Zugangsdaten nötig, Registrierung nur mit Adressen auf `@staging.invalid`, Bestätigungslink über `http://127.0.0.1:3201/api/dev/outbox?to=<adresse>`.

**Aktualisieren:** Image lokal bauen und übertragen (nicht auf dem Server, RAM und Platte), `AMANAH_RELEASE` setzen, Compose-Hash von Postgres vergleichen. Keinen Trockenlauf des ganzen Stacks: Er wartet endlos auf den Migrationsdienst.

## 5. Plattenplatz

`/` steht bei 87 %, die Staging-Prüfung warnt ab 85 % und ist deshalb dauerhaft rot. Große Amanah-Posten: `amanah-app-migrate:latest` (1,8 GB), Hotfix-Image, Rollback-Image, Staging-Images. Nicht entfernt, weil das eine Entscheidung ist. Ein Release braucht vorübergehend rund 1,5 GB zusätzlich für das Migrations-Image.
