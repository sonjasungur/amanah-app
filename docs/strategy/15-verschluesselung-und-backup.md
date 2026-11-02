# Verschlüsselung im Ruhezustand, Schlüsselverwaltung und Backups

Stand: 2026-10-30 · Implementiert auf `feat/vorsorge-testament-foundation` · **keine produktive Migration ausgeführt**

## 1. Was verschlüsselt wird

| Daten | Speicherort | Schutz |
|---|---|---|
| Vorsorgeordner (Gesundheit, Janazah, Schulden, Familie, Testament-Erbprofil …) | `amanah_data.data` (JSON) | **AES-256-GCM, Envelope-Verschlüsselung** (`src/lib/server/data-encryption.ts`) |
| Passwörter | `users.password_hash` | scrypt mit Salt |
| Session-Tokens | `sessions.token_hash` | SHA-256 mit Server-Secret, Token nur im HttpOnly-Cookie |
| E-Mail, Name | `users` | **Klartext** (für Login nötig) – Schutz über Backup-Verschlüsselung und Zugriffsrechte |
| Dateien/Uploads | – | **keine Dateispeicherung vorhanden** |
| PDF-Export | Browser (`window.print`) | wird **nicht** auf dem Server gespeichert |
| JSON-/Konto-Export | Download an den Nutzer, `Cache-Control: no-store` | nicht serverseitig abgelegt |

## 2. Verfahren

- Pro Datensatz ein zufälliger 256-Bit-Datenschlüssel (DEK); damit wird das JSON mit AES-256-GCM (96-Bit-IV, Auth-Tag) verschlüsselt.
- Der DEK wird mit dem aktiven Hauptschlüssel (KEK) verpackt, ebenfalls AES-256-GCM.
- Zusatzdaten (AAD) binden Ciphertext und DEK an die Nutzer-ID und Schlüssel-ID → eine kopierte Zeile lässt sich für einen anderen Nutzer nicht entschlüsseln.
- Format in der Spalte: `{ "$enc": "amanah-aes256gcm-v1", "kid", "dek": {iv,tag,ct}, "data": {iv,tag,ct} }`.
- Fehlermeldungen enthalten weder Klartext noch Schlüsselmaterial; der Servercode loggt keine Ordnerdaten (geprüft: keine `console.*` in `src/lib/server`, `src/app/api`, `src/lib/storage`).

## 3. Schlüssel

| Variable | Bedeutung |
|---|---|
| `AMANAH_DATA_KEYS` | `kid:base64,kid:base64` – je 32 Byte |
| `AMANAH_DATA_KEY_ACTIVE` | Schlüssel-ID für neue Schreibvorgänge |
| `AMANAH_DATA_ENCRYPTION` | `required` (Standard in Produktion) / `optional` (nur Entwicklung) |

- Schlüssel **nur** als Umgebungsvariable/Docker-Secret auf dem Server; nicht in DB, Repo oder Backups.
- Erzeugen: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- Produktion ohne gültige Schlüssel: `validateProductionEnv` und `scripts/validate-production-env.mjs` melden Fehler; Schreiben schlägt fehl (`required`).
- Schlüssel getrennt sichern (z. B. Passwortmanager des Betreibers, zwei Personen) – **Verlust = Datenverlust**.
- Später: KMS/Vault (Kosten/AVV prüfen).

## 4. Rotation und Altbestände

1. Neuen Schlüssel ergänzen: `AMANAH_DATA_KEYS=alt:…,neu:…`, `AMANAH_DATA_KEY_ACTIVE=neu`, App neu starten → neue Schreibvorgänge nutzen `neu`, alte Zeilen bleiben lesbar.
2. Backup erstellen.
3. Das Skript erfasst seit dem 01.11.2026 auch `amanah_data_versions` (Doku 38), wenn die Tabelle vorhanden ist.
   Trockenlauf: `node scripts/reencrypt-amanah-data.mjs` (zählt Klartext-, Rotations- und unveränderte Zeilen; keine Inhalte).
4. Anwenden: `AMANAH_REENCRYPT_CONFIRM=yes node scripts/reencrypt-amanah-data.mjs --apply` – verschlüsselt Klartext-Altbestände und verpackt DEKs neu (Daten-Ciphertext bleibt).
5. Erst wenn der Trockenlauf `rewrap: 0, encrypt_plaintext: 0` zeigt, den alten Schlüssel entfernen.

Altbestände im Klartext bleiben bis dahin lesbar und werden beim nächsten Speichern des Nutzers automatisch verschlüsselt. **Ausführung gegen die Produktions-DB nur mit Owner-Freigabe.**

## 5. Backups

- `scripts/backup-postgres.sh`: mit `BACKUP_AGE_RECIPIENTS="age1…"` wird der Dump mit `age` verschlüsselt (`.sql.gz.age`, Dateirechte 600). `BACKUP_REQUIRE_ENCRYPTION=true` verhindert unverschlüsselte Backups.
- Auf dem Server liegen nur **öffentliche** age-Empfängerschlüssel; die Identity für den Restore liegt getrennt beim Betreiber.
- `scripts/restore-postgres.sh` erkennt `.age` und benötigt `BACKUP_AGE_IDENTITY`.
- Daten-KEKs sind nicht Teil des Backups → ein gestohlenes Backup enthält die Ordnerdaten nur als Ciphertext.
- Löschkonzept: Backups enthalten gelöschte Konten bis zum Ablauf der Aufbewahrung → Frist mit DSB festlegen. Gilt auch für `amanah_data_versions`; zum Einspielen gelöschter Daten siehe [Doku 38](38-konto-speicherung-und-historie.md) §3. Vorbereitetes, ausgeschaltetes Löschprotokoll: [Doku 39](39-loeschprotokoll-und-restore.md).

## 6. Tests [geprüft 2026-10-30]

| Test | Ergebnis |
|---|---|
| `src/__tests__/data-encryption.test.ts` (Roundtrip, frische IV/DEK, falscher Besitzer/Schlüssel, Manipulation, Rotation, Konfigurationsfehler, Pflichtmodus, Altbestand, Memory-Repo speichert Ciphertext) | bestanden |
| `src/__tests__/postgres-encryption.test.ts` gegen temporäre PostgreSQL 16.6 (Ciphertext in der Zeile, Skript: Trockenlauf, Abbruch ohne Bestätigung, Anwenden, Rotation; `deleteUser`) | bestanden |
| Backup mit age (Alpine-Paket im Wegwerf-Container) → kein Klartext, Rechte 600; Restore in frische DB → Datensatz und Migrationshistorie vorhanden | bestanden |
| Produktionsvalidierung verlangt Schlüssel (`phase-4a`, `pilot-release-hardening`) | bestanden |
