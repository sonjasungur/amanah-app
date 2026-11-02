# Kostenlose Kontofunktionen und Änderungshistorie (Stand 02.11.2026)

**Für:** Owner und Datenschutzprüfung. **Stand:** lokal, nicht deployt. Plus-Zwang und Historie sind aus. Datenschutzprüfung bleibt Pflicht. Keine Rechtsprüfung; die Fristen und Grenzen sind Vorschläge.

## 1. Kostenlose Kontofunktionen bei Plus-Zwang

Die Regel liegt serverseitig in `src/lib/server/folder-access.ts` und greift nur mit `AMANAH_BILLING_ENFORCE=true`. Ohne diese Einstellung bleiben die Schreibrechte wie bisher.

**Dauerhaft kostenlos im Konto (`FREE_ACCOUNT_SECTIONS`):** Vermögensübersicht, Notfallkarte, Vorsorge-Check, Lesezeichen im Wissensbereich.

| Konto | Schreiben | Lesen, Export, Löschen |
|---|---|---|
| Plus gekauft, oder Konto älter als `AMANAH_PLUS_LAUNCH_AT` | alles | immer |
| Ohne Plus, auch nach Erstattung | nur die vier kostenlosen Bereiche | immer, auch für Bereiche aus der Plus-Zeit |

- Einwilligung und bestätigte E-Mail bleiben Bedingung fürs Speichern im Konto.
- Der Client lädt den ganzen Ordner hoch. Andere Bereiche werden dann nicht überschrieben und nicht gelöscht. Die Antwort nennt sie in `notStored`, die Oberfläche zeigt „Teilweise gespeichert“, und die Angaben bleiben im Browser.
- **Vorsorge-Check:** Der Fortschritt lag bisher nie im Ordner, auch nicht im lokalen Modus: Ein Fehler beim Laden des Stores verhinderte das Schreiben. Das ist behoben. Vor diesem Stand ausgefüllte Checks liegen weiter nur im `sessionStorage` des Tabs.
- **Gerätewechsel:** Für kostenlose Bereiche gilt der Stand im Konto. Ist ein Bereich im Konto noch leer, werden die Einträge aus diesem Browser übernommen und hochgeladen. **Grenze:** Hat jemand einen Bereich auf Gerät A vollständig geleert und meldet sich auf Gerät B mit altem Browserstand an, kommen die alten Einträge von dort zurück.
- **Tarifwechsel:** Kostenlos gespeicherte Daten bleiben durch Kauf und Erstattung unverändert. Plus-Bereiche bleiben nach einer Erstattung gespeichert und lesbar, Änderungen daran werden nur nicht mehr angenommen.

## 2. Datenmengen und bestehende Konten

**Können vorhandene Datensätze größer als 2 MiB sein? Theoretisch ja, praktisch sehr unwahrscheinlich; gemessen ist es nicht.**

- Bisher gab es serverseitig keine Grenze, und Textfelder sind unbegrenzt. Das Modell enthält keine Dateien, auch nicht bei Dokumenten: nur Titel, Ablageort und Notiz.
- Messung synthetisch: Demo-Daten 6 KB. Stark gefüllt (200 Vermögenseinträge, 200 Dokumente mit je 2.000 Zeichen Notiz, 50.000 Zeichen Familienbrief) 0,65 MiB. 2 MiB entsprechen rund zwei Millionen Zeichen.
- Größer werden kann ein Datensatz vor allem durch einen JSON-Import oder eingefügten Text. Der Browserspeicher begrenzt lokale Daten je nach Browser auf etwa 5 Millionen Zeichen.
- **Echte Datensätze wurden nicht gelesen.** Der Owner kann die Größenklassen selbst abrufen: `DATABASE_URL=… node scripts/report-folder-sizes.mjs`. Das Skript arbeitet nur lesend und gibt nur Zahlen aus.

**Regel seit dieser Runde:**

