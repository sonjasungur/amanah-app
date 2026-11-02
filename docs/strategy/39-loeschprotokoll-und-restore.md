# Löschprotokoll und Wiederherstellung aus Backups (Stand 02.11.2026)

**Für:** Owner, Datenschutz- und Sicherheitsprüfung, Betrieb. **Stand:** lokal entwickelt und mit synthetischen Daten getestet, nicht deployt und **ausgeschaltet**. Keine Rechtsprüfung; Fristen und Bewertungen sind Vorschläge für die Prüfung.

## 1. Problem und Ergebnis

Ein eingespieltes Backup bringt alles zurück, was seit dem Backup gelöscht wurde: Konten, Ordner, Verlauf und widerrufene Einwilligungen. Das Löschprotokoll hält diese Löschungen außerhalb der Datenbank fest und wiederholt sie, bevor die Anwendung nach einem Restore wieder Anfragen annimmt.

**Es löscht nichts aus den Backups selbst.** Gelöschte Daten bleiben bis zum Ablauf der Backup-Frist in den alten Sicherungen liegen. Das Protokoll verhindert nur, dass sie durch einen Restore wieder in den Betrieb gelangen.

## 2. Was gespeichert wird

| Feld | Inhalt |
|---|---|
| `subject` | Pseudonym der Konto-ID: HMAC-SHA-256 mit eigenem, abgeleitetem Schlüssel |
| `type` | `account_deleted`, `folder_deleted`, `history_deleted`, `consent_withdrawn`; dazu Verwaltungseinträge `genesis`, `checkpoint`, `cancelled` |
| `at`, `upTo`, `purpose` | Zeitpunkt; bei Verlaufslöschung „bis wann“; beim Widerruf der Einwilligungszweck |
| `epoch`, `seq`, `kid`, `prev`, `mac` | Kettenposition, Schlüsselkennung, Verkettung und Prüfwert |

**Nicht enthalten:** Namen, E-Mail-Adressen, Konto-IDs im Klartext, Ordnerinhalte. Die Übung prüft das an der echten Protokolldatei.

**Warum kein einfacher Hash:** Konto-IDs ließen sich gegen einen einfachen Hash durchprobieren. Ohne den Schlüssel lässt sich das Pseudonym nicht berechnen; mit Schlüssel und Datenbank lässt es sich zuordnen, sonst könnte der Restore nicht funktionieren.

## 3. Ablauf

**Löschen:** Erst der Protokolleintrag, dann die Löschung. Scheitert die Löschung, folgt ein `cancelled`-Eintrag. Lässt sich der Eintrag nicht schreiben, wird nicht gelöscht und die Anfrage endet mit einem Fehler (500). Stürzt der Server genau zwischen beiden Schritten ab, holt der nächste Start die Löschung nach.

**Restore mit `scripts/restore-with-deletions.sh`:**

1. Sperre `RESTORE_PENDING` setzen: Die Anwendung verweigert ab jetzt den Start.
2. Protokoll prüfen und prüfen, ob es das Backup abdeckt.
3. Datenbank ersetzen und Migrationen einspielen.
4. Löschungen in einer Transaktion wiederholen.
5. Sperre aufheben.

Bei einem Fehler bleibt die Sperre gesetzt. Das Skript verweigert die Arbeit, wenn die über `APP_CONTAINER` oder `APP_HEALTH_URL` angegebene Anwendung noch läuft.

**Jeder Serverstart** (`src/instrumentation.ts`) prüft das Protokoll und wiederholt die Löschungen, auch nach einem Restore ohne das Skript. Bei einem Problem beendet sich der Server, bevor er Anfragen beantwortet, und protokolliert nur den Fehlercode.

**Neuere Daten bleiben:** Die Wiederholung beachtet Zeitstempel. Was nach der Löschung neu angelegt wurde, etwa ein neuer Ordner desselben Kontos, wird nicht entfernt.

## 4. Manipulationsschutz

- Jeder Eintrag ist authentifiziert und mit dem vorherigen verkettet.
- Ein Kopfdatensatz in einem zweiten Verzeichnis und ein Anker in der Datenbank (`deletion_ledger_anchor`, nur Epoche und laufende Nummer) machen abgeschnittene oder verlorene Protokolle erkennbar.
- Die Konfiguration lehnt einen Kopfdatensatz im Protokollverzeichnis ab.

