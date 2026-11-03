# Produktionsplan für das Release (Stand 03.11.2026)

**Für:** Owner und Betrieb. **Gesperrt bis zur gesonderten Freigabe:** Merge, Produktionsrelease, Produktionsmigration, Route, Registrierung. Kandidat: `8668188`.

## Vorbedingungen

- [ ] `node scripts/validate-release.mjs --mode=public-release` besteht: alle sechs Freigaben dokumentiert, nur der Owner trägt ein.
- [ ] Marke, Domain, Mailanbieter entschieden (`entscheidung-marke-domain-mail.md`).
- [ ] Owner-Restore-Probe eines Produktions-Backups (Doku 45 §2).
- [ ] Modultexte und Inhalte gemäß den Prüfergebnissen; neuer Commit und erneuter Release-Check, falls sich etwas ändert.
- [ ] Merge nach `main` freigegeben.
- [ ] Mindestens 3 GB frei auf `/`.
- [ ] Prüfung auf Staging mit Domain und HTTPS, echter Mailtest, Smartphone-Abnahme.

## Konfiguration: fehlt heute in der Produktion

Geprüft nur anhand der Namen. Pflicht im Release, in `/opt/amanah-prod/.env.production` **nicht vorhanden:** `AMANAH_DATA_KEYS`, `AMANAH_DATA_KEY_ACTIVE`, `AMANAH_PUBLIC_BASE_URL`. Datenschlüssel auf dem Server erzeugen, nie im Chat oder Repo, und getrennt vom Backup sichern (Doku 15).

**Prüfen:** `AMANAH_AI_ENABLED=true` steht in der Produktion; im Release sollte es ausdrücklich `false` sein, solange die KI gesperrt ist. Zudem `AMANAH_MAIL_TRANSPORT` und Registrierung bewusst setzen (Doku 44).

## Ablauf

1. **Bauen:** lokal aus dem freigegebenen Commit mit den Produktions-Build-Werten, Images `app` und `migrate`; Prüfsumme und Schichten-Hash wie beim Hotfix.
2. **Übertragen:** beide Images laden; `df -h /` kontrollieren.
3. **Sichern:** verschlüsseltes Backup auslösen, Compose-Hash von Postgres mit dem Container vergleichen.
4. **App stoppen,** nur `amanah-app`. `gemeinsam1` nicht berühren.
5. **Migrieren:** `migrate deploy` mit dem Migrations-Image im Netz `amanah-app_amanah_internal`. Erwartet: 6 von 6. Fremde Dienste bleiben unberührt. Stoppen bei Fehler.
6. **Schlüssel und Env** ergänzen, in `deploy/production/docker-compose.pinned.yml` den neuen Digest eintragen, auch im Prüfskript.
7. **Starten:** `up -d --no-deps app`, Postgres muss weiterlaufen.
8. **Prüfen:** Health, `verify-production-image.sh`, `public-content-probe.py`, Konten und Daten, abgelehnte Anmeldung; `gemeinsam1` byte-gleich.
9. **Migrations-Image entfernen,** Platz freigeben.

**Noch nicht öffnen.** Route und Registrierung sind eigene, spätere Schritte mit eigener Freigabe (Doku 42 §3, Doku 44).

## Wiederherstellung

Zwei getrennte Wege, nicht verwechseln:

| Lage | Vorgehen | Belegt |
|---|---|---|
| **App-Fehler, Datenbank in Ordnung** | Digest zurück auf das bisherige Image, `up -d --no-deps app`. Das alte Image lief im Probelauf auf der migrierten Datenbank mit Anmeldung und Ordner | Probelauf, synthetisch |
| **Migration oder Daten beschädigt** | App stoppen, Datenbank aus dem Backup von Schritt 3 ersetzen, altes Image starten. Probelauf: Daten identisch, 1 Migration | Probelauf, synthetisch |

**Es gibt keine Rückmigration.** Prisma macht Migrationen nicht rückgängig; Änderungen nach dem Backup gehen beim Einspielen verloren. Ohne aktives Löschprotokoll kämen zudem Löschungen zurück (Doku 39). Die Route bleibt in allen Fällen geschlossen.

## Risiken

Gering, solange 0 Konten bestehen; der Stand ist vor dem Release erneut zu zählen. Plattenplatz ist knapp (87 %). Die Prüfung läuft ohne externe Benachrichtigung.
