# Sicherheitsmeldungen `npm audit` – Prisma (Stand 25.11.2026)

`npm audit` meldet drei Einträge der Stufe „hoch“. Sie haben **eine gemeinsame Ursache**: die Bibliothek `effect`, die das Prisma-Kommandozeilenwerkzeug mitbringt.

| Paket | installiert | Meldung | Abhängigkeitsweg |
|---|---|---|---|
| `effect` | 3.20.0 (betroffen: ≤ 3.22.0) | ReDoS (übermäßige Rechenzeit durch einen ungünstigen regulären Ausdruck) in `Schema.TemplateLiteral` – [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw) | `prisma` → `@prisma/config` → `effect` |
| `@prisma/config` | 7.10.1 | erbt die Meldung (`effect` fest auf 3.20.0) | Entwicklungs- und Migrationswerkzeug |
| `prisma` | 7.10.1 | erbt die Meldung | Entwicklungs- und Migrationswerkzeug |

## Tatsächliche Auswirkung

- **Laufende App: nicht betroffen.** Das Produktions-Image enthält nur `@prisma/client` (`.next/standalone/node_modules/@prisma/{client,client-runtime-utils}`). `prisma`, `@prisma/config` und `effect` sind darin nicht enthalten.
- **Betroffen ist nur das Werkzeug** für `prisma generate` (Build) und `prisma migrate deploy`; das läuft im einmaligen Migrations-Container vor dem Start.
- Für einen ReDoS braucht es angreiferkontrollierte Eingaben genau in diese Schema-Prüfung. Das Werkzeug liest dort nur `prisma.config.ts` aus dem eigenen Repository, keine Eingaben von Nutzerinnen und Nutzern und keine Netzwerkdaten.
- Schlimmster denkbarer Fall: Ein manipuliertes `prisma.config.ts` lässt Build oder Migration hängen. Wer das Repository so verändern kann, hätte ohnehin weitergehenden Zugriff.
- **Bewertung: geringes praktisches Risiko, kein Startblocker.**

## Warum nicht `npm audit fix --force`

npm schlägt eine Rückstufung auf `prisma@6.12.0` vor. Das wäre ein Wechsel der Hauptversion, der die Migrationskette und den generierten Client bricht. Deshalb wird er nicht empfohlen.

## Mögliche spätere Behebung

1. **Bevorzugt:** Prisma aktualisieren, sobald eine stabile Version `effect` ≥ 3.22.1 mitbringt. Am 25.11.2026 setzen alle 7.x-Versionen bis 7.10.1 fest 3.20.0 ein, und 8.0 ist nur als Vorabversion (`8.0.0-rc`) erhältlich.
2. **Alternative ohne Prisma-Update:** In `package.json` die Unterabhängigkeit festlegen: `"overrides": { "effect": "3.22.5" }`. 3.22.5 ist die bereinigte Version derselben Hauptversion (3.x). Danach `npm install`, `npx prisma generate` und einen Migrations-Probelauf ausführen, dann den vollständigen Release-Check.
3. In beiden Fällen als eigenen Commit mit vollständigem Release-Check umsetzen, nicht zusammen mit fachlichen Änderungen.

**Bis dahin:** Bei jedem Release-Check `npm audit` lesen. Neue Meldungen, die `@prisma/client` oder Pakete der laufenden App betreffen, sind sofort zu bewerten.