**Grenzen:**

- Der Schutz erkennt Veränderungen, er verhindert sie nicht. Wer Protokoll, Kopfdatensatz und Datenbank gemeinsam auf einen alten Stand zurücksetzt, bleibt unentdeckt. Protokoll und Kopf gehören deshalb getrennt und nicht in denselben Snapshot.
- Wer die Schlüssel hat, kann gültige Einträge erzeugen. Schlüssel gehören nicht in Backups und nicht in die Protokollablage.
- Für nur anhängbare Ablage sorgt der Code nicht. Das wäre eine Betriebsmaßnahme, etwa `chattr +a` oder ein WORM-Speicher; die tägliche Bereinigung schreibt die Datei allerdings neu und müsste dann angepasst werden.
- Annahme: **eine einzige Anwendungsinstanz.** Mehrere Instanzen an einem Protokoll sind nicht abgesichert und vor einem solchen Betrieb neu zu bewerten.

## 5. Aufbewahrung und Backup-Grenzen

- **Frist:** `AMANAH_BACKUP_MAX_RETENTION_DAYS` + 7 Tage Sicherheitsabstand. Es gibt bewusst keinen Standardwert; ohne Angabe startet die Anwendung mit eingeschaltetem Protokoll nicht. Einträge danach entfernt der tägliche Lauf. Eine unbefristete Speicherung ist nicht vorgesehen.
- **Der Wert muss die längste Frist einschließlich Archivkopien sein.** Das prüft der Code nicht, er kann die Backups nicht sehen. Die Frist der Produktions-Backups ist **nicht belegt**; Staging nutzt standardmäßig 7 Tage ([Doku 38](38-konto-speicherung-und-historie.md) §3).
- **Abdeckung:** Das Protokoll kennt den Zeitpunkt, ab dem es vollständig ist. Ältere Backups lehnt der Restore ab (`backup_not_covered`). Eine ältere Archivkopie lässt sich also nur nach einer eigenen, dokumentierten Entscheidung verwenden, nicht über dieses Skript.
- **Backup-Zeitpunkt:** Er kommt aus dem Dateinamen oder `BACKUP_TAKEN_AT`. Eine falsche Angabe kann die Abdeckungsprüfung täuschen.
- **Nicht erfasst:** Daten außerhalb der Datenbank, zum Beispiel Exporte, die Nutzer selbst gespeichert haben, oder Browserspeicher.

## 6. Schlüsselrotation

Neuen Schlüssel ergänzen und aktivieren: `AMANAH_DELETION_LEDGER_KEYS=alt:…,neu:…` mit `AMANAH_DELETION_LEDGER_KEY_ACTIVE=neu`.

- Vorhandene Einträge behalten ihren Schlüssel; die Wiederholung versteht beide.
- Ein alter Schlüssel darf erst entfernt werden, wenn seine Einträge abgelaufen sind. Fehlt er vorher, verweigert die Anwendung den Start (`unknown_key`).
- Ein endgültig verlorener Schlüssel ist wie ein verlorenes Protokoll zu behandeln (§7).

## 7. Verlorenes oder beschädigtes Protokoll

Ohne Protokoll startet die Anwendung nicht, und ein Restore bricht ab. Das Verhalten ist gewollt: Lieber kein Betrieb als unbemerkt zurückgekehrte Daten.

1. Protokoll aus einer getrennten Sicherung wiederherstellen, falls vorhanden, und mit `node scripts/deletion-ledger.mjs verify` prüfen.
2. Sonst Verlust dokumentieren und nach Owner-Entscheidung neu beginnen: `AMANAH_LEDGER_ACCEPT_LOSS=yes node scripts/deletion-ledger.mjs accept-loss`. Die defekte Datei wird beiseitegelegt und nicht gelöscht; sie ist danach gesondert zu entfernen.
3. **Folge:** Alle älteren Backups gelten dann als nicht abgedeckt und werden abgelehnt. Löschungen vor dem Verlust lassen sich aus dem Protokoll nicht mehr wiederholen.