| Fall | Ergebnis |
|---|---|
| Gespeicherte Menge bis 2 MiB | immer erlaubt |
| Konto liegt schon darüber | Bearbeiten und Kürzen bleiben möglich; je Speichern bis zu 64 KiB Wachstum |
| Gekürzt und später wieder über 2 MiB | abgelehnt (413), der gespeicherte Stand bleibt |
| Über 16 MiB | wird nicht gelesen (413) |
| Mehr als 500 Vermögenseinträge | neu abgelehnt (422); wer schon mehr hat, darf behalten und reduzieren |
| Kostenloses Konto mit großem Browserstand | zählt nur, was wirklich im Konto gespeichert wird |

**Warnung und voller Browserspeicher:** Über 80 % der Grenze warnt die Speicheranzeige. Ist der Browserspeicher voll, erscheint eine Meldung, und die Eingabe bleibt auf der geöffneten Seite. Auf kleinen Bildschirmen zeigt ein eigener Hinweis Speicherprobleme an, weil die Seitenleiste dort verborgen ist.

**Verbleibende Lücke:** Wer lokal schon über 2 MiB gesammelt hat und das Konto neu anlegt, bekommt beim ersten Hochladen die Meldung, die Daten seien zu groß; sie bleiben im Browser.

## 3. Änderungshistorie

Vorbereitet, **aus** (`AMANAH_DATA_HISTORY`), nicht verlinkt. Logik: `src/lib/server/data-history.ts`; Oberfläche `/dashboard/verlauf`, die ohne Flag nur „noch nicht verfügbar“ zeigt.

| Thema | Umsetzung |
|---|---|
| Inhalt | Nur der frühere Wert der geänderten Bereiche, kein vollständiger Abzug bei jeder Änderung |
| Bereiche | Was Menschen eingeben, dazu Vorsorge-Check und Lesezeichen; keine Navigation |
| Tarif | **Owner-Entscheidung 02.11.2026:** Verlauf von Vermögensübersicht, Notfallkarte, Vorsorge-Check und Lesezeichen bleibt kostenlos, einschließlich Wiederherstellung im Rahmen der Speichergrenzen. Verlauf anderer Plus-Bereiche kann später Teil von Plus sein. Einsicht, Export und Löschen bleiben unabhängig vom Tarif möglich |
| Schutz | Verschlüsselt wie der Ordner und an das Konto gebunden. Im Klartext liegen nur Konto-ID, laufende Nummer, Art, Größe und Datum |
| Zugriff | Lesen, Wiederherstellen und Löschen sind je Konto begrenzt; eine fremde ID ergibt 404 und ändert nichts; eine kopierte Zeile lässt sich nicht lesen; schreibende Anfragen nur von gleicher Herkunft |
| Passwörter, Schlüssel | Felder mit solchen Namen werden entfernt. **Grenze:** Freitext kann nicht gefiltert werden |
| Anzeige | Die Liste zeigt Datum, Art und Bereiche; Inhalte nur für die geöffnete Version, als reiner Text. Antworten werden nicht zwischengespeichert. Felder tragen verständliche Bezeichnungen, technische Felder sind ausgeblendet |
| Wiederherstellen | Zwei Schritte mit Ankreuzfeld; der Server verlangt `confirmed: true`, Einwilligung und bestätigte E-Mail. Der aktuelle Stand wird selbst eine Version. Ohne Plus nur kostenlose Bereiche |
| Grenzen (vorläufig) | 90 Tage, höchstens 50 Versionen, höchstens 5 MiB je Konto. Eine einzelne Änderung über 5 MiB wird gar nicht aufbewahrt; Wiederherstellen setzt diesen Bereich dann nicht zurück |
| Automatisches Löschen | Beim Schreiben, beim Export und täglich im Server (`src/instrumentation.ts`, beim Start und alle 24 Stunden, auch mit ausgeschaltetem Flag). Es löscht nur, es schaltet nichts frei. Das Log enthält nur Anzahl oder Fehlercode. Ist die Datenbank nicht erreichbar (`P1001`), folgt der nächste Versuch nach 15 Minuten statt erst am Folgetag |
| Löschen durch Nutzer | Alles, oder eine Version samt älteren, damit die übrigen vollständig bleiben. Automatisch mit dem Ordner, dem Widerruf der Einwilligung und dem Konto |
| Export | `dataHistory` ohne abgelaufene Versionen (Format `@2`), dazu `purchases`. Unlesbare Versionen erscheinen ohne Inhalt |
| Schlüsselrotation | `scripts/reencrypt-amanah-data.mjs` erfasst auch die Versionen |

