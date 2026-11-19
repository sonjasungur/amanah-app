# Produktionsplan für das Release (Stand 03.11.2026, 13:57)

**Für:** Owner und Betrieb. **Gesperrt bis zur gesonderten Freigabe:** Merge, Produktionsrelease, Produktionsmigration, Route, Registrierung. Kandidat: `b473cd5`.

## Vorbedingungen

- [ ] `node scripts/validate-release.mjs --mode=public-release` besteht: alle sechs Freigaben dokumentiert, nur der Owner trägt ein.
- [ ] Marke, Domain, Mailanbieter entschieden (`entscheidung-marke-domain-mail.md`).
- [ ] Owner-Restore-Probe eines Produktions-Backups (Doku 45 §2).
- [ ] Modultexte und Inhalte gemäß den Prüfergebnissen; neuer Commit und erneuter Release-Check, falls sich etwas ändert.
- [ ] Merge nach `main` freigegeben.
- [ ] Mindestens 3 GB frei auf `/`.
- [ ] Datenschlüssel vom Owner gesichert, Probe `check-data-key` bestanden.
- [ ] Prüfung auf Staging mit Domain und HTTPS, echter Mailtest, Smartphone-Abnahme.

## Konfiguration: fehlt heute in der Produktion

Geprüft nur anhand der Namen. Pflicht im Release, in `/opt/amanah-prod/.env.production` **nicht vorhanden:** `AMANAH_DATA_KEYS`, `AMANAH_DATA_KEY_ACTIVE`, `AMANAH_PUBLIC_BASE_URL`. Datenschlüssel auf dem Server erzeugen, nie im Chat oder Repo, und getrennt vom Backup sichern (Doku 15).

**Vorbereitet, unbenutzt (03.11.):** `/opt/amanah-prod/release/.env.production.next` (600) mit Datenschlüssel `prod1`, `AMANAH_DATA_ENCRYPTION=required`, `AMANAH_AI_ENABLED=false`; die aktive Env und die laufende App sind unverändert (Prüfsumme). Eine Kopie des Datenschlüssels, nur für den Owner lesbar: `release/data-key-prod1.age`. Validator im Kandidaten-Image: 0 Fehler, 1 Warnung (kein Mailtransport). `AMANAH_PUBLIC_BASE_URL` bleibt leer, bis die Domain feststeht; `prepare-release-env.sh https://…` trägt sie nach, und `docker-compose.release.yml` startet ohne sie nicht. Geprüft: `compose config` scheitert ohne Adresse, mit Adresse gültig.

**Der Stack braucht diese neue Datei:** Der heutige gepinnte Stack reicht Datenschlüssel und Adresse gar nicht an die App weiter und setzt die KI im Zweifel auf `true`.

**Der Owner sichert den Datenschlüssel vor dem Release selbst** (`check-data-key`, Doku 45 §2.2). Backups enthalten nur noch Verschlüsseltes: **Ohne diesen Schlüssel ist ein Backup für die Ordnerinhalte wertlos.**

## Ablauf

1. **Bauen:** lokal aus dem freigegebenen Commit mit den Produktions-Build-Werten, Images `app` und `migrate`; Prüfsumme und Schichten-Hash wie beim Hotfix.
2. **Übertragen:** beide Images laden; `df -h /` kontrollieren.
3. **Sichern:** verschlüsseltes Backup auslösen, Compose-Hash von Postgres mit dem Container vergleichen.
4. **App stoppen,** nur `amanah-app`. `gemeinsam1` nicht berühren.
5. **Migrieren:** `migrate deploy` mit dem Migrations-Image im Netz `amanah-app_amanah_internal`. Erwartet: 7 von 7. Fremde Dienste bleiben unberührt. Stoppen bei Fehler.
6. **Env und Stack wechseln:** `release/.env.production.next` wird zu `.env.production`, `docker-compose.release.yml` mit `AMANAH_RELEASE_IMAGE=<digest>`; Digest auch im Prüfskript eintragen. Alte Env und alten Stack in `config-vorher/` behalten.
6a. **Schlüsselreferenz anlegen, einmalig, vor dem ersten Start:** mit der neuen Env: `AMANAH_RELEASE_IMAGE=<digest> docker compose -f docker-compose.release.yml --env-file .env.production run --rm --no-deps -T -e AMANAH_KEY_REFERENCE_CONFIRM=yes --entrypoint node app scripts/key-reference.mjs init`. Vorher belegt der Owner mit `check-data-key`, dass genau dieser Schlüssel gesichert ist: Beim allerersten Anlegen gibt es nichts, womit ein falscher Schlüssel zu erkennen wäre. Ohne Referenz bleibt der Ordnerzugriff gesperrt, und `rollback-app.sh` startet nicht.
7. **Starten, nur über den geprüften Weg:** `rollback-app.sh` mit dem Release-Stack (Abschnitt Wiederherstellung) nach `/opt/amanah-prod/` installieren und mit `--apply` ausführen; Postgres muss weiterlaufen. Danach `docker-compose.pinned.yml` in `config-vorher/` verschieben, damit kein Direktstart des alten Images mehr bereitliegt.
8. **Prüfen:** Health, `verify-production-image.sh`, `public-content-probe.py`, Konten und Daten, abgelehnte Anmeldung; `gemeinsam1` byte-gleich.
9. **Migrations-Image entfernen,** Platz freigeben.