**Nicht erkennbar:** Gehen Kopfdatensatz und Datenbankanker und das Protokoll zugleich verloren, sieht das aus wie ein Neubeginn. Die erstmalige Einrichtung und jeder Neubeginn sollten deshalb im Betriebstagebuch stehen.

## 8. Datenschutzrisiken für die Prüfung

| Thema | Einschätzung und offene Frage |
|---|---|
| Personenbezug | Das Protokoll enthält **pseudonyme personenbezogene Daten**, solange die Zuordnung über Schlüssel und Datenbank möglich ist. Es ist nicht anonym |
| Widerspruch zur Löschung | Das Protokoll bewahrt die Tatsache einer Löschung über die Löschung hinaus auf. Zu prüfen: Rechtsgrundlage, Erforderlichkeit, Text in `/datenschutz`, Verzeichnis der Verarbeitungstätigkeiten |
| Sensible Rückschlüsse | Typ und Zeitpunkt zeigen, dass jemand Daten gelöscht oder eine Einwilligung widerrufen hat. Der Einwilligungszweck steht im Klartext |
| Backups | Gelöschte Daten bleiben bis zum Fristablauf in den Sicherungen (Ordnerinhalte verschlüsselt, Kontodaten wie E-Mail-Adressen je nach Backup-Verschlüsselung). Frist und Verschlüsselung der Produktion sind nicht belegt |
| Fristkopplung | Eine zu kurz eingestellte Frist lässt Einträge verfallen, solange noch passende Backups existieren. Die Abdeckungsprüfung lehnt solche Backups dann ab, sofern der Backup-Zeitpunkt stimmt |
| Verfügbarkeit | Ein defektes Protokoll stoppt die gesamte Anwendung, und eine Protokollstörung blockiert Löschanträge. Zu entscheiden: Ist das so gewollt, und wie schnell muss jemand reagieren? |
| Zahlungsdaten | Kaufdatensätze bleiben beim Löschen des Kontos ohne Kontobezug erhalten (`onDelete: SetNull`); die Aufbewahrungsfrist ist steuerlich zu prüfen |

## 9. Vor einer Aktivierung nötig

1. Datenschutz- und Sicherheitsprüfung mit diesem Dokument.
2. Backup-Fristen in der Produktion belegen, einschließlich Archivkopien.
3. Getrennte Ablage für Protokoll und Kopfdatensatz; Schlüssel außerhalb der Backups; Migration `20261102120000_deletion_ledger_anchor`.
4. Sicherung und Überwachung des Protokolls festlegen, Fehlercodes in den Alarm aufnehmen.
5. Restore-Anleitung im Betrieb auf `restore-with-deletions.sh` umstellen; `restore-postgres.sh` allein wiederholt keine Löschungen, das tut dann erst der nächste Serverstart.
6. Übung auf Staging mit synthetischen Daten wiederholen, nur nach Owner-Freigabe.

**Einschalten** (erst danach): `AMANAH_DELETION_LEDGER=required`, `AMANAH_DELETION_LEDGER_DIR`, `AMANAH_DELETION_LEDGER_HEAD`, `AMANAH_DELETION_LEDGER_KEYS`, `AMANAH_BACKUP_MAX_RETENTION_DAYS`.

## 10. Testweg

```bash
# Wegwerf-Postgres und API-Build wie in Doku 38 §5, dann mit Zeitgrenze:
timeout -k 20 540 node scripts/testing/restore-drill.mjs > drill.log 2>&1
```

Die Übung läuft nur gegen den Container `amanah-history-test-pg` und verweigert sonst die Arbeit. Sie nutzt echten Server, echten `pg_dump` und das echte Restore-Skript. Geprüft werden Löschungen nach dem Backup, Startsperre, roher Restore, Restore über das Skript, Wiederinbetriebnahme, zweiter Start, Schlüsselrotation, manipuliertes und verlorenes Protokoll.

Nicht geprüft: Produktion und Staging, verschlüsselte `.age`-Backups im Zusammenspiel mit diesem Skript, Archivkopien, gleichzeitige Instanzen, Ausfall mitten im Restore außerhalb der gezeigten Fälle.
