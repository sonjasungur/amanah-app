# Sicherheitsstatus, Datenschutz-Technik und Testbericht

Stand: 2026-10-30 · Branch `feat/vorsorge-testament-foundation` · lokale Commits, **nicht gepusht, nicht deployt**
Belege: **[geprüft]** = in dieser Sitzung ausgeführt. Keine Rechtsberatung.

---

## 1. Sicherheitsstatus

| Bereich | Stand vorher (`main` @ 1fdb5db) | Stand Branch | Beleg |
|---|---|---|---|
| Next.js | 16.2.10, mehrere kritische RCE-Advisories | 16.4.3 | `npm audit` [geprüft] |
| Abhängigkeiten (prod) | 11 Befunde, 1 critical | 3 high = **eine** CLI-Lücke in `deepmerge-ts` über Prisma 6 | [geprüft]; Bewertung in [07-prisma7-analyse.md](07-prisma7-analyse.md) |
| Session-Transport | Bearer-Token im LocalStorage (XSS-auslesbar) | HttpOnly-Cookie, `SameSite=Lax`, in Produktion `Secure` + `__Host-`-Präfix; Token nie im Body | Unit + E2E [geprüft] |
| CSRF | – (Bearer war CSRF-immun) | zustandsändernde Requests nur same-origin (`Origin` bzw. `Sec-Fetch-Site`); Login/Register/Logout/Konto 403 bei fremder Herkunft | Unit + E2E [geprüft] |
| Session-Fixation | – | Login/Registrierung verwerfen mitgebrachtes Token, immer neues Token | Unit + E2E [geprüft] |
| Logout | Token im DB gelöscht, Client-Kopie | Server-Session gelöscht + Cookie geleert; Replay des alten Cookies → 401 | E2E [geprüft] |
| Passwortregeln | min. 6 | min. 8 (Client und Server) | Unit [geprüft] |
| Brute Force | kein Limit | Login 10/min je IP und E-Mail, Registrierung 5/min je IP (prozesslokal) | Smoke + Unit [geprüft] |
| Session-Secret | Fallback-Wert auch in Produktion | Produktion ohne Secret → Fehler | Code |
| Memory-Modus | „Hash“ = Länge + erste 3 Zeichen → jedes ähnliche Passwort gültig | scrypt | Unit [geprüft] |
| Security-Header | nur über Caddy | zusätzlich in Next (`nosniff`, `DENY`, Referrer-, Permissions-Policy), kein `X-Powered-By` | Smoke [geprüft] |
| Kontoexport | nur Ordner-JSON im Browser | `GET /api/account/export` (Konto + Ordnerdaten, ohne Hashes/Tokens) | Unit + E2E [geprüft] |
| Kontolöschung | nur Ordnerdaten, Konto blieb | `DELETE /api/account` mit Passwortbestätigung: Konto, alle Sessions, alle Daten | Unit + E2E [geprüft] |
| KI-Consent | Float-Chat sendete `consentGranted: true` | gespeicherte Einwilligung; KI-UI standardmäßig aus | Code |
| Verschlüsselung at rest | keine (JSON im Klartext) | **unverändert** – Plan in Abschnitt 3 | – |
| CSP | keine | **offen** (Next-Inline-Skripte erfordern Nonce-Konzept) | – |
| 2FA, E-Mail-Verifikation, Passwort-Reset | fehlen | **offen** | – |

Bewusst gewählt: `SameSite=Lax` statt `Strict`, damit Links aus E-Mails oder von der Startseite eingeloggt öffnen; der CSRF-Schutz liegt in der Origin-Prüfung.

Betrieblicher Hinweis: Hinter Caddy muss `Host` bzw. `X-Forwarded-Host` der öffentlichen Domain entsprechen, sonst schlägt die Origin-Prüfung fehl. Caddy reicht `Host` standardmäßig durch; vor Livegang mit der echten Domain prüfen.

---

## 2. Datenschutz und Einwilligung bei besonders sensiblen Daten

Gespeichert werden u. a. Gesundheitsangaben, Religionszugehörigkeit (implizit durch Janazah-/Islam-Bezug), Angaben zu Dritten (Familie, Vertrauenspersonen), Schulden. Religion und Gesundheit sind Art.-9-Daten.

| Anforderung | Ist | Bedarf |
|---|---|---|
| Rechtsgrundlage Art. 9 Abs. 2 lit. a (ausdrückliche Einwilligung) | keine Einwilligung bei Registrierung oder vor Server-Speicherung | Einwilligungsschritt vor erster Server-Speicherung, Text versioniert, Zeitpunkt gespeichert, Widerruf in Einstellungen |
| Nachweis der Einwilligung | – | Tabelle `ConsentRecord` (userId, purpose, textVersion, grantedAt, revokedAt) – braucht Migration |
| Datenschutzerklärung | beschreibt Datenkategorien und Speicherorte | Verantwortlicher, Rechtsgrundlagen, Speicherdauer, Empfänger/Hoster (Hetzner), Betroffenenrechte, Beschwerderecht, Cookie-Hinweis → **Text durch Anwalt/DSB** |
| Daten Dritter | Freitext ohne Hinweis | Hinweis bei Personenangaben; Grundlage (Art. 6 Abs. 1 lit. f / Haushaltsausnahme?) **anwaltlich klären** |
| DSFA (Art. 35) | keine | erforderlich wahrscheinlich (umfangreiche Art.-9-Daten) – mit DSB |
| AVV Hosting | – | AVV mit Hetzner abschließen |
| Auskunft/Übertragbarkeit | erledigt (Export) | – |
| Löschung | erledigt (Konto vollständig) | Backup-Löschkonzept (Backups enthalten gelöschte Konten bis Ablauf) |
| Cookies | nur technisch notwendiges Session-Cookie | kein Banner nötig, Hinweis in Datenschutzerklärung (ergänzt) |