**Noch nicht öffnen.** Route und Registrierung sind eigene, spätere Schritte mit eigener Freigabe (Doku 42 §3, Doku 44).

## Wiederherstellung

Zwei getrennte Wege. Das alte Image ist nach Einführung verschlüsselter Daten **kein allgemeiner Rollback-Kandidat**. Probe: `scripts/testing/rollback-encryption-probe.sh`, isoliert, synthetisches Konto, API-Ebene.

### App-Wechsel: nur über `rollback-app.sh`

Jeder Imagewechsel läuft über dieses Skript; es prüft das Image, das Compose tatsächlich starten würde, und bricht vor jeder Änderung ab. Ohne `--apply` prüft es nur.

```bash
cd /opt/amanah-prod
AMANAH_RELEASE_IMAGE=<image@sha256:…> ./rollback-app.sh --compose docker-compose.release.yml --env-file .env.production          # nur prüfen
AMANAH_RELEASE_IMAGE=<image@sha256:…> ./rollback-app.sh --compose docker-compose.release.yml --env-file .env.production --apply  # wechseln
```

Staging: `APP_CONTAINER=amanah-staging-app DB_CONTAINER=amanah-staging-postgres AMANAH_RELEASE=<sha> scripts/rollback-app.sh --compose docker-compose.staging.yml --compose docker-compose.staging.proxy.yml --env-file .env.staging`.

| Lage | Ergebnis | Exit |
|---|---|---|
| Keine verschlüsselte Zeile | erlaubt, auch das alte Image | 0 |
| Verschlüsselte Zeilen, Image ohne Verschlüsselung **oder ohne Schreibschutz** | abgebrochen, nichts geändert | 1 |
| Verschlüsselte Zeilen, Image geeignet, Schlüssel öffnen nicht alle Zeilen | abgebrochen, nichts geändert | 1 |
| Verschlüsselte Zeilen, Image geeignet, Trockenlauf öffnet alle Zeilen | erlaubt | 0 |
| Zählung fehlgeschlagen, Image fehlt, Compose nennt kein Ziel | unbekannt, nichts geändert | 2 |
| Zeilen entstanden zwischen Prüfung und Stopp | alte App läuft wieder, abgebrochen | 1 |

Geeignet heißt: Das Image enthält den Umschlag `amanah-aes256gcm-v1` und den Schutz `folder_unreadable`. Der frühere Kandidat `8668188` hat nur den Umschlag, also nicht den Schreibschutz, und wird abgelehnt.

Warum das alte Image nicht geht (Probe 03.11.): Anmeldung 200, Ordner **erscheint leer**, Speichern legt neue Eingaben **im Klartext** neben den Umschlag; zurück beim Kandidaten sind diese Eingaben weg.

**Sicherer Weg bei verschlüsselten Daten:** vorwärts auf ein kompatibles Image mit demselben Schlüssel, oder der vollständige Restore unten. Compose von Hand umgeht die Prüfung und ist kein zulässiger Weg. `rollback-check.sh` bleibt als schnelle, rein lesende Übersicht.

### Vollständiger Datenbank-Restore

App stoppen, Datenbank aus dem Backup von Schritt 3 ersetzen, dann das **zum Stand des Backups passende Image mit dem Schlüssel dieses Stands** über `rollback-app.sh --apply` starten. In der Probe: Zeile identisch mit dem Backup, Kandidat mit Schlüssel liest sie. Zurück auf Stand 1 mit altem Image: vorheriger Probelauf, Daten identisch.