### Backups und Wiederherstellung gelöschter Daten

- **Was Backups enthalten:** Der Datenbank-Dump umfasst alle Tabellen, auch `amanah_data_versions`. Der Inhalt bleibt verschlüsselt; die Datenschlüssel sind nicht Teil des Backups ([Doku 15](15-verschluesselung-und-backup.md) §5).
- **Aufbewahrung:** Auf Staging standardmäßig 7 Tage (`BACKUP_KEEP_DAYS` in `scripts/staging-cron.sh`). **Für die Produktion nicht belegt:** Die Backupzeile dort habe ich nicht geprüft, weder Frist noch Verschlüsselung.
- **Folge:** Gelöschte Versionen, Ordner und Konten bleiben bis zum Ablauf dieser Frist in alten Backups.
- **Beim Einspielen eines Backups kommen gelöschte Daten zurück,** auch gelöschte Konten und widerrufene Ordner. Abgelaufene Versionen entfernt der Serverstart sofort wieder.
- **Löschprotokoll:** Lokal vorbereitet und ausgeschaltet, siehe [Doku 39](39-loeschprotokoll-und-restore.md). Solange es nicht aktiv ist, gilt:
  1. Ein Restore in die Produktion nur nach Owner-Entscheidung und Dokumentation.
  2. Nach dem Restore Löschanträge seit dem Backup-Datum aus Support und Unterlagen erneut ausführen.
  3. Betroffene Zeiträume festhalten.

### Vor dem Einschalten nötig

1. Datenschutzprüfung: Zweck, Fristen, Text in `/datenschutz` und im Einwilligungstext. Beides nennt die Historie noch nicht.
2. Ein Link aus den Einstellungen.
3. Backup-Fristen in der Produktion belegen und festlegen.
4. Entscheidung über das Löschprotokoll nach [Doku 39](39-loeschprotokoll-und-restore.md) §9.

## 4. Datenbank

Migration `20261101190000_data_history`: eine neue, leere Tabelle `amanah_data_versions`, Fremdschlüssel mit Cascade auf `users`. Bestehende Tabellen und Zeilen bleiben unverändert. Geprüft auf Wegwerf-Postgres mit einem vorhandenen Datensatz; auf Staging und Produktion **nicht** angewendet. In der aktuellen Runde kam keine neue Migration dazu.

## 5. Testweg

```bash
# Wegwerf-Postgres
docker run -d --rm --name amanah-history-test-pg -e POSTGRES_USER=test -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=hist \
  --tmpfs /var/lib/postgresql/data -p 127.0.0.1:5447:5432 postgres:16-alpine
DATABASE_URL=postgresql://test:testonly@127.0.0.1:5447/hist AMANAH_SERVER_STORAGE=postgres npx prisma migrate deploy
DATABASE_URL=postgresql://test:testonly@127.0.0.1:5447/hist AMANAH_SERVER_STORAGE=postgres npx vitest run src/__tests__/postgres
```

Browser mit echtem Konto: API-Build wie in [Doku 06](06-sicherheit-und-tests.md), dazu `AMANAH_BILLING_ENFORCE=true AMANAH_PLUS_LAUNCH_AT=2000-01-01T00:00:00Z FREE_ASSET_E2E=true` und `e2e/free-asset-account.spec.ts` sowie mit `AMANAH_DATA_HISTORY=true DATA_HISTORY_E2E=true` `e2e/data-history.spec.ts`. Je Spec und Projekt einen eigenen Lauf starten: Die Registrierungsbremse erlaubt 5 Konten pro Minute. Danach wieder `npm run build:e2e`.
