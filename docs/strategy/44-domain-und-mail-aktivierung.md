# Domain und E-Mail aktivieren (Vorbereitung)

**Für:** Owner und Betrieb. **Stand:** Der Code ist vorbereitet. Marke, Domain und Mailanbieter legt der Owner fest ([Doku 33](33-marken-und-domainvorrecherche.md), [Doku 34](34-namensfindung.md)); Agenten entscheiden hier nichts und nehmen keine Kontakte auf. Nichts davon ist aktiviert.

**Stand 03.11.2026:** Abläufe mit Mail-Outbox bestanden, lokal und auf Staging. **Echter Versand `NOT_RUN`:** Es gibt keine autorisierte Testadresse, und externer Versand ist per Owner-Entscheidung aus. Entscheidungsvorlage: `docs/release/entscheidung-marke-domain-mail.md`.

## Was bereits funktioniert

- Registrierung ohne Sitzung, Anmeldung erst nach bestätigter E-Mail (`email_unverified`), Bestätigungslink, Passwort zurücksetzen, neutrale Antworten.
- Registrierung ist standardmäßig aus; ohne Mailanbieter antwortet sie mit 503.
- Mailanbieter-Anbindungen sind vorbereitet (`AMANAH_MAIL_TRANSPORT`: `brevo`, `postmark`), Inhalte und Adressen werden nicht geloggt.
- `validate-production-env` verlangt Schlüssel und Absender und verbietet `outbox`. `validate-release --mode=public-release` lehnt Registrierung ohne echten Anbieter ab.

## Reihenfolge

1. **Owner:** Marke und Domain festlegen, registrieren. Registrieren allein öffnet die App nicht mehr, weil keine Route besteht.
2. **Owner:** Mailanbieter wählen, AVV abschließen. Datenschutzprüfung nennt ihn.
3. **Betrieb:** SPF, DKIM, DMARC für die Absenderadresse setzen und mit Testmails an eigene Postfächer prüfen. Externer Versand braucht eine eigene Freigabe; er ist derzeit gesperrt.
4. **Betrieb:** Werte nur in der Env-Datei auf dem Server eintragen, nie im Repo: `AMANAH_MAIL_TRANSPORT`, `AMANAH_MAIL_API_KEY`, `AMANAH_MAIL_FROM`, `AMANAH_MAIL_FROM_NAME`, `AMANAH_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`. Die `NEXT_PUBLIC_`-Werte stecken im Build: neues Image, neuer Digest.
5. **Staging:** Registrierung, Bestätigung, Passwort zurücksetzen mit echtem Versand an Testpostfächer; Zustellbarkeit prüfen, auch Spam.
6. **Freigaben:** alle Einträge in `docs/release/freigaben.json`.
7. **Zuletzt, je mit Freigabe:** Route setzen (Doku 42 §3), dann `AMANAH_PUBLIC_REGISTRATION_ENABLED=true`.

## Vor dem Einschalten prüfen

- [ ] Bestätigungsmail kommt an, Link führt auf die richtige Domain, läuft ab.
- [ ] Ohne Bestätigung keine Anmeldung und keine Speicherung.
- [ ] Passwort-Zurücksetzen verrät nicht, ob ein Konto existiert.
- [ ] Bremse für Registrierung bleibt aktiv.
- [ ] Absender, Impressum und Datenschutztext nennen dieselbe Stelle.
- [ ] `/opt/amanah-prod/verify-production-image.sh` an den neuen Digest angepasst.
