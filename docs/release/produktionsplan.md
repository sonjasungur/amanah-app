# Produktionsplan für das Release (Stand 03.11.2026, 10:23)

**Für:** Owner und Betrieb. **Gesperrt bis zur gesonderten Freigabe:** Merge, Produktionsrelease, Produktionsmigration, Route, Registrierung. Kandidat: `8668188`.

## Vorbedingungen

- [ ] `node scripts/validate-release.mjs --mode=public-release` besteht: alle sechs Freigaben dokumentiert, nur der Owner trägt ein.
- [ ] Marke, Domain, Mailanbieter entschieden (`entscheidung-marke-domain-mail.md`).
- [ ] Owner-Restore-Probe eines Produktions-Backups (Doku 45 §2).
- [ ] Modultexte und Inhalte gemäß den Prüfergebnissen; neuer Commit und erneuter Release-Check, falls sich etwas ändert.
- [ ] Merge nach `main` freigegeben.
- [ ] Mindestens 3 GB frei auf `/`.
- [ ] Datenschlüssel vom Owner gesichert, Probe `check-data-key` bestanden.
- [ ] **Vor dem ersten echten Konto:** Fehler „Schreiben mit falschem Schlüssel“ behoben (siehe unten).
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
5. **Migrieren:** `migrate deploy` mit dem Migrations-Image im Netz `amanah-app_amanah_internal`. Erwartet: 6 von 6. Fremde Dienste bleiben unberührt. Stoppen bei Fehler.
6. **Env und Stack wechseln:** `release/.env.production.next` wird zu `.env.production`, `docker-compose.release.yml` mit `AMANAH_RELEASE_IMAGE=<digest>`; Digest auch im Prüfskript eintragen. Alte Env und alten Stack in `config-vorher/` behalten.
7. **Starten:** `up -d --no-deps app`, Postgres muss weiterlaufen.
8. **Prüfen:** Health, `verify-production-image.sh`, `public-content-probe.py`, Konten und Daten, abgelehnte Anmeldung; `gemeinsam1` byte-gleich.
9. **Migrations-Image entfernen,** Platz freigeben.

**Noch nicht öffnen.** Route und Registrierung sind eigene, spätere Schritte mit eigener Freigabe (Doku 42 §3, Doku 44).

## Wiederherstellung

Zwei getrennte Wege. Probe: `scripts/testing/rollback-encryption-probe.sh`, 03.11., isoliert auf dem Server, synthetisches Konto, altes Image `wissenssperre-dda903c` und Kandidat `8668188`, 1 auf 6 Migrationen, API-Ebene.

### App-Rollback: nur solange keine verschlüsselte Zeile existiert

```bash
/opt/amanah-prod/rollback-check.sh    # Exit 0 erlaubt, 1 nicht erlaubt, 2 unbekannt
```

Das alte Image kennt keine Datenverschlüsselung. **Meine frühere Aussage „App-Rollback belegt“ galt nur für unverschlüsselte Zeilen und ist hiermit korrigiert.**

| Schritt in der Probe | Beobachtung |
|---|---|
| Altes Image, Zeile unverschlüsselt | Funktioniert: Anmeldung, Lesen, Schreiben |
| Altes Image, Zeile verschlüsselt, Lesen | Anmeldung 200, Ordner **erscheint leer**, HTTP 200, keine Fehlermeldung |
| Altes Image, Client speichert | HTTP 200, **neue Eingaben stehen im Klartext in der Zeile**, neben dem Umschlag |
| Danach wieder Kandidat | Liest den alten verschlüsselten Stand: **Eingaben der Rollback-Zeit sind weg**, der Klartext bleibt liegen |

**Regel:** Bei `rollback-check.sh` = erlaubt: Digest zurück, alte Env, `up -d --no-deps app`. Andernfalls nicht aufs alte Image, sondern **vorwärts**: korrigiertes Image mit demselben Schlüssel; ein Neustart des Kandidaten mit demselben Schlüssel las in der Probe korrekt. Oder den nächsten Weg.

Das gilt bis zum ersten Schreibvorgang mit dem neuen Image. Solange die Route zu ist und 0 Konten bestehen, bleibt der Rollback erlaubt.

### Vollständiger Datenbank-Restore

App stoppen, Datenbank aus dem Backup von Schritt 3 ersetzen, passendes Image **mit dem Schlüssel dieses Stands** starten. In der Probe: Zeile identisch mit dem Backup, Kandidat mit Schlüssel liest sie. Zurück auf Stand 1 mit altem Image: vorheriger Probelauf, Daten identisch.

**Es gibt keine Rückmigration.** Änderungen nach dem Backup gehen verloren, und ohne aktives Löschprotokoll kämen Löschungen zurück (Doku 39). Die Route bleibt in allen Fällen geschlossen.

### Schlüsselfehler

| Lage in der Probe | Lesen | Schreiben | Folge |
|---|---|---|---|
| Kein Schlüssel | HTTP 500 | HTTP 500 | sicher, Zeile unverändert |
| **Falscher Schlüssel, gleiche Kennung** | HTTP 500 | **HTTP 200, Zeile überschrieben** | **Fehler im Produkt:** Danach kann auch der richtige Schlüssel die Zeile nicht lesen (HTTP 500); nur ein Backup hilft |

Ein vollständiger Schreibvorgang liest die alte Zeile nicht und bemerkt den falschen Schlüssel deshalb nicht. Getestet mit direktem API-Aufruf; ob der Browser-Client nach einem 500 beim Laden überhaupt schreibt, ist nicht geprüft. **Nicht behoben:** Das wäre Produktcode und braucht einen neuen Kandidaten. Vor dem ersten echten Konto beheben, zum Beispiel Schreiben ablehnen, wenn die vorhandene Zeile sich nicht öffnen lässt. Bis dahin Schlüssel nie von Hand ändern, und nach jedem Env-Wechsel mit einem Testkonto lesen, bevor Schreibzugriffe möglich sind.

## Risiken

Gering, solange 0 Konten bestehen; der Stand ist vor dem Release erneut zu zählen. Plattenplatz bleibt knapp (84 %, Warnung ab 85 %). Ein Schlüsselfehler kann Daten überschreiben, siehe oben. Die Prüfung läuft ohne externe Benachrichtigung.