**Es gibt keine Rückmigration.** Änderungen nach dem Backup gehen verloren, und ohne aktives Löschprotokoll kämen Löschungen zurück (Doku 39). Die Route bleibt in allen Fällen geschlossen.

### Schlüsselfehler

Falscher, fehlender oder entfernter Schlüssel: Die API lehnt Lesen und alle Schreibwege mit HTTP 503 und `code: folder_unreadable` ab, die Zeile bleibt unverändert. Der Browser zeigt den Hinweis statt leerer Formulare und speichert nichts. Serverlog: `[folder] rejected`, beim Start `[keys] folder access locked`, ohne Schlüssel und Inhalte.

**Schlüsselreferenz:** Die Tabelle `data_key_references` enthält je Schlüsselkennung einen mit diesem Schlüssel versiegelten Wert ohne Nutzerdaten. Damit fällt ein falscher Schlüssel **auch bei leerer Datenbank** auf, vor dem ersten Speichern. Die App schreibt die Tabelle nie, und kein Befehl ersetzt eine vorhandene Referenz: Schlägt die Prüfung fehl, ist die Konfiguration falsch, bis das Gegenteil belegt ist.

```bash
C="docker compose -f docker-compose.release.yml --env-file .env.production run --rm --no-deps -T -e AMANAH_KEY_REFERENCE_CONFIRM=yes --entrypoint node app"
$C scripts/key-reference.mjs check          # nach jedem Env-Wechsel; Exit 0 gültig, 1 ungültig, 2 nicht ausführbar
$C scripts/reencrypt-amanah-data.mjs        # Trockenlauf: öffnet zusätzlich jede Zeile, schreibt nichts
```

| Status | Bedeutung |
|---|---|
| `ok` | Schlüssel passen |
| `wrong_key` | Unter dieser Kennung liegt ein anderer Schlüssel |
| `missing_key` | Ein referenzierter Schlüssel fehlt |
| `not_initialized` | Diese Umgebung hat noch keine Referenz |
| `active_key_without_reference` | Aktiver Schlüssel ohne Referenz, `add` fehlt |
| `invalid_config` | `AMANAH_DATA_KEYS` ist nicht lesbar |

**Kontrollierter Schlüsselwechsel:** neuen Schlüssel neben dem alten in `AMANAH_DATA_KEYS` eintragen, `AMANAH_DATA_KEY_ACTIVE` auf die neue Kennung, `key-reference.mjs add` (gelingt nur, wenn die alten Referenzen sich öffnen lassen), App über `rollback-app.sh --apply` neu starten, `reencrypt-amanah-data.mjs --apply` mit `AMANAH_REENCRYPT_CONFIRM=yes`, `key-reference.mjs retire <alt>` (gelingt nur, wenn keine Zeile ihn mehr nutzt), erst dann den alten Schlüssel entfernen. Parallele Speichervorgänge bleiben dabei erhalten: Geänderte Zeilen lässt das Werkzeug aus, meldet `changed_meanwhile` und wird erneut gestartet.

**Nach einem Restore** gilt die Referenz des Backups: Sie passt zum Schlüssel dieses Stands. Enthält ein altes Backup noch keine, öffnet `init` zuerst alle verschlüsselten Zeilen und lehnt ab, wenn eine sich nicht öffnen lässt.

**Grenzen:**
- Beim allerersten `init` auf leerer Datenbank gibt es keinen Vergleichswert. Deshalb die Owner-Probe `check-data-key` vorher.
- Geht der richtige Schlüssel endgültig verloren, gibt es bewusst keinen Befehl dafür. Das ist eine Owner-Entscheidung; die Referenz wird nicht automatisch ersetzt.
- Der Schutz gilt für PostgreSQL; der Speicher-Modus für lokale Tests hat keine dauerhafte Referenz. Unit-Tests schalten die Prüfung außerhalb der eigenen Testdatei ab; das wirkt nur bei `NODE_ENV=test`.

**Bewusste Ausnahme:** Einwilligungswiderruf und Kontolöschung löschen auch einen gerade nicht lesbaren Ordner, weil sie ausdrückliche Löschwünsche sind. „Amanah-Daten löschen“ wird dagegen abgelehnt.

## Risiken

Gering, solange 0 Konten bestehen; der Stand ist vor dem Release erneut zu zählen. Plattenplatz bleibt knapp (84 %, Warnung ab 85 %). Die Prüfung läuft ohne externe Benachrichtigung.
