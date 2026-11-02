# Kostenlose Vermögensübersicht im Konto und Änderungshistorie (Stand 01.11.2026)

**Für:** Owner und Datenschutzprüfung. **Stand:** lokal, nicht deployt. Plus-Zwang und Historie sind aus. Keine Rechtsprüfung; die Fristen und Grenzen sind Vorschläge.

## 1. Vermögensübersicht bei Plus-Zwang

Die Regel liegt serverseitig in `src/lib/server/folder-access.ts` und greift nur mit `AMANAH_BILLING_ENFORCE=true`. Ohne diese Einstellung verhält sich das Speichern wie bisher.

| Konto | Schreiben | Lesen, Export, Löschen |
|---|---|---|
| Plus gekauft, oder Konto älter als `AMANAH_PLUS_LAUNCH_AT` | alles | immer |
| Ohne Plus | nur `assets` (`FREE_ACCOUNT_SECTIONS`) | immer, auch für Bereiche aus der Plus-Zeit |

- Einwilligung und bestätigte E-Mail bleiben Bedingung fürs Speichern im Konto.
- Der Client lädt den ganzen Ordner hoch. Andere Bereiche werden dann nicht überschrieben und nicht gelöscht. Die Antwort nennt sie in `notStored`, die Oberfläche zeigt „Teilweise gespeichert“, und die Angaben bleiben im Browser. Beim Anmelden überschreibt das Konto sie nicht.
- **Tarifwechsel:** Nach Erstattung oder Ablauf bleibt alles gespeichert und lesbar. Änderungen außerhalb der Übersicht werden nur nicht mehr angenommen. Vorhandene Daten werden weder migriert noch gelöscht.
- **Grenzen, gelten immer:** 2 MiB je Speichervorgang (413), 500 Einträge in der Übersicht (422). Der gespeicherte Stand bleibt bei einer Ablehnung erhalten. Die Größe echter Datensätze wurde nicht geprüft, weil keine Produktionsdaten gelesen werden.

**Zu entscheiden:** Notfallkarte und Vorsorge-Check sind im Tarifplan kostenlos, im Konto gespeichert würden sie bei Plus-Zwang aber nicht; sie blieben im Browser. Gleiches gilt für Lesezeichen. Eine Aufnahme in `FREE_ACCOUNT_SECTIONS` ist eine einzeilige Änderung.

## 2. Änderungshistorie

Technisch vorbereitet, **aus** (`AMANAH_DATA_HISTORY`), ohne Oberfläche. Logik: `src/lib/server/data-history.ts`.

| Thema | Umsetzung |
|---|---|
| Inhalt | Nur der frühere Wert der geänderten Bereiche, kein vollständiger Abzug bei jeder Änderung |
| Bereiche | Was Menschen eingeben; kein Fortschritt, keine Navigation, keine Lesezeichen |
| Schutz | Verschlüsselt wie der Ordner und an das Konto gebunden. Im Klartext liegen nur Konto-ID, laufende Nummer, Art, Größe und Datum; die Namen der Bereiche sind verschlüsselt |
| Zuordnung | Jede Abfrage ist auf das Konto begrenzt; eine fremde ID ergibt 404; eine kopierte Zeile lässt sich nicht lesen |
| Passwörter, Schlüssel | Felder mit solchen Namen werden entfernt. **Grenze:** Freitext kann nicht gefiltert werden |
| Anzeige | Die Liste zeigt nur Datum, Art und Bereiche, nie den Inhalt |
| Wiederherstellen | Nur per POST mit `confirmed: true`, gleiche Herkunft, Einwilligung, bestätigte E-Mail. Der aktuelle Stand wird selbst eine Version, also umkehrbar. Ohne Plus nur freie Bereiche |
| Zusammenfassen | Änderungen innerhalb von 10 Minuten zählen als eine Änderung |
| Aufbewahrung (Vorschlag) | 90 Tage, höchstens 50 Versionen, höchstens 5 MiB je Konto. Ältere Versionen werden beim Schreiben entfernt und sind nach Fristablauf nicht mehr abrufbar |
| Löschen | Einzeln alle Versionen; automatisch mit dem Ordner, mit dem Widerruf der Einwilligung und mit dem Konto |
| Export | `dataHistory` im Kontoexport (Format `@2`), dazu neu `purchases`. Unlesbare Versionen erscheinen ohne Inhalt |
| Schlüsselrotation | `scripts/reencrypt-amanah-data.mjs` erfasst jetzt auch die Versionen |

**Vor dem Einschalten nötig:**
1. Datenschutzprüfung: Zweck, Frist, Text in `/datenschutz` und im Einwilligungstext. Die Seite nennt die Historie noch nicht, darf also erst danach aktiv werden.
2. `scripts/purge-data-history.mjs` planen; ohne Planung bleiben abgelaufene Versionen inaktiver Konten bis zum nächsten Schreiben liegen. Bis dahin sind sie nicht abrufbar, im Kontoexport aber enthalten.
3. Oberfläche mit Rückfrage vor dem Wiederherstellen.
4. Backups: Gelöschte Versionen bleiben bis zum Ablauf der Backup-Aufbewahrung in alten Backups, wie der Ordner auch. Frist mit prüfen.

## 3. Datenbank

Migration `20261101190000_data_history`: eine neue, leere Tabelle `amanah_data_versions`, Fremdschlüssel mit Cascade auf `users`. Bestehende Tabellen und Zeilen bleiben unverändert. Geprüft auf Wegwerf-Postgres mit einem vorhandenen Datensatz; auf Staging und Produktion **nicht** angewendet.

## 4. Testweg

```bash
# Wegwerf-Postgres
docker run -d --rm --name amanah-history-test-pg -e POSTGRES_USER=test -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=hist \
  --tmpfs /var/lib/postgresql/data -p 127.0.0.1:5447:5432 postgres:16-alpine
DATABASE_URL=postgresql://test:testonly@127.0.0.1:5447/hist AMANAH_SERVER_STORAGE=postgres npx prisma migrate deploy
DATABASE_URL=postgresql://test:testonly@127.0.0.1:5447/hist AMANAH_SERVER_STORAGE=postgres npx vitest run src/__tests__/postgres
```

Browser mit echtem Konto: API-Build wie in [Doku 06](06-sicherheit-und-tests.md), dazu `AMANAH_BILLING_ENFORCE=true AMANAH_PLUS_LAUNCH_AT=2000-01-01T00:00:00Z FREE_ASSET_E2E=true` und `e2e/free-asset-account.spec.ts`. Danach wieder `npm run build:e2e`.