Rechtstexte habe ich bewusst nicht formuliert.

---

## 3. Plan: Verschlüsselung sensibler Daten und Schlüsselverwaltung

Ziel: Ein Datenbank-Dump oder ein Backup allein darf keine lesbaren Vorsorgedaten enthalten.

1. **Feldverschlüsselung auf Anwendungsebene** für `amanah_data.data`: AES-256-GCM mit Node `crypto`; pro Datensatz ein zufälliger Data-Key (Envelope Encryption), verschlüsselt mit einem Key-Encryption-Key (KEK).
2. **Format:** `{ v: 1, kid, iv, tag, ct, wrappedKey }` in der JSON-Spalte; `schema_version` bleibt; Lesen erkennt Klartext-Altbestände und verschlüsselt beim nächsten Schreiben (lazy migration) oder per einmaligem Migrationsskript.
3. **KEK-Haltung (Start):** Secret außerhalb der DB als Umgebungsvariable/Docker-Secret auf dem Server, nicht im Repo, nicht in Backups der DB. Mehrere Schlüssel über `kid` → Rotation ohne Downtime (neue Daten mit neuem KEK, Altbestand beim Schreiben umschlüsseln).
4. **Später:** KMS/HSM (z. B. Hetzner bietet keinen KMS – Optionen: HashiCorp Vault selbst gehostet, oder EU-KMS eines anderen Anbieters → Kosten/AVV prüfen).
5. **Backups:** zusätzlich verschlüsselt (z. B. `age`/GPG) und getrennt vom KEK gelagert; Volume-Verschlüsselung (LUKS) als zweite Schicht.
6. **Grenze:** Der Server kann entschlüsseln (keine Ende-zu-Ende-Verschlüsselung). E2E würde Server-Funktionen (Export, Anwaltsfreigabe) erschweren – erst mit klarem Produktbedarf.
7. **Tests:** Roundtrip, falscher Schlüssel → Fehler, Manipulation (GCM-Tag) → Fehler, Rotation, Export liefert Klartext nur an berechtigten Nutzer.

Aufwand: ca. 3–4 PT inkl. Migration und Tests.

---

## 4. Testbericht [geprüft, 2026-10-30]

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Unit/Integration | `npx vitest run` | **399 bestanden, 1 skipped** (Postgres-Test ohne DB) |
| Typen | `npx tsc --noEmit` | ok |
| Lint | `npx eslint src e2e` | 0 Probleme |
| Secret-Scan | `gitleaks dir` mit `.gitleaks.toml` über alle Änderungen | keine Funde |
| E2E lokaler Modus (Desktop + Mobil) | `npm run build:e2e && npx playwright test` | **220 bestanden**, 62 skipped (API-only) |
| E2E API-Modus (Memory, Registrierung offen, Zufalls-Secret) | `next build` mit `NEXT_PUBLIC_AUTH_MODE=api NEXT_PUBLIC_STORAGE_MODE=api …`, dann `SECURITY_API_E2E=true PHASE2_API_TESTS=true npx playwright test e2e/security-session.spec.ts e2e/phase2-failure-paths.spec.ts` | **55 bestanden**, 5 skipped (Mobil-Duplikate) |
| E2E nach Startseiten-Änderung | home-entry + knowledge-center + check-and-tiles | 54 bestanden |
| Postgres-Integration | – | `NOT_RUN` (keine lokale DB gestartet) |
| Docker-Build | – | `NOT_RUN` |

Abgedeckt (Auftrag P3): Anmeldung/Registrierung, Sessions, Vorsorge-/Janazah-Abläufe, Dokumentenexport (Konto-JSON; PDF-Druckansicht aus bestehenden Specs), Wissenszentrum, unveröffentlichte Inhalte (404), redaktioneller Zugriffsschutz (404), Navigation, responsives Layout (kein horizontales Scrollen auf Mobil).

Durch E2E gefundener und behobener Fehler: Nach erfolgreicher Kontolöschung meldete die Oberfläche „Löschen fehlgeschlagen“, weil sie anschließend noch die (schon gelöschten) Serverdaten löschen wollte.

### API-Modus-E2E reproduzieren

```bash
NEXT_PUBLIC_AUTH_MODE=api NEXT_PUBLIC_STORAGE_MODE=api \
NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED=true NEXT_PUBLIC_AMANAH_AI_ENABLED=true npx next build
AMANAH_PUBLIC_REGISTRATION_ENABLED=true AMANAH_SERVER_STORAGE=memory \
SESSION_SECRET=$(openssl rand -hex 32) SECURITY_API_E2E=true PHASE2_API_TESTS=true \
npx playwright test e2e/security-session.spec.ts e2e/phase2-failure-paths.spec.ts
```

Danach für den Standardlauf wieder `npm run build:e2e`.
